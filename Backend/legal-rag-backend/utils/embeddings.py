#embeddings.py
import numpy as np
from vertexai.language_models import TextEmbeddingModel

# Init embedding model once
embedding_model = TextEmbeddingModel.from_pretrained("text-embedding-004")

def embed_texts_batch(texts: list[str]) -> list[np.ndarray]:
    """Generate normalized embeddings for a list of texts."""
    embeddings = embedding_model.get_embeddings(texts)
    vectors = []
    for emb in embeddings:
        vec = np.array(emb.values, dtype="float32")
        vectors.append(vec / np.linalg.norm(vec))
    return vectors
