import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, FileText, ChevronDown, Mic, Volume2, Pause, Cpu } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from './ui/dropdown-menu';
import type { Message } from './MainApp'; // Import from MainApp
import { cn } from './lib/utils';

interface ChatInterfaceProps {
  documentId: string;
  chatHistory: Message[];
  onSendMessage: (documentId: string, messageText: string) => Promise<void>;
  documentName: string;
}

// Gemini model options
type GeminiModel = {
  id: string;
  name: string;
  description: string;
};
const GEMINI_MODELS: GeminiModel[] = [
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Most capable model' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Fast and efficient' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Advanced reasoning' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Balanced performance' },
  { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Reliable baseline' },
];

const messageVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const suggestionsContainerVariants = {
  visible: { transition: { staggerChildren: 0.07 } }
};

const suggestionItemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 }
};

const sourcesVariants = {
  hidden: { opacity: 0, height: 0, marginTop: 0 },
  visible: { opacity: 1, height: 'auto', marginTop: '12px' }
};

export function ChatInterface({
  documentId,
  documentName,
  chatHistory,
  onSendMessage
}: ChatInterfaceProps) {
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);
  const initialMessage: Message = {
    id: 'initial-1',
    role: 'assistant',
    content: `Hello! I've analyzed ${documentName}. I can help you understand the risks, clauses, and legal implications. What would you like to know?`,
    timestamp: new Date().toISOString()
  };
  const messages = [initialMessage, ...chatHistory];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-pro');
  const suggestions = [
    "What are the main risks in this contract?",
    "Explain the termination clause in simple terms",
    "Are there any unusual clauses I should be aware of?",
    "What's the liability exposure in this agreement?"
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (messageText?: string) => {
    setIsListening(false);
    const textToSend = messageText || input;
    if (!textToSend.trim()) return;
    setInput('');
    setIsLoading(true);
    setExpandedSourcesId(null);
    await onSendMessage(documentId, textToSend);
    setIsLoading(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleToggleSources = (messageId: string) => {
    setExpandedSourcesId(prevId => (prevId === messageId ? null : messageId));
  };

  const handleMicClick = () => {
    const newListeningState = !isListening;
    setIsListening(newListeningState);
    if (newListeningState) {
      setInput('');
      console.log("TODO: Implement start speech recognition");
    } else {
      console.log("TODO: Implement stop speech recognition");
    }
  };

  return (
    <div
      className={cn(
        "h-auto md:h-[89vh] flex flex-col flex-1 bg-white dark:bg-[#0f1629]/30",
        "w-full md:w-auto"
      )}
    >
      {/* --- MODIFIED: Added h-[70vh] for mobile, kept md:flex-1 for desktop --- */}
      <ScrollArea
        className="py-4 px-6 h-[70vh] md:h-auto md:flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden"
        ref={scrollRef}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.id}
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                layout
                className={`flex gap-3 items-start ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-4 flex flex-col ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 text-black dark:text-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>

                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleSources(message.id)}
                          className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-[#2a304f]/50 hover:bg-gray-300 dark:hover:bg-[#2a304f] px-3 py-1 rounded-full transition-all border border-gray-300 dark:border-gray-700/50"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{message.sources.length} Sources</span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedSourcesId === message.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                      </div>
                      <AnimatePresence>
                        {expandedSourcesId === message.id && (
                          <motion.div
                            key="sources-list"
                            variants={sourcesVariants}
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            className="space-y-2 border-l-2 border-blue-300 dark:border-blue-500/50 pl-3 mt-3"
                          >
                            {message.sources.map((source, index) => (
                              <div
                                key={index}
                                className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100/50 dark:bg-[#1a1f3a]/40 p-2 rounded-md"
                              >
                                {source}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>
                {/* {message.role === 'assistant' && (
                  <button
                    onClick={() => handleToggleSpeech(message.id, message.content)}
                    className="flex-shrink-0 p-2 mt-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2a304f]/50 transition-all"
                    title={speakingMessageId === message.id ? "Stop speech" : "Read aloud"}
                  >
                    {speakingMessageId === message.id ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>
                )} */}
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {isLoading && (
              <motion.div
                variants={messageVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="flex gap-3 justify-start"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>

      <div className="border-t border-gray-200 dark:border-gray-800/80 bg-white/80 dark:bg-[#1a1f3a]/30 p-4 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          {chatHistory.length === 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-gray-900 dark:text-gray-400 text-sm">Suggested questions:</span>
              </div>
              <motion.div
                className="grid grid-cols-2 gap-2"
                variants={suggestionsContainerVariants}
                initial="hidden"
                animate="visible"
              >
                {suggestions.map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    variants={suggestionItemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-left p-3 rounded-lg bg-gray-50 dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 hover:border-blue-300 dark:hover:border-blue-500/30 hover:bg-gray-100 dark:hover:bg-[#1a1f3a] text-gray-900 dark:text-gray-300 text-sm transition-all"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </motion.div>
            </div>
          )}
          <div className="flex gap-3">
            <DropdownMenu open={isModelMenuOpen} onOpenChange={setIsModelMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-[60px] px-4 bg-white dark:bg-[#1a1f3a] border border-gray-300 dark:border-gray-700 text-black dark:text-white hover:border-blue-300 dark:hover:border-blue-500/30 flex items-center gap-2 min-w-[180px] dark:hover:bg-[#1a1f3a]/50"
                >
                  <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div className="flex flex-col items-start flex-1">
                    <span className="text-xs text-gray-800 dark:text-gray-400">Model</span>
                    <span className="text-sm truncate max-w-[120px]">
                      {GEMINI_MODELS.find(m => m.id === selectedModel)?.name}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
                      isModelMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[280px] bg-white dark:backdrop-blur-3xl dark:bg-transparent border-gray-300 dark:border-gray-700"
              >
                <DropdownMenuLabel className="text-gray-600 dark:text-gray-400"> Select Gemini Model </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
                <DropdownMenuRadioGroup value={selectedModel} onValueChange={setSelectedModel}>
                  {GEMINI_MODELS.map((model) => (
                    <DropdownMenuRadioItem
                      key={model.id}
                      value={model.id}
                      className="cursor-pointer focus:bg-blue-50 dark:focus:bg-blue-500/10"
                    >
                      <div className="flex flex-col gap-1">
                        <span className="font-medium text-black dark:text-white"> {model.name} </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400"> {model.description} </span>
                      </div>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>

            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isListening ? "Listening..." : "Ask about this document..."}
              className="flex-1 min-h-[60px] max-h-[120px] bg-white dark:bg-[#0f1629] items-center border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 resize-none"
              disabled={isListening}
            />
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleMicClick}
                disabled={isLoading}
                className="h-[60px] w-[60px] px-6 bg-gray-100 dark:bg-[#1a1f3a] border border-gray-300 dark:border-gray-700 text-black dark:text-white hover:border-blue-300 dark:hover:border-blue-500/30 disabled:opacity-50"
                title={isListening ? "Stop listening" : "Start listening"}
              >
                <Mic
                  className={`w-5 h-5 ${
                    isListening ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className="h-[60px] w-[60px] px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}