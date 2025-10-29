<<<<<<< Updated upstream
=======

# DocuLex AI - AI-Powered Legal Document Analysis

DocuLex AI is a powerful legal-tech platform that leverages generative AI to provide instant insights and answers from complex legal documents. This tool is designed for legal professionals, paralegals, and anyone who needs to quickly understand and query legal texts without sifting through pages of jargon.

## Features

- **Document Upload & Analysis**: Upload legal documents in PDF format for automated analysis and text extraction.
- **AI-Powered Q&A**: Ask questions in natural language and get precise answers based on the document's content.
- **Clause-by-Clause Breakdown**: View the document's text, intelligently split into individual clauses for easier review.
- **Summarization**: Get a quick summary of the entire legal document.
- **Modern & Responsive UI**: A clean and intuitive interface built with React, TypeScript, and ShadCN UI.

## Tech Stack



### Frontend

- **Framework**: [React](https://react.dev/) ![React](https://img.shields.io/badge/react-%2320232a.svg?style=plastic&logo=react&logoColor=%2361DAFB)
- **Language**: [TypeScript](https://www.typescriptlang.org/) ![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=plastic&logo=typescript&logoColor=white)
- **UI**: [ShadCN UI](https://ui.shadcn.com/) ![Shadcn UI](https://img.shields.io/badge/shadcn%2Fui-000000?style=plastic&logo=shadcnui&logoColor=white)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) ![Tailwind CSS](https://img.shields.io/badge/tailwind%20css-%2338B2AC.svg?style=plastic&logo=tailwind-css&logoColor=white)
- **Build Tool**: [Vite](https://vitejs.dev/) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=plastic&logo=vite&logoColor=white)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) ![TanStack Query](https://img.shields.io/badge/-TanStack%20Query-FF4154?style=plastic&logo=tanstack&logoColor=white)
- **HTTP Client**: [Axios](https://axios-http.com/) ![Axios](https://img.shields.io/badge/axios-2B2B2B?style=plastic&logo=axios)
- **Form Management**: [React Hook Form](https://react-hook-form.com/) ![React Hook Form](https://img.shields.io/badge/React%20Hook%20Form-EC5990?style=plastic&logo=reacthookform&logoColor=white)
- **Animation**: [Framer Motion](https://www.framer.com/motion/) ![Framer Motion](https://img.shields.io/badge/Framer%20Motion-0055FF?style=plastic&logo=framer&logoColor=white)
- **Linting**: [ESLint](https://eslint.org/) ![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=plastic&logo=eslint&logoColor=white)
- **Package Manager**: [Bun](https://bun.sh/) ![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=plastic&logo=bun&logoColor=white) or [NPM](https://www.npmjs.com/) ![NPM](https://img.shields.io/badge/NPM-%23CB3837.svg?style=plastic&logo=npm&logoColor=white)

### Backend

- **Framework**: [FastAPI](https://fastapi.tiangolo.com/) ![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=plastic&logo=fastapi)
- **Language**: [Python](https://www.python.org/) ![Python](https://img.shields.io/badge/python-3670A0?style=plastic&logo=python&logoColor=ffdd54)
- **Web Server**: [Uvicorn](https://www.uvicorn.org/) ![Uvicorn](https://img.shields.io/badge/Uvicorn-2F9E8F?style=plastic&logo=uvicorn&logoColor=white)
- **AI/ML**:
  - [Google Vertex AI (Gemini)](https://cloud.google.com/vertex-ai) ![Vertex AI](https://img.shields.io/badge/Vertex-AI-4285F4?style=plastic&logo=google-cloud)
  - [Google Document AI](https://cloud.google.com/document-ai) ![Document AI](https://img.shields.io/badge/Document-AI-4285F4?style=plastic&logo=google-cloud)
- **Vector Database**: [Pinecone](https://www.pinecone.io/) ![Pinecone](https://img.shields.io/badge/pinecone-%233B77E6.svg?style=plastic&logo=pinecone&logoColor=white)
- **API Testing**: [Swagger UI](https://fastapi.tiangolo.com/features/#automatic-docs) ![Swagger](https://img.shields.io/badge/-Swagger-%23Clojure?style=plastic&logo=swagger&logoColor=white)

## Getting Started

Follow these instructions to set up and run the project on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Bun](https://bun.sh/) (optional, but recommended) or [NPM](https://www.npmjs.com/)
- [Python](https://www.python.org/downloads/) (v3.9 or higher)
- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)
- A Google Cloud Project with Vertex AI and Document AI APIs enabled.
- A [Pinecone](https://www.pinecone.io/) account and API key.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Setup Backend:**
    - Navigate to the backend directory:
      ```bash
      cd Hack2Skill/Backend/legal-rag-backend
      ```
    - Create and activate a virtual environment:
      ```bash
      python -m venv venv
      source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
      ```
    - Install Python dependencies:
      ```bash
      pip install -r requirements.txt
      ```
    - Create a `.env` file and add your environment variables (see `.env.example` for a template).

3.  **Setup Frontend:**
    - In a new terminal, navigate to the frontend directory:
      ```bash
      cd Hack2Skill/Frontend
      ```
    - Install frontend dependencies:
      ```bash
      bun install
      # or
      npm install
      ```

### Running the Application

1.  **Start the Backend Server:**
    - In the backend directory (`Hack2Skill/Backend/legal-rag-backend`):
      ```bash
      uvicorn app:app --reload
      ```
    - The backend will be running at `http://127.0.0.1:8000`.

2.  **Start the Frontend Development Server:**
    - In the frontend directory (`Hack2Skill/Frontend`):
      ```bash
      bun run dev
      # or
      npm run dev
      ```
    - Open your browser and navigate to `http://localhost:5173` to see the application.

## Folder Structure

```
.
├── Backend/
│   └── legal-rag-backend/
│       ├── app.py              # FastAPI application
│       ├── config.py           # Configuration settings
│       ├── requirements.txt    # Python dependencies
│       └── utils/              # Utility functions
└── Frontend/
    ├── public/                 # Static assets
    ├── src/
    │   ├── api/                # API call functions
    │   ├── components/         # React components
    │   ├── hooks/              # Custom React hooks
    │   ├── lib/                # Utility functions
    │   ├── pages/              # Page components
    │   ├── App.tsx             # Main App component
    │   └── main.tsx            # Application entry point
    ├── package.json            # Frontend dependencies
    └── vite.config.ts          # Vite configuration
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
>>>>>>> Stashed changes
