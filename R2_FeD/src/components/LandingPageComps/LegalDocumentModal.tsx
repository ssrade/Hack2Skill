import { X, Download, ExternalLink, Maximize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";

interface LegalDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  pdfUrl: string;
}

export const LegalDocumentModal = ({ isOpen, onClose, title, pdfUrl }: LegalDocumentModalProps) => {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `${title.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close modal"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-50 w-full max-w-6xl h-[90vh] bg-gradient-to-br from-gray-900 via-gray-950 to-black rounded-2xl shadow-2xl border border-gray-700/50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
              </div>

              <div className="flex items-center gap-2">
                {/* Download Button */}
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Download PDF"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>

                {/* Open in New Tab Button */}
                <Button
                  onClick={handleOpenInNewTab}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  title="Open in new tab"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Expand
                </Button>

                {/* Close Button */}
                <Button
                  onClick={onClose}
                  variant="outline"
                  size="sm"
                  className="bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-500 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 overflow-hidden bg-gray-950/50">
              <iframe
                src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                title={title}
                className="w-full h-full border-0"
                style={{ minHeight: '100%' }}
              />
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-700/50 bg-gray-900/50 backdrop-blur-sm">
              <p className="text-xs text-gray-400 text-center">
                This document is for informational purposes only. Please consult with a legal professional for advice specific to your situation.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
