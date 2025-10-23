PROJECT_ID = "hip-well-472414-c5"

PROCESSOR_ID = "dbab5c8c3c8d83b"
DOCUMENT_AI_LOCATION = "us"        # Only 'us' or 'eu'
VERTEX_AI_LOCATION = "us-central1"


FIRESTORE_COLLECTION = "user_documents" 


MATCHING_ENGINE_INDEX = "legal_clauses_index"
MATCHING_ENGINE_INDEX_ENDPOINT = "projects/1049380606759/locations/us-central1/indexEndpoints/7443379259717976064"

GEMINI_MODEL = "gemini-2.5-flash"
PINECONE_ENVIRONMENT = "us-east-1"  # or whatever environment your index is in
RAG_INDEX_NAME= "legal-doc-index"
SKIP_KEYWORDS = ["aadhaar", "passport", "voter id", "pan card", "self attested"]
