import os
import re
import json
import uuid
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form, HTTPException
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
from utils.pdf_gen import generate_pdf_from_data
from utils.firestore_utils import save_processed_data, get_processed_data

from fastapi.responses import FileResponse

# --- Initialization ---
load_dotenv()

# Google credentials
if not os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")

# Vertex AI
vertexai.init(project=config.PROJECT_ID, location=config.VERTEX_AI_LOCATION)
gemini = GenerativeModel("gemini-2.5-flash")

# Document AI
documentai_client = documentai.DocumentProcessorServiceClient()
processor_name = documentai_client.processor_path(
    config.PROJECT_ID, config.DOCUMENT_AI_LOCATION, config.PROCESSOR_ID
)

# Pinecone (RAG index for user docs)
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
if config.RAG_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=config.RAG_INDEX_NAME,
        dimension=1536,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
rag_index = pc.Index(config.RAG_INDEX_NAME)
rulebook_index = pc.Index("legal-doc-index")
# FastAPI app
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
    return json.loads(cleaned)


# --- Endpoints ---

@app.post("/upload")
async def upload_doc(file: UploadFile, doc_type: str = Form(...), user_id: str = Form(...)):
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

    return {"message": f"Document processed successfully ({len(clauses)} clauses).", "doc_id": doc_id}


def fetch_doc_clauses(user_id: str, doc_id: str):
    """Fetch all clauses of a specific document from Pinecone."""
    query_emb = embed_texts_batch(["dummy"])[0].tolist()  # <--- convert ndarray to list
    # embedding dimension only
    # fetch all vectors with this user_id + doc_id
    query_filter = {"user_id": {"$eq": user_id}, "doc_id": {"$eq": doc_id}}
    results = rag_index.query(vector=query_emb, top_k=1000, include_metadata=True, filter=query_filter)
    # Sort by clause_id
    sorted_clauses = sorted(results.matches, key=lambda x: x.metadata["clause_id"])
    return [f"Clause {c.metadata['clause_id']+1}: {c.metadata['snippet']}" for c in sorted_clauses]


@app.post("/summarize")
async def summarize_doc(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found in Pinecone.")

    query_emb = embed_texts_batch(["Identify key legal terms for this document."])[0]
    retrieved_rulebook = retrieve_top_k_pinecone(query_emb, rag_index, k=5)

    prompt = f"""
You are a legal assistant specializing in contracts and agreements.

Task:
1. Summarize the uploaded document in short, clear language.
2. Extract key terms from both the document and reference rulebook.
3. Use the rulebook only for context; do not add unrelated info.
4. Return JSON exactly as: {{"summary": "<text>", "key_terms": ["term1","term2",...] }}

--- USER-UPLOADED DOCUMENT CLAUSES ---
{"\n\n".join(clauses_text)}

--- RULEBOOK RELEVANT CHUNKS ---
{"\n\n".join(retrieved_rulebook)}
"""
    summary_data = generate_json_from_gemini(prompt)
    save_processed_data(user_id, doc_id, "summary", summary_data)
    return {"summary_json": summary_data}


@app.post("/clauses")
async def get_clauses(doc_id: str = Form(...), user_id: str = Form(...)):
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found in Pinecone.")

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
        raise HTTPException(status_code=404, detail="Document not found in Pinecone.")

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


@app.post("/download_pdf")
async def download_pdf(doc_id: str = Form(...), user_id: str = Form(...)):
    processed_data = get_processed_data(user_id, doc_id)
    if not processed_data or not all(k in processed_data for k in ["summary", "clauses", "risks"]):
        raise HTTPException(status_code=400, detail="Please run summarize, risks, and clauses endpoints first.")

    pdf_path = generate_pdf_from_data(
        processed_data["summary"],
        processed_data["risks"],
        processed_data["clauses"]
    )

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename="Legal_Report.pdf"
    )


@app.post("/query")
async def query_doc(question: str = Form(...), doc_id: str = Form(...), user_id: str = Form(...)):
    # Fetch document clauses from Pinecone
    clauses_text = fetch_doc_clauses(user_id, doc_id)
    if not clauses_text:
        raise HTTPException(status_code=404, detail="Document not found in Pinecone.")

    # Embed question
    query_emb = embed_texts_batch([question])[0]

    # Retrieve top clauses from the user's document
    retrieved_clauses_doc = retrieve_top_k_pinecone(query_emb, rag_index, k=5, filter_dict={"user_id": {"$eq": user_id}, "doc_id": {"$eq": doc_id}})

    # Retrieve top clauses from the reference rulebook (separate index)
    retrieved_clauses_rulebook = retrieve_top_k_pinecone(query_emb, rulebook_index, k=10)

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
{"\n\n".join(retrieved_clauses_doc)}

--- RULEBOOK CONTEXT ---
{"\n\n".join(retrieved_clauses_rulebook)}

--- QUESTION ---
{question}
"""
    response_data = generate_json_from_gemini(prompt)
    return {
        "response_json": response_data,
        "retrieved_clauses_doc": retrieved_clauses_doc,
        "retrieved_clauses_rulebook": retrieved_clauses_rulebook
    }
