import { useState } from 'react';
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
} from 'lucide-react';

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
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([]);

  const handleDownloadReport = () => {
    const reportContent = `
      📄 Document Report
      ==========================
      Document Name: ${doc.name}
      Upload Date: ${doc.uploadDate}
      Summary: This is an auto-generated report for the document "${doc.name}". It includes metadata and sample analysis details.
      Total Clauses: ${doc.clauses?.length || 0}
      Generated On: ${new Date().toLocaleString()}
      ==========================
    `;
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    link.download = `${doc.name.replace(/\s+/g, '_')}_Report.txt`;
    window.document.body.appendChild(link);
    link.click();
    URL.revokeObjectURL(url);
    window.document.body.removeChild(link);
  }

  const handleGenerateQuestions = () => {
    setIsGenerating(true);
    setGeneratedQuestions([]);
    setTimeout(() => {
      setGeneratedQuestions([
        `What are the specific penalties if we breach the confidentiality clause (Section ${doc.clauses[0]?.id || 'N/A'})?`,
        'Can you clarify the notice period required for termination?',
        `How does the "Limited Liability" clause impact us in a worst-case scenario?`,
        'Are there any conflicts between this document and our "Service Agreement 2024"?',
      ]);
      setIsGenerating(false);
    }, 1500);
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
            <h3 className="text-black dark:text-white mb-3"> Download Report </h3>
            <div className="p-4 rounded-lg bg-gray-5 dark:bg-[#0f1629]/50 border border-gray-200 dark:border-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br transition-all duration-500 from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex flex-col flex-1">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Download a detailed analysis report for <strong>{doc.name}</strong>.
                  </p>
                  <Button
                    onClick={handleDownloadReport}
                    className="mt-3 w-fit bg-gradient-to-r transition-all duration-500 from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download Report
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
            <h3 className="text-black dark:text-white mb-3"> Generate Insights </h3>
            {/* Update card background and border */}
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-[#0f1629]/50 border border-gray-200 dark:border-gray-800/50">
              <div className="flex items-start gap-3">
                <div className="mt-1 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                  {/* Update text color */}
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Generate questions to ask your counterparty based on this doc.
                  </p>
                  <Button
                    onClick={handleGenerateQuestions}
                    disabled={isGenerating}
                    className="mt-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  >
                    <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    {isGenerating ? 'Generating...' : 'Generate'}
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