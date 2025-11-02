import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import googleIcon from '/google-drive-svgrepo-com.svg';
import {
  Upload,
  FileText,
  Lock,
  Zap,
  Scan,
  FileDigit,
  CloudUpload,
  X,
  CheckCircle2,
  Award,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import type { Document, DocumentType } from './MainApp';
import { ModalDocumentList } from './ModalDocumentList';
import { ScrollArea } from './ui/scroll-area';
import { uploadDocument, type UploadProgress } from '../api/uploadDocument';
import { processAgreement } from '../api/agreementProcessApi';
import { toast } from './ui/toast';
import { getUserFriendlyError } from '../utils/errorHandler';
import { useTranslation } from '../contexts/TranslationContext';

// --- Only OAuth credential needed ---
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_DRIVE_CLIENT_ID!;

interface GoogleTokenResponse {
  access_token: string;
}

declare global {
  interface Window {
    google: any;
  }
}

interface UploadViewProps {
  onUpload: (file: File, documentType: DocumentType) => void;
  documents: Document[];
  onSelect: (id: string) => void;
}

// Analysis steps for loader (will be translated dynamically)
const ANALYSIS_STEPS = [
  "Uploading document...",
  "Processing document structure...",
  "Extracting text content...",
  "Analyzing clauses and terms...",
  "Identifying potential risks...",
  "Evaluating legal compliance...",
  "Generating comprehensive summary...",
  "Nearly complete, finalizing analysis..."
];

// Time duration for each step in milliseconds (Total: ~50 seconds)
const STEP_DURATIONS = [
  4000,   // Uploading document - 4s
  7000,   // Processing structure - 7s
  8000,   // Extracting text - 8s
  10000,  // Analyzing clauses - 10s
  9000,   // Identifying risks - 9s
  7000,   // Legal compliance - 7s
  5000,   // Generating summary - 5s
  -1      // Nearly complete - stays until done
];

export function UploadView({ onUpload, documents, onSelect }: UploadViewProps) {
  const { inline, t, currentLanguage } = useTranslation();
  const [analysisType, setAnalysisType] = useState<'basic' | 'professional'>('basic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('scanned');
  const [uploadStage, setUploadStage] = useState<'selection' | 'uploading' | 'uploaded' | 'analyzing' | 'analysisComplete'>('selection');
  const [uploadedDocument, setUploadedDocument] = useState<any>(null);
  const [currentAnalysisStep, setCurrentAnalysisStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  
  // Translated analysis steps
  const [translatedAnalysisSteps, setTranslatedAnalysisSteps] = useState<string[]>(ANALYSIS_STEPS);
  
  // Update translated steps when language changes
  useEffect(() => {
    const translateSteps = async () => {
      if (currentLanguage === 'en') {
        setTranslatedAnalysisSteps(ANALYSIS_STEPS);
        return;
      }
      const translated = await Promise.all(ANALYSIS_STEPS.map(step => t(step)));
      setTranslatedAnalysisSteps(translated);
    };
    translateSteps();
  }, [currentLanguage, t]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [oauthToken, setOauthToken] = useState<GoogleTokenResponse | null>(null);
  const tokenClient = useRef<any>(null);

  // Load only Google Identity Services (OAuth)
  useEffect(() => {
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: async (tokenResponse: GoogleTokenResponse) => {
          setOauthToken(tokenResponse);
          await handleDriveFileSelect(tokenResponse.access_token);
        },
      });
      setIsGsiLoaded(true);
    };
    document.body.appendChild(gsiScript);

    return () => {
      document.body.removeChild(gsiScript);
    };
  }, []);

  // Simulate analysis steps progression with varying durations
  useEffect(() => {
    let stepTimeout: ReturnType<typeof setTimeout>;
    
    if (uploadStage === 'analyzing') {
      const progressToNextStep = () => {
        setCurrentAnalysisStep((prev) => {
          // Don't progress beyond the last step
          if (prev >= translatedAnalysisSteps.length - 1) {
            return prev;
          }
          
          const nextStep = prev + 1;
          
          // Schedule next step if not at the final step
          if (nextStep < translatedAnalysisSteps.length - 1) {
            stepTimeout = setTimeout(progressToNextStep, STEP_DURATIONS[nextStep]);
          }
          // If we reach the "Nearly complete" step, stay there until analysis finishes
          
          return nextStep;
        });
      };
      
      // Start with first step duration
      stepTimeout = setTimeout(progressToNextStep, STEP_DURATIONS[0]);
    }

    return () => {
      if (stepTimeout) clearTimeout(stepTimeout);
    };
  }, [uploadStage, translatedAnalysisSteps.length]);

  // Handle Drive file selection via native file picker
  const handleDriveFileSelect = async (accessToken: string) => {
    try {
      const pickerUrl = 'https://drive.google.com/drive/my-drive';
      window.open(pickerUrl, '_blank');
    } catch (err) {
      console.error('Error accessing Drive:', err);
    }
  };

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const isValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (isValidExtension) {
      if (file.size <= 100 * 1024 * 1024) {
        setSelectedFile(file);
      } else {
        console.error('File size exceeds 10MB limit.');
      }
    } else {
      console.error('Please select a valid document file (PDF, DOC, DOCX, TXT).');
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true);
    else if (e.type === 'dragleave') setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0])
      handleFileSelect(e.dataTransfer.files[0]);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStage('uploading');
    
    let uploadToastId: string | undefined;

    try {
      console.log('🚀 Starting document upload process...');
      const storedUser = localStorage.getItem('user');
      const userId = storedUser ? JSON.parse(storedUser).id : null;
      console.log('🪪 User ID:', userId);

      console.log('📤 Uploading document to server...');
      
      // Show toast for upload start
      uploadToastId = toast.info(inline('Uploading and analyzing document...'), 0); // Don't auto-dismiss
      
      const uploadedDoc = await uploadDocument(
        selectedFile,
        userId!,
        (progress: UploadProgress) => {
          setUploadProgress(progress.percentage);
          console.log(`Upload progress: ${progress.percentage}%`);
        }
      );
      
      console.log('✅ Document uploaded successfully:', uploadedDoc);
      
      // Dismiss info toast and show success
      if (uploadToastId) toast.dismiss(uploadToastId);
      const successMsg = await t(`Document "${selectedFile.name}" uploaded successfully!`);
      toast.success(successMsg, 3000);
      
      // Set uploaded document and change stage
      setUploadedDocument(uploadedDoc);
      setUploadStage('uploaded');
      setUploadProgress(100);
      
      // Reset UI after a brief delay
      setTimeout(() => {
        setUploadProgress(0);
        setIsUploading(false);
      }, 1000);
      
    } catch (err: any) {
      console.error('❌ Error uploading document:', err);
      setIsUploading(false);
      setUploadStage('selection');
      setUploadProgress(0);
      
      // Dismiss any info toasts
      if (uploadToastId) toast.dismiss(uploadToastId);
      
      // Show user-friendly error message
      const userMessage = getUserFriendlyError(err);
      toast.error(userMessage, 7000);
    }
  };

  // In handleAnalyze function, add this debug logging:
