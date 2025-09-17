import { useState, useCallback } from "react";
import { Upload, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onUpload: (file: File) => void;
  isAnalyzing?: boolean;
}

export const DocumentUpload = ({ onUpload, isAnalyzing }: DocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        const file = files[0];
        setUploadedFile(file);
        onUpload(file);
      }
    },
    [onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        const file = files[0];
        setUploadedFile(file);
        onUpload(file);
      }
    },
    [onUpload]
  );

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-300 hover-lift",
        dragActive
          ? "border-primary bg-accent/50 shadow-md"
          : "border-border hover:border-primary/50",
        uploadedFile && !isAnalyzing && "border-success bg-success/5",
        isAnalyzing && "border-warning bg-warning/5"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-8 text-center">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          disabled={isAnalyzing}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center transition-colors",
            uploadedFile && !isAnalyzing && "bg-success/10",
            isAnalyzing && "bg-warning/10",
            !uploadedFile && !isAnalyzing && "bg-primary/10"
          )}>
            {uploadedFile && !isAnalyzing ? (
              <CheckCircle2 className="w-8 h-8 text-success" />
            ) : isAnalyzing ? (
              <AlertTriangle className="w-8 h-8 text-warning animate-pulse" />
            ) : (
              <Upload className="w-8 h-8 text-primary" />
            )}
          </div>

          {uploadedFile ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FileText className="w-4 h-4" />
                {uploadedFile.name}
              </div>
              {isAnalyzing ? (
                <p className="text-warning text-sm">Analyzing document...</p>
              ) : (
                <p className="text-success text-sm">Document uploaded successfully</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">
                Upload Legal Document
              </h3>
              <p className="text-muted-foreground max-w-md">
                Drag and drop your legal document here, or click to browse. 
                We support PDF, Word, and text files.
              </p>
              <Button asChild className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </label>
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 text-xs text-muted-foreground">
          Supported formats: PDF, DOC, DOCX, TXT • Max size: 10MB
        </div>
      </div>
    </Card>
  );
};