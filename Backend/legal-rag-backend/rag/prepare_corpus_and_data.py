# Copyright 2025 Google LLC
# (License header remains the same)

import os
import time # Added for sleep after upload
from dotenv import load_dotenv, set_key
from google.auth import default
from google.api_core.exceptions import ResourceExhausted, PermissionDenied, NotFound # Added NotFound
import vertexai
from vertexai.preview import rag

# Attempt to import EmbeddingModelConfig, handle potential structure differences
try:
    from vertexai.preview.rag import EmbeddingModelConfig
except ImportError:
    try:
        from vertexai.preview.rag import types
        EmbeddingModelConfig = types.EmbeddingModelConfig
        print("Note: Using EmbeddingModelConfig from types submodule.")
    except ImportError:
        print("❌ CRITICAL: Could not find EmbeddingModelConfig. SDK might be too old or structure changed.")
        print("   Please ensure 'google-cloud-aiplatform' is installed and up-to-date.")
        raise # Stop execution if this essential class is missing

# --- Load environment variables ---
# Looks for .env in the parent directory (e.g., legal-rag-backend/.env)
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".env"))
load_dotenv(dotenv_path=dotenv_path)
print(f"Loaded environment variables from: {dotenv_path}")

# --- Configurations ---
# Details for Project B (RAG Project)
PROJECT_ID = os.getenv("RAG_PROJECT_ID")
if not PROJECT_ID:
    raise ValueError("❌ RAG_PROJECT_ID not set in .env file.")
LOCATION = os.getenv("RAG_LOCATION")
if not LOCATION:
    raise ValueError("❌ RAG_LOCATION not set in .env file.")

# Corpus details
CORPUS_DISPLAY_NAME = "Legal_Doc_Corpus" # Your desired Corpus name
CORPUS_DESCRIPTION = "Corpus containing legal documents for RAG"

# --- Local PDF File Configuration ---
# *** Ensure this filename matches your PDF in the legal-rag-backend folder ***
LOCAL_PDF_FILENAME = "aaatest.pdf"
LOCAL_PDF_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", LOCAL_PDF_FILENAME))
if not os.path.exists(LOCAL_PDF_PATH):
    raise FileNotFoundError(f"❌ Local PDF file not found at: {LOCAL_PDF_PATH}. Please place it in the main backend directory.")
print(f"Using local PDF file: {LOCAL_PDF_PATH}")

# Path to the .env file itself
ENV_FILE_PATH = dotenv_path

# --- Helper Functions ---

def initialize_vertex_ai():
    """Initializes Vertex AI SDK for the RAG project and location."""
    try:
        credentials, _ = default()
        vertexai.init(project=PROJECT_ID, location=LOCATION, credentials=credentials)
        print(f"✅ Vertex AI initialized for RAG project '{PROJECT_ID}' in location '{LOCATION}'.")
    except Exception as e:
        print(f"❌ Error initializing Vertex AI: {e}")
        raise

def create_or_get_corpus():
    """Creates a new RAG Corpus or retrieves an existing one in Project B."""
    try:
        embedding_model_config = EmbeddingModelConfig(
            publisher_model="publishers/google/models/text-embedding-004"
        )
    except NameError:
         print("❌ EmbeddingModelConfig class not found. Cannot proceed.")
         raise
    corpus = None
    try:
        existing_corpora_pager = rag.list_corpora()
        for existing_corpus in existing_corpora_pager:
            # Check display name and ensure it's in the correct project/location
            if (existing_corpus.display_name == CORPUS_DISPLAY_NAME and
                    f"projects/{PROJECT_ID}/locations/{LOCATION}" in existing_corpus.name):
                corpus = existing_corpus
                print(f"✅ Found existing corpus: '{CORPUS_DISPLAY_NAME}' ({corpus.name})")
                break
        if corpus is None:
            print(f"⏳ Creating new corpus '{CORPUS_DISPLAY_NAME}' in {PROJECT_ID}/{LOCATION}...")
            corpus = rag.create_corpus(
                display_name=CORPUS_DISPLAY_NAME,
                description=CORPUS_DESCRIPTION,
                embedding_model_config=embedding_model_config,
            )
            print(f"✅ Created new corpus: '{CORPUS_DISPLAY_NAME}' ({corpus.name})")
        return corpus
    except PermissionDenied as e:
        print(f"❌ Permission Denied creating/listing corpus in '{PROJECT_ID}'. Check 'Vertex AI User' role in Project B.")
        raise
    except Exception as e:
        print(f"❌ Error creating/getting corpus: {e}")
        raise

