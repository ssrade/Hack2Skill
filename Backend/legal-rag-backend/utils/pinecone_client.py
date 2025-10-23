import os
from pinecone import Pinecone, ServerlessSpec
import config

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))

# Initialize or connect to RAG index
if config.RAG_INDEX_NAME not in pc.list_indexes().names():
    pc.create_index(
        name=config.RAG_INDEX_NAME,
        dimension=1536,
        metric="cosine",
        spec=ServerlessSpec(cloud="aws", region="us-east-1")
    )
rag_index = pc.Index(config.RAG_INDEX_NAME)

# Connect to existing rulebook index
rulebook_index = pc.Index(config.RULEBOOK_INDEX_NAME)
