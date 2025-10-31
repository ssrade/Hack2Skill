import type { Document, Message } from './MainApp';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, FileCheck, MessageSquare, TrendingUp, ChevronDown } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { Progress } from './ui/progress';
import { DocumentExtrasSidebar } from './DocumentExtrasSidebar';
import { useState, useEffect } from 'react';
import { getAgreementAnalysis } from '../api/analysisApi';
import { Button } from './ui/button';
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

function DocumentView({ document, onSendMessage, onToggleMobileSidebar }: DocumentViewProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [analysis, setAnalysis] = useState<any>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!document) return;
    setAnalysisLoading(true);
    setAnalysisError(null);
    getAgreementAnalysis(document.id)
      .then((data) => setAnalysis(data))
      .catch((err) => setAnalysisError('Failed to load analysis'))
      .finally(() => setAnalysisLoading(false));
  }, [document]);

  if (!document) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <FileCheck className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-gray-700 dark:text-gray-400 text-lg mb-2">No Document Selected</h3>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Select a document from the sidebar to view analysis</p>
        </div>
      </div>
    );
  }

  if (analysisLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h3 className="text-gray-700 dark:text-gray-400 text-lg mb-2">Loading analysis...</h3>
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

  if (!analysis) {
    return null;
  }

  // Calculate risk score based on risk counts
  const calculateRiskScore = () => {
    const { Low = 0, Medium = 0, High = 0 } = analysis.risksJson?.counts || {};
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
    const risksJson = analysis.risksJson;

    if (!risksJson) return risks;

    // Process High risks
    (risksJson.top_clauses?.High || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `high-${idx}`,
        title: `High Risk ${idx + 1}`,
        description: description,
        severity: 'high' as const
      });
    });

    // Process Medium risks
    (risksJson.top_clauses?.Medium || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `medium-${idx}`,
        title: `Medium Risk ${idx + 1}`,
        description: description,
        severity: 'medium' as const
      });
    });

    // Process Low risks
    (risksJson.top_clauses?.Low || []).forEach((description: string, idx: number) => {
      risks.push({
        id: `low-${idx}`,
        title: `Low Risk ${idx + 1}`,
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
    (analysis.risksJson?.counts?.High || 0) +
    (analysis.risksJson?.counts?.Medium || 0) +
    (analysis.risksJson?.counts?.Low || 0);

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
                    {activeTab === 'chat' && <MessageSquare className="w-4 h-4" />}
                    {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-fit absolute -left-14 bg-white/80 dark:bg-transparent backdrop-blur-3xl border-gray-300 dark:border-gray-700 text-black dark:text-white">
                <DropdownMenuItem onSelect={() => setActiveTab('overview')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <TrendingUp className="w-4 h-4 mr-2" /> Overview
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('risks')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <AlertTriangle className="w-4 h-4 mr-2" /> Risks
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('clauses')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <FileCheck className="w-4 h-4 mr-2" /> Clauses
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setActiveTab('chat')} className="focus:bg-gray-200 dark:focus:bg-gray-700 cursor-pointer">
                  <MessageSquare className="w-4 h-4 mr-2" /> Chat
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
              <TrendingUp className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger
              value="risks"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <AlertTriangle className="w-4 h-4 mr-2" /> Risks
            </TabsTrigger>
            <TabsTrigger
              value="clauses"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <FileCheck className="w-4 h-4 mr-2" /> Clauses
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="data-[state=active]:bg-blue-100 mt-2 dark:bg-transparent dark:data-[state=active]:bg-gradient-to-r dark:data-[state=active]:from-blue-600/20 dark:data-[state=active]:to-purple-600/20 data-[state=active]:text-blue-700 dark:data-[state=active]:text-white text-gray-600 dark:text-gray-400"
            >
              <MessageSquare className="w-4 h-4 mr-2" /> Chat
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
                <div className="h-auto md:h-[88vh] w-full md:w-[70%] md:pr-4 pt-1 overflow-y-auto">
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="md:pr-3 pt-1">
                    {/* Upload Date */}
                    <motion.p variants={itemVariants} className="text-gray-600 dark:text-gray-400 mb-6">
                      Uploaded on {formatDate(analysis.uploadDate)}
                    </motion.p>

                    {/* Stats Cards */}
                    <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      {/* Risk Score Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Risk Score</div>
                        <div className="text-black dark:text-white text-2xl mb-2">{riskScore}/100</div>
                        <Progress value={riskScore} className="h-2" />
                      </motion.div>

                      {/* Total Risks Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Risks</div>
                        <div className="text-black dark:text-white text-2xl flex items-center gap-2">
                          {totalRisks}
                          <span className="text-sm text-gray-500">
                            ({analysis.risksJson?.counts?.High || 0}H, {analysis.risksJson?.counts?.Medium || 0}M, {analysis.risksJson?.counts?.Low || 0}L)
                          </span>
                        </div>
                      </motion.div>

                      {/* Total Clauses Card */}
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                      >
                        <div className="text-gray-600 dark:text-gray-400 text-sm mb-2">Total Clauses</div>
                        <div className="text-black dark:text-white text-2xl">{analysis.clausesJson?.total_clauses || 0}</div>
                      </motion.div>
                    </motion.div>

                    {/* Document Summary */}
                    <div className="mb-8">
                      <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                        Document Summary
                      </motion.h3>
                      <motion.div
                        variants={itemVariants}
                        className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5"
                      >
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {analysis.summaryJson?.summary || 'No summary available'}
                        </p>
                      </motion.div>
                    </div>

                    {/* Key Terms */}
                    {analysis.summaryJson?.key_terms && analysis.summaryJson.key_terms.length > 0 && (
                      <div className="mb-8">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          Key Terms
                        </motion.h3>
                        <motion.div variants={containerVariants} className="flex flex-wrap gap-2">
                          {analysis.summaryJson.key_terms.map((term: string, idx: number) => (
                            <motion.span
                              key={idx}
                              variants={itemVariants}
                              className="px-3 py-1.5 bg-blue-100/50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm border border-blue-200 dark:border-blue-500/30"
                            >
                              {term}
                            </motion.span>
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {/* Key Risks */}
                    <div className="mb-8">
                      <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                        Key Risks ({highRisks.length} High Priority)
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
                                  <h4 className="text-black dark:text-white font-medium">{risk.title}</h4>
                                  <span className={`px-2 py-0.5 rounded text-xs uppercase font-semibold ${getRiskColor(risk.severity)}`}>
                                    {risk.severity}
                                  </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm">{risk.description}</p>
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
                        {(analysis.clausesJson?.top_clauses || []).slice(0, 5).map((clause: any, idx: number) => (
                          <motion.div
                            key={idx}
                            variants={itemVariants}
                            className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-black dark:text-white font-medium flex-1">{clause.clause}</h4>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{clause.explanation}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>

                    {/* Critical Questions */}
                    {analysis.questionJson && analysis.questionJson.length > 0 && (
                      <div className="mb-8">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          Critical Questions
                        </motion.h3>
                        <motion.div variants={containerVariants} className="space-y-2">
                          {analysis.questionJson.map((question: string, idx: number) => (
                            <motion.div
                              key={idx}
                              variants={itemVariants}
                              className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-4 flex items-start gap-3"
                            >
                              <span className="text-blue-600 dark:text-blue-400 font-semibold text-sm flex-shrink-0">Q{idx + 1}:</span>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{question}</p>
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
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      Risk Analysis
                    </motion.h2>
                    
                    {/* Risk Summary */}
                    <motion.div variants={itemVariants} className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5 mb-6">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">{analysis.risksJson?.counts?.High || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">High Risk</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{analysis.risksJson?.counts?.Medium || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Medium Risk</div>
                        </div>
                        <div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">{analysis.risksJson?.counts?.Low || 0}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Low Risk</div>
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
                                <h4 className="text-black dark:text-white text-lg font-medium">{risk.title}</h4>
                                <span className={`px-2 py-1 rounded text-xs uppercase font-semibold ${getRiskColor(risk.severity)}`}>
                                  {risk.severity} risk
                                </span>
                              </div>
                              <p className="text-gray-600 dark:text-gray-400">{risk.description}</p>
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
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      Document Clauses ({analysis.clausesJson?.total_clauses || 0})
                    </motion.h2>
                    
                    {/* Important Clauses First */}
                    {analysis.clausesJson?.top_clauses && analysis.clausesJson.top_clauses.length > 0 && (
                      <div className="mb-6">
                        <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                          ⭐ Important Clauses
                        </motion.h3>
                        <motion.div variants={containerVariants} className="space-y-4">
                          {analysis.clausesJson.top_clauses.map((clause: any, idx: number) => (
                            <motion.div
                              key={`top-${idx}`}
                              variants={itemVariants}
                              className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200 dark:border-blue-500/30 rounded-xl p-5"
                            >
                              <div className="flex items-start justify-between mb-3">
                                <h4 className="text-black dark:text-white text-base font-semibold flex-1">{clause.clause}</h4>
                                <span className="px-3 py-1 rounded-full text-xs bg-blue-600 dark:bg-blue-500 text-white font-medium">
                                  Important
                                </span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{clause.explanation}</p>
                            </motion.div>
                          ))}
                        </motion.div>
                      </div>
                    )}

                    {/* All Clauses */}
                    <motion.h3 variants={itemVariants} className="text-black dark:text-white text-lg mb-4">
                      All Clauses
                    </motion.h3>
                    <motion.div variants={containerVariants} className="space-y-4">
                      {(analysis.clausesJson?.all_clauses || []).map((clause: string, idx: number) => (
                        <motion.div
                          key={`all-${idx}`}
                          variants={itemVariants}
                          className="bg-white dark:bg-[#1a1f3a]/50 border border-gray-200 dark:border-gray-800/50 rounded-xl p-5"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-black dark:text-white font-medium">Clause {idx + 1}</h4>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Section {idx + 1}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{clause}</p>
                        </motion.div>
                      ))}
                    </motion.div>
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
                <div className="flex-1 h-auto md:h-[87vh] w-full pt-2 md:pr-5 overflow-y-auto">
                  <motion.div className="max-w-full" variants={containerVariants} initial="hidden" animate="visible">
                    <motion.h2 variants={itemVariants} className="text-black dark:text-white text-2xl mb-4">
                      Chat with the document
                    </motion.h2>
                    <ChatInterface
                      messages={(analysis.chatJson?.messages || []) as Message[]}
                      onSend={(messageText: string) => onSendMessage(document.id, messageText)}
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