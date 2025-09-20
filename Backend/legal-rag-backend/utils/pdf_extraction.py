# pdf_extraction.py
import fitz  # PyMuPDF
from google.cloud import documentai

def _get_text(layout: documentai.Document.Page.Layout, text: str) -> str:
    """Extract text from a Document AI layout segment."""
    response = ""
    for segment in layout.text_anchor.text_segments:
        start = int(segment.start_index)
        end = int(segment.end_index)
        response += text[start:end]
    return response

def extract_text_from_pdf(
    documentai_client: documentai.DocumentProcessorServiceClient,
    processor_name: str,
    content: bytes,
    method: str = "document_ai",
    skip_keywords: list[str] = None
) -> str:
    """
    Extract text from PDF.

    method: 'document_ai' or 'pymupdf'
    skip_keywords: list of keywords to identify pages to skip (e.g., ID proofs)
    """
    if method == "pymupdf":
        # Fast path for fully electronic PDFs
        doc = fitz.open(stream=content, filetype="pdf")
        extracted_pages = []

        for page_num, page in enumerate(doc, start=1):
            text = page.get_text("text").strip()
            # Skip empty pages
            if not text:
                continue
            # Skip pages containing skip_keywords
            if skip_keywords and any(kw.lower() in text.lower() for kw in skip_keywords):
                continue
            extracted_pages.append(text)

        return "\n\n".join(extracted_pages)

    elif method == "document_ai":
        # OCR path for scanned PDFs
        result = documentai_client.process_document(
            request={
                "name": processor_name,
                "raw_document": {"content": content, "mime_type": "application/pdf"},
            }
        )
        document = result.document
        extracted_pages = []

        for page in document.pages:
            page_text_segments = []
            # Reconstruct paragraphs
            for paragraph in page.paragraphs:
                text = _get_text(paragraph.layout, document.text)
                if text.strip():
                    page_text_segments.append(text)
            page_text = "\n".join(page_text_segments)

            # Skip empty pages
            if not page_text.strip():
                continue
            # Skip pages containing skip_keywords
            if skip_keywords and any(kw.lower() in page_text.lower() for kw in skip_keywords):
                continue

            extracted_pages.append(page_text)

        return "\n\n".join(extracted_pages)

    else:
        raise ValueError("Invalid extraction method. Use 'pymupdf' or 'document_ai'.")

