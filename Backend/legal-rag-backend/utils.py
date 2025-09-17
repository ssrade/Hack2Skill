# utils.py

import re
import numpy as np
from vertexai.language_models import TextEmbeddingModel
from google.cloud import documentai

# --- Model Initialization ---
embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")


# --- Text Processing Functions ---

def split_into_clauses(text: str) -> list[str]:
    """Splits document text into clauses for embedding."""
    # This regex splits by multiple newlines or by numbered lists (e.g., "1. ", "2. ")
    splits = re.split(r'\n{2,}|(\d+\.\s)', text)
    # Filter out None values and short/empty strings
    clauses = [s.strip() for s in splits if s and len(s.strip()) > 50]
    return clauses

def embed_text(text: str) -> np.ndarray:
    """Generates an embedding vector for a given text."""
    embeddings = embedding_model.get_embeddings([text])
    return np.array(embeddings[0].values, dtype="float32")

def retrieve_top_k(query_emb: np.ndarray, vector_store: dict, k: int = 5) -> list[str]:
    """Retrieves top-k most similar clauses using cosine similarity."""
    clauses = list(vector_store.values())
    sims = []
    for clause_data in clauses:
        vec = clause_data["embedding"]
        # Calculate cosine similarity
        sim = np.dot(query_emb, vec) / (np.linalg.norm(query_emb) * np.linalg.norm(vec))
        sims.append((clause_data["text"], sim))

    # Sort by similarity score in descending order
    sims.sort(key=lambda x: x[1], reverse=True)

    # Return the text of the top k clauses
    return [text for text, score in sims[:k]]


# --- Document AI PDF Extraction ---

def _get_text(layout: documentai.Document.Page.Layout, text: str) -> str:
    """Helper to reconstruct text from layout spans provided by Document AI."""
    response = ""
    for segment in layout.text_anchor.text_segments:
        start_index = int(segment.start_index)
        end_index = int(segment.end_index)
        response += text[start_index:end_index]
    return response

def extract_text_from_pdf(
    documentai_client: documentai.DocumentProcessorServiceClient,
    processor_name: str,
    content: bytes,
) -> str:
    """Extracts text from PDF using the specified Document AI processor,
    respecting paragraph structure from the Layout Parser.
    """
    result = documentai_client.process_document(
        request={
            "name": processor_name,
            "raw_document": {"content": content, "mime_type": "application/pdf"},
        }
    )
    document = result.document

    # Reconstruct text paragraph by paragraph from the layout information
    extracted_text = []
    for page in document.pages:
        for paragraph in page.paragraphs:
            text = _get_text(paragraph.layout, document.text)
            if text.strip():
                extracted_text.append(text)
                
    return "\n\n".join(extracted_text)