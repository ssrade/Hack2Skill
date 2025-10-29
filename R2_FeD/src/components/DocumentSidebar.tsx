import {
  FileText,
  Clock,
  Trash2,
  Eye,
  Upload,
  TrashIcon,
  Inbox, // --- ADDED: Import Inbox icon for empty state ---
} from 'lucide-react';
import type { Document } from './MainApp';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentSidebarProps {
  documents: Document[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onPreviewDocument: (id: string) => void;
  onUploadClick: () => void;
  onDeleteAllDocuments: () => void;
}

export function DocumentSidebar({
  documents,
  selectedDocId,
  onSelectDocument,
  onDeleteDocument,
  onPreviewDocument,
  onUploadClick,
  onDeleteAllDocuments,
}: DocumentSidebarProps) {
  // --- MODIFIED: Renamed state for "Delete All" modal ---
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  // --- ADDED: State for individual doc deletion ---
  const [docToDelete, setDocToDelete] = useState<string | null>(null);

  // --- Handler for "Delete All" modal ---
  const handleDeleteAll = () => {
    onDeleteAllDocuments();
    setIsDeleteAllModalOpen(false);
  };

  // --- ADDED: Handler for individual doc delete modal ---
  const handleConfirmDelete = () => {
    if (docToDelete) {
      onDeleteDocument(docToDelete);
      setDocToDelete(null); // Close the modal
    }
  };

  // --- ADDED: Logic to find the doc for the modal ---
  const documentToConfirm = docToDelete
    ? documents.find((d) => d.id === docToDelete)
    : null;

  return (
    // --- MODIFIED: Added mobile-only top padding ---
    <div className="w-85 border-r border-gray-200 dark:border-gray-800/50 bg-white/50 dark:bg-[#1a1f3a]/20 backdrop-blur-sm flex flex-col h-full pt-[5vh] md:pt-0">
      {/* Update header border and text colors */}
      <div className="flex items-center justify-between py-2 pl-4 pr-2 border-b h-[10vh] border-gray-200 dark:border-gray-800/50">
        <div className="pl-1">
          <h2 className="text-black dark:text-white mt-1">Documents</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            {documents.length} document{documents.length === 1 ? '' : 's'} uploaded
          </p>
        </div>

        <div className="flex items-center">
          {/* Delete All Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteAllModalOpen(true)} // --- MODIFIED: Use new state ---
            className="text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/10"
            aria-label="Delete all documents"
            disabled={documents.length === 0}
          >
            <TrashIcon className="w-5 h-5" />
          </Button>

          {/* Existing Upload button styles */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onUploadClick}
            className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-blue-500/10"
            aria-label="Upload document"
          >
            <Upload className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden">
        <div className="px-2 pt-4">
          {/* --- ADDED: Conditional rendering for empty state --- */}
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center text-gray-500 dark:text-gray-400 pt-16 px-4">
              <Inbox className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium">No documents uploaded</p>
              <p className="text-xs mt-1">
                Click the <Upload className="inline w-3 h-3 -mt-px" /> icon
                above to get started.
              </p>
            </div>
          ) : (
            documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onSelectDocument(doc.id)}
                // Update selected and hover states for list items
                className={`w-80 text-left p-3 rounded-lg mb-2 transition-all relative group ${
                  selectedDocId === doc.id
                    ? 'bg-blue-100 dark:bg-transparent dark:bg-gradient-to-r dark:from-blue-600/20 dark:to-purple-600/20 border border-blue-200 dark:border-blue-500/30'
                    : 'bg-transparent dark:bg-[#0f1629]/50 hover:bg-gray-100 dark:hover:bg-[#0f1629] border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    // Update icon background based on selection
                    className={`mt-1 p-2 rounded-lg ${
                      selectedDocId === doc.id
                        ? 'bg-blue-100/50 dark:bg-blue-500/20'
                        : 'bg-gray-100 dark:bg-gray-800'
                    }`}
                  >
                    <FileText
                      // Update icon color based on selection
                      className={`w-4 h-4 ${
                        selectedDocId === doc.id
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    {/* Update text colors */}
                    <h3 className="text-black dark:text-white text-sm truncate pr-8">
                      {doc.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {doc.uploadDate}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div
                        // Update status badge colors
                        className={`inline-flex px-2 py-0.5 rounded text-xs ${
                          doc.status === 'analyzed'
                            ? 'bg-green-100/50 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                            : doc.status === 'processing'
                            ? 'bg-yellow-100/50 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400'
                            : 'bg-gray-100/50 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400'
                        }`}
                      >
                        {doc.status === 'analyzed'
                          ? '✓ Analyzed'
                          : doc.status === 'processing'
                          ? '⏳ Processing'
                          : 'Pending'}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Hover action buttons */}
                {/* Delete button - top right */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setDocToDelete(doc.id); // --- MODIFIED: Show individual modal ---
                  }}
                  className="absolute top-2 right-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-100/50 dark:hover:bg-red-500/10 opacity-100 transition-opacity cursor-pointer"
                  aria-label="Delete document"
                >
                  <TrashIcon className="w-4 h-4" />
                </div>
                {/* Preview button - bottom right */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    onPreviewDocument(doc.id);
                  }}
                  className="absolute bottom-2 right-2 p-1 rounded text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-100/50 dark:hover:bg-blue-500/10 opacity-100 transition-opacity cursor-pointer"
                  aria-label="Preview document"
                >
                  <Eye className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
          {/* --- END: Conditional rendering --- */}
        </div>
      </ScrollArea>

      {/* --- "Delete All" Confirmation Modal --- */}
      <AnimatePresence>
        {isDeleteAllModalOpen && ( // --- MODIFIED: Use new state ---
          <motion.div
            key="deleteAllBackdrop" // --- MODIFIED: Unique key ---
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsDeleteAllModalOpen(false)} // --- MODIFIED: Use new state ---
          >
            <motion.div
              key="deleteAllModalCard" // --- MODIFIED: Unique key ---
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700/50 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  Delete All Documents?
                </h3>
                <p className="text-gray-600 text-sm dark:text-gray-400 mb-6">
                  Are you sure you want to delete all {documents.length}{' '}
                  documents? This action cannot be undone.
                </p>
                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    onClick={() => setIsDeleteAllModalOpen(false)} // --- MODIFIED: Use new state ---
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gray-100/50 bg-gradient-to-r transition-all duration-500 from-red-500 to-red-600 hover:from-red-500 hover:to-red-700 text-white"
                    onClick={handleDeleteAll}
                  >
                    Yes, Delete All
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- END: "Delete All" Modal --- */}

      {/* --- ADDED: Individual Delete Confirmation Modal --- */}
      <AnimatePresence>
        {docToDelete && documentToConfirm && (
          <motion.div
            key="deleteDocBackdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setDocToDelete(null)}
          >
            <motion.div
              key="deleteDocModalCard"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700/50 p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-300" />
                </div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-2">
                  Delete Document?
                </h3>
                <p className="text-gray-600 text-sm dark:text-gray-400 mb-6">
                  Are you sure you want to delete "
                  <strong className="text-black dark:text-white">
                    {documentToConfirm.name}
                  </strong>
                  "? This action cannot be undone.
                </p>
                <div className="flex gap-4 w-full">
                  <Button
                    variant="outline"
                    className="flex-1 bg-transparent dark:bg-gray-800/50 border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                    onClick={() => setDocToDelete(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="flex-1 bg-gray-100/50 bg-gradient-to-r transition-all duration-500 from-red-500 to-red-600 hover:from-red-500 hover:to-red-700 text-white"
                    onClick={handleConfirmDelete}
                  >
                    Yes, Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- END: Individual Delete Modal --- */}
    </div>
  );
}