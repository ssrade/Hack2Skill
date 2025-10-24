#text_processing.py
import re

def split_into_clauses(text: str) -> list[str]:
    """
    Split document into clauses by headings.
    Handles patterns like "1) Clause Title (Code-XYZ)" or "a. Clause".
    """
    pattern = r'(\n\d+\)\s.*?\(Code\s-\w+\)|\n[a-z]\.\s)'
    parts = re.split(pattern, text)
    grouped_clauses = []

    # First part (before first heading)
    if parts[0] and parts[0].strip():
        grouped_clauses.append(parts[0].strip())

    # Pair headings with content
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            grouped_clauses.append(f"{parts[i].strip()}\n{parts[i+1].strip()}")
        else:
            grouped_clauses.append(parts[i].strip())

    return [c for c in grouped_clauses if c]