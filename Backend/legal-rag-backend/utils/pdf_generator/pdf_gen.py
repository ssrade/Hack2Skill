# import io
# import os
# import json
# import base64
# import matplotlib.pyplot as plt
# from jinja2 import Environment, FileSystemLoader, select_autoescape
# from weasyprint import HTML

# # Point Jinja to this directory
# template_dir = os.path.dirname(os.path.abspath(__file__))
# env = Environment(
#     loader=FileSystemLoader(template_dir),
#     autoescape=select_autoescape(['html', 'xml'])
# )

# def create_gauge_base64(value, total, color, label):
#     """
#     Generates a Matplotlib donut chart (gauge), saves it to bytes,
#     and returns the base64 encoded string for direct HTML embedding.
#     """
#     if total == 0: total = 1
    
#     # Calculate sizes for the chart (remaining and value)
#     remaining = total - value
#     sizes = [value, remaining]
#     colors = [color, '#ecf0f1'] # Color and Light Gray for the remainder

#     fig, ax = plt.subplots(figsize=(1.5, 1.5)) # Small size
    
#     # Create the pie/donut chart
#     ax.pie(
#         sizes, 
#         colors=colors, 
#         startangle=90, 
#         counterclock=False,
#         wedgeprops={'width': 0.3}
#     )
    
#     # Add a circle in the center for the 'donut hole'
#     center_circle = plt.Circle((0, 0), 0.5, fc='white')
#     fig.gca().add_artist(center_circle)
    
#     # Add text (score) in the center
#     pct = (value / total) * 100
#     ax.text(
#         0, 0,
#         f'{pct:.0f}%',
#         ha='center', va='center',
#         fontsize=18,
#         fontweight='bold',
#         color=color
#     )
    
#     # Add label at the bottom
#     ax.text(
#         0, -0.9,
#         label,
#         ha='center', va='top',
#         fontsize=10,
#         color='#333'
#     )

#     ax.axis('equal')
    
#     # Save the plot to an in-memory buffer
#     buf = io.BytesIO()
#     plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
#     plt.close(fig) 
    
#     # Encode the buffer content to base64
#     base64_encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
#     return base64_encoded


# def create_pdf_from_json(data: dict) -> bytes:
#     """
#     Final function to process the batch analysis JSON and generate PDF bytes.
#     """
#     # --- Data Extraction ---
#     summary_nested_json = data.get('summary', {})
#     clauses_nested_json = data.get('clauses', {})
#     risks_nested_json = data.get('risks', {})
#     counts = risks_nested_json.get('counts', {})
#     total_risks = sum(counts.values())
#     if total_risks == 0: total_risks = 1

#     # Calculate percentages
#     high_count = counts.get('High', 0)
#     high_pct = (high_count / total_risks) * 100
    
#     # --- Generate Base64 Images ---
#     high_base64 = create_gauge_base64(high_count, total_risks, '#e74c3c', f"High ({high_count})")
#     medium_base64 = create_gauge_base64(counts.get('Medium', 0), total_risks, '#f39c12', f"Medium ({counts.get('Medium', 0)})")
#     low_base64 = create_gauge_base64(counts.get('Low', 0), total_risks, '#2ecc71', f"Low ({counts.get('Low', 0)})")
    
#     # --- Build Context ---
#     try:
#         template = env.get_template('template.html')

#         context = {
#             "doc_id": data.get('doc_id', 'N/A'),
#             "summary_text": summary_nested_json.get('summary', 'No summary provided.'),
#             "key_terms": summary_nested_json.get('key_terms', []),
#             "top_clauses": clauses_nested_json.get('top_clauses', []),
#             "risks": risks_nested_json,
#             # Pass the BASE64 strings and the overall percentage
#             "high_gauge_src": high_base64,
#             "medium_gauge_src": medium_base64,
#             "low_gauge_src": low_base64,
#             "high_pct": high_pct, # Used for the horizontal bar width
#             "high_pct_int": round(high_pct),
#         }

#         # Render and return PDF bytes
#         html_string = template.render(context)
#         return HTML(string=html_string).write_pdf()

#     except Exception:
#         # Re-raise the exception for FastAPI
#         raise
import io
import os
import json
import base64
import matplotlib.pyplot as plt
from jinja2 import Environment, FileSystemLoader, select_autoescape
from weasyprint import HTML

# Point Jinja to this directory where the script and template.html reside
template_dir = os.path.dirname(os.path.abspath(__file__))
env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=select_autoescape(['html', 'xml'])
)
from datetime import datetime
import pytz

