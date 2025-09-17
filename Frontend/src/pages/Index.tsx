import { useState } from "react";
import { LegalHero } from "@/components/LegalHero";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ChatInterface } from "@/components/ChatInterface";
import { DocumentSummary } from "@/components/DocumentSummary";
import { LegalDisclaimer } from "@/components/LegalDisclaimer";

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
    setIsAnalyzing(true);
    
    // Simulate analysis time
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <LegalHero />

      {/* Main Application */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Upload Section */}
          <section>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-4">Upload Your Legal Document</h2>
              <p className="text-muted-foreground">
                Start by uploading any legal document to get instant AI-powered analysis
              </p>
            </div>
            <DocumentUpload 
              onUpload={handleFileUpload}
              isAnalyzing={isAnalyzing}
            />
          </section>

          {/* Analysis and Chat Section */}
          {(uploadedFile || isAnalyzing) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Document Analysis */}
              <section>
                <h3 className="text-xl font-semibold mb-4">Document Analysis</h3>
                <DocumentSummary 
                  documentName={uploadedFile?.name}
                  isAnalyzing={isAnalyzing}
                />
              </section>

              {/* Chat Interface */}
              <section>
                <h3 className="text-xl font-semibold mb-4">Ask Questions</h3>
                <ChatInterface documentUploaded={!!uploadedFile && !isAnalyzing} />
              </section>
            </div>
          )}

          {/* Legal Disclaimer */}
          <LegalDisclaimer />
        </div>
      </div>
    </div>
  );
};

export default Index;