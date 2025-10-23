# utils/pdf_gen.py
import pandas as pd
import plotly.express as px
import tempfile
import os
import pdfkit

pdfkit_config = None  # Set wkhtmltopdf path if needed

def generate_heatmap_image(clauses):
    """Generate risk heatmap PNG from dynamic clauses."""
    df = pd.DataFrame(clauses)
    risk_map = {"low": 3, "medium": 6, "high": 9}
    df['risk_numeric'] = df['risk_category'].str.lower().map(risk_map).fillna(0)

    fig = px.imshow([df["risk_numeric"].tolist()],
                    labels=dict(x="Clauses", y="", color="Risk"),
                    x=[f"Clause {i+1}" for i in range(len(df))],
                    y=[""],
                    color_continuous_scale="Reds")

    fig.update_layout(title_text='<b>Risk Distribution Heatmap</b>', title_x=0.5,
                      height=150, margin=dict(t=50, b=20, l=20, r=20), xaxis_title=None)
    fig.update_yaxes(showticklabels=False, title_text=None)

    tmp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".png")
    fig.write_image(tmp_file.name)
    tmp_file.close()
    return tmp_file.name

def _get_risk_class(risk_category):
    if not isinstance(risk_category, str): return "risk-na"
    return {"low": "risk-low", "medium": "risk-medium", "high": "risk-high"}.get(risk_category.lower(), "risk-na")

def create_pdf_report(summary_text, clauses_list, output_pdf="Legal_Report.pdf"):
    """Create PDF dynamically from passed summary and clauses JSON."""
    # Heatmap dynamically
    heatmap_path = generate_heatmap_image(clauses_list)

    # Build HTML for clauses dynamically
    clauses_html = ""
    for c in clauses_list:
        risk_class = _get_risk_class(c.get('risk_category'))
        risk_display = c.get('risk_category', 'N/A').capitalize() if c.get('risk_category') else 'N/A'
        clauses_html += f"""
        <div class="clause-item">
            <p class="clause-text">{c['text']}</p>
            <span class="clause-risk {risk_class}">Risk: {risk_display}</span>
        </div>
        """

    # CSS
    css_style = """..."""  # same as previous version

    abs_heatmap_path = f"file://{os.path.abspath(heatmap_path)}"
    html_content = f"""
    <html><head><meta charset="UTF-8"><style>{css_style}</style></head>
    <body>
        <h1>Legal Document Report</h1>
        <p class="report-date">Generated on: {pd.Timestamp.now().strftime('%B %d, %Y')}</p>
        <h2>Summary</h2><div class="summary">{summary_text}</div>
        <h2>Clauses & Risks</h2>{clauses_html}
        <h2>Risk Heatmap</h2>
        <div class="heatmap-container">
            <img src="{abs_heatmap_path}" alt="Risk Heatmap">
        </div>
    </body></html>
    """

    pdfkit.from_string(html_content, output_pdf, configuration=pdfkit_config)

    # cleanup
    if heatmap_path and os.path.exists(heatmap_path):
        os.remove(heatmap_path)

    return output_pdf

def generate_pdf_from_data(summary_json, risks_json, clauses_json):
    """
    Accepts dynamic JSON from endpoints:
    - summary_json: {"summary": "...", "key_terms": [...]}
    - risks_json: {"counts": {...}, "top_clauses": {...}}
    - clauses_json: {"all_clauses": [{"text": "...", "risk_category": "..."}]}
    """

    # Handle empty or 0 inputs
    if not summary_json or summary_json == 0:
        summary_json = {"summary": "N/A", "key_terms": []}
    if not clauses_json or clauses_json == 0:
        clauses_json = {"all_clauses": [], "top_clauses": []}
    if not risks_json or risks_json == 0:
        risks_json = {"top_clauses": {}}

    summary_text = summary_json.get("summary", "N/A")
    clauses_list = clauses_json.get("all_clauses", [])

    # Merge risk info if available
    risk_map = {}
    for risk_level, top_clauses in risks_json.get("top_clauses", {}).items():
        for clause in top_clauses:
            risk_map[clause] = risk_level.lower()

    # Ensure each clause has 'text' and 'risk_category'
    for i, c in enumerate(clauses_list):
        if isinstance(c, dict):
            c_text = c.get("text", f"Clause {i+1}")
            c["risk_category"] = risk_map.get(c_text, c.get("risk_category", "N/A"))
            c["text"] = c_text
        else:  # if clause is just a string
            clauses_list[i] = {"text": c, "risk_category": risk_map.get(c, "N/A")}

    return create_pdf_report(summary_text, clauses_list)