from datetime import datetime
import pytz

from datetime import datetime
import pytz

def get_ist_datetime():
    """Return current IST date and time as a string."""
    ist = pytz.timezone('Asia/Kolkata')
    now = datetime.now(ist)
    return now.strftime("%d/%m/%Y, %I:%M:%S %p IST")


def create_gauge_base64(value, total, color, label):
    """
    Generates a Matplotlib donut chart (gauge), saves it to bytes,
    and returns the base64 encoded string for direct HTML embedding.
    """
    if total == 0: total = 1
    
    # Calculate sizes for the chart (remaining and value)
    remaining = total - value
    sizes = [value, remaining]
    colors = [color, '#ecf0f1'] # Color and Light Gray for the remainder

    fig, ax = plt.subplots(figsize=(1.5, 1.5)) # Small size
    
    # Create the pie/donut chart
    ax.pie(
        sizes, 
        colors=colors, 
        startangle=90, 
        counterclock=False,
        wedgeprops={'width': 0.3}
    )
    
    # Add a circle in the center for the 'donut hole'
    center_circle = plt.Circle((0, 0), 0.5, fc='white')
    fig.gca().add_artist(center_circle)
    
    # Add text (score) in the center
    pct = (value / total) * 100
    ax.text(
        0, 0,
        f'{pct:.0f}%',
        ha='center', va='center',
        fontsize=18,
        fontweight='bold',
        color=color
    )
    
    # Add label at the bottom
    ax.text(
        0, -0.9,
        label,
        ha='center', va='top',
        fontsize=10,
        color='#333'
    )

    ax.axis('equal')
    
    # Save the plot to an in-memory buffer
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
    plt.close(fig) 
    
    # Encode the buffer content to base64
    base64_encoded = base64.b64encode(buf.getvalue()).decode('utf-8')
    return base64_encoded


def create_pdf_from_json(data: dict) -> bytes:
    """
    Final function to process the batch analysis JSON and generate PDF bytes.
    """
    # --- Data Extraction ---
    summary_nested_json = data.get('summary', {})
    clauses_nested_json = data.get('clauses', {})
    risks_nested_json = data.get('risks', {})
    counts = risks_nested_json.get('counts', {})
    
    # Get Counts
    high_count = counts.get('High', 0)
    medium_count = counts.get('Medium', 0)
    low_count = counts.get('Low', 0)
    total_risks = high_count + medium_count + low_count
    
    if total_risks == 0: total_risks = 1

    # --- NEW DANGER SCORE CALCULATION ---
    # The bar should show the sum of Mid + High Risk out of 100
    danger_score = high_count + medium_count
    # The percentage of risks that are Mid or High
    danger_score_pct = (danger_score / total_risks) * 100
    
    # Determine the color based on the score percentage
    if danger_score_pct <= 30:
        bar_color = '#2ecc71'  # Green (Low Concern)
    elif danger_score_pct <= 60:
        bar_color = '#f39c12'  # Yellow (Moderate Concern)
    else:
        bar_color = '#e74c3c'  # Red (High Concern)
    # --- END NEW CALCULATION ---
    
    # Calculate percentages for gauges (unchanged)
    high_pct = (high_count / total_risks) * 100

    # --- Generate Base64 Images ---
    high_base64 = create_gauge_base64(high_count, total_risks, '#e74c3c', f"High ({high_count})")
    medium_base64 = create_gauge_base64(medium_count, total_risks, '#f39c12', f"Medium ({medium_count})")
    low_base64 = create_gauge_base64(low_count, total_risks, '#2ecc71', f"Low ({low_count})")
    
    # --- Build Context ---
    try:
        template = env.get_template('template.html')

        context = {
            "current_ist_time": get_ist_datetime(),
            "doc_id": data.get('doc_id', 'N/A'),
            "summary_text": summary_nested_json.get('summary', 'No summary provided.'),
            "key_terms": summary_nested_json.get('key_terms', []),
            "top_clauses": clauses_nested_json.get('top_clauses', []),
            "risks": risks_nested_json,
            # Pass the calculated values to the template
            "high_gauge_src": high_base64,
            "medium_gauge_src": medium_base64,
            "low_gauge_src": low_base64,
            "danger_score_pct": round(danger_score_pct), # New: For bar width
            "bar_color": bar_color, # New: For bar color
        }

        # Render and return PDF bytes
        html_string = template.render(context)
        return HTML(string=html_string).write_pdf()

    except Exception:
        # Re-raise the exception for FastAPI
        raise




