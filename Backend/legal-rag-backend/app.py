# app.py

import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from google.cloud import documentai
from vertexai.generative_models import GenerativeModel
import vertexai
import config
from utils import split_into_clauses, embed_text, retrieve_top_k, extract_text_from_pdf

# --- Initialization ---
load_dotenv()

# Set credentials from .env file
# Ensure GOOGLE_APPLICATION_CREDENTIALS points to your service account JSON file
if os.getenv("GOOGLE_APPLICATION_CREDENTIALS"):
    os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
else:
    raise ValueError("GOOGLE_APPLICATION_CREDENTIALS environment variable not set.")

# Initialize Vertex AI SDK
try:
    vertexai.init(project=config.PROJECT_ID, location=config.VERTEX_AI_LOCATION)
except Exception as e:
    print(f"Error initializing Vertex AI: {e}")
    # You might want to exit or handle this more gracefully
    exit()

# Initialize API clients
documentai_client = documentai.DocumentProcessorServiceClient()
gemini = GenerativeModel("gemini-2.5-flash")

# Construct the full processor name for Document AI
processor_name = documentai_client.processor_path(
    config.PROJECT_ID, config.DOCUMENT_AI_LOCATION, config.PROCESSOR_ID
)

# --- FastAPI App ---
app = FastAPI(title="Legal RAG Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for development
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory vector store for demonstration purposes
vector_store = {}

# --- API Endpoints ---
@app.post("/upload")
async def upload_doc(file: UploadFile):
    """
    Receives a PDF, extracts text, creates embeddings, and stores them in memory.
    """
    if not file.content_type == "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")

    content = await file.read()
    text = extract_text_from_pdf(documentai_client, processor_name, content)

    print("----- EXTRACTED TEXT -----")
    print(text)
    print("--------------------------")

    clauses = split_into_clauses(text)

    vector_store.clear()  # Clear previous document's data
    for idx, clause in enumerate(clauses):
        vector_store[idx] = {"text": clause, "embedding": embed_text(clause)}

    return {"message": f"Document processed successfully. {len(clauses)} clauses stored."}


@app.post("/summarize")
async def summarize_doc():
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document has been uploaded yet.")
    
    all_text = "\n\n".join([v["text"] for v in vector_store.values()])
    prompt = f"Summarize this legal document in plain language, focusing on the key obligations and rights:\n\n{all_text}"
    response = gemini.generate_content(prompt)
    return {"summary": response.text}


@app.post("/risks")
async def classify_risks():
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document has been uploaded yet.")

    clauses_text = [v["text"] for v in vector_store.values()]
    prompt = "For a general user, classify each of the following legal clauses into High, Medium, or Low risk. Provide a brief one-sentence reason for each classification:\n\n" + "\n\n".join(f"Clause {i+1}: {text}" for i, text in enumerate(clauses_text))
    response = gemini.generate_content(prompt)
    return {"risks": response.text}


@app.post("/query")
async def query_doc(question: str = Form(...)):
    if not vector_store:
        raise HTTPException(status_code=404, detail="No document has been uploaded yet.")

    query_emb = embed_text(question)
    retrieved_clauses = retrieve_top_k(query_emb, vector_store, k=5)
    context = "\n\n".join(retrieved_clauses)

    prompt = (
        "You are a helpful legal assistant. Based *only* on the context provided below, answer the user's question in simple, clear language. "
        "If the answer is not in the context, state that you cannot find the answer in the provided text.\n\n"
        f"--- CONTEXT ---\n{context}\n\n"
        f"--- QUESTION ---\n{question}\n\n"
        "--- ANSWER ---"
    )
    response = gemini.generate_content(prompt)
    return {"answer": response.text, "retrieved_clauses": retrieved_clauses}