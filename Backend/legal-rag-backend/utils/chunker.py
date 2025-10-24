# utils/chunker.py
# chunking and text processing 

import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_into_clauses(text: str) -> list[str]:
    """
    Split document into clauses by detecting structured headings.
    Works with patterns like '1) Clause Title (Code-XYZ)' or 'a. Clause'.
    """
    pattern = r'(\n\d+\)\s.*?\(Code\s*-\s*\w+\)|\n[a-zA-Z]\.\s)'
    parts = re.split(pattern, text)
    grouped_clauses = []

    # Handle text before the first heading
    if parts[0] and parts[0].strip():
        grouped_clauses.append(parts[0].strip())

    # Pair headings with their text
    for i in range(1, len(parts), 2):
        if i + 1 < len(parts):
            grouped_clauses.append(f"{parts[i].strip()}\n{parts[i+1].strip()}")
        else:
            grouped_clauses.append(parts[i].strip())

    return [c for c in grouped_clauses if c.strip()]


def chunk_text(text: str, chunk_size=1500, chunk_overlap=200) -> list[str]:
    """
    Splits large text into smaller chunks using RecursiveCharacterTextSplitter.
    Maintains semantic integrity by avoiding random sentence breaks.
    """
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", "!", "?", " ", ""],
    )

    return text_splitter.split_text(text)


def process_text_for_llm(text: str) -> list[str]:
    """
    Combines clause detection and text chunking for maximum LLM efficiency.
    If structured clauses are found, each clause is chunked individually.
    Otherwise, the full text is chunked directly.
    """
    clauses = split_into_clauses(text)

    if clauses and len(clauses) > 1:
        all_chunks = []
        for clause in clauses:
            all_chunks.extend(chunk_text(clause))
        return all_chunks
    else:
        # fallback for unstructured docs
        return chunk_text(text)
