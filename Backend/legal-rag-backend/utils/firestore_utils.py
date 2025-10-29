from google.cloud import firestore
from datetime import datetime

# Initialize Firestore client
db = firestore.Client()

VALID_DATA_TYPES = ["full_text_chunks", "summary", "clauses", "risks"]

def save_processed_data(user_id: str, doc_id: str, data_type: str, data):
    """
    Save processed data of any type (summary, clauses, risks, full_text_chunks) for a document.
    Dynamic: no need to predefine allowed types.
    """
    if not all([user_id, doc_id, data_type]):
        raise ValueError("user_id, doc_id, and data_type must be provided.")

    doc_ref = db.collection("processed_docs").document(f"{user_id}_{doc_id}")
    doc_ref.set({data_type: data}, merge=True)


def get_processed_data(user_id: str, doc_id: str, data_type: str):
    """
    Retrieve processed data of a specific type for a document.
    Returns None if not found.
    """
    if not all([user_id, doc_id, data_type]):
        raise ValueError("user_id, doc_id, and data_type must be provided.")

    doc_ref = db.collection("processed_docs").document(f"{user_id}_{doc_id}")
    doc_snapshot = doc_ref.get()
    if doc_snapshot.exists:
        return doc_snapshot.to_dict().get(data_type)
    return None

def delete_processed_data(user_id: str, doc_id: str, data_type: str):
    """
    Deletes a specific data_type from Firestore for a user document.
    """
    if data_type not in VALID_DATA_TYPES:
        raise ValueError(f"Invalid data_type: {data_type}")

    doc_ref = db.collection("users").document(user_id).collection("documents").document(doc_id)
    doc_ref.update({data_type: firestore.DELETE_FIELD})