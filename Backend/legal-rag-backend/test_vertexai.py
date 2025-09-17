import os
from dotenv import load_dotenv
import vertexai

# Load .env if you are using one
load_dotenv()
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# Initialize Vertex AI
vertexai.init(
    project="hip-well-472414-c5",  # replace with your actual project ID
    location="us-south1"                    # region of your processor
)



print("Vertex AI initialized successfully!")
