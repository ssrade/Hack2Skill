# utils/retrieval.py
from typing import List, Optional, Any
import numpy as np

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    denom = (np.linalg.norm(vec1) * np.linalg.norm(vec2))
    if denom == 0:
        return 0.0
    return float(np.dot(vec1, vec2) / denom)

def retrieve_top_k(query_emb: np.ndarray, vector_store: dict, k: int = 5) -> List[str]:
    """
    Retrieve top-k most similar clauses from a local vector store (dict).
    vector_store format: {idx: {"text": clause_text, "embedding": np.array}}
    """
    import numpy as _np
    scores = []
    for idx, data in vector_store.items():
        emb = data.get("embedding")
        if emb is None:
            continue
        sim = cosine_similarity(query_emb, emb)
        scores.append((sim, data["text"]))
    scores.sort(reverse=True, key=lambda x: x[0])
    return [text for _, text in scores[:k]]

def retrieve_top_k_pinecone(query_emb: Any, pinecone_index, k: int = 5, filter_dict: Optional[dict] = None) -> List[str]:
    """
    Retrieve top-k texts from a Pinecone index.
    Accepts:

      - query_emb: list or numpy array embedding
      - pinecone_index: Pinecone Index object
      - k: top k
      - filter_dict: optional metadata filter for Pinecone

    Returns a list of textual snippets (fallback order: snippet -> text -> metadata fields).
    """
    # convert numpy arrays to lists
    if hasattr(query_emb, "tolist"):
        query_emb = query_emb.tolist()

    # Newer Pinecone SDK uses 'filter' param name. Some wrappers use filter_dict. Use filter.
    response = pinecone_index.query(
        vector=query_emb,
        top_k=k,
        include_metadata=True,
        filter=filter_dict or {}
    )

    # response can be dict-like or object with .matches depending on Pinecone client
    matches = []
    if isinstance(response, dict):
        matches = response.get("matches", [])
    else:
        # object returned (older/newer SDKs). attempt to read attribute
        matches = getattr(response, "matches", []) or []

    top_texts = []
    for m in matches:
        meta = m.get("metadata") if isinstance(m, dict) else getattr(m, "metadata", None)
        if not meta:
            continue
        # prefer snippet, then text, then any metadata field that looks useful
        text_candidate = None
        if isinstance(meta, dict):
            text_candidate = meta.get("snippet") or meta.get("text") or meta.get("content") or meta.get("chunk")
        else:
            # if metadata is an object, try attributes
            text_candidate = getattr(meta, "snippet", None) or getattr(meta, "text", None)
        if text_candidate:
            top_texts.append(text_candidate)
    return top_texts
