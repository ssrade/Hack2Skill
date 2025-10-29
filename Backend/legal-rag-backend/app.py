# app.py (final)
import os
import re
import json
import uuid
from dotenv import load_dotenv
from typing import Dict, Optional
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import documentai
from vertexai.generative_models import GenerativeModel
import vertexai
import config
from pinecone import Pinecone, ServerlessSpec
from fastapi.responses import StreamingResponse
from fastapi.responses import PlainTextResponse
import io
from google.cloud import aiplatform
from vertexai.preview import rag
from contextlib import asynccontextmanager
#from config import PROJECT_ID, VERTEX_AI_LOCATION
import traceback
from pydantic import BaseModel
from typing import List
import asyncio
import tempfile
import shutil
# Import the function that wraps rag.upload_file
from rag.prepare_corpus_and_data import upload_pdf_to_corpus

# --- Utils ---
#from utils.text_processing import split_into_clauses
from utils.embeddings import embed_texts_batch
from utils.retrieval import retrieve_top_k_pinecone
from utils.pdf_extraction import extract_text_from_pdf
from utils.firestore_utils import save_processed_data, get_processed_data
from utils.chunker import chunk_text
from utils.pdf_generator.pdf_gen import create_pdf_from_json
from utils.masking_pdf import mask_pdf
#from utils.vertex_rag import upload_to_vertex_rag

import os, tempfile, shutil, uuid, traceback
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import JSONResponse
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel
#VERTEX RAG
from fastapi import FastAPI, HTTPException, Form
from rag.agent import root_agent
# from rag.prepare_corpus_and_data import upload_file_to_corpus
from google.adk import Agent



basic_instruction = "for normal person"
pro_instruction = " for expert person"

import os
# from rag.prepare_corpus_and_data import send_chunks_to_vertex_corpus
from rag.prepare_corpus_and_data import initialize_vertex_ai 
from rag.agent import root_agent

#immport the masking route
from utils.masking_pdf import router as pii_mask_router 

app = FastAPI()

app.include_router(pii_mask_router, prefix="/node_helper")

aiplatform.init(project=config.PROJECT_ID, location=config.VERTEX_AI_LOCATION)
CORPUS_NAME = "legal-rag-corpus"
# --- Initialization ---
load_dotenv()

if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")

vertexai.init(project=config.PROJECT_ID, location=config.VERTEX_AI_LOCATION)
gemini = GenerativeModel("gemini-2.5-flash")

documentai_client = documentai.DocumentProcessorServiceClient()
processor_name = documentai_client.processor_path(
    config.PROJECT_ID, config.DOCUMENT_AI_LOCATION, config.PROCESSOR_ID
)

# Pinecone init (kept for parity with original app).
# You can disable Pinecone/upserts and embeddings by setting USE_PINECONE=false in .env
USE_PINECONE = os.getenv("USE_PINECONE", "true").lower() not in ("0", "false", "no")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if USE_PINECONE and not PINECONE_API_KEY:
    # If user asked to use Pinecone but didn't set API key, fail early
    raise ValueError("PINECONE_API_KEY environment variable not set but USE_PINECONE is enabled.")

pc = Pinecone(api_key=PINECONE_API_KEY) if USE_PINECONE else None

