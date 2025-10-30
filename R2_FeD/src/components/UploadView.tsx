import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
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
  Chrome, // --- ADDED: Google Icon ---
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import type { Document, DocumentType } from './MainApp';
import { ModalDocumentList } from './ModalDocumentList';
import { ScrollArea } from './ui/scroll-area';

// --- ADDED: Google API Credentials (REPLACE THESE) ---
// TODO: Replace with your own credentials from Google Cloud Console
const GOOGLE_API_KEY = 'YOUR_GOOGLE_API_KEY';
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID';

// --- ADDED: Type definitions for Google APIs ---
interface GoogleTokenResponse {
  access_token: string;
}

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// --- REMOVED: Google Drive Icon Component ---

interface UploadViewProps {
  onUpload: (file: File, documentType: DocumentType) => void;
  documents: Document[];
  onSelect: (id: string) => void;
}

export function UploadView({ onUpload, documents, onSelect }: UploadViewProps) {
  const [analysisType, setAnalysisType] =
    useState<'basic' | 'professional'>('basic');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [documentType, setDocumentType] = useState<DocumentType>('scanned');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ADDED: State for Google API loading and auth ---
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [isGapiLoaded, setIsGapiLoaded] = useState(false);
  const [oauthToken, setOauthToken] = useState<GoogleTokenResponse | null>(null);
  const tokenClient = useRef<any>(null);

  // --- ADDED: Effect to load Google APIs ---
  useEffect(() => {
    if (
      GOOGLE_API_KEY === 'YOUR_GOOGLE_API_KEY' ||
      GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID'
    ) {
      console.warn(
        'Google API Key and Client ID are not set. Google Drive upload will not work.'
      );
    }

    // Load GSI (Auth)
    const gsiScript = document.createElement('script');
    gsiScript.src = 'https://accounts.google.com/gsi/client';
    gsiScript.async = true;
    gsiScript.defer = true;
    gsiScript.onload = () => {
      tokenClient.current = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (tokenResponse: GoogleTokenResponse) => {
          setOauthToken(tokenResponse);
          // Automatically create picker after getting token
          if (isGapiLoaded) {
            createPicker(tokenResponse.access_token);
          }
        },
      });
      setIsGsiLoaded(true);
    };
    document.body.appendChild(gsiScript);

    // Load GAPI (Picker)
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.async = true;
    gapiScript.defer = true;
    gapiScript.onload = () => {
      window.gapi.load('client:picker', () => {
        window.gapi.client
          .init({ apiKey: GOOGLE_API_KEY, clientId: GOOGLE_CLIENT_ID })
          .then(() => setIsGapiLoaded(true));
      });
    };
    document.body.appendChild(gapiScript);

    // Cleanup
    return () => {
      document.body.removeChild(gsiScript);
      document.body.removeChild(gapiScript);
    };
  }, []);

  const handleFileSelect = (file: File | null | undefined) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.doc', '.docx', '.txt'];
    const isValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    if (isValidExtension) {
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
      } else {
        console.error('File size exceeds 10MB limit.'); // Use console.error
      }
    } else {
      console.error(
        'Please select a valid document file (PDF, DOC, DOCX, TXT).'
      ); // Use console.error
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

  const handleUpload = () => {
    if (selectedFile) onUpload(selectedFile, documentType);
  };

  const handleSelect = (id: string) => {
    onSelect(id);
  };

  // --- ADDED: Google Picker creation ---
  const createPicker = (accessToken: string) => {
    const pickerCallback = async (data: any) => {
      if (
        data.action === window.google.picker.Action.PICKED &&
        data.docs &&
        data.docs[0]
      ) {
        const doc = data.docs[0];
        const fileId = doc.id;
        const fileName = doc.name;
        const mimeType = doc.mimeType;

        try {
          // Fetch the file content
          const res = await fetch(
            `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
            {
              headers: { Authorization: `Bearer ${accessToken}` },
            }
          );

          if (!res.ok)
            throw new Error('Failed to fetch file from Google Drive');

          const blob = await res.blob();
          const file = new File([blob], fileName, { type: mimeType });

          // Use the existing file selection logic
          handleFileSelect(file);
        } catch (error) {
          console.error('Error fetching file from Drive:', error);
        }
      }
    };

    const view = new window.google.picker.View(
      window.google.picker.ViewId.DOCS
    );
    view.setMimeTypes(
      'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain'
    );

    const picker = new window.google.picker.PickerBuilder()
      .setAppId(GOOGLE_CLIENT_ID.split('-')[0]) // Project Number
      .setOAuthToken(accessToken)
      .addView(view)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setCallback(pickerCallback)
      .build();
    picker.setVisible(true);
  };

  // --- ADDED: Google Drive button handler ---
  const handleDriveUpload = () => {
    if (!isGsiLoaded || !isGapiLoaded) {
      console.error('Google APIs are not loaded yet.');
      return;
    }

    if (oauthToken) {
      // If we have a token, create the picker
      createPicker(oauthToken.access_token);
    } else {
      // If not, request a token. The callback will create the picker.
      tokenClient.current.requestAccessToken();
    }
  };

  // ----------------------------------------------------
  return (
    <div className="relative flex w-full h-full rounded-2xl transition-all duration-500 overflow-hidden bg-white dark:bg-transparent">
      {/* Background blobs */}
      <div className="absolute top-44 left-44 w-96 h-66 -translate-x-1/4 -translate-y-1/4 bg-blue-700/50 rounded-full blur-[100px] opacity-20 dark:opacity-40 pointer-events-none z-0"></div>
      <div className="absolute top-20 right-60 w-32 h-32 bg-pink-500 rounded-full blur-3xl opacity-20 dark:opacity-50 pointer-events-none z-0 animate-float-1"></div>
      <div className="absolute bottom-40 left-40 w-24 h-24 bg-teal-500 rounded-full blur-2xl opacity-30 dark:opacity-60 pointer-events-none z-0 animate-float-2"></div>

      <div className="relative z-10 flex w-full transition-all  duration-500 h-full">
        {/* Left Side: 50% */}
        <div
          className={cn(
            'w-[50%] h-full border-r transition-all duration-500 border-gray-200 dark:border-gray-700/50',
            ' dark:bg-gray-800/40 backdrop-blur-sm',
            'hidden lg:block' // Hide on mobile, show on desktop
          )}
        >
          <ModalDocumentList documents={documents} onSelect={handleSelect} />
        </div>

        {/* Right Side: 50% */}
        <div className="max-w-full lg:w-[50%] h-full">
          {' '}
          {/* Full width on mobile */}
          <Card
            className={cn(
              'relative border-none transition-all duration-500 overflow-hidden h-full rounded-l-none',
              'rounded-r-none pt-20 sm:pt-8 md:pt-0',
              ' dark:bg-gray-800/40 backdrop-blur-sm border-orange-200 dark:border-gray-700/50',
              isDragging ? 'border-blue-400' : 'border-transparent',
              'flex flex-col'
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <ScrollArea className="flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden">
              {/* --- MODIFIED: Changed min-h-full to h-full --- */}
              <div className="p-7 text-center relative z-10 h-full flex flex-col">
                <input
                  ref={fileInputRef}
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={(e) => handleFileSelect(e.target.files?.[0])}
                />

                {/* --- This wrapper centers the content --- */}
                <div className="flex-1 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {!selectedFile ? (
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
                                  Scanned
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  PDF scans, images
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
                                  Electronic
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  Digital PDFs, Word
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
                              Upload New Document
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 max-w-md">
                              Drag and drop your file or click to browse.
                            </p>

                            {/* --- MODIFIED: Wrapper for buttons --- */}
                            <div className="flex flex-col sm:flex-row justify-center gap-1 md:gap-4">
                              <Button
                                onClick={() => fileInputRef.current?.click()}
                                className="mt-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-3 font-medium text-white shadow-sm hover:shadow-lg"
                              >
                                <Upload className="w-5 h-5 mr-2" /> Choose File
                              </Button>

                              {/* --- MODIFIED: Google Drive Button --- */}
                              <motion.div
                                className="mt-4"
                                whileTap={{ scale: 0.98 }}
                              >
                                <Button
                                  onClick={handleDriveUpload}
                                  className="w-full rounded-xl bg-white dark:bg-gray-800/60 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/80 px-6 py-3 font-medium text-black dark:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 shadow-sm hover:shadow-md"
                                >
                                  {/* --- MODIFIED: Replaced custom icon with Lucide icon --- */}
                                  <img src={googleIcon} width={20} height={20} className='text-blue-300'/> From Google Drive
                                </Button>
                              </motion.div>
                            </div>
                            {/* --- END: Button wrapper --- */}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="confirmation-view"
                        className="w-full max-w-lg mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Confirmation View */}
                        <div className="flex flex-col items-center gap-6">
                          <div className="w-24 h-24 rounded-full flex items-center justify-center shadow-2xl border-2 bg-gradient-to-br from-emerald-500 to-green-600 border-emerald-400/30 shadow-emerald-500/30">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                          </div>
                          <h3 className="text-2xl font-bold text-black dark:text-white">
                            File Ready for Upload
                          </h3>

                          {/* --- MODIFIED: Added Radio Select Buttons --- */}
                          <div className="flex justify-center gap-4 w-full">
                            <motion.div
                              onClick={() => setAnalysisType('basic')}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 p-1 rounded-lg cursor-pointer transition-all duration-300 border-2', // MODIFIED: p-3 to p-2, rounded-xl to rounded-lg
                                analysisType === 'basic'
                                  ? 'bg-gradient-to-r from-blue-400 to-violet-700' // MODIFIED: Solid selected
                                  : 'bg-gray-200 dark:bg-transparent border-gray-200/20 border-[1px] hover:bg-gray-300 dark:hover:bg-gray-600/80' // MODIFIED: Solid unselected
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Zap
                                className={cn(
                                  'w-4 h-4',
                                  analysisType === 'basic'
                                    ? 'text-white'
                                    : 'text-indigo-600 dark:text-indigo-400' // MODIFIED: text-white for selected
                                )}
                              />
                              <span
                                className={cn(
                                  'font-medium',
                                  analysisType === 'basic'
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300' // MODIFIED: text-white for selected
                                )}
                              >
                                Basic
                              </span>
                            </motion.div>
                            <motion.div
                              onClick={() => setAnalysisType('professional')}
                              className={cn(
                                'flex-1 flex items-center justify-center gap-2 p-1 rounded-lg cursor-pointer transition-all duration-300 border-2', // MODIFIED: p-3 to p-2, rounded-xl to rounded-lg
                                analysisType === 'professional'
                                  ? 'bg-purple-600 ' // MODIFIED: Solid selected
                                  : 'bg-gray-200 dark:bg-transparent border-[1px] border-gray-200/20 hover:bg-gray-300 dark:hover:bg-gray-600' // MODIFIED: Solid unselected
                              )}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Award
                                className={cn(
                                  'w-4 h-4',
                                  analysisType === 'professional'
                                    ? 'text-white'
                                    : 'text-purple-600 dark:text-purple-300' // MODIFIED: text-white for selected
                                )}
                              />
                              <span
                                className={cn(
                                  'font-medium',
                                  analysisType === 'professional'
                                    ? 'text-white'
                                    : 'text-gray-700 dark:text-gray-300' // MODIFIED: text-white for selected
                                )}
                              >
                                Professional
                              </span>
                            </motion.div>
                          </div>
                          {/* --- End of MODIFIED section --- */}
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
                                MB • Ready
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
                              onClick={() => setSelectedFile(null)}
                              variant="outline"
                              className="flex-1 bg-transparent border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                            >
                              Change File
                            </Button>
                            <Button
                              onClick={handleUpload}
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                            >
                              <Upload className="w-5 h-5 mr-2" /> Upload &
                              Analyze
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer (now pushed to the bottom) */}
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