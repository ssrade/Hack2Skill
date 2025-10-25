# app.py (final)
import os
import re
import json
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import documentai
from vertexai.generative_models import GenerativeModel
import vertexai
import config
from pinecone import Pinecone, ServerlessSpec
from fastapi.responses import StreamingResponse
import io

# --- Utils ---
from utils.text_processing import split_into_clauses
from utils.embeddings import embed_texts_batch
from utils.retrieval import retrieve_top_k_pinecone
from utils.pdf_extraction import extract_text_from_pdf
from utils.firestore_utils import save_processed_data, get_processed_data
from utils.chunker import chunk_text
from utils.pdf_generator.pdf_gen import create_pdf_from_json

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

# --- Endpoints ---
@app.post("/upload")
async def upload_doc(file: UploadFile = File(...), doc_type: str = Form(...), user_id: str = Form(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Upload a PDF.")

    content = await file.read()

    if doc_type.lower() == "electronic":
        text = extract_text_from_pdf(None, None, content, method="pymupdf", skip_keywords=SKIP_KEYWORDS)
    elif doc_type.lower() == "scanned":
        text = extract_text_from_pdf(documentai_client, processor_name, content, method="document_ai", skip_keywords=SKIP_KEYWORDS)
    else:
        raise HTTPException(status_code=400, detail="doc_type must be 'scanned' or 'electronic'.")

    print(f"\n[PARSER DEBUG] Extracted Text Length: {len(text)} characters.")
    print(f"[PARSER DEBUG] Text Starts With: {text[:300]}...\n")

    # chunk_text returns list[dict] with 'chunk_id', 'content', 'type'
    chunks = chunk_text(text, chunk_size=1500, chunk_overlap=200)

    # Extract plain text list for embeddings / LLM usage
    chunk_texts = [c["content"] if isinstance(c, dict) and "content" in c else str(c) for c in chunks]

    # If embeddings / Pinecone enabled -> embed & upsert
    if USE_PINECONE:
        try:
            embeddings = embed_texts_batch(chunk_texts)
        except Exception as e:
            # log and re-raise to make failure explicit
            print(f"[EMBEDDING ERROR] Failed to create embeddings: {e}")
            raise

        doc_id = str(uuid.uuid4())
        vectors = [
            {
                "id": f"{user_id}_{doc_id}_chunk_{i}",
                "values": emb,
                "metadata": {"user_id": user_id, "doc_id": doc_id, "chunk_id": i, "snippet": chunk_texts[i][:150]},
            }
            for i, emb in enumerate(embeddings)
        ]

        if vectors:
            try:
                rag_index.upsert(vectors=vectors)
                print(f"[PINECONE] SUCCESS: Upserted {len(vectors)} vectors to RAG Index.")
            except Exception as e:
                # log but do not block storing chunks locally
                print(f"[PINECONE] ERROR: Failed to upsert vectors: {e}")
    else:
        # create doc_id even when not using Pinecone
        doc_id = str(uuid.uuid4())

    # Store chunks in Firestore as list of dicts with 'content' (consistent shape)
    store_chunks = []
    # If original chunk_texts length differs, fallback to chunk_texts
    if chunks and isinstance(chunks[0], dict) and "content" in chunks[0]:
        # normalize each chunk to {"content": <str>}
        for c in chunks:
            store_chunks.append({"content": str(c.get("content", "")), "chunk_id": c.get("chunk_id"), "type": c.get("type")})
    else:
        for i, txt in enumerate(chunk_texts):
            store_chunks.append({"content": str(txt), "chunk_id": i})

    save_processed_data(user_id, doc_id, "full_text_chunks", store_chunks)

    return {"message": f"Document processed successfully ({len(store_chunks)} chunks).", "doc_id": doc_id}

@app.post("/summarize")
async def summarize_doc(doc_id: str = Form(...), user_id: str = Form(...)):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    user_doc_clauses_str = "\n\n".join(chunk_texts)

    # Retrieve rulebook contexts (if rulebook index exists)
    rulebook_chunks_str = ""
    if rulebook_index:
        rulebook_texts = retrieve_top_k_pinecone(embed_texts_batch(["Identify key legal terms"])[0], rulebook_index, k=5)
        rulebook_chunks_str = "\n\n".join(rulebook_texts)

    prompt = f"""
You are a legal assistant specializing in contracts and agreements.

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
async def get_clauses(doc_id: str = Form(...), user_id: str = Form(...)):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    clauses_str = "\n\n".join(chunk_texts)

    prompt = f"""
You are a legal assistant reviewing document clauses.

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
async def classify_risks(doc_id: str = Form(...), user_id: str = Form(...)):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunk_texts = extract_chunk_texts(chunks)
    clauses_str = "\n\n".join(chunk_texts)

    prompt = f"""
You are a legal risk analyst.
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

@app.post("/batch_pipeline")
async def batch_pipeline(doc_id: str = Form(...), user_id: str = Form(...)):
    # Verify document exists before proceeding
    if not fetch_doc_chunks(user_id, doc_id):
        raise HTTPException(status_code=404, detail="Document not found. Please upload first.")

    summary_resp = await summarize_doc(doc_id, user_id)
    clauses_resp = await get_clauses(doc_id, user_id)
    risks_resp = await classify_risks(doc_id, user_id)

    full_data = {
        "doc_id": doc_id,
        "summary": summary_resp.get("summary_json", {}),
        "clauses": clauses_resp.get("clauses_json", {}),
        "risks": risks_resp.get("risks", {})
    }
    save_processed_data(user_id, doc_id, "full_analysis", full_data)

    return full_data

@app.post("/generate-report")
async def generate_report_endpoint(request_data: dict):
    """
    Receives the full analysis JSON (result of /batch_pipeline)
    and returns a PDF file download.
    """
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

@app.get("/")
def read_root():
    return {"status": "Legal RAG Backend is running!"}
