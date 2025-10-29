from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine, OperatorConfig
from pdfminer.high_level import extract_text
import re
import tempfile
import os

router = APIRouter()
analyzer = AnalyzerEngine()
anonymizer = AnonymizerEngine()

# Regex patterns for India specific IDs
INDIA_REGEX_PATTERNS = {
    "AADHAAR": r"\b\d{4}\s?\d{4}\s?\d{4}\b",
    "PAN": r"\b[A-Z]{5}[0-9]{4}[A-Z]\b"
}




def mask_indian_ids(text, mapping):
    for entity_type, pattern in INDIA_REGEX_PATTERNS.items():
        matches = list(re.finditer(pattern, text))
        for i, match in enumerate(matches):
            original = match.group()
            token = f"[{entity_type}_{i}]"
            mapping[token] = original
            text = text.replace(original, token)
    return text, mapping


from fastapi import HTTPException
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import os

async def mask_pdf(pdf_path: str):
    try:
        # ✅ Extract text
        extracted_text = extract_text(pdf_path)
        mapping = {}

        # ✅ Step 1 — Regex masking
        masked_text, mapping = mask_indian_ids(extracted_text, mapping)

        # ✅ Step 2 — NLP (Presidio)
        results = analyzer.analyze(
            text=masked_text,
            language="en"
        )

        operators = {}
        for idx, r in enumerate(results):
            token = f"[{r.entity_type}_{idx}]"
            operators[r.entity_type] = OperatorConfig("replace", {"new_value": token})
            mapping[token] = masked_text[r.start:r.end]

        anonymized_result = anonymizer.anonymize(
            text=masked_text,
            analyzer_results=results,
            operators=operators
        )
        masked_text = anonymized_result.text

        # ✅ Create correct PDF output path
        base = os.path.splitext(pdf_path)[0]
        masked_pdf_path = f"{base}_masked.pdf"

        # ✅ Convert to real PDF file
        c = canvas.Canvas(masked_pdf_path, pagesize=letter)
        width, height = letter
        y = height - 40

        for line in masked_text.split("\n"):
            c.drawString(40, y, line)
            y -= 14
            if y < 40:
                c.showPage()
                y = height - 40

        c.save()

        print(f"[✅] Masked PDF created: {masked_pdf_path}")

        return {
            "masked_pdf_path": masked_pdf_path,
            "mapping": mapping
        }

    except Exception as e:
        print("[❌ ERROR IN mask_pdf]", str(e))
        raise HTTPException(status_code=500, detail=str(e))
