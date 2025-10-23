# utils/chunker.py
# utils/chunker.py
import re
from typing import List

def chunk_text(text: str, max_chars: int = 3000, overlap: int = 300) -> List[str]:
    """
    Split text into chunks of approximately max_chars with overlap, trying not to break sentences.
    Returns list of text chunks.
    """
    if not text:
        return []

    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    # Split into sentences heuristically
    sentences = re.split(r'(?<=[\.\?\!])\s+', text)

    chunks = []
    current = ""

    for sent in sentences:
        if not sent:
            continue
        # If adding this sentence would exceed size, flush current chunk
        if len(current) + len(sent) + 1 > max_chars:
            if current:
                chunks.append(current.strip())
            # start new chunk: include overlap words from previous chunk if possible
            if chunks:
                tail_words = chunks[-1].split()[-overlap:] if overlap > 0 else []
                current = " ".join(tail_words) + " " + sent
            else:
                current = sent
        else:
            current = (current + " " + sent).strip() if current else sent

    if current:
        chunks.append(current.strip())

    # Final safety: if any chunk still too large, split by characters
    safe_chunks = []
    for ch in chunks:
        if len(ch) <= max_chars:
            safe_chunks.append(ch)
        else:
            # naive split into equal parts
            start = 0
            while start < len(ch):
                safe_chunks.append(ch[start:start+max_chars])
                start += max_chars - overlap

    return safe_chunks
