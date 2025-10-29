# # --- pdf_gen.py ---

# import io
# import os
# from jinja2 import Environment, FileSystemLoader, select_autoescape
# from weasyprint import HTML

# template_dir = os.path.dirname(os.path.abspath(__file__))
# env = Environment(
#     loader=FileSystemLoader(template_dir),
#     autoescape=select_autoescape(['html', 'xml'])
# )

# def create_pdf_from_json(data: dict) -> bytes:
#     """
#     Renders the HTML template with the given JSON data and returns
#     the PDF as raw bytes. Includes Debug Logging.
#     """
#     print("--- Received Data for PDF Generation ---")
#     print(data) # Log the entire input data
#     print("--------------------------------------")

#     try:
#         template = env.get_template('template.html')

#         summary_nested_json = data.get('summary', {})
#         clauses_nested_json = data.get('clauses', {})
#         risks_nested_json = data.get('risks', {})
#         counts = risks_nested_json.get('counts', {})

#         # --- Logging Extracted Data ---
#         print(f"Extracted Summary Dict: {summary_nested_json}")
#         print(f"Extracted Clauses Dict: {clauses_nested_json}")
#         print(f"Extracted Risks Dict: {risks_nested_json}")
#         # ---

#         total_risks = sum(counts.values())
#         if total_risks == 0: total_risks = 1

#         high_pct = (counts.get('High', 0) / total_risks) * 100
#         medium_pct = (counts.get('Medium', 0) / total_risks) * 100
#         low_pct = (counts.get('Low', 0) / total_risks) * 100

#         context = {
#             "doc_id": data.get('doc_id', 'N/A'),
#             "summary_text": summary_nested_json.get('summary', 'No summary provided.'),
#             "key_terms": summary_nested_json.get('key_terms', []),
#             "top_clauses": clauses_nested_json.get('top_clauses', []),
#             "risks": risks_nested_json,
#             "high_pct": high_pct,
#             "medium_pct": medium_pct,
#             "low_pct": low_pct,
#             "high_pct_int": round(high_pct),
#             "medium_pct_int": round(medium_pct),
#             "low_pct_int": round(low_pct),
#         }

#         # --- Logging Context for Template ---
#         print("\n--- Context being sent to template ---")
#         print(f"Summary Text: {context['summary_text']}")
#         print(f"Key Terms: {context['key_terms']}")
#         print(f"Top Clauses: {context['top_clauses']}")
#         print("------------------------------------")
#         # ---

#         html_string = template.render(context)
#         return HTML(string=html_string).write_pdf()

#     except Exception as e:
#         print(f"Error in PDF generation: {e}")
#         raise