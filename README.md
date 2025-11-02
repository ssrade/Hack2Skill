# LawBuddy AI - Legal Document Analysis Platform

[![React](https://img.shields.io/badge/React-19.1.1-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-4.1.14-38B2AC.svg)](https://tailwindcss.com/)
[![Live Demo](https://img.shields.io/badge/Demo-Live-success.svg)](https://hack2-skill-three.vercel.app/)

A modern, AI-powered legal document analysis platform that helps users understand complex legal documents through intelligent analysis, risk detection, and plain language explanations.

**🌐 Live Demo:** [https://hack2-skill-three.vercel.app/](https://hack2-skill-three.vercel.app/)

![LawBuddy AI](https://img.shields.io/badge/Status-Active-success)

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
- **npm** or **yarn** package manager
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/ssrade/Hack2Skill.git
cd Hack2Skill/R2_FeD
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=your_backend_api_url
VITE_GOOGLE_CLIENT_ID=your_google_oauth_client_id
```

4. **Start the development server**

```bash
npm run dev
```

The application will be available at `https://hack2-skill-three.vercel.app/`

### Building for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## 📖 Usage

### Basic Workflow

1. **Sign Up/Login**: Create an account or sign in using Google OAuth
2. **Upload Documents**: Upload legal documents (PDF, DOCX) for analysis
3. **View Analysis**: Review the AI-generated risk scores, complexity ratings, and extracted clauses
4. **Interactive Chat**: Ask questions about your document using the chat interface
5. **Manage Documents**: Preview, download, or delete documents from your dashboard

### Example: Uploading a Document

```typescript
// The app provides two upload types:
// - Electronic Documents (digital PDFs)
// - Scanned Documents (scanned images requiring OCR)

// Simply drag and drop or click to upload
// The AI will automatically analyze and provide insights
```

### Example: Chat with Your Document

```typescript
// Ask natural language questions about your legal document:
// "What are the termination clauses?"
// "Explain the payment terms in simple language"
// "What are the risks in this contract?"
```

## 🛠️ Tech Stack

### Frontend Framework
- **React 19.1.1** - UI library
- **TypeScript 5.9.3** - Type-safe JavaScript
- **Vite 7.1.7** - Build tool and dev server

### UI & Styling
- **TailwindCSS 4.1.14** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Framer Motion 12.23.24** - Animation library
- **Lucide React** - Icon library

### State Management & Routing
- **React Router DOM 7.9.4** - Client-side routing
- **React Context API** - Global state management

### Data Visualization
- **Recharts 3.3.0** - Chart library for analytics

### Authentication
- **@react-oauth/google** - Google OAuth integration
- **jwt-decode** - JWT token handling

### HTTP Client
- **Axios 1.13.1** - Promise-based HTTP client

## 📁 Project Structure

```
R2_FeD/
├── src/
│   ├── api/              # API client modules
│   │   ├── agreementApi.ts
│   │   ├── authApi.ts
│   │   ├── ragQueryApi.ts
│   │   └── uploadDocument.ts
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Base UI components (buttons, cards, etc.)
│   │   ├── ChatInterface.tsx
│   │   ├── DocumentSidebar.tsx
│   │   ├── DocumentView.tsx
│   │   └── MainApp.tsx
│   ├── contexts/         # React Context providers
│   │   ├── AuthContext.tsx
│   │   └── TranslationContext.tsx
│   ├── hooks/           # Custom React hooks
│   │   └── useDocuments.ts
│   ├── pages/           # Page components
│   │   ├── Landing.tsx
│   │   ├── LoginPage.tsx
│   │   ├── AppPage.tsx
│   │   └── ProfilePage.tsx
│   ├── services/        # Business logic services
│   ├── styles/          # Global styles
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Root component
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.ts       # Vite configuration
└── tailwind.config.js   # Tailwind CSS configuration
```

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

The frontend connects to a backend API for:

- Document upload and processing
- AI-powered analysis using RAG and Vertex AI
- User authentication and management
- Real-time chat with document context
- Document retrieval and management

API endpoints are configured via environment variables.

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

### User Profile
- Custom profile picture upload
- Cover photo upload (LinkedIn-style)
- Edit personal information
- View document statistics
- Multi-language preferences

### Translation Support
- Built-in translation service
- Multiple language support
- Automatic UI translation
- Cached translations for performance

## 🔧 Development

### Available Scripts

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

### Code Quality

The project uses:
- **ESLint** - Code linting
- **TypeScript** - Type checking
- **Prettier** (recommended) - Code formatting

### Environment Variables

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here

# Optional: Feature Flags
VITE_ENABLE_ANALYTICS=false
```

## 📚 Documentation

- **Component Documentation**: See inline JSDoc comments in component files
- **API Documentation**: Refer to the Backend API documentation
- **Type Definitions**: Check `src/types/` for TypeScript interfaces

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
# Change the port in vite.config.ts or kill the process using the port
lsof -ti:5173 | xargs kill -9  # macOS/Linux
```

**Build errors**
```bash
# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**API connection issues**
- Verify `VITE_API_BASE_URL` in `.env`
- Check if backend server is running
- Review CORS configuration

## 📞 Support

For help and support:

- **Issues**: [GitHub Issues](https://github.com/ssrade/Hack2Skill/issues)
- **Discussions**: [GitHub Discussions](https://github.com/ssrade/Hack2Skill/discussions)
- **Email**: Contact the maintainers

## 👥 Team

**Maintainers:**
- [@ssrade](https://github.com/ssrade) - Project Lead

**Contributors:**
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

## 🗺️ Roadmap

- [ ] Advanced document comparison features
- [ ] Collaborative document review
- [ ] Custom AI model training
- [ ] Mobile native applications
- [ ] Blockchain-based document verification
- [ ] Integration with legal databases
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features

---

**Built with ❤️ for legal professionals and individuals navigating complex legal documents**

For more information, visit our [documentation](docs/) or contact the team.
