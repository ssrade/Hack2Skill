import os
import traceback
import vertexai
from dotenv import load_dotenv
from google.adk.agents import Agent
from google.adk.tools.retrieval.vertex_ai_rag_retrieval import VertexAiRagRetrieval
from .prompts import return_instructions_root  # Relative import

# --- Load environment variables ---
dotenv_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(dotenv_path=dotenv_path)
print(f"Agent loading .env from: {dotenv_path}")

# --- Initialize Vertex AI ---
RAG_PROJECT_ID = os.getenv("RAG_PROJECT_ID")
RAG_LOCATION = os.getenv("RAG_LOCATION")
if RAG_PROJECT_ID and RAG_LOCATION:
    try:
        vertexai.init(project=RAG_PROJECT_ID, location=RAG_LOCATION)
        print(f"✅ Vertex AI initialized for project {RAG_PROJECT_ID}")
    except Exception as e:
        print(f"⚠️ Warning: Vertex AI init failed: {e}")
elif not getattr(vertexai, "initialized", False):
    print("⚠️ Warning: RAG_PROJECT_ID or RAG_LOCATION missing, relying on app init.")

# --- Import RagResource ---
try:
    from vertexai.preview import rag
    RagResource = rag.RagResource
except ImportError:
    try:
        from vertexai.preview.rag import types
        RagResource = types.RagResource
        print("Note: Using RagResource from vertexai.preview.rag.types")
    except ImportError:
        print("❌ Could not import RagResource. Check SDK installation.")
        raise
except AttributeError:
    print("❌ vertexai.preview.rag found but RagResource missing.")
    raise

# --- Configure RAG Tool ---
tools = []
rag_corpus_resource_name = os.environ.get("RAG_CORPUS")
if rag_corpus_resource_name:
    print(f"✅ Found RAG corpus: ...{rag_corpus_resource_name[-20:]}")
    try:
        ask_vertex_retrieval = VertexAiRagRetrieval(
            name='retrieve_rag_documentation',
            description=(
                "Use only for user queries about the legal documents. "
                "Do not use for casual conversation or general knowledge."
            ),
            rag_resources=[
                RagResource(
                    rag_corpus=rag_corpus_resource_name
                )
            ],
            similarity_top_k=5,
            vector_distance_threshold=0.5,
        )
        tools.append(ask_vertex_retrieval)
        print("✅ VertexAiRagRetrieval tool configured successfully.")
        print(f"[DEBUG] Tool type: {type(ask_vertex_retrieval)}")
        print(f"[DEBUG] Tool methods: {[m for m in dir(ask_vertex_retrieval) if not m.startswith('_')]}")
    except Exception as e:
        print(f"❌ Failed to configure RAG tool: {e}")
        traceback.print_exc()
        print("Agent will run without RAG retrieval.")
else:
    print("⚠️ RAG_CORPUS env var missing. Agent will run without RAG retrieval.")

# Debug: Print final tools list
print(f"[DEBUG] Final tools list in agent.py: {tools}")

# --- Define Root Agent ---
root_agent = None
try:
    instruction_text = return_instructions_root(use_rag_tool=bool(tools))
    root_agent = Agent(
        model='gemini-1.5-flash',
        name='legal_rag_assistant_agent',
        instruction=instruction_text,
        tools=tools
    )
    print("✅ Root agent created successfully.")
except Exception as e:
    print(f"❌ FATAL: Failed to create root agent: {e}")
    traceback.print_exc()

__all__ = ["root_agent", "tools"]