from google.cloud import firestore
from datetime import datetime

# Initialize Firestore client
db = firestore.Client()

def save_processed_data(user_id: str, doc_id: str, data_type: str, data: dict):
    """
    Save processed data (summary, clauses, risks) for a specific user and document.
    - data_type: "summary" | "clauses" | "risks"
    """
    if data_type not in ["summary", "clauses", "risks"]:
        raise ValueError(f"Invalid data_type: {data_type}")

    doc_ref = db.collection("users").document(user_id).collection("docs").document(doc_id)
    doc_ref.set({data_type: data}, merge=True)


def get_processed_data(user_id: str, doc_id: str) -> dict:
    """
    Fetch all processed data for a user/document.
    Returns a dict with keys: summary, clauses, risks (if they exist).
    """
    doc_ref = db.collection("users").document(user_id).collection("docs").document(doc_id)
    doc_snap = doc_ref.get()
    if doc_snap.exists:
        return doc_snap.to_dict()
    return {}


def delete_processed_data(user_id: str, doc_id: str):
    """
    Delete all processed data for a specific user/document.
    """
    doc_ref = db.collection("users").document(user_id).collection("docs").document(doc_id)
    doc_ref.delete()
