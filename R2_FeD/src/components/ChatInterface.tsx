import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, FileText, ChevronDown, Mic, Cpu, AlertCircle, Loader } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { ScrollArea } from './ui/scroll-area';
import { cn } from './lib/utils';
import { fetchChatMessages, sendRAGQuery, type BackendMessage, type FetchMessagesResponse } from '../api/ragQueryApi';
import { toast } from './ui/toast';
import { useTranslation } from '../contexts/TranslationContext';

const MAX_CHARACTERS = 2000;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

interface ChatInterfaceProps {
  documentId: string;
  documentName: string;
}

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

/**
 * Convert backend message format to frontend Message format
 * Note: Content translation is handled separately when messages are received
 */
const convertBackendMessageToFrontend = (backendMsg: BackendMessage): Message => {
  return {
    id: backendMsg.id,
    role: backendMsg.sender === 'USER' ? 'user' : 'assistant',
    content: backendMsg.content, // Will be translated when setting messages
    timestamp: backendMsg.createdAt,
    sources: backendMsg.metadata?.sources,
  };
};

export function ChatInterface({
  documentId,
  documentName,
}: ChatInterfaceProps) {
  const { inline, t, currentLanguage } = useTranslation();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [expandedSourcesId, setExpandedSourcesId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position before loading more messages
  const scrollPositionBeforeLoadRef = useRef<number>(0);
  const scrollHeightBeforeLoadRef = useRef<number>(0);
  
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Speech to text refs (matching wstrail.html exactly)
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  let silenceTimer: ReturnType<typeof setTimeout> | null = null; // Plain variable like wstrail.html
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const SILENCE_DELAY = 2000; // 2 seconds of silence before stopping
  const SILENCE_THRESHOLD = 25; // Increased from 5 to 25 - Audio level threshold for silence detection
  
  // Pagination state
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isNearTop, setIsNearTop] = useState(false);
  const [optimisticUserMessage, setOptimisticUserMessage] = useState<Message | null>(null);
  
  const suggestions = [
    inline("What are the main risks in this contract?"),
    inline("Explain the termination clause in simple terms"),
    inline("Are there any unusual clauses I should be aware of?"),
    inline("What's the liability exposure in this agreement?")
  ];

  // Initial message will be translated when currentLanguage changes
  const getInitialMessage = useCallback(async () => {
    const messageText = `Hello! I've analyzed ${documentName}. I can help you understand the risks, clauses, and legal implications. What would you like to know?`;
    const translatedContent = await t(messageText);
    return {
      id: 'initial-1',
      role: 'assistant' as const,
      content: translatedContent,
      timestamp: new Date().toISOString()
    };
  }, [documentName, t]);

  // Get the actual scrollable viewport element
  const getScrollElement = useCallback(() => {
    // Try to find the scrollable viewport element
    if (scrollRef.current) {
      const viewport = scrollRef.current.querySelector('[data-slot="scroll-area-viewport"]') as HTMLElement;
      if (viewport) return viewport;
      // Fallback: if ScrollArea is structured differently, use the direct child
      const scrollableDiv = scrollRef.current.querySelector('div[class*="overflow"]') as HTMLElement;
      if (scrollableDiv) return scrollableDiv;
    }
    return scrollRef.current;
  }, []);

  // Fetch initial chat messages (latest 10) and translate them
  const loadMessages = useCallback(async (cursor?: string, isLoadMore: boolean = false) => {
    if (!documentId) {
      setIsLoadingHistory(false);
      return;
    }
    
    if (isLoadMore) {
      // Save scroll position and height before loading more messages
      const scrollEl = getScrollElement();
      if (scrollEl) {
        scrollPositionBeforeLoadRef.current = scrollEl.scrollTop;
        scrollHeightBeforeLoadRef.current = scrollEl.scrollHeight;
      }
      setIsLoadingMore(true);
    } else {
      setIsLoadingHistory(true);
    }
    
    setError(null);
    
    try {
      console.log('🔄 Loading messages:', { cursor, isLoadMore });
      const response: FetchMessagesResponse = await fetchChatMessages(documentId, 10, cursor);
      const convertedMessages = response.messages.map(convertBackendMessageToFrontend);
      
      // Translate all message contents from backend
      const translatedMessages = await Promise.all(
        convertedMessages.map(async (msg) => {
          if (currentLanguage === 'en') return msg;
          const translatedContent = await t(msg.content);
          return { ...msg, content: translatedContent };
        })
      );
      
      console.log('📥 Messages loaded:', {
        count: translatedMessages.length,
        nextCursor: response.nextCursor,
        hasMore: response.hasMore
      });
      
      if (isLoadMore) {
        // FIXED: For pagination - API returns messages in chronological order (oldest first)
        // We want to append them at the beginning in the correct order
        // So the 10th message from new batch should be just above the previous first message
        setMessages(prev => [...translatedMessages, ...prev]);
      } else {
        // For initial load: Replace all messages
        setMessages(translatedMessages);
      }
      
      setNextCursor(response.nextCursor);
      setHasMore(response.hasMore);
      
    } catch (error: any) {
      console.error('Failed to load chat messages:', error);
      setError(inline('Failed to load chat history'));
    } finally {
      setIsLoadingHistory(false);
      setIsLoadingMore(false);
    }
  }, [documentId, getScrollElement, t, currentLanguage, inline]);

  // Load initial messages when component mounts
  useEffect(() => {
    loadMessages(); // No cursor = get latest 10 messages
  }, [loadMessages]);

  // Auto-scroll to bottom when new messages are added (not during pagination)
  useEffect(() => {
    const scrollEl = getScrollElement();
    if (scrollEl && !isLoadingMore && !isNearTop) {
      const scrollToBottom = () => {
        if (scrollEl) {
          scrollEl.scrollTop = scrollEl.scrollHeight;
        }
      };
      
      // Small delay to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isLoading, isLoadingMore, isNearTop, optimisticUserMessage, getScrollElement]);

  // Restore scroll position after loading older messages
  useEffect(() => {
    const scrollEl = getScrollElement();
    if (scrollEl && isLoadingMore === false && scrollHeightBeforeLoadRef.current > 0) {
      // Calculate the new scroll position to maintain the same view
      const scrollHeightAfterLoad = scrollEl.scrollHeight;
      const heightDifference = scrollHeightAfterLoad - scrollHeightBeforeLoadRef.current;
      const newScrollPosition = scrollPositionBeforeLoadRef.current + heightDifference;
      
      scrollEl.scrollTop = newScrollPosition;
      
      // Reset refs
      scrollHeightBeforeLoadRef.current = 0;
      scrollPositionBeforeLoadRef.current = 0;
    }
  }, [isLoadingMore, getScrollElement]);

  // Improved scroll handling with better detection
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollContainer = e.currentTarget;
    const scrollTop = scrollContainer.scrollTop;
    
    // Check if user is near the top (within 50px from top)
    const nearTop = scrollTop <= 50;
    setIsNearTop(nearTop);
    
    console.log('🔄 Scroll detected:', {
      scrollTop,
      nearTop,
      hasMore,
      isLoadingMore,
      isLoadingHistory,
      nextCursor
    });
    
    // Load more when near top and there are more messages to load
    if (nearTop && hasMore && !isLoadingMore && !isLoadingHistory && nextCursor) {
      console.log('🚀 Triggering load more with cursor:', nextCursor);
      loadMessages(nextCursor, true);
    }
  }, [hasMore, isLoadingMore, isLoadingHistory, nextCursor, loadMessages]);

  // Manual load more button handler
  const handleManualLoadMore = () => {
    if (hasMore && nextCursor && !isLoadingMore) {
      console.log('🔘 Manual load more triggered with cursor:', nextCursor);
      loadMessages(nextCursor, true);
    }
  };

  const handleSendMessage = async (messageText?: string) => {
    setIsListening(false);
    const textToSend = messageText || input;
    
    if (!textToSend.trim()) {
      return;
    }
    
    // Check character limit
    if (textToSend.length > MAX_CHARACTERS) {
      toast.warning(inline(`Message exceeds ${MAX_CHARACTERS} characters. Please shorten your message.`));
      return;
    }

    if (!documentId) {
      setError(inline('Document ID is missing'));
      return;
    }

    setInput('');
    setIsLoading(true);
    setExpandedSourcesId(null);
    setError(null);

    // Create optimistic user message that stays visible during loading
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };
    
    // Set optimistic message that will be displayed immediately
    setOptimisticUserMessage(userMessage);

    // FIXED: Force scroll to bottom immediately when user sends message
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);

    try {
      console.log('💬 Sending query to RAG backend...');
      // Step 1: Send query to /chat/query
      const response = await sendRAGQuery(documentId, textToSend);
      console.log('✅ RAG query response received');
      
      // Step 2: Reload all messages from /chat/messages to get updated conversation
      console.log('🔄 Reloading messages after query...');
      await loadMessages(); // This will fetch the latest 10 messages including the new one
      
    } catch (error: any) {
      console.error('Failed to send message:', error);
      const errorMsg = error.message || inline('Failed to send message. Please try again.');
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setOptimisticUserMessage(null); // Clear optimistic message after response
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const handleToggleSources = (messageId: string) => {
    setExpandedSourcesId(prevId => (prevId === messageId ? null : messageId));
  };

  // 🛑 Stop recording when silence is detected (exact copy from wstrail.html)
  const stopRecording = useCallback(() => {
    console.log('🤫 Silence detected — stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  // Manual stop/cleanup function
  const stopSpeechRecognition = useCallback(() => {
    console.log('🛑 Manually stopping speech recognition...');
    
    // Clear silence timer
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    
    // Stop MediaRecorder if active (this will trigger onstop and send audio)
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio tracks
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
    
    // Close AudioContext
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Don't close WebSocket immediately - wait for audio to be sent
    // Close it after a short delay
    setTimeout(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }, 500); // Wait 500ms for audio to be sent

    setIsListening(false);
    analyserRef.current = null;
  }, []);

  // 🧠 Silence detection loop (exact copy from wstrail.html)
  const detectSilence = useCallback((analyser: AnalyserNode) => {
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    console.log('🎧 Silence detection started');

    const check = () => {
      analyser.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

      if (avg < SILENCE_THRESHOLD) { // silence threshold
        if (!silenceTimer) {
          console.log('🤫 Silence detected! Starting 2s timer... (audio level:', avg.toFixed(2), ')');
          silenceTimer = setTimeout(stopRecording, SILENCE_DELAY);
        }
      } else {
        if (silenceTimer) {
          clearTimeout(silenceTimer);
          silenceTimer = null;
        }
      }

      requestAnimationFrame(check);
    };

    check();
  }, [stopRecording, SILENCE_DELAY, SILENCE_THRESHOLD]);

  // 🎤 Start speech recognition (exact pattern from wstrail.html)
  const startSpeechRecognition = useCallback(async () => {
    try {
      setError(null);
      
      // Request microphone FIRST, before WebSocket
      console.log('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      audioStreamRef.current = stream;
      
      // Get WebSocket URL
      const baseURL = import.meta.env.VITE_API_BASE || 'http://localhost:3001';
      const wsProtocol = baseURL.startsWith('https') ? 'wss' : 'ws';
      const wsHost = baseURL.replace(/^https?:\/\//, '');
      const wsUrl = `${wsProtocol}://${wsHost}/speech/ws`;

      // Create WebSocket connection (exact pattern from wstrail.html)
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        console.log('✅ WebSocket connected');
        setIsListening(true);

        try {
          // Setup audio processing (exact pattern from wstrail.html)
          const audioContext = new AudioContext();
          audioContextRef.current = audioContext;
          console.log('🔊 AudioContext created, state:', audioContext.state);
          
          const source = audioContext.createMediaStreamSource(stream);
          const analyser = audioContext.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          analyserRef.current = analyser;
          console.log('📊 Analyser connected');

          // Reset audio chunks
          audioChunksRef.current = [];
          console.log('🗑️ Audio chunks reset');

          // Create MediaRecorder (exact pattern from wstrail.html)
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
          mediaRecorderRef.current = mediaRecorder;
          console.log('📹 MediaRecorder created');

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            console.log('🎤 Audio chunk received:', e.data.size, 'bytes');
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log('🛑 Stopped recording. Total chunks:', audioChunksRef.current.length);

          if (audioChunksRef.current.length === 0) {
            console.warn('⚠️ No audio chunks to send!');
            return;
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
          console.log('📦 Audio blob size:', audioBlob.size, 'bytes');
          
          const buffer = await audioBlob.arrayBuffer();
          console.log('📤 Sending audio buffer, size:', buffer.byteLength, 'bytes');
          
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(new Uint8Array(buffer)); // send entire recording to backend
            wsRef.current.send(JSON.stringify({ event: 'stop' })); // optional stop signal
            console.log('✅ Audio sent to backend');
          } else {
            console.error('❌ WebSocket not open! State:', wsRef.current?.readyState);
          }
        };

        // Start recording (exact pattern from wstrail.html - NO parameter)
        console.log('🎙️ Starting MediaRecorder...');
        mediaRecorder.start();
        console.log('📊 MediaRecorder state:', mediaRecorder.state);

        // 🎤 Start silence detection (exact pattern from wstrail.html)
        detectSilence(analyser);
        } catch (err) {
          console.error('❌ Error in ws.onopen:', err);
          setError(inline('Failed to initialize recording'));
          stopSpeechRecognition();
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data.transcript || data.text || data.results?.[0]?.alternatives?.[0]?.transcript;
          if (text && text.trim()) {
            // Only update if the new transcript is longer (to show final result, not interim)
            setInput(prev => {
              const newText = text.trim();
              if (newText.length > prev.length || !prev) {
                console.log('📝 Transcript updated:', newText);
                return newText;
              }
              return prev;
            });
          }
        } catch (err) {
          console.error('❌ Error parsing server message:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError(inline('Failed to connect to speech service'));
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setIsListening(false);
      };

    } catch (error: any) {
      console.error('Error starting speech recognition:', error);
      
      // Clean up stream if it was created
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }
      
      // Close WebSocket if it was created
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      
      // Handle specific error cases with user-friendly messages
      if (error.name === 'NotAllowedError') {
        setError(inline('🎤 Microphone permission denied. Please click the lock icon in your browser address bar and allow microphone access, then try again.'));
      } else if (error.name === 'NotFoundError') {
        setError(inline('No microphone found. Please connect a microphone and try again.'));
      } else {
        setError(inline('Failed to start speech recognition. Please try again.'));
      }
      setIsListening(false);
    }
  }, [detectSilence, inline, SILENCE_THRESHOLD, SILENCE_DELAY]);

  const handleMicClick = async () => {
    if (isListening) {
      // Stop listening
      stopSpeechRecognition();
    } else {
      // Start listening
      await startSpeechRecognition();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSpeechRecognition();
    };
  }, [stopSpeechRecognition]);

  // State for translated initial message
  const [translatedInitialMessage, setTranslatedInitialMessage] = useState<Message | null>(null);

  // Update initial message when language or documentName changes
  useEffect(() => {
    getInitialMessage().then(setTranslatedInitialMessage);
  }, [getInitialMessage]);

  // Combine messages for display
  const getDisplayMessages = () => {
    let displayMessages = [...messages];
    
    // Add initial message only when there are no loaded messages
    if (messages.length === 0 && !isLoadingHistory && translatedInitialMessage) {
      displayMessages = [translatedInitialMessage];
    }
    
    // Add optimistic user message if it exists
    if (optimisticUserMessage) {
      displayMessages = [...displayMessages, optimisticUserMessage];
    }
    
    return displayMessages;
  };

  const displayMessages = getDisplayMessages();

  return (
    <div
      className={cn(
        "h-auto md:h-[80vh] flex flex-col flex-1 bg-white dark:bg-[#0f1629]/30",
        "w-full md:w-auto"
      )}
      data-testid="chat-interface"
    >
      <ScrollArea
        className="py-4 px-6 h-[70vh] md:h-auto md:flex-1 min-h-0 [&_[data-orientation='vertical']]:hidden"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Manual Load More Button */}
          {hasMore && (
            <div className="flex justify-center">
              <Button
                onClick={handleManualLoadMore}
                disabled={isLoadingMore}
                variant="outline"
                size="sm"
                className="text-xs"
              >
                {isLoadingMore ? inline('Loading...') : inline('Load Older Messages')}
              </Button>
            </div>
          )}

          {/* Load More Indicator */}
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                <Loader className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <span className="text-sm text-blue-600 dark:text-blue-400">{inline('Loading older messages...')}</span>
              </div>
            </div>
          )}

          {/* No More Messages Indicator */}
          {!hasMore && messages.length > 0 && (
            <div className="flex justify-center py-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 px-3 py-1 rounded-full">
                {inline('Beginning of conversation')}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="mt-2 h-7 text-xs text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100"
                >
                  {inline('Dismiss')}
                </Button>
              </div>
            </div>
          )}

          {/* Loading History Indicator */}
          {isLoadingHistory && (
            <div className="flex items-center justify-center py-8">
              <div className="flex gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></div>
                <div
                  className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></div>
              </div>
            </div>
          )}

          {/* Messages */}
          <AnimatePresence>
            {displayMessages.map((message) => (
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
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

                  {message.role === 'assistant' && message.sources && message.sources.length > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => handleToggleSources(message.id)}
                          className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-[#2a304f]/50 hover:bg-gray-300 dark:hover:bg-[#2a304f] px-3 py-1 rounded-full transition-all border border-gray-300 dark:border-gray-700/50"
                        >
                          <FileText className="w-3 h-3" />
                          <span>{message.sources.length} {inline('Sources')}</span>
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
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading Indicator for new messages */}
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

      {/* Input Area */}
      <div className="border-t border-gray-200 dark:border-gray-800/80 bg-white/80 dark:bg-[#1a1f3a]/30 p-4 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          {/* Suggestions - only show when no messages */}
          {messages.length === 0 && !isLoadingHistory && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="text-gray-900 dark:text-gray-400 text-sm">{inline('Suggested questions:')}</span>
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

          {/* Input Controls */}
          <div className="flex gap-3">
            {/* Fixed Model Display - Removed Dropdown */}
            <div className="h-[60px] px-4 bg-white dark:bg-[#1a1f3a] border border-gray-300 dark:border-gray-700 text-black dark:text-white flex items-center gap-2 min-w-[180px] rounded-md">
              <Cpu className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="flex flex-col items-start flex-1">
                <span className="text-xs text-gray-800 dark:text-gray-400">{inline('Model')}</span>
                <span className="text-sm truncate max-w-[120px]">Gemini 2.5 Flash</span>
              </div>
            </div>

            <div className="flex-1 relative">
              <Textarea
                value={input}
                onChange={(e) => {
                  const newValue = e.target.value;
                  // Prevent typing if already at limit
                  if (newValue.length <= MAX_CHARACTERS) {
                    setInput(newValue);
                  } else {
                    // Warn user when they exceed limit
                    toast.warning(inline(`Character limit reached (${MAX_CHARACTERS} characters).`));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() && !isLoading && input.length <= MAX_CHARACTERS) {
                      handleSendMessage();
                    }
                  }
                }}
                placeholder={isListening ? inline("Listening...") : inline("Ask about this document...")}
                className="flex-1 min-h-[60px] max-h-[120px] bg-white dark:bg-[#0f1629] items-center border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-500 focus:border-blue-500 resize-none pr-16"
                disabled={isListening || isLoading}
                maxLength={MAX_CHARACTERS}
                aria-label="Chat input"
                aria-describedby="char-counter"
              />
              <div
                id="char-counter"
                className={cn(
                  "absolute bottom-2 right-2 text-xs",
                  input.length > MAX_CHARACTERS * 0.9
                    ? input.length >= MAX_CHARACTERS
                      ? "text-red-500 font-semibold"
                      : "text-yellow-600 dark:text-yellow-400"
                    : "text-gray-400 dark:text-gray-500"
                )}
              >
                {input.length}/{MAX_CHARACTERS}
              </div>
            </div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleMicClick}
                disabled={isLoading}
                className={cn(
                  "h-[60px] w-[60px] px-6 border disabled:opacity-50 relative",
                  isListening 
                    ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30" 
                    : "bg-gray-100 dark:bg-[#1a1f3a] border-gray-300 dark:border-gray-700 text-black dark:text-white hover:border-blue-300 dark:hover:border-blue-500/30"
                )}
                title={isListening ? inline("Recording... (click to stop)") : inline("Start voice input")}
              >
                <Mic
                  className={`w-5 h-5 ${
                    isListening ? 'text-red-500 dark:text-red-400 animate-pulse' : 'text-gray-600 dark:text-gray-300'
                  }`}
                />
                {isListening && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
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