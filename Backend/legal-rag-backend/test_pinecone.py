import os
from dotenv import load_dotenv
from pinecone import Pinecone

# Load .env variables
load_dotenv()

api_key = os.getenv("PINECONE_API_KEY")
if not api_key:
    raise ValueError("PINECONE_API_KEY not found in environment variables")

pc = Pinecone(api_key=api_key)

for idx in pc.list_indexes():
    print(idx)
