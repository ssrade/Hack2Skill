import { useState, useRef, useEffect } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { queryDocument } from "@/api/queryApi"; // import your API call

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  confidence?: "high" | "medium" | "low";
  citations?: string[];
  timestamp: Date;
}

interface ChatInterfaceProps {
  documentUploaded?: boolean;
}

export const ChatInterface = ({ documentUploaded }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastMessageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (documentUploaded && messages.length === 0) {
      const welcomeMessage: Message = {
        id: "1",
        text: "I've analyzed your legal document and I'm ready to help! I can explain complex clauses, summarize key points, identify potential risks, and answer your questions. What would you like to know?",
        sender: "ai",
        confidence: "high",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
    }
  }, [documentUploaded, messages.length]);

  useEffect(() => {
    if (!scrollAreaRef.current) return;

    // Use requestAnimationFrame so scrolling happens after the DOM paint
    // (helps with Framer Motion animations and dynamic heights).
    const rafId = requestAnimationFrame(() => {
      // First, try to scroll the Radix ScrollArea viewport (the real
      // scrollable container). This will ensure only the chat panel
      // scrolls and not the page.
      const viewport = scrollAreaRef.current?.querySelector('[data-scroll-viewport]') as HTMLElement | null;
      if (viewport) {
        try {
          viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
          return;
        } catch (e) {
          viewport.scrollTop = viewport.scrollHeight;
          return;
        }
      }

      // If no viewport found, fall back to scrolling the last message
      // element into view or the root scroll area.
      if (lastMessageRef.current) {
        try {
          lastMessageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
          return;
        } catch (e) {
          // ignore and continue to root fallback
        }
      }

      // Fallback: scroll the root if viewport isn't found
      try {
        scrollAreaRef.current!.scrollTo({ top: scrollAreaRef.current!.scrollHeight, behavior: 'smooth' });
      } catch (e) {
        if (scrollAreaRef.current) {
          // @ts-ignore
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      }
    });

    return () => cancelAnimationFrame(rafId);
  }, [messages, isLoading]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call your API
      const response = await queryDocument(inputValue);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.answer || "Sorry, I couldn't find an answer.",
        sender: "ai",
        confidence: "high", // or determine dynamically if API returns confidence
        citations: response.source ? [response.source] : [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: "An error occurred while fetching the answer. Please try again.",
        sender: "ai",
        confidence: "low",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // focus input so user can continue typing without moving the page
      setTimeout(() => {
        try {
          inputRef.current?.focus({ preventScroll: true } as FocusOptions);
        } catch {
          inputRef.current?.focus();
        }
      }, 50);
    }
  };

  const getConfidenceBadge = (confidence?: string) => {
    switch (confidence) {
      case "high":
        return (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-[0_0_8px_rgba(16,185,129,0.5)]">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            High Confidence
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 shadow-[0_0_8px_rgba(251,191,36,0.5)]">
            <AlertCircle className="w-3 h-3 mr-1" />
            Medium Confidence
          </Badge>
        );
      case "low":
        return (
          <Badge className="bg-gradient-to-r from-rose-500 to-red-600 text-white border-0 shadow-[0_0_8px_rgba(239,68,68,0.5)]">
            <XCircle className="w-3 h-3 mr-1" />
            Low Confidence
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusBadge = () => {
    if (documentUploaded) {
      return (
        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 text-xs font-medium shadow-[0_0_6px_rgba(16,185,129,0.5)]">
          <FileText className="w-3 h-3 mr-1" />
          Document Ready
        </Badge>
      );
    }
    return (
      <Badge className="bg-gradient-to-r from-slate-600 to-slate-700 text-white border-0 text-xs font-medium shadow-sm">
        <FileText className="w-3 h-3 mr-1" />
        Awaiting Document
      </Badge>
    );
  };

  return (
    <Card className="flex flex-col h-[105vh] max-h-[950px] shadow-2xl border border-white/55 bg-gradient-to-br from-slate-900 via-slate-950 to-black relative overflow-hidden text-slate-100">
      {/* Background blobs */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-blue-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-indigo-600/20 rounded-full blur-3xl"></div>

      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-800 bg-gradient-to-r from-slate-900/70 to-slate-800/70 backdrop-blur-sm relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Legal AI Assistant
              </h3>
              <p className="text-xs text-slate-400">
                Powered by advanced document analysis
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-6 relative z-10">
        <div className="space-y-6">
          {messages.length === 0 && !documentUploaded && (
            <div className="text-center py-16 text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-sm">
                <Bot className="w-8 h-8 text-slate-500" />
              </div>
              <h4 className="text-lg font-medium mb-2">
                Ready to analyze your document
              </h4>
              <p className="text-sm max-w-md mx-auto leading-relaxed">
                Upload a legal document to get started. I'll help you understand
                clauses, key terms, and risks.
              </p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              ref={idx === messages.length - 1 ? lastMessageRef : undefined}
              key={message.id}
              className={`flex gap-4 ${
                message.sender === "user" ? "justify-end" : "justify-start"
              } animate-in slide-in-from-bottom-2 duration-300`}
            >
              {message.sender === "ai" && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <Bot className="w-5 h-5 text-blue-400" />
                </div>
              )}

              <div
                className={`max-w-[75%] relative ${
                  message.sender === "user"
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-3 border border-white/10 shadow-lg shadow-blue-500/30"
                    : "bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700 shadow-sm"
                }`}
              >
                <p className="text-sm leading-relaxed font-medium">{message.text}</p>

                {message.confidence && (
                  <div className="flex items-center gap-2 mt-3">
                    {getConfidenceBadge(message.confidence)}
                  </div>
                )}

                {message.citations && message.citations.length > 0 && (
                  <div className="mt-3 p-3 bg-slate-900/40 rounded-lg border border-slate-700 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <FileText className="w-3 h-3 mt-0.5 text-slate-400" />
                      <div className="text-xs">
                        <span className="font-medium text-slate-300">
                          Referenced sources:
                        </span>
                        <div className="mt-1 text-slate-400">
                          {message.citations.map((citation, index) => (
                            <span key={index} className="block">
                              • {citation}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div
                  className={`text-xs mt-2 ${
                    message.sender === "user" ? "text-blue-200" : "text-slate-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              {message.sender === "user" && (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-gray-800 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 animate-in slide-in-from-bottom-2 duration-300">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-900 to-indigo-900 flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                <Bot className="w-5 h-5 text-blue-400" />
              </div>
              <div className="bg-gradient-to-br from-slate-800 to-slate-700 text-slate-100 rounded-2xl rounded-bl-md px-4 py-3 border border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  <span className="text-sm font-medium">Analyzing your question...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-6 border-t border-slate-800 bg-gradient-to-b from-slate-900/70 to-slate-800/50 backdrop-blur-sm relative z-10">
        <form onSubmit={handleSubmit}>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  documentUploaded
                    ? "Ask about your document..."
                    : "Upload a document to start chatting"
                }
                disabled={!documentUploaded || isLoading}
                className="pr-12 h-12 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500 text-sm rounded-xl shadow-inner"
              />
              {!documentUploaded && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <FileText className="w-4 h-4 text-slate-500" />
                </div>
              )}
            </div>
            <Button
              type="submit"
              disabled={!documentUploaded || !inputValue.trim() || isLoading}
              className="h-12 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-700 disabled:to-slate-800 disabled:cursor-not-allowed text-white rounded-xl shadow-md shadow-blue-500/40 hover:shadow-lg hover:shadow-blue-500/60 transition-all duration-200"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>

        <p className="text-xs text-slate-500 mt-3 text-center flex items-center justify-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-400" />
          Ask about clauses, risks, summaries, or any legal concepts in your document
        </p>
      </div>
    </Card>
  );
};
