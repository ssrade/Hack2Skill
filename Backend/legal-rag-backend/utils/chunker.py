import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_into_clauses(text: str) -> list[dict]:
    """
    Splits document into logical clauses by detecting numbered or lettered headings.
    Returns list of dicts with 'content' and 'type' keys.
    """
    # Regex for headings: numbers, letters, Roman numerals, etc.
    pattern = r'(\n\d+\)|\n\d+\.\s|\n[a-z]\.\s|\n[A-Z]\.\s|\n\(\w+\)\s)'
    
    parts = re.split(pattern, text)
    grouped_clauses = []

    # Preamble before the first heading
    if parts and parts[0].strip():
        grouped_clauses.append({"content": parts[0].strip(), "type": "preamble"})

    for i in range(1, len(parts), 2):
        heading = parts[i].strip() if i < len(parts) else ""
        body = parts[i + 1].strip() if i + 1 < len(parts) else ""
        if heading or body:
            grouped_clauses.append({"content": f"{heading} {body}".strip(), "type": "clause"})

    return [c for c in grouped_clauses if c["content"]]

def chunk_text(text: str, chunk_size: int = 1500, chunk_overlap: int = 200) -> list[dict]:
    """
    Splits legal text into semantically consistent chunks.
    Step 1: Clause-level split.
    Step 2: Further splits long clauses with RecursiveCharacterTextSplitter.
    Returns list of dicts with 'content', 'type', 'chunk_id'.
    """
    clauses = split_into_clauses(text)
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "! ", "? "]  # avoid splitting mid-word
    )

    final_chunks = []
    chunk_counter = 0
    for c in clauses:
        content = c["content"]
        type_ = c["type"]

        if len(content) > chunk_size:
            sub_chunks = splitter.split_text(content)
            for sc in sub_chunks:
                final_chunks.append({
                    "chunk_id": chunk_counter,
                    "content": sc.strip(),
                    "type": type_
                })
                chunk_counter += 1
        else:
            final_chunks.append({
                "chunk_id": chunk_counter,
                "content": content.strip(),
                "type": type_
            })
            chunk_counter += 1

    return final_chunks
