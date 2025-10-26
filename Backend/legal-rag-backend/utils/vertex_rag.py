# utils/vertex_rag.py
import os
from vertexai.preview import rag
from dotenv import load_dotenv

load_dotenv()

RAG_CORPUS = os.environ.get("RAG_CORPUS")
if not RAG_CORPUS:
    raise Exception("RAG_CORPUS environment variable is missing!")

async def send_chunks_to_vertex_corpus(chunks: list[str], doc_id: str):
    """
    Send a list of text chunks (or a single concatenated text) to the Vertex RAG corpus.
    Each chunk will be uploaded as a separate document in the corpus.
    """
    corpus = rag.RagCorpus(name=RAG_CORPUS)

    try:
        # Generate unique IDs per chunk/document
        doc_ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]

        # Upload all chunks/texts
        corpus.add_texts(texts=chunks, ids=doc_ids)
        print(f"[Vertex RAG] Uploaded {len(chunks)} chunk(s) successfully.")
    except Exception as e:
        print(f"[Vertex RAG] Failed to upload chunks: {e}")
        raise

    return {"status": "success", "uploaded_chunks": len(chunks)}
