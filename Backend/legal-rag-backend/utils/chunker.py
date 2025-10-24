# # utils/chunker.py
# # chunking and text processing 

# import re
# from langchain_text_splitters import RecursiveCharacterTextSplitter

# def split_into_clauses(text: str) -> list[str]:
#     """
#     Split document into clauses by detecting structured headings.
#     Works with patterns like '1) Clause Title (Code-XYZ)' or 'a. Clause'.
#     """
#     pattern = r'(\n\d+\)\s.*?\(Code\s*-\s*\w+\)|\n[a-zA-Z]\.\s)'
#     parts = re.split(pattern, text)
#     grouped_clauses = []

#     # Handle text before the first heading
#     if parts[0] and parts[0].strip():
#         grouped_clauses.append(parts[0].strip())

#     # Pair headings with their text
#     for i in range(1, len(parts), 2):
#         if i + 1 < len(parts):
#             grouped_clauses.append(f"{parts[i].strip()}\n{parts[i+1].strip()}")
#         else:
#             grouped_clauses.append(parts[i].strip())

#     return [c for c in grouped_clauses if c.strip()]


# def chunk_text(text: str, chunk_size=1500, chunk_overlap=200) -> list[str]:
#     """
#     Splits large text into smaller chunks using RecursiveCharacterTextSplitter.
#     Maintains semantic integrity by avoiding random sentence breaks.
#     """
#     text_splitter = RecursiveCharacterTextSplitter(
#         chunk_size=chunk_size,
#         chunk_overlap=chunk_overlap,
#         separators=["\n\n", "\n", ".", "!", "?", " ", ""],
#     )

#     return text_splitter.split_text(text)


# def process_text_for_llm(text: str) -> list[str]:
#     """
#     Combines clause detection and text chunking for maximum LLM efficiency.
#     If structured clauses are found, each clause is chunked individually.
#     Otherwise, the full text is chunked directly.
#     """
#     clauses = split_into_clauses(text)

#     if clauses and len(clauses) > 1:
#         all_chunks = []
#         for clause in clauses:
#             all_chunks.extend(chunk_text(clause))
#         return all_chunks
#     else:
#         # fallback for unstructured docs
#         return chunk_text(text)
# utils/chunker.py
# utils/chunker.py
import re
from langchain_text_splitters import RecursiveCharacterTextSplitter

def split_into_clauses(text: str) -> list[tuple[str, str]]:
    """
    Splits document into logical clauses by detecting numbered/lettered headings.
    Improved regex for broader matching (Arabic, Roman, Letters).
    Returns a list of tuples: (heading, body).
    """
    # Expanded pattern: Catches more formats like 1., a., (i), I. etc., with optional preceding newline
    # Group 1 captures the heading (like "1.", "(a)", "I.")
    # Group 2 captures the body text following the heading
    pattern = re.compile(
        r"^(?:(\d+\.|[a-zA-Z]\.|[ivxlcdm]+\.| \
        \(\d+\)|\([a-zA-Z]\)|\([ivxlcdm]+\))\s+)", 
        re.MULTILINE | re.IGNORECASE
    )
    
    lines = text.splitlines()
    clauses = []
    current_heading = "Preamble" # Default for text before first clause
    current_body = []

    for line in lines:
        match = pattern.match(line)
        if match:
            # Found a new heading, save the previous clause
            if current_body:
                clauses.append((current_heading, "\n".join(current_body).strip()))
            
            # Start the new clause
            current_heading = match.group(1).strip() # The detected heading (e.g., "1.", "a.")
            current_body = [line[match.end():].strip()] # Text after the heading
        else:
            # Continue current clause body
            current_body.append(line.strip())

    # Add the last clause
    if current_body:
        clauses.append((current_heading, "\n".join(current_body).strip()))

    return [(h, b) for h, b in clauses if b] # Return only clauses with body text

def chunk_text(text, chunk_size=1500, chunk_overlap=400):
    """
    Hybrid chunker — improved version.
    Splits into clauses, then further divides long ones, prepending heading info.
    """
    # Step 1: Clause-level split using the improved function
    clauses = split_into_clauses(text)

    # Step 2: Set up recursive splitter
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ". ", "! ", "? ", ", ", " ", ""], # Added more separators
        length_function=len, # Use standard len
        is_separator_regex=False,
    )

    final_chunks = []
    for heading, body in clauses:
        # Combine heading and body for context
        full_clause_text = f"{heading}\n{body}" if heading != "Preamble" else body

        if len(full_clause_text) > chunk_size:
            # Split the long clause
            sub_chunks = splitter.split_text(full_clause_text)
            
            # Prepend context to subsequent chunks
            for i, chunk in enumerate(sub_chunks):
                if i == 0:
                    final_chunks.append(chunk.strip()) # First chunk already has context
                else:
                    # Add context marker to later chunks of the same clause
                    final_chunks.append(f"(Continuation of {heading})\n{chunk.strip()}")
        elif body.strip(): # Only add if there's actual text
            final_chunks.append(full_clause_text.strip())

    return [c for c in final_chunks if c]

# --- Make sure your /upload endpoint uses chunk_text_improved ---
# Example usage in app.py /upload:
# from utils.chunker import chunk_text_improved
# ...
# chunks = chunk_text_improved(text, chunk_size=1500, chunk_overlap=400)
# ...
