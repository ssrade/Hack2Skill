import { useState } from 'react';
import { getAgreementQuestions } from '../api/agreementQuestionsApi';
import { downloadAgreementReport } from '../api/reportApi';
import type { Document } from './MainApp'; // Adjust this import path if needed
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from './ui/scroll-area'; // Import ScrollArea
import { Button } from './ui/button';
import {
  Download,
  Sparkles,
  User,
  Phone,
  Bot,
  FileText,
  Mail,
  Loader,
  AlertCircle,
} from 'lucide-react';
import { useTranslation } from '../contexts/TranslationContext';

interface DocumentExtrasSidebarProps {
  document: Document;
}

const mockContacts = [
  { id: 'c1', type: 'person', name: 'Jane Doe', icon: User },
  { id: 'c2', type: 'email', name: 'jane.doe@techcorp.com', icon: Mail },
  { id: 'c3', type: 'person', name: 'Tech Corp Legal', icon: User },
  { id: 'c4', type: 'phone', name: '+1 (555) 123-4567', icon: Phone },
];

// (Animation variants remain unchanged)
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export function DocumentExtrasSidebar({ document: doc }: DocumentExtrasSidebarProps) {
  const { inline, t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);
  const [isDownloadingReport, setIsDownloadingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  const handleDownloadReport = async () => {
    if (!doc.id) {
      setReportError(await t('Document ID is missing'));
      return;
    }

    setIsDownloadingReport(true);
    setReportError(null);

    try {
      await downloadAgreementReport(doc.id);
      // Success - download triggered automatically by the API function
    } catch (error: any) {
      console.error('Error downloading report:', error);
      setReportError(await t(error.message || 'Failed to download report. Please try again.'));
    } finally {
      setIsDownloadingReport(false);
    }
  }

  const handleGenerateQuestions = async () => {
    if (!doc.id) return;

    setIsGenerating(true);
    setGeneratedQuestions([]);

    try {
      const questions = await getAgreementQuestions(doc.id);
      // Translate backend-generated questions
      const translatedQuestions = await Promise.all(
        questions.map((q: string) => t(q))
      );
      setGeneratedQuestions(translatedQuestions);
    } catch (error: any) {
      console.error('Error generating questions:', error.message);
      setGeneratedQuestions([
        await t('⚠️ Failed to fetch AI-generated questions. Please try again later.'),
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    // --- MODIFIED: w-full/h-auto for mobile ---
    <div className="w-full md:w-[30%] h-auto md:h-[89vh] pt-8 md:pt-0 flex flex-col md:border-l border-gray-200 dark:border-gray-800/50 bg-white/50 dark:bg-transparent backdrop-blur-sm overflow-hidden">
      <ScrollArea className="flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden">
        <div className="flex flex-col gap-6 py-4 md:pl-4 pt-1 "> {/* Added padding here */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <h3 className="text-black dark:text-white mb-3">{inline('Download Report')}</h3>
            <div className="p-4 rounded-lg bg-gray-5 dark:bg-[#0f1629]/50 border border-gray-200 dark:border-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br transition-all duration-500 from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {inline('Download a detailed PDF analysis report for')} <strong>{doc.name}</strong>.
                  </p>
                  
                  {/* Error Message */}
                  {reportError && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                      <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{reportError}</span>
                    </div>
                  )}
                  
                  <Button
                    onClick={handleDownloadReport}
                    disabled={isDownloadingReport}
                    className="mt-3 w-fit bg-gradient-to-r transition-all duration-500 from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloadingReport ? (
                      <>
                        <Loader className="w-4 h-4 mr-2 animate-spin" /> {inline('Generating Report...')}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" /> {inline('Download Report')}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Generate Questions Section */}
          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.2 }}
            className="flex flex-col"
          >
            <h3 className="text-black dark:text-white mb-3">{inline('Generate Insights')}</h3>
            {/* Update card background and border */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0f1629]/50 border border-gray-200 dark:border-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  {/* Update text color */}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {inline('Generate questions to ask your counterparty based on this doc.')}
                  </p>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? inline('Generating...') : inline('Generate')}
                  </Button>
                </div>
              </div>
              <AnimatePresence>
                {generatedQuestions.length > 0 && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={containerVariants}
                    // Update border
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700/50 space-y-2"
                  >
                    {generatedQuestions.map((q, i) => (
                      <motion.div
                        key={i}
                        variants={itemVariants}
                        // Update background and text color
                        className="text-sm text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1f3a]/50 p-2 rounded-md"
                      >
                        {q}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Relevant Contacts Section */}
          {/* <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.3 }}
            className="flex flex-col"
          >
            <h3 className="text-black dark:text-white mb-3"> Relevant Contacts </h3>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
              {mockContacts.map(contact => (
                <motion.div
                  key={contact.id}
                  variants={itemVariants}
                  // Update background and icon/text colors
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-[#0f1629]/50"
                >
                  <contact.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <p className="text-sm text-black dark:text-white truncate">{contact.name}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div> */}
        </div>
      </ScrollArea>
    </div>
  );
}