const handleAnalyze = async () => {
  if (!selectedFile || !uploadedDocument) {
    console.error('❌ No file or uploaded document found');
    console.error('📄 Selected File:', selectedFile);
    console.error('📦 Uploaded Document:', uploadedDocument);
    return;
  }

  try {
    console.log('🔍 Starting agreement analysis process...');
    console.log('📄 Selected File details:', {
      name: selectedFile.name,
      size: selectedFile.size,
      type: selectedFile.type,
      lastModified: selectedFile.lastModified
    });
    console.log('📦 Uploaded Document response:', uploadedDocument);
    console.log('🆔 Agreement ID from upload:', uploadedDocument.id);
    console.log('📝 Document Type:', documentType);
    console.log('👤 User Type (analysis):', analysisType);
    
    // Verify the uploadedDocument has the expected structure
    if (!uploadedDocument.id) {
      console.error('❌ Uploaded document missing ID field');
      console.error('📦 Full uploaded document:', uploadedDocument);
      throw new Error('Document upload incomplete. Please try uploading again.');
    }
    
    // Set analyzing stage and reset steps
    setUploadStage('analyzing');
    setCurrentAnalysisStep(0);
    
    // Prepare user type for API (basic -> 'basic', professional -> 'pro')
    const userType = analysisType === 'basic' ? 'basic' : 'pro';
    console.log('🎯 Sending user_type to API:', userType);

    console.log('📤 Calling processAgreement API...');
    
    const result = await processAgreement({
      file: selectedFile,
      agreementId: uploadedDocument.id,
      docType: documentType,
      userType: userType,
    });

    console.log('✅ Agreement analysis completed successfully:', result);
    
    // Translate backend analysis result if needed (summary, risk descriptions, etc.)
    // Note: Risk descriptions will be translated when displayed in DocumentView
    setAnalysisResult(result);
    setUploadStage('analysisComplete');
    setCurrentAnalysisStep(translatedAnalysisSteps.length - 1);
    
  } catch (err: any) {
    console.error('❌ Error during agreement analysis:', err);
    console.error('📋 Error details:', err.message);
    console.error('📋 Full error object:', err);
    
    // Show user-friendly error message
    const userMessage = getUserFriendlyError(err);
    toast.error(userMessage, 7000);
    
    // Reset to uploaded stage on error
    setUploadStage('uploaded');
  }
};

  const handleCancel = () => {
    console.log('↩️ Cancelling upload, returning to selection');
    setSelectedFile(null);
    setUploadStage('selection');
    setCurrentAnalysisStep(0);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
  };

  // Trigger OAuth flow for Drive
  const handleDriveUpload = () => {
    if (!isGsiLoaded) {
      console.error('Google OAuth not yet loaded.');
      return;
    }
    tokenClient.current.requestAccessToken();
  };

  return (
    <div className="relative flex w-full h-full rounded-2xl transition-all duration-500 overflow-hidden bg-white dark:bg-transparent">
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1/4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      <div className="relative z-10 flex w-full transition-all duration-500 h-full">
        <div
          className={cn(
            'w-[50%] h-full border-r transition-all duration-500 border-gray-200 dark:border-gray-700/50',
            'dark:bg-gray-800/40 backdrop-blur-sm',
            'hidden lg:block'
          )}
        >
          <ModalDocumentList documents={documents} onSelect={handleSelect} />
        </div>

        <div className="max-w-full lg:w-[50%] h-full">
          <Card
            className={cn(
              'relative border-none transition-all duration-500 overflow-hidden h-full rounded-l-none',
              'rounded-r-none pt-20 sm:pt-8 md:pt-0',
              'dark:bg-gray-800/40 backdrop-blur-sm border-orange-200 dark:border-gray-700/50',
              isDragging ? 'border-blue-400' : 'border-transparent',
              'flex flex-col'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <ScrollArea className="flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden">
              <div className="p-7 text-center relative z-10 h-full flex flex-col">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                <div className="flex-1 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {uploadStage === 'selection' ? (
                      // STAGE 1: Document Selection UI
                      !selectedFile ? (
                        <motion.div
                          key="initial-view"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          {/* Document Type */}
                          <div className="mb-8">
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center justify-center gap-2">
                              <FileDigit className="w-5 h-5 text-blue-500 dark:text-blue-400" />{' '}
                              Document Type
                            </h3>
                            <div className="flex justify-center gap-4">
                              <motion.div
                                onClick={() => setDocumentType('scanned')}
                                className={cn(
                                  'flex items-center dark:bg-gray-900/50 gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 w-1/2',
                                  documentType === 'scanned'
                                    ? 'bg-blue-50  border-blue-500 dark:border-blue-500/50 shadow-lg shadow-blue-500/10 dark:shadow-blue-500/20'
                                    : 'bg-white  border-gray-300 dark:border-gray-700 hover:border-blue-400/40'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center',
                                    documentType === 'scanned'
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  )}
                                >
                                  <Scan
                                    className={cn(
                                      'w-5 h-5',
                                      documentType === 'scanned'
                                        ? 'text-white'
                                        : 'text-gray-600 dark:text-white'
                                    )}
                                  />
                                </div>
                                <div className="text-left">
                                  <p
                                    className={cn(
                                      'font-semibold',
                                      documentType === 'scanned'
                                        ? 'text-blue-600 dark:text-blue-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                    )}
                                  >
                                    {inline('Scanned')}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {inline('PDF scans, images')}
                                  </p>
                                </div>
                              </motion.div>
                              <motion.div
                                onClick={() => setDocumentType('electronic')}
                                className={cn(
                                  'flex items-center gap-3 p-4 dark:bg-gray-900/50 rounded-xl border-2 cursor-pointer transition-all duration-300 w-1/2',
                                  documentType === 'electronic'
                                    ? 'bg-green-50 border-green-500 dark:border-green-500/50 shadow-lg shadow-green-500/10 dark:shadow-green-500/20'
                                    : 'bg-white border-gray-300 dark:border-gray-700 hover:border-green-400/40'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div
                                  className={cn(
                                    'w-10 h-10 rounded-full flex items-center justify-center',
                                    documentType === 'electronic'
                                      ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                                      : 'bg-gray-200 dark:bg-gray-700'
                                  )}
                                >
                                  <FileDigit
                                    className={cn(
                                      'w-5 h-5',
                                      documentType === 'electronic'
                                        ? 'text-white'
                                        : 'text-gray-600 dark:text-white'
                                    )}
                                  />
                                </div>
                                <div className="text-left">
                                  <p
                                    className={cn(
                                      'font-semibold',
                                      documentType === 'electronic'
                                        ? 'text-green-600 dark:text-green-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                    )}
                                  >
                                    {inline('Electronic')}
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {inline('Digital PDFs, Word')}
                                  </p>
                                </div>
                              </motion.div>
                            </div>
                          </div>

                          {/* Upload New Document */}
                          <div className="flex flex-col items-center gap-6">
                            <motion.div
                              className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/30 shadow-blue-500/30"
                              whileHover={{ scale: 1.05, rotate: 2 }}
                            >
                              <CloudUpload className="w-12 h-12 text-white" />
                            </motion.div>
                            <div className="space-y-5">
                              <h3 className="text-2xl font-bold text-black dark:text-white">
                                {inline('Upload New Document')}
                              </h3>
                              <p className="text-gray-600 dark:text-gray-300 max-w-md">
                                {inline('Drag and drop your file or click to browse.')}
                              </p>

                              <div className="flex flex-col sm:flex-row justify-center gap-1 md:gap-4">
                                <Button
                                  onClick={() => fileInputRef.current?.click()}
                                  className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 font-medium text-white shadow-sm hover:shadow-lg"
                                >
                                  <Upload className="w-5 h-5 mr-2" /> {inline('Choose File')}
                                </Button>

                                <motion.div
                                  className="mt-4"
                                  whileTap={{ scale: 0.98 }}
                                >
                                  <Button
                                    onClick={handleDriveUpload}
                                    className="w-full rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 px-6 py-3 font-medium text-black dark:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                                  >
                                    <img src={googleIcon} width={20} height={20} className='text-blue-300'/> {inline('From Google Drive')}
                                  </Button>
                                </motion.div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ) : (
                        // STAGE 1: File Selected (Ready to Upload)
                        <motion.div
                          key="confirmation-view"
                          className="w-full max-w-lg mx-auto"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex flex-col items-center gap-6">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400/30 shadow-emerald-500/30">
                              <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-black dark:text-white">
                              {inline('File Ready for Upload')}
                            </h3>

                            <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 w-full flex items-center gap-4">
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                              </div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-black dark:text-white font-medium truncate">
                                  {selectedFile.name}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {(selectedFile.size / 1024 / 1024).toFixed(2)}{' '}
                                  MB • {inline('Ready')}
                                </p>
                              </div>
                              <Button
                                onClick={() => setSelectedFile(null)}
                                size="icon"
                                variant="ghost"
                                className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-200 dark:hover:bg-gray-700/50"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </div>
                            <div className="flex gap-4 w-full mt-2">
                              <Button
                                onClick={handleCancel}
                                variant="outline"
                                className="flex-1 bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                              >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                {inline('Cancel')}
                              </Button>
                              <Button
                                onClick={handleUpload}
                                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                              >
                                <Upload className="w-5 h-5 mr-2" /> {inline('Upload Document')}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      )
                    ) : uploadStage === 'uploading' ? (
                      // STAGE 1.5: Uploading (with progress)
                      <motion.div
                        key="uploading-view"
                        className="w-full max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-400/30 shadow-blue-500/30">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                          </div>
                          <div className="text-center space-y-2">
                            <h3 className="text-2xl font-bold text-black dark:text-white">
                              {inline('Uploading and analyzing...')}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300">
                              {inline('Please wait while we upload your document')}
                            </p>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full space-y-2 px-4">
                            <Progress value={uploadProgress} className="h-3 w-full" />
                            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                              <span>{inline('Uploading...')}</span>
                              <span className="font-medium">{uploadProgress}%</span>
                            </div>
                          </div>

                          <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 w-full flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-black dark:text-white font-medium truncate">
                                {selectedFile?.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {(selectedFile ? selectedFile.size / 1024 / 1024 : 0).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : uploadStage === 'uploaded' ? (
                      // STAGE 2: Document Uploaded (Ready for Analysis)
                      <motion.div
                        key="uploaded-view"
                        className="w-full max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-green-500 to-emerald-600 border-green-400/30 shadow-green-500/30">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">
                            {inline('Document Uploaded Successfully!')}
                          </h3>

                          {/* Analysis Type Selection */}
                          <div className="w-full">
                            <h3 className="text-lg font-semibold text-black dark:text-white mb-4 flex items-center justify-center gap-2">
                              <Award className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                              {inline('Analysis Type')}
                            </h3>
                            <div className="flex justify-center gap-4 w-full">
                              <motion.div
                                onClick={() => setAnalysisType('basic')}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 border-2',
                                  analysisType === 'basic'
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 border-blue-500 shadow-lg shadow-blue-500/20'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Zap
                                  className={cn(
                                    'w-5 h-5',
                                    analysisType === 'basic'
                                      ? 'text-white'
                                      : 'text-blue-600 dark:text-blue-400'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'font-medium',
                                    analysisType === 'basic'
                                      ? 'text-white'
                                      : 'text-gray-700 dark:text-gray-300'
                                  )}
                                >
                                  {inline('Basic')}
                                </span>
                              </motion.div>
                              <motion.div
                                onClick={() => setAnalysisType('professional')}
                                className={cn(
                                  'flex-1 flex items-center justify-center gap-2 p-3 rounded-xl cursor-pointer transition-all duration-300 border-2',
                                  analysisType === 'professional'
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 border-purple-500 shadow-lg shadow-purple-500/20'
                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-purple-400'
                                )}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <Award
                                  className={cn(
                                    'w-5 h-5',
                                    analysisType === 'professional'
                                      ? 'text-white'
                                      : 'text-purple-600 dark:text-purple-400'
                                  )}
                                />
                                <span
                                  className={cn(
                                    'font-medium',
                                    analysisType === 'professional'
                                      ? 'text-white'
                                      : 'text-gray-700 dark:text-gray-300'
                                  )}
                                >
                                  {inline('Professional')}
                                </span>
                              </motion.div>
                            </div>
                          </div>

                          {/* Uploaded Document Info */}
                          <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 w-full flex items-center gap-4">
                            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-green-600 dark:text-green-300" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-black dark:text-white font-medium truncate">
                                {selectedFile?.name}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {inline('Uploaded')} • {inline('Ready for Analysis')}
                              </p>
                            </div>
                          </div>

                          <Button
                            onClick={handleAnalyze}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white py-3 text-lg font-semibold"
                          >
                            <Zap className="w-5 h-5 mr-2" />
                            {inline('Analyze Document')}
                          </Button>
                        </div>
                      </motion.div>
                    ) : uploadStage === 'analyzing' ? (
                      // STAGE 3: Analysis in Progress
                      <motion.div
                        key="analyzing-view"
                        className="w-full max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400/30 shadow-purple-500/30">
                            <Loader2 className="w-12 h-12 text-white animate-spin" />
                          </div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">
                            {inline('Analyzing Document')}
                          </h3>

                          {/* Progress Percentage */}
                          <div className="w-full">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {inline('Progress')}
                              </span>
                              <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                {Math.round(((currentAnalysisStep + 1) / translatedAnalysisSteps.length) * 100)}%
                              </span>
                            </div>
                            <Progress 
                              value={((currentAnalysisStep + 1) / translatedAnalysisSteps.length) * 100} 
                              className="h-2"
                            />
                          </div>

                          {/* Progress Steps */}
                          <div className="w-full space-y-4">
                            <div className="space-y-2">
                              {translatedAnalysisSteps.map((step, index) => (
                                <div
                                  key={step}
                                  className={cn(
                                    'flex items-center gap-3 p-3 rounded-lg transition-all duration-500',
                                    index <= currentAnalysisStep
                                      ? 'bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30'
                                      : 'bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
                                  )}
                                >
                                  <div
                                    className={cn(
                                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300',
                                      index <= currentAnalysisStep
                                        ? 'bg-green-500 text-white scale-110'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                    )}
                                  >
                                    {index < currentAnalysisStep ? '✓' : index + 1}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-sm font-medium transition-all duration-300',
                                      index <= currentAnalysisStep
                                        ? 'text-green-700 dark:text-green-300'
                                        : 'text-gray-500 dark:text-gray-400',
                                      index === currentAnalysisStep && 'animate-pulse'
                                    )}
                                  >
                                    {step}
                                  </span>
                                  {index === currentAnalysisStep && (
                                    <motion.div
                                      initial={{ opacity: 0, scale: 0.5 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="ml-auto"
                                    >
                                      <Loader2 className="w-4 h-4 text-green-600 dark:text-green-400 animate-spin" />
                                    </motion.div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Status Message */}
                          <div className="text-center">
                            {currentAnalysisStep === translatedAnalysisSteps.length - 1 ? (
                              <div className="flex flex-col items-center gap-2">
                                <p className="text-base font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
                                  {inline('Almost done! Finalizing your analysis...')}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {inline('This will just take a moment')}
                                </p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {inline('This may take a few moments...')}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      // STAGE 4: Analysis Complete
                      <motion.div
  key="analysis-complete-view"
  className="w-full max-w-lg mx-auto"
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  <div className="flex flex-col items-center gap-6">
    <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-green-500 to-emerald-600 border-green-400/30 shadow-green-500/30">
      <CheckCircle2 className="w-12 h-12 text-white" />
    </div>
    <h3 className="text-2xl font-bold text-black dark:text-white text-center">
      {inline('Analysis Complete!')}
    </h3>
    
    <div className="bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 rounded-xl p-4 w-full">
      <p className="text-green-700 dark:text-green-300 font-medium text-center">
        {inline('Your document has been successfully analyzed and processed.')}
      </p>
    </div>

    {/* Uploaded Document Info */}
    <div className="bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700/50 rounded-xl p-4 w-full flex items-center gap-4">
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 dark:bg-green-500/20 flex items-center justify-center">
        <FileText className="w-6 h-6 text-green-600 dark:text-green-300" />
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-black dark:text-white font-medium truncate">
          {selectedFile?.name}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {inline('Analysis Completed Successfully')}
        </p>
      </div>
    </div>

    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
      The analysis results are ready. You can now view the detailed insights.
    </div>

    {/* Go to Analysis Page Button */}
    <Button
      onClick={() => {
        console.log('🚀 Redirecting to analysis page for document:', uploadedDocument.id);
        window.location.href = `/app/${uploadedDocument.id}`;
      }}
      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 text-lg font-semibold"
    >
      <FileText className="w-5 h-5 mr-2" />
      {inline('Go to Analysis Page')}
    </Button>

  
  </div>
</motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer */}
                <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700/50">
                    <FileText className="w-3 h-3 text-blue-600 dark:text-blue-300" />
                    <span>PDF, DOC, DOCX, TXT</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700/50">
                    <Lock className="w-3 h-3 text-green-600 dark:text-green-300" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-700/50">
                    <Zap className="w-3 h-3 text-yellow-600 dark:text-amber-300" />
                    <span>Max 10MB</span>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}