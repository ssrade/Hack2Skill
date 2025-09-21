import os
import re
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import documentai
from vertexai.generative_models import GenerativeModel
import vertexai
import config
import pinecone
import json

# Import utils
from utils.text_processing import split_into_clauses
from utils.embeddings import embed_texts_batch
from utils.retrieval import retrieve_top_k, retrieve_top_k_pinecone
from utils.pdf_extraction import extract_text_from_pdf

# --- Initialization ---
load_dotenv()

# Set credentials
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
else:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")

# Vertex AI init
vertexai.init(project=config.PROJECT_ID, location=config.VERTEX_AI_LOCATION)

# Pinecone init
from pinecone import Pinecone, ServerlessSpec
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

if config.PINECONE_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=config.PINECONE_INDEX_NAME,
        dimension=1536,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
pinecone_index = pc.Index(config.PINECONE_INDEX_NAME)

# Clients
documentai_client = documentai.DocumentProcessorServiceClient()
gemini = GenerativeModel("gemini-2.5-flash")
processor_name = documentai_client.processor_path(
    config.PROJECT_ID, config.DOCUMENT_AI_LOCATION, config.PROCESSOR_ID
)

# FastAPI app
app = FastAPI(title="Legal RAG Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory vector store
vector_store = {}
SKIP_KEYWORDS = ["aadhaar", "passport", "voter id", "pan card", "self attested"]

# --- Helper to clean Gemini output ---
def clean_gemini_response(text: str) -> str:
    """Remove ```json and ``` markers and extra whitespace."""
    return re.sub(r"```(?:json)?\s*|\s*```", "", text).strip()

def generate_json_from_gemini(prompt: str) -> dict:
    response = gemini.generate_content(prompt)
    cleaned = clean_gemini_response(response.text)
    return json.loads(cleaned)

# --- Endpoints ---

@app.post("/upload")
async def upload_doc(file: UploadFile, doc_type: str = Form(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Upload a PDF.")
    content = await file.read()
    
    if doc_type.lower() == "electronic":
        text = extract_text_from_pdf(
            documentai_client=None,
            processor_name=None,
            content=content,
            method="pymupdf",
            skip_keywords=SKIP_KEYWORDS
        )
    elif doc_type.lower() == "scanned":
        text = extract_text_from_pdf(
            documentai_client=documentai_client,
            processor_name=processor_name,
            content=content,
            method="document_ai",
            skip_keywords=SKIP_KEYWORDS
        )
    else:
        raise HTTPException(status_code=400, detail="doc_type must be 'scanned' or 'electronic'.")

    clauses = split_into_clauses(text)
    embeddings = embed_texts_batch(clauses)
    vector_store.clear()
    for idx, (clause, emb) in enumerate(zip(clauses, embeddings)):
        vector_store[idx] = {"text": clause, "embedding": emb}

    return {"message": f"Document processed successfully. {len(clauses)} clauses stored."}

@app.post("/summarize")
async def summarize_doc():
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document uploaded yet.")
    
    all_clauses = [v["text"] for v in vector_store.values()]
    query_emb = embed_texts_batch(["Identify key legal terms for this document (type, parties, obligations, etc.)"])[0]
    retrieved_rulebook = retrieve_top_k_pinecone(query_emb, pinecone_index, k=5)
    numbered_clauses = [f"Clause {i+1}: {text}" for i, text in enumerate(all_clauses)]

    prompt = f"""
You are a legal assistant specializing in contracts and agreements.

Task:
1. Summarize the uploaded document in short, clear language.
2. Extract key terms from both the document and reference rulebook.
3. Use the rulebook only for context; do not add unrelated info.
4. Return JSON exactly as: {{"summary": "<text>", "key_terms": ["term1","term2",...] }}

--- USER-UPLOADED DOCUMENT CLAUSES ---
{"\n\n".join(numbered_clauses)}

--- RULEBOOK RELEVANT CHUNKS ---
{"\n\n".join(retrieved_rulebook)}
"""
    summary_data = generate_json_from_gemini(prompt)
    return {"summary_json": summary_data}

@app.post("/risks")
async def classify_risks():
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document uploaded yet.")
    
    clauses_text = [v["text"] for v in vector_store.values()]
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
{"\n\n".join(f"Clause {i+1}: {text}" for i, text in enumerate(clauses_text))}
"""
    risks_data = generate_json_from_gemini(prompt)
    return {"risks": risks_data}

@app.post("/query")
async def query_doc(question: str = Form(...)):
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document uploaded yet.")
    
    query_emb = embed_texts_batch([question])[0]
    retrieved_clauses_local = retrieve_top_k(query_emb, vector_store, k=5)
    retrieved_clauses_rulebook = retrieve_top_k_pinecone(query_emb, pinecone_index, k=10)

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

--- USER-UPLOADED DOCUMENT CONTEXT ---
{"\n\n".join(retrieved_clauses_local)}

--- RULEBOOK CONTEXT ---
{"\n\n".join(retrieved_clauses_rulebook)}

--- QUESTION ---
{question}
"""
    response_data = generate_json_from_gemini(prompt)
    return {
        "response_json": response_data,
        "retrieved_clauses_local": retrieved_clauses_local,
        "retrieved_clauses_rulebook": retrieved_clauses_rulebook
    }

@app.post("/clauses")
async def get_clauses():
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document uploaded yet.")
    
    numbered_clauses = [f"Clause {i+1}: {v['text']}" for i, v in enumerate(vector_store.values())]
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

Clauses from document:
{"\n\n".join(numbered_clauses)}
"""
    clauses_data = generate_json_from_gemini(prompt)
    clauses_data["all_clauses"] = numbered_clauses
    return {"clauses_json": clauses_data}
