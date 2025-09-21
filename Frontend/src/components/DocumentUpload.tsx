import { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  CheckCircle2,
  CloudUpload,
  FileCheck,
  Sparkles,
  Brain,
  Lock,
  Zap,
  ArrowUp,
  Scan,
  FileDigit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { uploadDocument } from "@/api/documentApi";

interface DocumentUploadProps {
  onUpload?: (file: File) => void;
  onUploadSuccess?: (response: any) => void;
  isAnalyzing?: boolean;
}

export const DocumentUpload = ({ onUpload, onUploadSuccess, isAnalyzing }: DocumentUploadProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [docType, setDocType] = useState<"scanned" | "electronic">("scanned");
  const [loading, setLoading] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleUploadToBackend = async (file: File) => {
    try {
      setLoading(true);
      const uploadRes = await uploadDocument(file, docType);
      console.log("Upload success:", uploadRes);

      if (onUploadSuccess) {
        onUploadSuccess(uploadRes);
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const simulateProgressAndUpload = (file: File) => {
    setUploadProgress(0);
    setUploadedFile(file);
    
    // Immediately notify parent that file is being uploaded
    if (onUpload) {
      onUpload(file);
    }

    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleUploadToBackend(file);
          return 100;
        }
        return prev + 10;
      });
    }, 100);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      const files = e.dataTransfer.files;
      if (files && files[0]) {
        simulateProgressAndUpload(files[0]);
      }
    },
    [docType, onUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files[0]) {
        simulateProgressAndUpload(files[0]);
      }
    },
    [docType, onUpload]
  );

  return (
    <Card
      className={cn(
        "relative border-2 border-dashed transition-all duration-500 overflow-hidden backdrop-blur-sm bg-gray-900/40",
        dragActive
          ? "border-blue-400 bg-gradient-to-br from-blue-500/15 to-indigo-500/15 shadow-2xl scale-[1.02]"
          : "border-gray-700/60 hover:border-blue-400/60 bg-gradient-to-br from-gray-800/40 to-gray-900/50",
        uploadedFile && !isAnalyzing && "border-emerald-400/70 bg-gradient-to-br from-emerald-500/15 to-green-500/15",
        isAnalyzing && "border-amber-400/70 bg-gradient-to-br from-amber-500/15 to-orange-500/15"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="p-7 text-center relative z-10">
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".pdf,.doc,.docx,.txt"
          onChange={handleFileSelect}
          disabled={isAnalyzing || loading}
        />

        {/* Document Type Selector */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center justify-center gap-2">
            <FileDigit className="w-5 h-5 text-blue-400" />
            Document Type
          </h3>
          <div className="flex justify-center gap-4">
            <motion.div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                docType === "scanned"
                  ? "bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border-blue-500/50 shadow-lg shadow-blue-500/20"
                  : "bg-gray-800/40 border-gray-700/50 hover:border-blue-400/40 hover:bg-gray-800/60"
              )}
              onClick={() => setDocType("scanned")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                docType === "scanned" 
                  ? "bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/40" 
                  : "bg-gray-700/60"
              )}>
                <Scan className={cn(
                  "w-5 h-5",
                  docType === "scanned" ? "text-white" : "text-gray-400"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-semibold",
                  docType === "scanned" ? "text-blue-300" : "text-gray-300"
                )}>Scanned Document</p>
                <p className="text-xs text-gray-400">PDF scans, images, photos</p>
              </div>
            </motion.div>

            <motion.div
              className={cn(
                "flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300",
                docType === "electronic"
                  ? "bg-gradient-to-br from-green-600/20 to-emerald-600/20 border-green-500/50 shadow-lg shadow-green-500/20"
                  : "bg-gray-800/40 border-gray-700/50 hover:border-green-400/40 hover:bg-gray-800/60"
              )}
              onClick={() => setDocType("electronic")}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                docType === "electronic" 
                  ? "bg-gradient-to-br from-green-500 to-emerald-600 shadow-md shadow-green-500/40" 
                  : "bg-gray-700/60"
              )}>
                <FileDigit className={cn(
                  "w-5 h-5",
                  docType === "electronic" ? "text-white" : "text-gray-400"
                )} />
              </div>
              <div className="text-left">
                <p className={cn(
                  "font-semibold",
                  docType === "electronic" ? "text-green-300" : "text-gray-300"
                )}>Electronic Document</p>
                <p className="text-xs text-gray-400">Digital PDFs, Word files, text</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Upload area */}
        <div className="flex flex-col items-center gap-6">
          <motion.div
            className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl border-2",
              uploadedFile && !isAnalyzing && "bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400/30 shadow-emerald-500/30",
              isAnalyzing && "bg-gradient-to-br from-amber-500 to-orange-600 border-amber-400/30 shadow-amber-500/30",
              !uploadedFile && !isAnalyzing && "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/30 shadow-blue-500/30"
            )}
            whileHover={{ scale: 1.05, rotate: 2 }}
            transition={{ duration: 0.3 }}
          >
            {uploadedFile && !isAnalyzing ? (
              <CheckCircle2 className="w-12 h-12 text-white" />
            ) : isAnalyzing ? (
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                <Brain className="w-12 h-12 text-white" />
              </motion.div>
            ) : (
              <CloudUpload className="w-12 h-12 text-white" />
            )}
          </motion.div>

          <AnimatePresence mode="wait">
            {!uploadedFile ? (
              <motion.div
                className="space-y-5"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <h3 className="text-2xl font-bold text-white">Upload Legal Document</h3>
                <p className="text-gray-300 max-w-md leading-relaxed">
                  Drag and drop your {docType === "scanned" ? "scanned document" : "electronic file"} or click to browse.
                  {docType === "scanned" ? " We'll extract text from images." : " We'll analyze the digital content."}
                </p>
                <Button asChild className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 font-medium">
                    <Upload className="w-5 h-5 mr-2" />
                    Choose File
                  </label>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className="space-y-4 w-full max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 justify-center text-lg font-semibold">
                  <FileText className="w-5 h-5 text-gray-300" />
                  <span className="text-white truncate">{uploadedFile.name}</span>
                </div>

                {isAnalyzing || loading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 justify-center text-amber-300">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <p className="text-sm font-medium">Uploading & Analyzing...</p>
                    </div>
                    <Progress value={uploadProgress} className="h-2 bg-gray-700/60" />
                  </div>
                ) : (
                  <motion.div className="flex items-center gap-2 justify-center text-emerald-300">
                    <FileCheck className="w-5 h-5" />
                    <p className="text-sm font-medium">Ready for analysis</p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && uploadProgress < 100 && (
          <motion.div className="mt-6 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Progress value={uploadProgress} className="h-2 bg-gray-700/60" />
            <p className="text-xs text-gray-400">Uploading... {uploadProgress}%</p>
          </motion.div>
        )}

        {/* File info tags */}
        <div className="mt-6 text-xs text-gray-400 flex items-center justify-center gap-3 flex-wrap">
          <div className="flex items-center gap-1 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
            <FileText className="w-3 h-3 text-blue-300" />
            <span>PDF, DOC, DOCX, TXT</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
            <Lock className="w-3 h-3 text-green-300" />
            <span>Secure</span>
          </div>
          <div className="flex items-center gap-1 bg-gray-800/50 px-3 py-1.5 rounded-full border border-gray-700/50">
            <Zap className="w-3 h-3 text-amber-300" />
            <span>Max 10MB</span>
          </div>
        </div>
      </div>

      {/* Drag overlay */}
      <AnimatePresence>
        {dragActive && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-md flex items-center justify-center rounded-lg border-2 border-dashed border-blue-400/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div className="text-center p-6 bg-gray-800/90 rounded-xl shadow-2xl border border-blue-400/30">
              <ArrowUp className="w-12 h-12 text-blue-400 mx-auto mb-3" />
              <p className="text-blue-200 font-semibold text-lg">Drop to upload</p>
              <p className="text-gray-400 text-sm mt-1">We'll securely process your {docType} document</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};