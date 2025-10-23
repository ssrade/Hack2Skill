import numpy as np

def cosine_similarity(vec1: np.ndarray, vec2: np.ndarray) -> float:
    """Compute cosine similarity between two vectors."""
    return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))

def retrieve_top_k(query_emb: np.ndarray, vector_store: dict, k: int = 5) -> list[str]:
    """
    Retrieve top-k most similar clauses from the vector_store.
    vector_store format: {idx: {"text": clause_text, "embedding": np.array}}
    """
    scores = []
    for idx, data in vector_store.items():
        sim = cosine_similarity(query_emb, data["embedding"])
        scores.append((sim, data["text"]))

    # Sort by similarity descending
    scores.sort(reverse=True, key=lambda x: x[0])
    top_k = [text for _, text in scores[:k]]
    return top_k

def retrieve_top_k_pinecone(query_emb, pinecone_index, k=5):
    # Convert query embedding to list if it's a NumPy array
    if hasattr(query_emb, "tolist"):
        query_emb = query_emb.tolist()

    result = pinecone_index.query(
        vector=query_emb,
        top_k=k,
        include_metadata=True  # if you stored text in metadata
    )

    # Extract the actual texts
    top_texts = [match['metadata']['text'] for match in result['matches']]
    return top_texts