def upload_pdf_to_corpus(corpus_name, pdf_path, display_name, description):
    """Uploads a LOCAL PDF file directly to the specified corpus using rag.upload_file()."""
    print(f"⏳ Uploading '{display_name}' directly to corpus '{os.path.basename(corpus_name)}'...")
    try:
        # Use rag.upload_file with the local path
        rag_file = rag.upload_file(
            corpus_name=corpus_name,
            path=pdf_path, # The path to the local file
            display_name=display_name,
            description=description,
        )
        # upload_file is synchronous for the upload itself, but processing/indexing is background
        print(f"✅ Successfully submitted upload for '{display_name}'.")
        print(f"   File Name in Corpus: {rag_file.name}")
        print(f"   Monitor background processing/indexing in Console: Project B -> Vertex AI -> RAG Engine.")
        return rag_file
    except ResourceExhausted as e:
        print(f"❌ Error uploading file '{display_name}' (Quota Exceeded): {e}")
        print("\n   API QUOTA EXCEEDED. Request increase for embedding model QPM in Project B.")
        return None
    except PermissionDenied as e:
         print(f"❌ Permission Denied uploading file '{display_name}'. Check 'Vertex AI User' role in Project B.")
         return None
    except FileNotFoundError:
         # Should be caught earlier, but good to have
         print(f"❌ Error: Local file not found at '{pdf_path}' during upload attempt.")
         return None
    except Exception as e:
        print(f"❌ Error uploading file '{display_name}': {e}")
        return None

def update_env_file(corpus_resource_name, env_file_path_):
    """Updates the .env file with the RAG_CORPUS resource name."""
    try:
        if not os.path.exists(env_file_path_):
            with open(env_file_path_, 'w') as f: pass
            print(f"   Created empty .env file at {env_file_path_}")
        # Use quote_mode="never" to avoid extra quotes in .env
        set_key(env_file_path_, "RAG_CORPUS", corpus_resource_name, quote_mode="never")
        print(f"✅ Updated RAG_CORPUS in {env_file_path_}")
        print(f"   Set to: {corpus_resource_name}")
    except Exception as e:
        print(f"❌ Error updating .env file at {env_file_path_}: {e}")

def list_corpus_files(corpus_name):
    """Lists files in the specified corpus."""
    print(f"\n--- Listing files in corpus '{os.path.basename(corpus_name)}' ---")
    try:
        files_iterator = rag.list_files(corpus_name=corpus_name)
        files = list(files_iterator)
        print(f"   Total files found: {len(files)}")
        if not files:
            print("   No files found in the corpus yet.")
        else:
            for file in files:
                # Display file state and size if available
                state_info = f"State: {file.state.name}" if hasattr(file, 'state') else "State: ?"
                size_info = f"Size: {file.size_bytes} bytes" if hasattr(file, 'size_bytes') else "Size: ?"
                file_id = file.name.split('/')[-1] # Get last part of resource name
                print(f"   - {file.display_name} ({state_info}, {size_info}, ID: ...{file_id})")
            print("\n   Note: File state might be 'PROCESSING' initially. It needs to become 'ACTIVE' to be queried.")
    except PermissionDenied as e:
        print(f"❌ Permission Denied listing files. Check 'Vertex AI User' role.")
    except Exception as e:
        print(f"❌ Error listing files: {e}")
    print("------------------------------------------")

# --- Main Execution Logic ---
def main():
    """Main function using upload_file for local PDF to specified RAG project."""
    print("🚀 Starting RAG Corpus Prep Script (using upload_file)...")
    start_time = time.time()
    corpus = None # Initialize corpus variable

    try:
        # Step 1: Initialize Vertex AI for Project B
        initialize_vertex_ai()

        # Step 2: Create or get the RAG Corpus in Project B
        corpus = create_or_get_corpus()
        if not corpus:
            print("❌ Failed to create or get corpus. Exiting.")
            return # Stop if corpus isn't available

        # Step 3: Update .env file with the full Corpus resource name
        update_env_file(corpus.name, ENV_FILE_PATH)

        # Step 4: Upload the specified local PDF directly using upload_file
        print(f"\n📄 Preparing to upload local PDF: '{LOCAL_PDF_FILENAME}' to corpus '{corpus.display_name}'")
        rag_file_result = upload_pdf_to_corpus(
            corpus_name=corpus.name,
            pdf_path=LOCAL_PDF_PATH, # Pass the direct path to the local file
            display_name=LOCAL_PDF_FILENAME,
            description=f"Locally uploaded document: {LOCAL_PDF_FILENAME}"
        )

        # Step 5: List files (won't show completion immediately)
        if rag_file_result:
            print("\n⏱️ Upload submitted. Waiting briefly before listing files...")
            # Allow some time for the file entry to potentially appear in the list
            time.sleep(25)
            list_corpus_files(corpus_name=corpus.name)
        else:
            print("\n❌ File upload failed to start or returned no result. Check errors above.")

        end_time = time.time()
        print(f"\n🏁 Script finished in {end_time - start_time:.2f} seconds.")
        if rag_file_result:
             print("   Remember that background processing/indexing takes time. Monitor status in Google Cloud Console.")

    except FileNotFoundError as e:
         # Specific error if the local PDF isn't found at the start
         print(f"\n❌ CRITICAL ERROR: {e}")
         print("   Ensure the PDF file exists at the specified LOCAL_PDF_PATH.")
    except Exception as e:
        # Catch-all for other unexpected errors during the main flow
        print(f"\n❌ An unexpected error occurred during the main script execution: {e}")
        # Attempt to list files even if upload failed, to see corpus state
        if corpus:
            print("\nAttempting to list files in the corpus despite the error...")
            list_corpus_files(corpus.name)

if __name__ == "__main__":
    main()