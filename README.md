# LawBuddy AI - Legal Document Analysis Platform

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC.svg)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Demo-Live-success.svg)](https://hack2-skill-three.vercel.app/)

A modern, AI-powered legal document analysis platform that helps users understand complex legal documents through intelligent analysis, risk detection, and plain language explanations.

**🌐 Live Demo:** [https://hack2-skill-three.vercel.app/](https://hack2-skill-three.vercel.app/)
## 📖 Documentation
View the complete project documentation on [DeepWiki](https://deepwiki.com/MaNaa04/Hack2Skill)

![LawBuddy AI](https://img.shields.io/badge/Status-Active-success)

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/ssrade/Hack2Skill)

## 🎯 What is LawBuddy AI?

LawBuddy AI is a comprehensive legal document analysis application that leverages advanced AI algorithms (RAG with Vertex AI) to analyze legal agreements, identify risks, extract key clauses, and provide actionable insights. The platform features a beautiful, modern interface with real-time document processing, interactive chat capabilities, and multi-language support.

### Key Features

- **🤖 AI-Powered Analysis**: Advanced language models trained on legal documents analyze your agreements
- **⚠️ Risk Detection**: Automatically identify potential legal and financial risks
- **📊 Document Intelligence**: Extract and categorize key clauses, terms, and obligations
- **💬 Interactive Chat**: Ask questions about your documents and get instant AI-powered answers
- **🌍 Multi-Language Support**: Built-in translation capabilities for global accessibility
- **🔒 Secure & Private**: Military-grade encryption ensures document confidentiality
- **📱 Responsive Design**: Beautiful UI that works seamlessly on desktop and mobile devices
- **🌓 Dark/Light Mode**: Comfortable viewing experience with theme switching
- **📈 Document Management**: Organize, preview, and manage multiple legal documents
- **👤 User Profiles**: Personalized experience with profile customization

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)
- **PostgreSQL** database
- **Docker** (optional, for containerized deployment)
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

#### Frontend Setup (R2_FeD)

1. **Navigate to frontend directory**

```bash
cd R2_FeD
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the R2_FeD directory:

```env
VITE_API_BASE_URL=your_backend_api_url
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

4. **Start the development server**

```bash
npm run dev
```

#### Backend Setup (Node Backend)

1. **Navigate to node backend directory**

```bash
cd node_backend
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Prisma**

```bash
npx prisma generate
npx prisma migrate dev
```

4. **Start the server**

```bash
npm run dev
```

#### Backend Setup (Legal RAG Backend)

1. **Navigate to legal RAG backend directory**

```bash
cd legal-rag-backend
```

2. **Install Python dependencies**

```bash
pip install -r requirements.txt
```

3. **Configure environment variables**

Create a `.env` file with necessary API keys and configurations.

4. **Start the Flask server**

```bash
python app.py
```

## 📁 Project Structure

```
Hack2Skill/
├── Backend/
│   ├── legal-rag-backend/          # Python Flask Backend for RAG
│   │   ├── app.py                  # Main Flask application
│   │   ├── config.py               # Configuration settings
│   │   ├── requirements.txt        # Python dependencies
│   │   ├── Dockerfile             # Docker configuration
│   │   ├── rag/                   # RAG implementation
│   │   │   ├── agent.py           # RAG agent logic
│   │   │   ├── prompts.py         # Prompt templates
│   │   │   └── prepare_corpus_and_data.py
│   │   ├── utils/                 # Utility modules
│   │   │   ├── chunker.py         # Text chunking
│   │   │   ├── embeddings.py      # Embedding generation
│   │   │   ├── firestore_utils.py # Firestore integration
│   │   │   ├── masking_pdf.py     # PDF masking
│   │   │   ├── pdf_extraction.py  # PDF text extraction
│   │   │   ├── pinecone_client.py # Pinecone vector DB
│   │   │   ├── retrieval.py       # Document retrieval
│   │   │   ├── vertex_rag.py      # Vertex AI integration
│   │   │   └── pdf_generator/     # PDF generation
│   │   └── uploads/               # Document uploads
│   │       └── masked_docs/       # Masked documents
│   │
│   └── node_backend/              # Node.js/TypeScript Backend
│       ├── src/
│       │   ├── index.ts           # Main server entry point
│       │   ├── config/            # Configuration files
│       │   │   ├── database.ts    # Prisma database config
│       │   │   ├── gcp.config.ts  # Google Cloud Platform
│       │   │   ├── googleAuth.ts  # OAuth configuration
│       │   │   ├── swagger.ts     # API documentation
│       │   │   └── zep.config.ts  # Memory/chat config
│       │   ├── middleware/        # Express middleware
│       │   │   └── auth.middleware.ts
│       │   └── models/            # Business logic modules
│       │       ├── analysis/      # Document analysis
│       │       ├── auth/          # Authentication
│       │       ├── doc_services/  # Document services
│       │       ├── masking/       # Document masking
│       │       ├── memory/        # Chat memory
│       │       ├── pref_model/    # User preferences
│       │       ├── profile/       # User profiles
│       │       ├── rag_query/     # RAG query handling
│       │       └── speechToText/  # Speech-to-text
│       ├── prisma/                # Database schema
│       │   ├── schema.prisma      # Prisma schema
│       │   └── migrations/        # Database migrations
│       ├── package.json           # Node dependencies
│       ├── tsconfig.json          # TypeScript config
│       ├── Dockerfile            # Docker configuration
│       └── docker-compose.yml     # Docker Compose config
│
└── R2_FeD/                        # React Frontend
    ├── src/
    │   ├── main.tsx               # Application entry point
    │   ├── App.tsx                # Root component
    │   ├── api/                   # API client modules
    │   │   ├── agreementApi.ts
    │   │   ├── agreementProcessApi.ts
    │   │   ├── agreementQuestionsApi.ts
    │   │   ├── analysisApi.ts
    │   │   ├── authApi.ts
    │   │   ├── axiosClient.ts
    │   │   ├── deleteDocumentApi.ts
    │   │   ├── previewApi.ts
    │   │   ├── ragQueryApi.ts
    │   │   ├── reportApi.ts
    │   │   ├── rulebookApi.ts
    │   │   └── uploadDocument.ts
    │   ├── components/            # Reusable UI components
    │   │   ├── ui/               # Base UI components
    │   │   │   ├── avatar.tsx
    │   │   │   ├── badge.tsx
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── dialog.tsx
    │   │   │   ├── dropdown-menu.tsx
    │   │   │   ├── input.tsx
    │   │   │   ├── label.tsx
    │   │   │   ├── progress.tsx
    │   │   │   ├── scroll-area.tsx
    │   │   │   ├── tabs.tsx
    │   │   │   ├── textarea.tsx
    │   │   │   └── toast.tsx
    │   │   ├── figma/            # Figma components
    │   │   │   └── ImageWithFallback.tsx
    │   │   ├── LandingPageComps/ # Landing page components
    │   │   │   ├── LegalDisclaimer.tsx
    │   │   │   └── LegalHero.tsx
    │   │   ├── ChatInterface.tsx
    │   │   ├── DocumentCard.tsx
    │   │   ├── DocumentExtrasSidebar.tsx
    │   │   ├── DocumentPreviewModal.tsx
    │   │   ├── DocumentSidebar.tsx
    │   │   ├── DocumentSkeleton.tsx
    │   │   ├── DocumentView.tsx
    │   │   ├── MainApp.tsx
    │   │   ├── ModalDocumentList.tsx
    │   │   ├── OfflineBanner.tsx
    │   │   ├── SessionTimeoutBanner.tsx
    │   │   ├── UploadView.tsx
    │   │   └── UserNav.tsx
    │   ├── contexts/             # React Context providers
    │   │   ├── AuthContext.tsx
    │   │   └── TranslationContext.tsx
    │   ├── hooks/                # Custom React hooks
    │   │   ├── documentsApi.ts
    │   │   ├── useDocuments.ts
    │   │   └── useTranslatedText.ts
    │   ├── pages/                # Page components
    │   │   ├── AdminPanel.tsx
    │   │   ├── AppPage.tsx
    │   │   ├── Landing.tsx
    │   │   ├── LoginPage.tsx
    │   │   ├── PrivacyPolicy.tsx
    │   │   ├── ProfilePage.tsx
    │   │   ├── SignupPage.tsx
    │   │   └── TermsOfService.tsx
    │   ├── services/             # Business logic services
    │   │   └── translationService.ts
    │   ├── styles/               # Global styles
    │   │   └── globals.css
    │   ├── types/                # TypeScript type definitions
    │   │   ├── auth.ts
    │   │   └── index.ts
    │   └── utils/                # Utility functions
    │       └── errorHandler.ts
    ├── public/                   # Static assets
    ├── index.html                # HTML template
    ├── package.json              # Dependencies and scripts
    ├── tsconfig.json             # TypeScript configuration
    ├── vite.config.ts            # Vite configuration
    ├── vercel.json               # Vercel deployment config
    └── eslint.config.js          # ESLint configuration
```

## 🛠️ Tech Stack

### Frontend (R2_FeD)
- **React 19.1.1** - UI library
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.1.7** - Build tool and dev server
- **TailwindCSS 4.1.14** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.24** - Animation library
- **React Router DOM 7.9.4** - Client-side routing
- **Axios 1.13.1** - HTTP client

### Backend - Node.js (node_backend)
- **Node.js & TypeScript** - Server runtime
- **Express.js** - Web framework
- **Prisma** - ORM for PostgreSQL
- **PostgreSQL** - Primary database
- **Swagger** - API documentation
- **Google Cloud Platform** - Cloud services
- **Zep** - Memory management for chat

### Backend - Python (legal-rag-backend)
- **Flask** - Web framework
- **Google Vertex AI** - AI/ML platform
- **Pinecone** - Vector database
- **Firestore** - Document storage
- **RAG (Retrieval-Augmented Generation)** - AI architecture
- **PDF Processing Libraries** - Document handling

## 🎨 Key Components

### Document Analysis Flow

```typescript
// 1. Upload Component
<UploadView onUpload={handleUpload} />

// 2. Document Processing
// Backend processes document with AI/RAG

// 3. Display Results
<DocumentView 
  document={selectedDocument}
  onSendMessage={handleChatMessage}
/>
```

### Authentication Flow

```typescript
// Managed through AuthContext
const { user, login, logout, isAuthenticated } = useAuth();

// Protected routes automatically redirect unauthenticated users
<ProtectedRoute isAuth={isAuthenticated}>
  <AppPage />
</ProtectedRoute>
```

## 🌐 API Integration

The application uses a three-tier architecture:

1. **Frontend (R2_FeD)** - React application
2. **Node Backend** - REST API, authentication, database operations
3. **Python Backend** - RAG processing, AI analysis, document processing

### Key API Endpoints

- `/api/auth/*` - Authentication endpoints
- `/api/documents/*` - Document management
- `/api/analysis/*` - Document analysis
- `/api/rag-query/*` - RAG-based queries
- `/api/profile/*` - User profile management
- `/api/memory/*` - Chat memory management

## 🎯 Features in Detail

### Document Preview
- View documents in full-screen modal
- Zoom in/out functionality
- Download documents
- Open in new tab

### Document Sidebar
- List all uploaded documents
- Filter and search
- Quick document selection
- Status indicators (analyzed, processing, pending)

### Chat Interface
- Real-time messaging with AI
- Context-aware responses based on document content
- Message history per document
- Markdown support for formatted responses
- Memory persistence using Zep

### User Profile
- Custom profile picture upload
- Cover photo upload (LinkedIn-style)
- Edit personal information
- View document statistics
- Multi-language preferences

### Admin Panel
- User management
- Document analytics
- System monitoring
- Usage statistics

### Translation Support
- Built-in translation service
- Multiple language support
- Automatic UI translation
- Cached translations for performance

## 🔧 Development

### Available Scripts - Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

### Available Scripts - Node Backend

```bash
# Start development server
npm run dev

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### Available Scripts - Python Backend

```bash
# Start Flask server
python app.py

# Run tests
python test_pinecone.py
python test_vertexai.py
```

## 📚 Documentation

- **Component Documentation**: See inline JSDoc comments in component files
- **API Documentation**: Available via Swagger at `/api-docs`
- **Type Definitions**: Check `src/types/` for TypeScript interfaces
- **Database Schema**: See `prisma/schema.prisma`

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation as needed

## 🐛 Troubleshooting

### Common Issues

**Port already in use**
```bash
# Frontend
lsof -ti:5173 | xargs kill -9  # macOS/Linux

# Backend
lsof -ti:3000 | xargs kill -9  # Node backend
lsof -ti:5000 | xargs kill -9  # Python backend
```

**Build errors**
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Database connection issues**
```bash
# Reset Prisma
npx prisma migrate reset
npx prisma generate
```

**API connection issues**
- Verify `VITE_API_BASE_URL` in `.env`
- Check if backend servers are running
- Review CORS configuration

## 📞 Support

For help and support:

- **Issues**: [GitHub Issues](https://github.com/ssrade/Hack2Skill/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ssrade/Hack2Skill/discussions)
- **Email**: Contact the maintainers

## 👥 Team


**Contributors:**
- [@ssrade](https://github.com/ssrade) - Shubham Rade
- [@MaNaa04](https://github.com/MaNaa04) - Manas Pawar
- [@arpan9422](https://github.com/arpan9422) - Arpan Agrawal 
- [@TanmayNawlakhe](https://github.com/TanmayNawlakhe) - Tanmay Nawlakhe
- [@adityaa2404](https://github.com/adityaa2404) - Aditya Potdar

See the [Contributors](https://github.com/ssrade/Hack2Skill/graphs/contributors) page for a full list of contributors.

## 📄 License

This project is private and proprietary. All rights reserved.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Styled with [TailwindCSS](https://tailwindcss.com/)
- Icons by [Lucide](https://lucide.dev/)
- AI powered by Google Vertex AI
- Animations by [Framer Motion](https://www.framer.com/motion/)
- Vector database by [Pinecone](https://www.pinecone.io/)
- ORM by [Prisma](https://www.prisma.io/)

## 🗺️ Roadmap

- [ ] Advanced document comparison features
- [ ] Collaborative document review
- [ ] Custom AI model training
- [ ] Mobile native applications
- [ ] Blockchain-based document verification
- [ ] Integration with legal databases
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Real-time collaboration
- [ ] Voice-to-text document queries

---

**Built with ❤️ for legal professionals and individuals navigating complex legal documents**

For more information, visit our [documentation](docs/) or contact the team.
