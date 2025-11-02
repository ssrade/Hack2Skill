import type { Document, Message } from './MainApp';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, FileCheck, MessageSquare, TrendingUp, ChevronDown, BookOpen } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { Progress } from './ui/progress';
import { DocumentExtrasSidebar } from './DocumentExtrasSidebar';
import { useState, useEffect } from 'react';
import { getAgreementAnalysis } from '../api/analysisApi';
import { getRulebookExplanations, type RulebookTerm } from '../api/rulebookApi';
import { Button } from './ui/button';
import { useTranslation } from '../contexts/TranslationContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface DocumentViewProps {
  document: Document | undefined;
  onSendMessage: (documentId: string, messageText: string) => Promise<void>;
  onToggleMobileSidebar: () => void;
}

const tabContentVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } },
};
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Helper component to translate dynamic backend text
function TranslatedText({ text }: { text: string }) {
  const { t, currentLanguage } = useTranslation();
  const [translated, setTranslated] = useState(text);

  useEffect(() => {
    if (currentLanguage === 'en') {
      setTranslated(text);
      return;
    }
    t(text).then(setTranslated);
  }, [text, currentLanguage, t]);

  return <>{translated}</>;
}

function DocumentView({ document, onSendMessage, onToggleMobileSidebar }: DocumentViewProps) {
  const { inline, t, currentLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [analysis, setAnalysis] = useState<any>(null);
  const [translatedAnalysis, setTranslatedAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Rulebook state
  const [rulebookTerms, setRulebookTerms] = useState<RulebookTerm[]>([]);
  const [translatedRulebookTerms, setTranslatedRulebookTerms] = useState<RulebookTerm[]>([]);
  const [rulebookLoading, setRulebookLoading] = useState(false);
  const [rulebookError, setRulebookError] = useState<string | null>(null);
  const [rulebookFetched, setRulebookFetched] = useState(false);
  const [showRulebookContent, setShowRulebookContent] = useState(false);

  // Reset to overview tab when document changes
  useEffect(() => {
    if (document) {
      setActiveTab('overview');
      // Reset rulebook view states for new document
      setRulebookFetched(false);
      setShowRulebookContent(false);
    }
  }, [document?.id]);

  // Translate analysis data when it arrives or language changes
  useEffect(() => {
    if (!analysis || currentLanguage === 'en') {
      setTranslatedAnalysis(analysis);
      return;
    }
    
    const translateAnalysis = async () => {
      try {
        const translated = { ...analysis };
        
        // Translate summary if it exists
        if (translated.summary) {
          translated.summary = await t(translated.summary);
        }
        
        // Translate risk descriptions
        if (translated.risksJson?.top_clauses) {
          const risks = translated.risksJson.top_clauses;
          
          // Translate High risks
          if (risks.High) {
            risks.High = await Promise.all(risks.High.map((desc: string) => t(desc)));
          }
          
          // Translate Medium risks
          if (risks.Medium) {
            risks.Medium = await Promise.all(risks.Medium.map((desc: string) => t(desc)));
          }
          
          // Translate Low risks
          if (risks.Low) {
            risks.Low = await Promise.all(risks.Low.map((desc: string) => t(desc)));
          }
        }
        
        setTranslatedAnalysis(translated);
      } catch (error) {
        console.error('Error translating analysis:', error);
        setTranslatedAnalysis(analysis); // Fallback to original
      }
    };
    
    translateAnalysis();
  }, [analysis, currentLanguage, t]);

  // Translate rulebook terms when they arrive or language changes
  useEffect(() => {
    if (!rulebookTerms || rulebookTerms.length === 0) {
      setTranslatedRulebookTerms(rulebookTerms);
      return;
    }
    
    if (currentLanguage === 'en') {
      // Force update even for English to ensure UI renders
      setTranslatedRulebookTerms([...rulebookTerms]);
      return;
    }
    
    const translateRulebook = async () => {
      try {
        const translated = await Promise.all(
          rulebookTerms.map(async (item) => ({
            term: await t(item.term),
            explanation: await t(item.explanation),
          }))
        );
        // Force update with new array reference
        setTranslatedRulebookTerms([...translated]);
      } catch (error) {
        console.error('Error translating rulebook:', error);
        // Fallback to original with new array reference
        setTranslatedRulebookTerms([...rulebookTerms]);
      }
    };
    
    translateRulebook();
  }, [rulebookTerms, currentLanguage, t]);

  // Fetch analysis data
  useEffect(() => {
    if (!document) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    getAgreementAnalysis(document.id)
      .then((data) => setAnalysis(data))
      .catch((err) => {
        const errorMsg = inline('Failed to load analysis');
        setAnalysisError(errorMsg);
      })
      .finally(() => setAnalysisLoading(false));
  }, [document, inline]);

  // Fetch rulebook data
  useEffect(() => {
    if (!document) return;
    
    // Reset state first
    setRulebookTerms([]);
    setTranslatedRulebookTerms([]);
    setRulebookLoading(true);
    setRulebookError(null);
    setRulebookFetched(false);
    
    getRulebookExplanations(document.id)
      .then((data) => {
        const terms = data.rulebook_explanations?.rulebookJson || [];
        console.log('✅ Rulebook data fetched successfully:', terms.length, 'terms');
        
        // Create new array references to force React to detect the change
        const newTerms = [...terms];
        setRulebookTerms(newTerms);
        
        // Set translated terms immediately with a slight delay to ensure state updates
        setTimeout(() => {
          setTranslatedRulebookTerms([...newTerms]);
          setRulebookFetched(true); // Mark as successfully fetched
        }, 0);
      })
      .catch((err) => {
        console.error('❌ Rulebook error:', err);
        
        // User-friendly error messages
        let errorMsg = inline('Sorry, we could not load the legal terms.');
        
        if (err.message?.includes('Authentication') || err.message?.includes('token')) {
          errorMsg = inline('Please log in again to view the rulebook.');
        } else if (err.message?.includes('No response') || err.message?.includes('connection')) {
          errorMsg = inline('Please check your internet connection and try again.');
        } else if (err.message?.includes('No analysis found')) {
          errorMsg = inline('This document has not been analyzed yet. Please analyze it first.');
        } else if (err.message?.includes('404')) {
          errorMsg = inline('No rulebook information found for this document.');
        } else if (err.message?.includes('500')) {
          errorMsg = inline('Server error. Please try again in a few moments.');
        }
        
        setRulebookError(errorMsg);
      })
      .finally(() => {
        setRulebookLoading(false);
      });
  }, [document?.id, inline]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileCheck className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-700 dark:text-gray-400 text-lg mb-2">{inline('No Document Selected')}</h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm">{inline('Select a document from the sidebar to view analysis')}</p>
        </div>
      </div>
    );
  }

  if (analysisLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-gray-700 dark:text-gray-400 text-lg mb-2">{inline('Loading analysis...')}</h3>
        </div>
      </div>
    );
  }

  if (analysisError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileCheck className="w-16 h-16 text-red-400 dark:text-red-600 mx-auto mb-4" />
          <h3 className="text-red-700 dark:text-red-400 text-lg mb-2">{analysisError}</h3>
        </div>
      </div>
    );
  }

  // Use translated analysis for display, fallback to original
  const displayAnalysis = translatedAnalysis || analysis;
  
  if (!displayAnalysis) {
    return null;
  }

  // Calculate risk score based on risk counts
  const calculateRiskScore = () => {
    const { Low = 0, Medium = 0, High = 0 } = displayAnalysis.risksJson?.counts || {};
    const total = Low + Medium + High;
    if (total === 0) return 0;
    
    // Weighted calculation: High=3, Medium=2, Low=1
    const weightedScore = (High * 3 + Medium * 2 + Low * 1) / (total * 3);
    return Math.round(weightedScore * 100);
  };

  const riskScore = calculateRiskScore();

  // Format upload date
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Transform risk data from backend format to UI format
  const transformRisksForUI = () => {
    const risks: any[] = [];
    const risksJson = displayAnalysis.risksJson;

    if (!risksJson) return risks;

    // Process High risks
    (risksJson.top_clauses?.High || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `high-${idx}`,
        title: `${inline('High Risk')} ${idx + 1}`,
        description: description,
        severity: 'high' as const
      });
    });

    // Process Medium risks
    (risksJson.top_clauses?.Medium || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `medium-${idx}`,
        title: `${inline('Medium Risk')} ${idx + 1}`,
        description: description,
        severity: 'medium' as const
      });
    });

    // Process Low risks
    (risksJson.top_clauses?.Low || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `low-${idx}`,
        title: `${inline('Low Risk')} ${idx + 1}`,
        description: description,
        severity: 'low' as const
      });
    });

    return risks;
  };

  const allRisks = transformRisksForUI();
  const highRisks = allRisks.filter(r => r.severity === 'high');

  // Calculate total risks from counts
  const totalRisks =
    (displayAnalysis.risksJson?.counts?.High || 0) +
    (displayAnalysis.risksJson?.counts?.Medium || 0) +
    (displayAnalysis.risksJson?.counts?.Low || 0);

  const getRiskColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return 'text-red-700 bg-red-100/50 dark:text-red-400 dark:bg-red-500/20';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100/50 dark:text-yellow-400 dark:bg-yellow-500/20';
      case 'low':
        return 'text-green-700 bg-green-100/50 dark:text-green-400 dark:bg-green-500/20';
    }
  };

  return (
    <motion.div
      key={document.id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex-1 flex flex-col"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="h-[10vh] border-b border-gray-200 dark:border-gray-800/50 bg-white/50 dark:bg-[#1a1f3a]/20 backdrop-blur-sm px-6 py-1 flex items-center">
          {/* Mobile Dropdown */}
          <div className="md:hidden pl-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between dark:bg-[#1a1f3a]/50 dark:border-gray-700 text-black dark:text-white">
                  <span className="flex items-center gap-2">
                    {activeTab === 'overview' && <TrendingUp className="w-4 h-4" />}
                    {activeTab === 'risks' && <AlertTriangle className="w-4 h-4" />}
                    {activeTab === 'clauses' && <FileCheck className="w-4 h-4" />}
                    {activeTab === 'rulebook' && <BookOpen className="w-4 h-4" />}
                    {activeTab === 'chat' && <MessageSquare className="w-4 h-4" />}
                    {inline(
                      activeTab === 'overview' ? 'Overview' : 
                      activeTab === 'risks' ? 'Risks' : 
                      activeTab === 'clauses' ? 'Clauses' : 
                      activeTab === 'rulebook' ? 'Rulebook' : 
                      'Chat'
                    )}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit absolute -left-14 bg-white/80 dark:bg-transparent backdrop-blur-3xl border-gray-300 dark:border-gray-700 text-black dark:text-white">
                <DropdownMenuItem onSelect={() => setActiveTab('overview')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <TrendingUp className="w-4 h-4 mr-2" /> {inline('Overview')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('risks')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <AlertTriangle className="w-4 h-4 mr-2" /> {inline('Risks')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('clauses')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <FileCheck className="w-4 h-4 mr-2" /> {inline('Clauses')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('rulebook')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <BookOpen className="w-4 h-4 mr-2" /> {inline('Rulebook')}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('chat')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <MessageSquare className="w-4 h-4 mr-2" /> {inline('Chat')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Tabs */}
          <TabsList className="hidden md:flex bg-transparent border-0 gap-4 h-14 py-2">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <TrendingUp className="w-4 h-4 mr-2" /> {inline('Overview')}
            </TabsTrigger>
            <TabsTrigger
              value="risks"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> {inline('Risks')}
            </TabsTrigger>
            <TabsTrigger
              value="clauses"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <FileCheck className="w-4 h-4 mr-2" /> {inline('Clauses')}
            </TabsTrigger>
            <TabsTrigger
              value="rulebook"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <BookOpen className="w-4 h-4 mr-2" /> {inline('Rulebook')}
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> {inline('Chat')}
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <div className="flex-1 overflow-hidden">
            {/* OVERVIEW TAB */}
            <TabsContent value="overview" className="m-0 px-6" asChild>
              <motion.div
                key="overview"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col md:flex-row w-full h-auto"
              >
                <div className="h-auto md:h-[88vh] w-full md:w-[70%] md:pr-4 pt-1 overflow-y-auto scrollbar-hide">
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="md:pr-3 pt-1">
                    {/* Upload Date */}
                    <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 mb-6">
                      {inline('Uploaded on')} {formatDate(displayAnalysis.uploadDate)}
                    </motion.p>

                    {/* Stats Cards */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {/* Risk Score Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">{inline('Risk Score')}</div>
                        <div className="text-black dark:text-white text-2xl mb-2">{riskScore}/100</div>
                        <Progress value={riskScore} className="h-2" />
                      </motion.div>

                      {/* Total Risks Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">{inline('Total Risks')}</div>
                        <div className="text-black dark:text-white text-2xl flex items-center gap-2">
                          {totalRisks}
                          <span className="text-sm text-gray-500">
                            ({displayAnalysis.risksJson?.counts?.High || 0}H, {displayAnalysis.risksJson?.counts?.Medium || 0}M, {displayAnalysis.risksJson?.counts?.Low || 0}L)
                          </span>
                        </div>
                      </motion.div>

                      {/* Total Clauses Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">{inline('Total Clauses')}</div>
                        <div className="text-black dark:text-white text-2xl">{displayAnalysis.clausesJson?.total_clauses || 0}</div>
                      </motion.div>
                    </motion.div>

                    {/* Document Summary */}
                    <div className="mb-8">
                      <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                        {inline('Document Summary')}
                      </motion.h3>
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5"
                      >
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {displayAnalysis.summaryJson?.summary ? <TranslatedText text={displayAnalysis.summaryJson.summary} /> : inline('No summary available')}
                        </p>
                      </motion.div>
                    </div>

                    {/* Key Terms */}
                    {displayAnalysis.summaryJson?.key_terms && displayAnalysis.summaryJson.key_terms.length > 0 && (
                      <div className="mb-8">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          {inline('Key Terms')}
                        </motion.h3>
                        <motion.div variants={containerVariants} className="flex flex-wrap gap-2">
                          {displayAnalysis.summaryJson.key_terms.map((term: string, idx: number) => (
                            <motion.span
                              key={idx}
                              variants={itemVariants}
                              className="px-3 py-1.5 bg-blue-100/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-500/30"
                            >
                              <TranslatedText text={term} />
                            </motion.span>
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {/* Key Risks */}
                    <div className="mb-8">
                      <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                        {inline('Key Risks')} ({highRisks.length} {inline('High Priority')})
                      </motion.h3>
                      <motion.div variants={containerVariants} className="space-y-3">
                        {highRisks.slice(0, 5).map((risk: any) => (
                          <motion.div
                            key={risk.id}
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                          >
                            <div className="flex items-start gap-3">
                              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="text-black dark:text-white font-medium"><TranslatedText text={risk.title} /></h4>
                                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-semibold ${getRiskColor(risk.severity)}`}>
                                    {risk.severity}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm"><TranslatedText text={risk.description} /></p>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Top Clauses */}
                    <div className="mb-8">
                      <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                        Important Clauses
                      </motion.h3>
                      <motion.div variants={containerVariants} className="space-y-3">
                        {(displayAnalysis.clausesJson?.top_clauses || []).slice(0, 5).map((clause: any, idx: number) => (
                          <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-black dark:text-white font-medium flex-1"><TranslatedText text={clause.clause} /></h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm"><TranslatedText text={clause.explanation} /></p>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Critical Questions */}
                    {displayAnalysis.questionJson && displayAnalysis.questionJson.length > 0 && (
                      <div className="mb-8">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          {inline('Critical Questions')}
                        </motion.h3>
                        <motion.div variants={containerVariants} className="space-y-2">
                          {displayAnalysis.questionJson.map((question: string, idx: number) => (
                            <motion.div
                              key={idx}
                              variants={itemVariants}
                              className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 flex items-start gap-3"
                            >
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">Q{idx + 1}:</span>
                              <p className="text-gray-600 dark:text-gray-400 text-sm"><TranslatedText text={question} /></p>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </div>
                <DocumentExtrasSidebar document={document} />
              </motion.div>
            </TabsContent>

            {/* RISKS TAB */}
            <TabsContent value="risks" className="m-0 px-6" asChild>
              <motion.div
                key="risks"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col md:flex-row w-full h-auto"
              >
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto scrollbar-hide">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      {inline('Risk Analysis')}
                    </motion.h2>
                    
                    {/* Risk Summary */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5 mb-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{displayAnalysis.risksJson?.counts?.High || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{inline('High Risk')}</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{displayAnalysis.risksJson?.counts?.Medium || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{inline('Medium Risk')}</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{displayAnalysis.risksJson?.counts?.Low || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{inline('Low Risk')}</div>
                        </div>
                      </div>
                    </motion.div>

                    {/* All Risks */}
                    <motion.div variants={containerVariants} className="space-y-4">
                      {allRisks.map((risk: any) => (
                        <motion.div
                          key={risk.id}
                          variants={itemVariants}
                          className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={`p-3 rounded-lg ${
                                risk.severity === 'high'
                                  ? 'bg-red-100/50 dark:bg-red-500/20'
                                  : risk.severity === 'medium'
                                  ? 'bg-yellow-100/50 dark:bg-yellow-500/20'
                                  : 'bg-green-100/50 dark:bg-green-500/20'
                              }`}
                            >
                              <AlertTriangle
                                className={`w-6 h-6 ${
                                  risk.severity === 'high'
                                    ? 'text-red-600 dark:text-red-400'
                                    : risk.severity === 'medium'
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-green-600 dark:text-green-400'
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-black dark:text-white text-lg font-medium"><TranslatedText text={risk.title} /></h4>
                                <span className={`px-2 py-1 rounded text-xs uppercase font-semibold ${getRiskColor(risk.severity)}`}>
                                  {risk.severity} {inline('risk')}
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400"><TranslatedText text={risk.description} /></p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
                <DocumentExtrasSidebar document={document} />
              </motion.div>
            </TabsContent>

            {/* CLAUSES TAB */}
            <TabsContent value="clauses" className="m-0 px-6" asChild>
              <motion.div
                key="clauses"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col md:flex-row w-full h-auto"
              >
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto scrollbar-hide">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      {inline('Document Clauses')} ({displayAnalysis.clausesJson?.total_clauses || 0})
                    </motion.h2>
                    
                    {/* Important Clauses First */}
                    {displayAnalysis.clausesJson?.top_clauses && displayAnalysis.clausesJson.top_clauses.length > 0 && (
                      <div className="mb-6">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          ⭐ {inline('Important Clauses')}
                        </motion.h3>
                        <motion.div variants={containerVariants} className="space-y-4">
                          {displayAnalysis.clausesJson.top_clauses.map((clause: any, idx: number) => (
                            <motion.div
                              key={`top-${idx}`}
                              variants={itemVariants}
                              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-500/30 rounded-xl p-5"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-black dark:text-white text-base font-semibold flex-1"><TranslatedText text={clause.clause} /></h4>
                                <span className="px-3 py-1 rounded-full text-xs bg-blue-600 dark:bg-blue-500 text-white font-medium">
                                  {inline('Important')}
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed"><TranslatedText text={clause.explanation} /></p>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {/* All Clauses */}
                    <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                      {inline('All Clauses')}
                    </motion.h3>
                    <motion.div variants={containerVariants} className="space-y-4">
                      {(displayAnalysis.clausesJson?.all_clauses || []).map((clause: string, idx: number) => (
                        <motion.div
                          key={`all-${idx}`}
                          variants={itemVariants}
                          className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-black dark:text-white font-medium">{inline('Clause')} {idx + 1}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{inline('Section')} {idx + 1}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line"><TranslatedText text={clause} /></p>
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>
                </div>
                <DocumentExtrasSidebar document={document} />
              </motion.div>
            </TabsContent>

            {/* RULEBOOK TAB */}
            <TabsContent value="rulebook" className="m-0 px-6" asChild>
              <motion.div
                key="rulebook"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col md:flex-row w-full h-auto"
              >
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto scrollbar-hide">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      {inline('Legal Rulebook')}
                    </motion.h2>
                    
                    <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
                      {inline('Comprehensive explanations of key legal terms found in this agreement, referenced from authoritative legal documents and rulebooks.')}
                    </motion.p>

                    {/* Loading State */}
                    {rulebookLoading && (
                      <motion.div
                        variants={itemVariants}
                        className="flex items-center justify-center py-16"
                      >
                        <div className="text-center max-w-md">
                          {/* Animated Book Icon */}
                          <div className="relative w-24 h-24 mx-auto mb-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl animate-pulse"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-white animate-bounce" />
                            </div>
                          </div>
                          
                          {/* Loading Text */}
                          <h3 className="text-black dark:text-white text-xl font-semibold mb-2">
                            {inline('Loading Legal Terms')}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            {inline('Fetching explanations from legal rulebooks...')}
                          </p>
                          
                          {/* Progress Dots */}
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Error State */}
                    {rulebookError && !rulebookLoading && (
                      <motion.div
                        variants={itemVariants}
                        className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-500/30 rounded-xl p-8 text-center max-w-2xl mx-auto"
                      >
                        <div className="bg-red-100 dark:bg-red-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
                        </div>
                        <h3 className="text-red-800 dark:text-red-300 text-xl font-semibold mb-2">
                          {inline('Unable to Load Rulebook')}
                        </h3>
                        <p className="text-red-700 dark:text-red-400 text-lg mb-4">{rulebookError}</p>
                        <p className="text-red-600 dark:text-red-500 text-sm">
                          {inline('If the problem continues, please contact support or try refreshing the page.')}
                        </p>
                      </motion.div>
                    )}

                    {/* Success Message with Button (First Time Only) */}
                    {!rulebookLoading && !rulebookError && rulebookFetched && !showRulebookContent && translatedRulebookTerms && translatedRulebookTerms.length > 0 && (
                      <motion.div
                        key="success-message"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-500/30 rounded-xl p-8 text-center max-w-2xl mx-auto"
                      >
                        <div className="bg-green-100 dark:bg-green-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                          <BookOpen className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-green-800 dark:text-green-300 text-2xl font-bold mb-2">
                          {inline('Rulebook Successfully Loaded!')}
                        </h3>
                        <p className="text-green-700 dark:text-green-400 text-lg mb-6">
                          {inline('We found')} <span className="font-bold">{translatedRulebookTerms.length}</span> {inline('legal terms with detailed explanations')}
                        </p>
                        <Button
                          onClick={() => {
                            console.log('Button clicked - showing content');
                            setShowRulebookContent(true);
                          }}
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-6 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          <BookOpen className="w-5 h-5 mr-2" />
                          {inline('View Legal Terms')}
                        </Button>
                      </motion.div>
                    )}

                    {/* Rulebook Terms */}
                    {!rulebookLoading && !rulebookError && showRulebookContent && translatedRulebookTerms && translatedRulebookTerms.length > 0 && (
                      <motion.div
                        key="rulebook-content"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        {/* Terms Count */}
                        <div className="mb-6">
                          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-500/30 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-black dark:text-white font-semibold text-lg">
                                  {translatedRulebookTerms.length} {inline('Legal Terms Explained')}
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                                  {inline('Based on authoritative legal references and rulebooks')}
                                </p>
                              </div>
                              <BookOpen className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                          </div>
                        </div>

                        {/* Terms List */}
                        <div className="space-y-6">
                          {translatedRulebookTerms.map((term, idx) => (
                            <div
                              key={`${document.id}-term-${idx}`}
                              className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-6 hover:shadow-lg dark:hover:shadow-blue-500/10 transition-shadow duration-300"
                            >
                              {/* Term Header */}
                              <div className="flex items-start gap-4 mb-4">
                                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                                  {idx + 1}
                                </div>
                                <div className="flex-1">
                                  <h3 className="text-black dark:text-white text-xl font-bold mb-1">
                                    {term.term}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-medium">
                                      {inline('Legal Term')}
                                    </span>
                                    <span className="px-2 py-1 rounded-md bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 text-xs font-medium">
                                      {inline('Rulebook Reference')}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Explanation */}
                              <div className="pl-14">
                                <div className="bg-gray-50 dark:bg-[#141829]/50 rounded-lg p-4 border-l-4 border-blue-500">
                                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                    {term.explanation}
                                  </p>
                                </div>
                              </div>

                              {/* Footer Info */}
                              <div className="pl-14 mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <BookOpen className="w-3 h-3" />
                                <span>{inline('Referenced from legal documentation and case law')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
                <DocumentExtrasSidebar document={document} />
              </motion.div>
            </TabsContent>

            {/* CHAT TAB */}
            <TabsContent value="chat" className="m-0 px-6" asChild>
              <motion.div
                key="chat"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="flex flex-col md:flex-row w-full h-auto"
              >
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto scrollbar-hide">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      {inline('Chat with the document')}
                    </motion.h2>
                    <ChatInterface
                      documentId={document.id}
                      documentName={document.name}
                    />
                  </motion.div>
                </div>
                <DocumentExtrasSidebar document={document} />
              </motion.div>
            </TabsContent>
          </div>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
}

export { DocumentView };