# Document index (user uploaded docs) - create if enabled
if USE_PINECONE:
    if config.RAG_INDEX_NAME not in pc.list_indexes().names():
        pc.create_index(
            name=config.RAG_INDEX_NAME,
            dimension=768,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    rag_index = pc.Index(config.RAG_INDEX_NAME)
else:
    rag_index = None

# Rulebook index (kept for retrieval tasks)
if USE_PINECONE:
    if "legal-doc-index" not in pc.list_indexes().names():
        pc.create_index(
            name="legal-doc-index",
            dimension=1536,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    rulebook_index = pc.Index("legal-doc-index")
else:
    rulebook_index = None

app = FastAPI(title="Legal RAG Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SKIP_KEYWORDS = ["aadhaar", "passport", "voter id", "pan card", "self attested"]

# --- Helpers ---
def clean_gemini_response(text: str) -> str:
    return re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()

def generate_json_from_gemini(prompt: str) -> dict:
    response = gemini.generate_content(prompt)
    cleaned = clean_gemini_response(response.text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        return {"error": "Invalid JSON from LLM", "raw_text": cleaned}

def fetch_doc_chunks(user_id: str, doc_id: str):
    """Fetch all chunks from Firestore for the document. Returns raw stored value."""
    processed_data = get_processed_data(user_id, doc_id, "full_text_chunks")
    return processed_data if processed_data else []

def extract_chunk_texts(chunks):
    """
    Given chunks returned from Firestore (which might be list[str] or list[dict]),
    return a list of string contents safe for embeddings/LLM prompts.
    """
    texts = []
    for c in chunks:
        if isinstance(c, dict):
            # prefer 'content' key if present
            if "content" in c:
                texts.append(str(c["content"]))
            # fallback to serialized version if other structure
            else:
                # try common keys
                if "text" in c:
                    texts.append(str(c["text"]))
                else:
                    texts.append(json.dumps(c, ensure_ascii=False))
        else:
            # content may already be stored as a raw string
            texts.append(str(c))
    return texts


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Code to run on startup
    print("🚀 Initializing Vertex AI for RAG Agent during startup...")
    try:
        # Initialize Vertex AI connection targeting the RAG project (Project B)
        initialize_vertex_ai()
        if root_agent is None:
             print("⚠️ WARNING: root_agent might not have been initialized successfully.")
        else:
            print("✅ Vertex AI Initialized. RAG Agent should be ready.")
    except Exception as e:
        print(f"❌ FATAL: Error during Vertex AI initialization: {e}")
        # Decide if you want the app to fail startup if this happens
        # raise  # Uncomment to stop the app if initialization fails
    
    yield # The application runs while yielded
    
    # Code to run on shutdown (if any)
    print("ℹ️ Shutting down FastAPI application.")

# --- FastAPI App Setup ---
# Pass the lifespan function to the FastAPI constructor
app = FastAPI(title="Legal RAG Backend", lifespan=lifespan)

# --- Endpoints ---

UPLOAD_DIR = "uploads/masked_docs"

@app.post("/upload")
async def upload_doc(
    file_name: str,
    doc_type: str,
    user_id: str
):

    # ✅ Build file path
    file_path = os.path.join(UPLOAD_DIR, file_name)
    print(file_path)

    # ✅ Validate file exists
    if not os.path.exists(file_path):
        raise HTTPException(status_code=400, detail="File not found in uploads/masked_docs.")

    # ✅ Validate extension
    if not file_name.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF allowed.")

    # ✅ Read file content
    with open(file_path, "rb") as f:
        content = f.read()

    # ✅ Extract text based on document type
    if doc_type.lower() == "electronic":
        text = extract_text_from_pdf(None, None, content, method="pymupdf", skip_keywords=SKIP_KEYWORDS)

    elif doc_type.lower() == "scanned":
        text = extract_text_from_pdf(documentai_client, processor_name, content, method="document_ai",
                                     skip_keywords=SKIP_KEYWORDS)
    else:
        raise HTTPException(status_code=400, detail="doc_type must be 'scanned' or 'electronic'.")

    print(f"\n[PARSER DEBUG] Extracted Text Length: {len(text)} characters.")
    print(f"[PARSER DEBUG] Text Starts With: {text[:300]}...\n")

    # ✅ Chunk the text
    chunks = chunk_text(text, chunk_size=1500, chunk_overlap=200)
    chunk_texts = [c["content"] for c in chunks]

    # ✅ Generate a new doc_id
    doc_id = str(uuid.uuid4())

    # ✅ Optional: Store embeddings to Pinecone
    if USE_PINECONE:
        try:
            embeddings = embed_texts_batch(chunk_texts)
            vectors = [
                {
                    "id": f"{user_id}_{doc_id}_chunk_{i}",
                    "values": emb,
                    "metadata": {"user_id": user_id, "doc_id": doc_id, "chunk_id": i, "snippet": chunk_texts[i][:150]},
                }
                for i, emb in enumerate(embeddings)
            ]
            rag_index.upsert(vectors=vectors)
            print(f"[PINECONE] SUCCESS: Upserted {len(vectors)} vectors")
        except Exception as e:
            print(f"[PINECONE ERROR]: {e}")

    # ✅ Store normalized chunks to Firestore
    store_chunks = [
        {"content": c.get("content", ""), "chunk_id": c.get("chunk_id"), "type": c.get("type")}
        for c in chunks
    ]

    save_processed_data(user_id, doc_id, "full_text_chunks", store_chunks)

    return {
        "message": f"Document processed successfully ({len(store_chunks)} chunks).",
        "doc_id": doc_id,
        "source": file_path
    }


class RAGQueryRequest(BaseModel):
    query: str

@app.post("/upload-rag")
async def upload_doc_to_rag(
    file: UploadFile = File(...),
    user_id: str = Form(...),
    doc_type: str = Form("electronic")
):
    if not file.content_type or file.content_type != "application/pdf":
        await file.close()
        raise HTTPException(status_code=400, detail="Only PDF files allowed.")

    corpus_resource_name = os.getenv("RAG_CORPUS")
    if not corpus_resource_name:
        raise HTTPException(status_code=500, detail="RAG_CORPUS environment variable not set.")
    
    temp_pdf_path = None
    
    try:
        upload_display_name = file.filename if file.filename else f"upload_{uuid.uuid4()}.pdf"
        content = await file.read()  # Read file content
        
        # ✅ Extract text for storage (regardless of upload type)
        if doc_type.lower() == "scanned":
            extracted_text = extract_text_from_pdf(
                documentai_client, 
                processor_name, 
                content, 
                method="document_ai", 
                skip_keywords=SKIP_KEYWORDS
            )
        else:
            extracted_text = extract_text_from_pdf(
                None, 
                None, 
                content, 
                method="pymupdf", 
                skip_keywords=SKIP_KEYWORDS
            )
        
        # Upload to RAG corpus
        if doc_type.lower() == "scanned":
            # Save as text file for RAG
            with tempfile.NamedTemporaryFile(delete=False, suffix=".txt", mode='w', encoding='utf-8') as temp_txt:
                temp_txt.write(extracted_text)
                temp_txt_path = temp_txt.name
            
            rag_file_result = rag.upload_file(
                corpus_name=corpus_resource_name,
                path=temp_txt_path,
                display_name=f"{upload_display_name}.txt",
                description=f"OCR extracted from scanned PDF by user '{user_id}'"
            )
            os.remove(temp_txt_path)
        else:
            # Save PDF temporarily
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf", mode='wb') as temp_pdf:
                temp_pdf.write(content)
                temp_pdf_path = temp_pdf.name

            rag_file_result = upload_pdf_to_corpus(
                corpus_name=corpus_resource_name,
                pdf_path=temp_pdf_path,
                display_name=upload_display_name,
                description=f"Uploaded by user '{user_id}' via API."
            )
        
        rag_file_id = rag_file_result.name.split('/')[-1]
        doc_id = str(uuid.uuid4())

        # ✅ Chunk the text for better retrieval
        chunks = chunk_text(extracted_text, chunk_size=1500, chunk_overlap=200)
        chunk_texts = [c["content"] if isinstance(c, dict) else str(c) for c in chunks]

        # ✅ Store BOTH RAG mapping AND full text chunks
        save_processed_data(
            user_id=user_id,
            doc_id=doc_id,
            data_type="rag_file_mapping",
            data={
                "rag_file_id": rag_file_id,
                "rag_file_name": rag_file_result.name,
                "user_id": user_id,
                "doc_id": doc_id,
                "filename": upload_display_name,
                "uploaded_at": str(uuid.uuid1().time),
                "status": "indexing",
                "indexed_at": None,
                "doc_type": doc_type
            }
        )
        
        # ✅ Store full text chunks as backup
        save_processed_data(
            user_id=user_id,
            doc_id=doc_id,
            data_type="full_text_chunks",
            data=chunk_texts
        )

        return {
            "message": "Document uploaded successfully. Indexing in progress.",
            "doc_id": doc_id,
            "status": "indexing",
            "user_id": user_id,
            "chunks_stored": len(chunk_texts)
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload: {str(e)}")
    finally:
        if temp_pdf_path and os.path.exists(temp_pdf_path):
            os.remove(temp_pdf_path)
        await file.close()



# ...existing code...

# ...existing code...
from fastapi import HTTPException
from pydantic import BaseModel
from vertexai.preview import rag
from vertexai.generative_models import GenerativeModel, Tool
import os
import traceback

class RAGQueryRequest(BaseModel):
    query: str
    user_id: str = ""
    doc_id: str = ""

class RAGQueryResponse(BaseModel):
    answer: str
    user_id: str
    doc_id: str

@app.post("/query-rag", response_model=RAGQueryResponse)
async def query_vertex_rag_agent(payload: RAGQueryRequest):
    print("[DEBUG] RAG_CORPUS:", os.getenv("RAG_CORPUS"))

    try:
        corpus_name = os.getenv("RAG_CORPUS")
        if not corpus_name:
            raise HTTPException(status_code=500, detail="RAG_CORPUS not configured.")

        enhanced_query = payload.query
        if payload.doc_id:
            enhanced_query = f"For document ID {payload.doc_id}: {payload.query}"

        print(f"🔍 Querying RAG corpus with: {enhanced_query}")

        # Create a RAG retrieval tool
        rag_retrieval_tool = Tool.from_retrieval(
            retrieval=rag.Retrieval(
                source=rag.VertexRagStore(
                    rag_resources=[
                        rag.RagResource(
                            rag_corpus=corpus_name,
                        )
                    ],
                    similarity_top_k=5,
                    vector_distance_threshold=0.5,
                ),
            )
        )

        # Create a model with the RAG tool
        rag_model = GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=[rag_retrieval_tool],
        )

        # Generate response using RAG
        response = rag_model.generate_content(enhanced_query)
        response_text = response.text

        print(f"✅ Received response ({len(response_text)} chars): {response_text[:200]}...")

        return RAGQueryResponse(
            answer=response_text or "No response generated.",
            user_id=payload.user_id,
            doc_id=payload.doc_id
        )

    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error querying RAG: {str(e)}")
################################

@app.post("/summarize")
async def summarize_doc(doc_id: str = Form(...), user_id: str = Form(...), analysis_type: str = Form("basic")):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    user_doc_clauses_str = "\n\n".join(chunk_texts)

    


    language_instruction = basic_instruction if analysis_type.lower() == "basic" else pro_instruction
    # Retrieve rulebook contexts (if rulebook index exists)
    rulebook_chunks_str = ""
    if rulebook_index:
        rulebook_texts = retrieve_top_k_pinecone(embed_texts_batch(["Identify key legal terms"])[0], rulebook_index, k=5)
        rulebook_chunks_str = "\n\n".join(rulebook_texts)

    prompt = f"""
    **Generate clean json for the below**
You are a legal assistant specializing in contracts and agreements.
    {language_instruction}
Task:
1. Summarize the uploaded document in short, clear language.
2. Extract key terms from both the document and reference rulebook.
3. Use the rulebook only for context; do not add unrelated info.
4. Return JSON exactly as: {{"summary": "<text>", "key_terms": ["term1","term2",...] }}

--- USER DOCUMENT CLAUSES ---
{user_doc_clauses_str}

--- RULEBOOK CHUNKS ---
{rulebook_chunks_str}
"""
    summary_data = generate_json_from_gemini(prompt)
    save_processed_data(user_id, doc_id, "summary", summary_data)
    return {"summary_json": summary_data}




@app.post("/clauses")
async def get_clauses(doc_id: str = Form(...), user_id: str = Form(...),analysis_type: str = Form("basic")):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    clauses_str = "\n\n".join(chunk_texts)
    


    language_instruction = basic_instruction if analysis_type.lower() == "basic" else pro_instruction

    prompt = f"""
    **Generate clean json for the below**
You are a legal assistant reviewing document clauses.
{language_instruction}

Task:
1. Identify top 5 clauses (most important obligations/duties/rules).
2. Provide full easy-to-understand explanation for each top clause.
3. Do not leave explanations incomplete.
4. Return JSON in the format:
{{
  "total_clauses": <number>,
  "top_clauses": [
    {{"clause": "Clause X: text", "explanation": "full explanation"}},
    ...
  ],
  "all_clauses": [
    "Clause 1: full text",
    ...
  ]
}}

Clauses:
{clauses_str}
"""
    clauses_data = generate_json_from_gemini(prompt)

    # ensure all_clauses saved as list of strings
    clauses_data["all_clauses"] = chunk_texts
    save_processed_data(user_id, doc_id, "clauses", clauses_data)
    return {"clauses_json": clauses_data}

@app.post("/risks")
async def classify_risks(doc_id: str = Form(...), user_id: str = Form(...),analysis_type: str = Form("basic")):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    clauses_str = "\n\n".join(chunk_texts)

    

    language_instruction = basic_instruction if analysis_type.lower() == "basic" else pro_instruction
    prompt = f"""
    **Generate clean json for the below**
You are a legal risk analyst.
{language_instruction}
Classify each clause below into High, Medium, or Low Risk.

Instructions:
- High Risk: significant legal, financial, or compliance exposure.
- Medium Risk: moderate obligations or negotiable terms.
- Low Risk: standard, low-impact terms.

Task:
1. Return total counts under "counts".
2. Return top 3 clauses per risk under "top_clauses".
3. Use short/simple language.
4. Output JSON like:
{{
"counts": {{"High": <int>, "Medium": <int>, "Low": <int>}},
"top_clauses": {{
"High": ["clause1","clause2"],
"Medium": ["clause1","clause2"],
"Low": ["clause1","clause2"]
}}
}}

Clauses:
{clauses_str}
"""
    risks_data = generate_json_from_gemini(prompt)
    save_processed_data(user_id, doc_id, "risks", risks_data)
    return {"risks": risks_data}

@app.post("/query")
async def query_doc(question: str = Form(...), doc_id: str = Form(...), user_id: str = Form(...)):
    """
    (Kept as-is from your original app; this endpoint relies on Pinecone retrieval.)
    Answers user's question based *strictly* on provided context and generates follow-ups.
    """
    if not fetch_doc_chunks(user_id, doc_id): # Check if doc exists
        raise HTTPException(status_code=404, detail="Document not found.")

    # if Pinecone disabled, return helpful message
    if not USE_PINECONE or rag_index is None:
        return {
            "error": "Retrieval via Pinecone is disabled. Enable USE_PINECONE=true to use /query."
        }

    query_emb = embed_texts_batch([question])[0]
    retrieved_doc_texts = retrieve_top_k_pinecone(query_emb, rag_index, k=5, filter_dict={"user_id":{"$eq":user_id}, "doc_id":{"$eq":doc_id}})
    retrieved_rulebook_texts = retrieve_top_k_pinecone(query_emb, rulebook_index, k=5) if rulebook_index else []

    doc_context_str = "\n\n".join(retrieved_doc_texts)
    rulebook_context_str = "\n\n".join(retrieved_rulebook_texts)

    prompt = f"""
You are a factual legal assistant. Your answers **MUST** be based *ONLY* on the provided "Document context" and "Rulebook context". Do not add outside knowledge or assumptions.

Tasks:
1.  **Answer the Question:** Based *strictly* on the provided context, answer the user's question in simple, clear language.
    * **Prioritize "Document context".**
    * Use "Rulebook context" ONLY to clarify terms found in the document context. Mention this using "(Reference from rulebook)".
    * If the answer is **NOT** found in EITHER context, you **MUST** respond *exactly*: "The provided document excerpts do not contain information to answer this question." and set source to "none". Do NOT attempt to answer from general knowledge.
2.  **Generate Suggestions:** Create exactly 3 relevant follow-up questions a user might ask next, based *only* on the provided context.

Output Format:
Return **ONLY** a valid JSON object matching this structure EXACTLY:
{{
  "answer": "<Your concise answer based ONLY on context, or the specific 'not found' message>",
  "source": "document | rulebook | none",
  "suggested_questions": ["Follow-up Question 1", "Follow-up Question 2", "Follow-up Question 3"]
}}

--- PROVIDED CONTEXT START ---
Document context:
{doc_context_str if doc_context_str else "No relevant document context found."}

Rulebook context:
{rulebook_context_str if rulebook_context_str else "No relevant rulebook context found."}
--- PROVIDED CONTEXT END ---

User Question:
{question}
"""
    response_data = generate_json_from_gemini(prompt)

    # Validate response structure (optional but recommended)
    if not isinstance(response_data, dict) or not all(k in response_data for k in ["answer", "source", "suggested_questions"]):
         print(f"Warning: Gemini returned malformed JSON for query: {question}. Raw: {response_data}")
         response_data = {
             "answer": "There was an issue generating the response. Please try rephrasing your question.",
             "source": "none",
             "suggested_questions": []
         }

    return {
        "response_json": response_data,
        "retrieved_clauses_doc_count": len(retrieved_doc_texts),
        "retrieved_clauses_rulebook_count": len(retrieved_rulebook_texts),
        "DEBUG_DOC_CONTEXT": retrieved_doc_texts,
        "DEBUG_RULEBOOK_CONTEXT": retrieved_rulebook_texts
    }

@app.post("/query")
async def query_rag_endpoint(user_query: str = Form(...)):
    """
    Receives a user query and directly queries the Vertex RAG corpus
    with the strict QUERY_PROMPT.
    """
    try:
        # Initialize RAG with the corpus you already uploaded chunks to
        corpus = rag.RagCorpus(name="legal-rag-corpus")

        # RAG internally retrieves relevant chunks from the corpus
        full_prompt = QUERY_PROMPT + f"\n\nUser Question:\n{user_query}"

        rag_response = corpus.generate(query=full_prompt)

        return {
            "response": rag_response.text
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process query: {e}")

@app.post("/query")
async def query_legal_rag(
    user_id: str = Form(...),
    doc_id: str = Form(...),
    query: str = Form(...)
):
    """
    Query the ADK-powered RAG Agent for legal question answering.
    Accepts form data: user_id, doc_id, query
    """
    try:
        agent = root_agent()
        response = agent.query(query)

        return {
            "user_id": user_id,
            "doc_id": doc_id,
            "response": response
        }
    except Exception as e:
        return {"error": str(e)}
    



@app.post("/batch_pipeline")
async def batch_pipeline(doc_id: str = Form(...), user_id: str = Form(...), type: str = Form("basic")):
    """
    Batch pipeline for document analysis.
    
    Parameters:
    - doc_id: Document ID
    - user_id: User ID
    - type: Analysis type - "basic" (simple language for everyone) or "pro" (legal terminology)
    """
    if not fetch_doc_chunks(user_id, doc_id):
        raise HTTPException(status_code=404, detail="Document not found. Please upload first.")

    # Validate type parameter
    if type.lower() not in ["basic", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid type. Must be 'basic' or 'pro'.")

    # Pass the analysis_type to all sub-functions
    summary_resp = await summarize_doc(doc_id, user_id, type)
    clauses_resp = await get_clauses(doc_id, user_id, type)
    risks_resp = await classify_risks(doc_id, user_id, type)

    full_data = {
        "doc_id": doc_id,
        "analysis_type": type,
        "summary": summary_resp.get("summary_json", {}),
        "clauses": clauses_resp.get("clauses_json", {}),
        "risks": risks_resp.get("risks", {})
    }

    save_processed_data(user_id, doc_id, "full_analysis", full_data)
    return full_data


    
###Might throw error in /batch and gen-report - update not now
@app.post("/generate-report")
async def generate_report_endpoint(request_data: dict):
    try:
        pdf_bytes = create_pdf_from_json(request_data)
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment;filename=Legal_Report.pdf"}
        )
    except Exception as e:
        print(f"Failed to generate report: {e}")
        return {"error": "Failed to generate PDF report."}, 500



@app.post("/generate-questions")
async def generate_questions(doc_id: str = Form(...), user_id: str = Form(...)):
    full_analysis_data = get_processed_data(user_id, doc_id, "full_analysis")
    if not full_analysis_data:
        raise HTTPException(status_code=404, detail="Analysis data not found for this document. Run /batch_pipeline first.")

    summary_text = full_analysis_data.get('summary', {}).get('summary', 'No summary provided.')
    top_clauses = full_analysis_data.get('clauses', {}).get('top_clauses', [])

    formatted_clauses = "\n".join([f"Clause: {c.get('clause', 'N/A')}" for c in top_clauses])

    prompt = f"""
You are an expert legal consultant. Your goal is to help the user understand their contractual risks and obligations.

Task:
Generate a list of exactly 7 insightful, proactive, **one-liner**,and relevant questions based on the provided document summary and analysis. These questions should prompt the user to consider legal risks, compliance issues, or necessary next steps.

Instructions:
1. Generate 7 unique , short and simple questions that user would ask.
2. Structure questions clearly (e.g., "What happens if...", "Am I required to...").
3. Return the result as a simple JSON list of strings: {{"questions": ["question 1", "question 2", ...]}}

--- DOCUMENT SUMMARY ---
{summary_text}

--- TOP CLAUSE ANALYSIS (TEXT ONLY) ---
{formatted_clauses}
"""
    questions_data = generate_json_from_gemini(prompt)
    return questions_data


@app.get("/view-chunks")
async def view_chunks(doc_id: str, user_id: str):
    """
    Returns all stored chunks for a given document.
    """
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found or no chunks available.")

    # Return only the content and chunk_id for readability
    return {
        "doc_id": doc_id,
        "user_id": user_id,
        "chunks": [{"chunk_id": c.get("chunk_id"), "content": c.get("content")} for c in chunks]
    }

class MaskResponse(BaseModel):
    status: str
    uploaded_doc: str
    mask_mapping: dict

    

os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/mask-pdf")
async def masking_data(
    file: UploadFile = File(...),
):
    # Construct file path
    file_path = os.path.join(UPLOAD_DIR, file.filename)

    # Save file locally
    with open(file_path, "wb") as f:
        f.write(await file.read())

    # Call masking function
    result = await mask_pdf(file_path)

    return {
        "message": "File uploaded & masked successfully!",
        "original_path": file_path,
        **result  # contains masked_pdf_path + mapping
    }


from fastapi import Form
from fastapi.responses import JSONResponse
from utils.retrieval import retrieve_top_k_pinecone
import pinecone

# Make sure you have initialized Pinecone and have the index object
USE_PINECONE = os.getenv("USE_PINECONE", "true").lower() not in ("0", "false", "no")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")

if USE_PINECONE and not PINECONE_API_KEY:
    # If user asked to use Pinecone but didn't set API key, fail early
    raise ValueError("PINECONE_API_KEY environment variable not set but USE_PINECONE is enabled.")

pc = Pinecone(api_key=PINECONE_API_KEY) if USE_PINECONE else None
if USE_PINECONE:
    if "legal-doc-index" not in pc.list_indexes().names():
        pc.create_index(
            name="legal-doc-index",
            dimension=1536,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
    rulebook_index = pc.Index("legal-doc-index")
else:
    rulebook_index = None

from fastapi import Form, FastAPI, HTTPException, Request
from typing import List
import json

@app.post("/view-rulebook-source")
async def view_rulebook_source(
    request: Request,
    top_k: int = 1
):
    """
    Extracts data["summary"]["key_terms"] from the input JSON.
    For each key term, retrieves the most relevant rulebook chunk from Pinecone and
    generates an explanation via the LLM.
    """
    if not USE_PINECONE or rulebook_index is None:
        return {
            "error": "Rulebook retrieval via Pinecone is disabled. Enable USE_PINECONE=true to use /view-rulebook-source."
        }

    try:
        # Parse incoming JSON
        data = await request.json()

        # Extract key terms
        key_terms_list = data.get("summary", {}).get("key_terms", [])[:15]
        if not isinstance(key_terms_list, list) or not key_terms_list:
            raise HTTPException(
                status_code=400,
                detail="Missing or invalid data['summary']['key_terms']. Expected a non-empty list of strings."
            )

        results = []

        # Loop through each key term
        for term in key_terms_list:
            # 1️⃣ Embed the term
            query_emb = embed_texts_batch([term])[0]

            # 2️⃣ Retrieve top chunk(s) from Pinecone
            retrieved_chunks = retrieve_top_k_pinecone(query_emb, rulebook_index, k=top_k)
            context = "\n\n".join(retrieved_chunks)

            # 3️⃣ Prompt LLM for explanation
            prompt = f"""
You are a legal assistant for a professional law person.
Use "Rulebook context" to clarify terms found in the document context.
Given the following rulebook excerpt, explain the meaning or relevance of the term in professional, clear language. 
If the term is not found in the context, reply exactly: "Not found in context."

Term: {term}

Rulebook Context:
{context if context else "No relevant rulebook context found."}

Return ONLY a valid JSON object: {{"term": "<term>", "explanation": "<explanation or Not found in context.>"}}
"""
            llm_resp = generate_json_from_gemini(prompt)

            # 4️⃣ Fallback if LLM fails or returns invalid JSON
            if not isinstance(llm_resp, dict) or "explanation" not in llm_resp:
                llm_resp = {
                    "term": term,
                    "explanation": "Not found in context." if not context else context
                }

            results.append(llm_resp)

        return {"results": results}

    except HTTPException as e:
        raise e
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return {"error": str(e)}