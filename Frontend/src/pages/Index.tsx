import { useState } from "react";
import { LegalHero } from "@/components/LegalHero";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentSummary } from "@/components/DocumentSummary";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";
import { 
  Brain, 
  FileText, 
  MessageCircle, 
  Sparkles, 
  ArrowDown, 
  Shield, 
  Zap, 
  Target, 
  Crown 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // This gets called when file upload starts (immediately when file is selected)
  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
  };

  // This gets called when backend upload is complete
  const handleUploadSuccess = (response: any) => {
    console.log("Upload success response:", response);
    setIsAnalyzing(false); // Stop the analyzing state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent"></div>
      <div className="fixed -top-40 -right-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
      <div className="fixed -bottom-40 -left-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>
      
      {/* Hero Section */}
      <LegalHero />

      {/* Animated scroll indicator */}
      <motion.div 
        className="flex justify-center mt-4 relative z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center text-gray-400"
        >
          <span className="text-sm mb-2">Scroll to explore</span>
          <ArrowDown className="w-5 h-5" />
        </motion.div>
      </motion.div>

      {/* Main Application */}
      <div className="container mx-auto px-6 py-16 relative z-10">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* Upload Section */}
          <motion.section
            id="document-upload-section"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* Background decoration */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <div className="text-center mb-12 relative z-10">
              <motion.div 
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                <Sparkles className="w-4 h-4 text-blue-300" />
                <span className="text-sm text-blue-200 font-medium">Step 1: Upload Document</span>
              </motion.div>
              <h2 className="text-4xl md:text-5xl p-2 font-bold mb-8 bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Begin Your Legal Analysis
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto text-lg leading-relaxed">
                Upload any legal document to unlock AI-powered insights, risk detection, and plain-English explanations
              </p>
            </div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <DocumentUpload 
                onUpload={handleFileUpload}
                onUploadSuccess={handleUploadSuccess}
                isAnalyzing={isAnalyzing}
              />
            </motion.div>
          </motion.section>

          {/* Analysis and Chat Section - Show immediately when file starts uploading */}
          <AnimatePresence>
            {uploadedFile && (
              <motion.div 
                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.7 }}
              >
                {/* Document Analysis */}
                <motion.section
                  initial={{ opacity: 0, x: -50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-lg">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">Document Analysis</h3>
                      <p className="text-gray-400 text-sm">AI-powered insights and risk assessment</p>
                    </div>
                  </div>
                  
                  <DocumentSummary 
                    documentName={uploadedFile.name}
                    isAnalyzing={isAnalyzing}
                  />
                </motion.section>

                {/* Chat Interface */}
                <motion.section
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  {/* Section header */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-700 flex items-center justify-center shadow-lg">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold text-white">AI Legal Assistant</h3>
                      <p className="text-gray-400 text-sm">Ask questions about your document</p>
                    </div>
                  </div>
                  
                  <ChatInterface documentUploaded={!isAnalyzing} />
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Showcase (shown when no document uploaded) */}
          {!uploadedFile && (
            <motion.section
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="text-center py-16"
            >
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-blue-400/30 rounded-full px-4 py-2 mb-4">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-blue-200 font-medium">Why Choose DocuLex AI?</span>
              </div>
              <h2 className="text-4xl md:text-5xl p-3 font-bold mb-12 bg-gradient-to-r from-blue-200 via-purple-200 to-cyan-200 bg-clip-text text-transparent">
                Enterprise-Grade Legal AI
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    icon: <Shield className="w-8 h-8 text-blue-400" />,
                    title: "Bank-Level Security",
                    description: "Military-grade encryption ensures your legal documents remain completely confidential and secure"
                  },
                  {
                    icon: <Zap className="w-8 h-8 text-purple-400" />,
                    title: "Instant Analysis",
                    description: "Analyze complex legal documents in seconds with our advanced AI algorithms"
                  },
                  {
                    icon: <Target className="w-8 h-8 text-green-400" />,
                    title: "Precision Insights",
                    description: "Using RAG and vertexAI with a reference of deeds book"
                  }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    className="bg-gray-800/40 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 hover:bg-gray-800/60 transition-all duration-300 group hover:shadow-xl"
                    whileHover={{ y: -8, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-700/50 to-gray-800/50 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Legal Disclaimer */}
          <motion.section
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <LegalDisclaimer />
          </motion.section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800/50 mt-20 py-12 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                  DocuLex AI
                </span>
                <p className="text-gray-400 text-sm">AI-Powered Legal Analysis</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm text-center md:text-right">
              © {new Date().getFullYear()} DocuLex AI. Transforming legal document analysis.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;