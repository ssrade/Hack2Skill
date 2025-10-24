#app.py
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
# --- Add PDF generation imports ---
from fastapi.responses import StreamingResponse
import io
# --- Utils ---
from utils.text_processing import split_into_clauses
from utils.embeddings import embed_texts_batch
from utils.retrieval import retrieve_top_k_pinecone
from utils.pdf_extraction import extract_text_from_pdf
from utils.firestore_utils import save_processed_data, get_processed_data
from utils.chunker import chunk_text
from utils.chunker import chunk_text
# --- Import PDF generation function ---
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

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Document index (user uploaded docs)
if config.RAG_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=config.RAG_INDEX_NAME,
        dimension=768,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
rag_index = pc.Index(config.RAG_INDEX_NAME)

# Rulebook index
if "legal-doc-index" not in pc.list_indexes().names():
    pc.create_index(
        name="legal-doc-index",
        dimension=1536,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
rulebook_index = pc.Index("legal-doc-index")

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
    """Fetch all chunks from Firestore for the document."""
    processed_data = get_processed_data(user_id, doc_id, "full_text_chunks")
    if not processed_data:
        return []
    return processed_data

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

    # chunks = chunk_text(text, chunk_size=1500, chunk_overlap=200)
    # embeddings = embed_texts_batch(chunks)

    # doc_id = str(uuid.uuid4())

    # vectors = [
    #     {
    #         "id": f"{user_id}_{doc_id}_chunk_{i}",
    #         "values": emb,
    #         "metadata": {"user_id": user_id, "doc_id": doc_id, "chunk_id": i, "snippet": chunk[:150]},
    #     }
    #     for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    # ]
    # rag_index.upsert(vectors=vectors)

    # # Store chunks in Firestore for LLM use
    # save_processed_data(user_id, doc_id, "full_text_chunks", chunks)

    # return {"message": f"Document processed successfully ({len(chunks)} chunks).", "doc_id": doc_id}
    print(f"\n[PARSER DEBUG] Extracted Text Length: {len(text)} characters.")
    print(f"[PARSER DEBUG] Text Starts With: {text[:300]}...\n")
    chunks = chunk_text(text, chunk_size=1500, chunk_overlap=200)
    embeddings = embed_texts_batch(chunks)

    doc_id = str(uuid.uuid4())

    vectors = [
        {
            "id": f"{user_id}_{doc_id}_chunk_{i}",
            "values": emb,
            "metadata": {"user_id": user_id, "doc_id": doc_id, "chunk_id": i, "snippet": chunk[:150]},
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    
    # === NEW: UPSERT WITH ERROR HANDLING ===
    if vectors:
        try:
            rag_index.upsert(vectors=vectors)
            print(f"[PINE CONE] SUCCESS: Upserted {len(vectors)} vectors to RAG Index.")
        except Exception as e:
            # THIS WILL PRINT A CLEAR ERROR TO YOUR DOCKER LOGS
            print(f"[PINE CONE] ERROR: Failed to upsert vectors! Check API key/Index name. Error: {e}")
            # Do NOT raise 500 here, as it would disrupt the upload flow.
    else:
        print("[PINE CONE] WARNING: No vectors generated. Check PDF content.")
    # =======================================

    # Store chunks in Firestore (this is also critical)
    save_processed_data(user_id, doc_id, "full_text_chunks", chunks)

    return {"message": f"Document processed successfully ({len(chunks)} chunks).", "doc_id": doc_id}

@app.post("/summarize")
async def summarize_doc(doc_id: str = Form(...), user_id: str = Form(...)):
    chunks = fetch_doc_chunks(user_id, doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found.")

    retrieved_rulebook_texts = retrieve_top_k_pinecone(embed_texts_batch(["Identify key legal terms"])[0], rulebook_index, k=5)

    # --- FIX for f-string backslash error ---
    user_doc_clauses_str = "\n\n".join(chunks)
    rulebook_chunks_str = "\n\n".join(retrieved_rulebook_texts)
    # ----------------------------------------

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

    # --- FIX for f-string backslash error ---
    clauses_str = "\n\n".join(chunks)
    # ----------------------------------------

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
    # Add original chunks back to the response after Gemini generates structure
    clauses_data["all_clauses"] = chunks
    save_processed_data(user_id, doc_id, "clauses", clauses_data)
    return {"clauses_json": clauses_data}

@app.post("/risks")
async def classify_risks(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text_list = fetch_doc_chunks(user_id, doc_id)
    if not clauses_text_list:
        raise HTTPException(status_code=404, detail="Document not found.")

    # --- FIX for f-string backslash error ---
    clauses_str = "\n\n".join(clauses_text_list)
    # ----------------------------------------

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
    Answers user's question based *strictly* on provided context and generates follow-ups.
    """
    if not fetch_doc_chunks(user_id, doc_id): # Check if doc exists
        raise HTTPException(status_code=404, detail="Document not found.")

    query_emb = embed_texts_batch([question])[0]
    # Retrieving slightly fewer chunks might improve relevance, k=5 is often good.
    retrieved_doc_texts = retrieve_top_k_pinecone(query_emb, rag_index, k=5, filter_dict={"user_id":{"$eq":user_id}, "doc_id":{"$eq":doc_id}})
    retrieved_rulebook_texts = retrieve_top_k_pinecone(query_emb, rulebook_index, k=5) # Reduced k for rulebook too

    doc_context_str = "\n\n".join(retrieved_doc_texts)
    rulebook_context_str = "\n\n".join(retrieved_rulebook_texts)

    # --- STRONGER PROMPT ---
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
    # -------------------------

    response_data = generate_json_from_gemini(prompt)

    # Validate response structure (optional but recommended)
    if not isinstance(response_data, dict) or not all(k in response_data for k in ["answer", "source", "suggested_questions"]):
         # Handle cases where Gemini failed to produce the correct JSON structure
         print(f"Warning: Gemini returned malformed JSON for query: {question}. Raw: {response_data}")
         # Fallback response
         response_data = {
             "answer": "There was an issue generating the response. Please try rephrasing your question.",
             "source": "none",
             "suggested_questions": []
         }


    # ... after response_data = generate_json_from_gemini(prompt)

    # --- MODIFIED RETURN FOR DEBUGGING: Returns the full text lists ---
    return {
        "response_json": response_data,
        "retrieved_clauses_doc_count": len(retrieved_doc_texts),
        "retrieved_clauses_rulebook_count": len(retrieved_rulebook_texts),
        "DEBUG_DOC_CONTEXT": retrieved_doc_texts, # <<--- NOW RETURNS THE TEXT
        "DEBUG_RULEBOOK_CONTEXT": retrieved_rulebook_texts # <<--- NOW RETURNS THE TEXT
    }
    # -----------------------------------------------------------------
# @app.post("/query")
# async def query_doc(question: str = Form(...), doc_id: str = Form(...), user_id: str = Form(...)):
#     # Check if chunks exist for the doc_id, though we use Pinecone primarily
#     if not fetch_doc_chunks(user_id, doc_id):
#         raise HTTPException(status_code=404, detail="Document not found.")

#     query_emb = embed_texts_batch([question])[0]
#     retrieved_doc_texts = retrieve_top_k_pinecone(query_emb, rag_index, k=8, filter_dict={"user_id":{"$eq":user_id}, "doc_id":{"$eq":doc_id}})
#     retrieved_rulebook_texts = retrieve_top_k_pinecone(query_emb, rulebook_index, k=10)

#     # --- FIX for f-string backslash error ---
#     doc_context_str = "\n\n".join(retrieved_doc_texts)
#     rulebook_context_str = "\n\n".join(retrieved_rulebook_texts)
#     # ----------------------------------------

#     prompt = f"""
# You are a legal assistant which assists in very normal-simplied language. **Use only the provided context to answer accurately**
# Your primary task is to answer the user's question. Your secondary task is to guide the conversation.

# 1. Uploaded document (primary)
# 2. Authoritative rulebook (reference only)

# Instructions:
# - **PRIORITY 1: Answer the Question.** Respond in very normal, simple language.
# - **PRIORITY 2: Generate Suggestions.** Generate exactly 3 unique, relevant follow-up questions based on the document and the user's query.

# Output JSON must contain both the answer and the suggestions:
# {{
#   "answer": "<text response to the question>",
#   "source": "document|rulebook|none",
#   "suggested_questions": ["Question 1", "Question 2", "Question 3"]
# }}

# Document context:
# {doc_context_str}

# Rulebook context:
# {rulebook_context_str}

# Question:
# {question}
# """
#     response_data = generate_json_from_gemini(prompt)

#     return {
#         "response_json": response_data,
#         "retrieved_clauses_doc": len(retrieved_doc_texts),
#         "retrieved_clauses_rulebook": len(retrieved_rulebook_texts)
#     }
    

@app.post("/batch_pipeline")
async def batch_pipeline(doc_id: str = Form(...), user_id: str = Form(...)):
    # Verify document exists before proceeding
    if not fetch_doc_chunks(user_id, doc_id):
        raise HTTPException(status_code=404, detail="Document not found. Please upload first.")

    summary_resp = await summarize_doc(doc_id, user_id)
    clauses_resp = await get_clauses(doc_id, user_id)
    risks_resp = await classify_risks(doc_id, user_id)

    # Extract the nested JSON data correctly
    full_data = {
        "doc_id": doc_id,
        "summary": summary_resp.get("summary_json", {}),
        "clauses": clauses_resp.get("clauses_json", {}),
        "risks": risks_resp.get("risks", {})
    }
    # Save the combined results to Firestore under a specific key, e.g., 'full_analysis'
    save_processed_data(user_id, doc_id, "full_analysis", full_data)

    return full_data


# --- ADDED PDF Report Endpoint ---
@app.post("/generate-report")
async def generate_report_endpoint(request_data: dict):
    """
    Receives the full analysis JSON (result of /batch_pipeline)
    and returns a PDF file download.
    """
    try:
        # Call your helper function with the JSON from the request
        pdf_bytes = create_pdf_from_json(request_data)

        # Return the PDF bytes as a file download
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": "attachment;filename=Legal_Report.pdf"}
        )
    except Exception as e:
        # Log the error for debugging
        print(f"Failed to generate report: {e}")
        return {"error": "Failed to generate PDF report."}, 500


@app.post("/generate-questions")
async def generate_questions(doc_id: str = Form(...), user_id: str = Form(...)):
    """
    Fetches analysis data and uses Gemini to generate a list of suggested questions.
    OPTIMIZED for speed by reducing prompt length.
    """
    
    # 1. Fetch Analysis Data from Firestore
    # We assume 'full_analysis' key holds the combined JSON
    full_analysis_data = get_processed_data(user_id, doc_id, "full_analysis")
    
    if not full_analysis_data:
        raise HTTPException(status_code=404, detail="Analysis data not found for this document. Run /batch_pipeline first.")

    # Safely extract necessary components
    summary_text = full_analysis_data.get('summary', {}).get('summary', 'No summary provided.')
    top_clauses = full_analysis_data.get('clauses', {}).get('top_clauses', [])
    
    # 2. OPTIMIZED PROMPT CONSTRUCTION: 
    # We only send the clause text, NOT the verbose explanation, to save time.
    formatted_clauses = "\n".join([
        f"Clause: {c.get('clause', 'N/A')}"
        for c in top_clauses
    ])

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
    
    # 3. Call Gemini
    # This remains the slowest step, but the shorter prompt helps latency and cost.
    questions_data = generate_json_from_gemini(prompt)

    # 4. Return the list of questions
    return questions_data

# --- Health check endpoint ---
@app.get("/")
def read_root():
    return {"status": "Legal RAG Backend is running!"}

# --- Optional: If you want to run this directly with uvicorn for local testing ---
# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run(app, host="0.0.0.0", port=8080)