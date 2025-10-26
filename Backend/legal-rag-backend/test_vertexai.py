# import os
# from dotenv import load_dotenv
# import vertexai

# # Load .env if you are using one
# load_dotenv()
# os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

# # Initialize Vertex AI
# vertexai.init(
#     project="",  # replace with your actual project ID
#     location="us-south1"                    # region of your processor
# )



# print("Vertex AI initialized successfully!")
# from google.cloud import aiplatform

# print(dir(aiplatform.MatchingEngineIndexEndpoint))
# from vertexai.preview import rag
# import os
# import config

# PROJECT_ID = config.PROJECT_ID
# LOCATION = config.VERTEX_AI_LOCATION


# # List corpora
# corpora = rag.list_corpora(location=LOCATION)

# for c in corpora:
#     print("Display Name:", c.display_name)
#     print("Corpus ID:", c.name)
#     print("------")
from vertexai.preview import rag

# List all corpora
corpora = rag.list_corpora()  # no location argument

for c in corpora:
    print("Display Name:", c.display_name)
    print("Corpus ID:", c.name)
    print("------")

print("bye bye")
