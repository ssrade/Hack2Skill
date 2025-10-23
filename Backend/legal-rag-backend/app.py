import os
import re
import json
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File,Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import documentai
from vertexai.generative_models import GenerativeModel
import vertexai
import config
from pinecone import Pinecone, ServerlessSpec

# --- Utils ---
from utils.text_processing import split_into_clauses
from utils.embeddings import embed_texts_batch
from utils.retrieval import retrieve_top_k_pinecone
from utils.pdf_extraction import extract_text_from_pdf
from utils.firestore_utils import save_processed_data, get_processed_data

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
        dimension=1536,
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

def fetch_doc_clauses(user_id: str, doc_id: str):
    """Fetch all clauses of a specific document from Pinecone."""
    # Only used for ordering and LLM prompt building
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

    clauses = split_into_clauses(text)
    embeddings = embed_texts_batch(clauses)

    doc_id = str(uuid.uuid4())

    vectors = [
        {
            "id": f"{user_id}_{doc_id}_clause_{i}",
            "values": emb,
            "metadata": {"user_id": user_id, "doc_id": doc_id, "clause_id": i, "snippet": clause[:150]}
        }
        for i, (clause, emb) in enumerate(zip(clauses, embeddings))
    ]
    rag_index.upsert(vectors=vectors)

    # Store chunks in Firestore
    save_processed_data(user_id, doc_id, "full_text_chunks", clauses)

    return {"message": f"Document processed successfully ({len(clauses)} clauses).", "doc_id": doc_id}

@app.post("/summarize")
async def summarize_doc(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found.")

    retrieved_rulebook = retrieve_top_k_pinecone(embed_texts_batch(["Identify key legal terms"])[0], rulebook_index, k=5)

    prompt = f"""
You are a legal assistant specializing in contracts and agreements.

Task:
1. Summarize the uploaded document in short, clear language.
2. Extract key terms from both the document and reference rulebook.
3. Use the rulebook only for context; do not add unrelated info.
4. Return JSON exactly as: {{"summary": "<text>", "key_terms": ["term1","term2",...] }}

--- USER DOCUMENT CLAUSES ---
{"\n\n".join(clauses_text)}

--- RULEBOOK CHUNKS ---
{"\n\n".join(retrieved_rulebook)}
"""
    summary_data = generate_json_from_gemini(prompt)
    save_processed_data(user_id, doc_id, "summary", summary_data)
    return {"summary_json": summary_data}

@app.post("/clauses")
async def get_clauses(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found.")

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
{"\n\n".join(clauses_text)}
"""
    clauses_data = generate_json_from_gemini(prompt)
    clauses_data["all_clauses"] = clauses_text
    save_processed_data(user_id, doc_id, "clauses", clauses_data)
    return {"clauses_json": clauses_data}

@app.post("/risks")
async def classify_risks(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found.")

    prompt = f"""
You are a legal risk analyst. 
Classify each clause below into High, Medium, or Low Risk.

Instructions:
- High Risk: significant legal, financial, or compliance exposure.
- Medium Risk: moderate obligations or negotiable terms.
- Low Risk: standard, low-impact terms.

Task:
1. Return total counts under "counts".
2. Return top 2 clauses per risk under "top_clauses".
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
{"\n\n".join(clauses_text)}
"""
    risks_data = generate_json_from_gemini(prompt)
    save_processed_data(user_id, doc_id, "risks", risks_data)
    return {"risks": risks_data}

@app.post("/query")
async def query_doc(question: str = Form(...), doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found.")

    query_emb = embed_texts_batch([question])[0]
    retrieved_doc = retrieve_top_k_pinecone(query_emb, rag_index, k=5, filter_dict={"user_id":{"$eq":user_id}, "doc_id":{"$eq":doc_id}})
    retrieved_rulebook = retrieve_top_k_pinecone(query_emb, rulebook_index, k=10)

    prompt = f"""
You are a legal assistant. Answer the user's question using:

1. Uploaded document (primary)
2. Authoritative rulebook (reference only)

Instructions:
- Prioritize document.
- Use rulebook only to clarify.
- Indicate rulebook info with "Reference from rulebook:"
- If neither has answer, respond "The document does not provide this information."
- Output JSON: {{"answer":"<text>","source":"document|rulebook|none"}}

Document context:
{"\n\n".join(retrieved_doc)}

Rulebook context:
{"\n\n".join(retrieved_rulebook)}

Question:
{question}
"""
    response_data = generate_json_from_gemini(prompt)
    return {
        "response_json": response_data,
        "retrieved_clauses_doc": retrieved_doc,
        "retrieved_clauses_rulebook": retrieved_rulebook
    }

@app.post("/batch_pipeline")
async def batch_pipeline(doc_id: str = Form(...), user_id: str = Form(...)):
    summary_resp = await summarize_doc(doc_id, user_id)
    clauses_resp = await get_clauses(doc_id, user_id)
    risks_resp = await classify_risks(doc_id, user_id)

    return {
        "doc_id": doc_id,
        "summary": summary_resp,
        "clauses": clauses_resp,
        "risks": risks_resp
    }
