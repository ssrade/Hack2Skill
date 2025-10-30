"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Scale,
  Brain,
  Shield,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

import {
  summarizeDocument,
  fetchRisks,
  getTotalRiskCount,
  getRisksByLevel,
  getTotalClauses,
  getTopClauses,
  fetchClauses
} from "@/api/documentApi";

interface RiskItem {
  level: "high" | "medium" | "low";
  description: string;
  clause: string;
}

interface KeyClause {
  title: string;
  summary: string;
}

interface DocumentSummaryProps {
  documentName: string;
  isAnalyzing?: boolean;
}

const DocumentSummary = ({ documentName, isAnalyzing }: DocumentSummaryProps) => {
  const [risks, setRisks] = useState<RiskItem[]>([]);
  const [keyClauses, setKeyClauses] = useState<KeyClause[]>([]);
  const [totalClauses, setTotalClauses] = useState(0);
  const [totalRiskCount, setTotalRiskCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Collapse states
  const [showAllRisks, setShowAllRisks] = useState(false);
  const [showAllClauses, setShowAllClauses] = useState(false);

  // Display limits
  const RISK_DISPLAY_LIMIT = 3;
  const CLAUSE_DISPLAY_LIMIT = 2;

  useEffect(() => {
    if (isAnalyzing) {
      setLoading(true);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const clauseResponse = await fetchClauses();
        console.log("Clause response:", clauseResponse);

        if (clauseResponse) {
          const clausesData = clauseResponse;

          if (clausesData) {
            try {
              const total = getTotalClauses(clausesData);
              setTotalClauses(total);
            } catch (e) {
              setTotalClauses(clausesData.all_clauses?.length || 0);
            }

            try {
              const top = getTopClauses(clausesData);
              setKeyClauses(
                top.map((c: any) => ({
                  title: c.clause,
                  summary: c.explanation
                }))
              );
            } catch (e) {
              setKeyClauses(
                clausesData.topClauses.map((clause: any) => ({
                  title: clause.clause,
                  summary: clause.explanation
                }))
              );
            }
          } else {
            setTotalClauses(clausesData.totalClauses || 0);
            setKeyClauses(
              clausesData.topClauses.map((clause: any) => ({
                title: clause.clause,
                summary: clause.explanation
              }))
            );
          }
        }

        const riskResponse = await fetchRisks();
        console.log("Risk response:", riskResponse);
        
        if (riskResponse) {
          setTotalRiskCount(getTotalRiskCount(riskResponse));

          const risksByLevel = getRisksByLevel(riskResponse);
          const processedRisks: RiskItem[] = [
            ...risksByLevel.high.map((clause: string) => ({
              level: "high" as const,
              description: clause,
              clause: clause.split(":")[0] || "Unknown Clause",
            })),
            ...risksByLevel.medium.map((clause: string) => ({
              level: "medium" as const,
              description: clause,
              clause: clause.split(":")[0] || "Unknown Clause",
            })),
            ...risksByLevel.low.map((clause: string) => ({
              level: "low" as const,
              description: clause,
              clause: clause.split(":")[0] || "Unknown Clause",
            })),
          ];
          setRisks(processedRisks);
        }
      } catch (error) {
        console.error("Error fetching document data:", error);
        setTotalClauses(0);
        setTotalRiskCount(0);
        setRisks([]);
        setKeyClauses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAnalyzing]);

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "high":
        return <AlertTriangle className="w-4 h-4" />;
      case "medium":
        return <Clock className="w-4 h-4" />;
      case "low":
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  if (isAnalyzing || loading) {
    return (
      <div className="animate-in fade-in-50 duration-700">
        <Card className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-2xl rounded-3xl relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
          <CardContent className="text-center py-12 relative z-10">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-transparent rounded-full animate-spin bg-gradient-to-r from-blue-400 to-indigo-600 [mask:linear-gradient(white,transparent)]"></div>
              <div
                className="absolute inset-2 border-2 border-transparent rounded-full animate-spin bg-gradient-to-r from-indigo-400 to-purple-600 [mask:linear-gradient(white,transparent)]"
                style={{ animationDirection: "reverse", animationDuration: "2s" }}
              ></div>
              <div className="absolute inset-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-400/50">
                <FileText className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-100 mb-3 flex items-center justify-center gap-3">
              <Brain className="w-6 h-6 text-indigo-400 animate-pulse" />
              {isAnalyzing ? "AI Processing Document" : "Loading Analysis"}
            </h3>
            <p className="text-slate-300 mb-6 font-medium text-lg">
              {isAnalyzing ? "Analyzing" : "Processing"} <span className="font-bold bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">{documentName}</span>
            </p>
            <div className="px-16 relative">
              <Progress value={isAnalyzing ? 45 : 85} className="h-4 bg-slate-800 rounded-full shadow-inner" />
              <div
                className="absolute top-0 left-0 h-4 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-400/30"
                style={{ width: isAnalyzing ? "45%" : "85%" }}
              ></div>
            </div>
            <p className="text-sm text-indigo-400 mt-3 font-semibold flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
              {isAnalyzing ? "45% Complete" : "85% Complete"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayedRisks = showAllRisks ? risks : risks.slice(0, RISK_DISPLAY_LIMIT);
  const displayedClauses = showAllClauses ? keyClauses : keyClauses.slice(0, CLAUSE_DISPLAY_LIMIT);

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-700">
      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { icon: FileText, label: "Total Clauses", value: totalClauses, color: "blue" },
          { icon: Shield, label: "Risk Areas", value: totalRiskCount, color: "amber" },
        ].map((stat, i) => (
          <Card
            key={i}
            className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-lg hover:scale-[1.02] transition-all duration-300 rounded-2xl group cursor-pointer relative overflow-hidden"
          >
            <CardContent className="p-4 text-center relative z-10">
              <div
                className={`w-10 h-10 bg-gradient-to-br ${
                  stat.color === "blue" ? "from-blue-500 to-blue-600 shadow-blue-500/30" : "from-amber-500 to-amber-600 shadow-amber-500/30"
                } rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg`}
              >
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-slate-300 font-semibold text-sm">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Risk Assessment Section */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-2xl rounded-2xl relative overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-100">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-red-500/30">
              <AlertTriangle className="w-4 h-4 text-white" />
            </div>
            Risk Assessment
            {risks.length > RISK_DISPLAY_LIMIT && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {risks.length} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {risks.length === 0 ? (
            <p className="text-slate-400 text-sm">No risks detected.</p>
          ) : (
            <>
              {displayedRisks.map((risk, index) => (
                <div
                  key={index}
                  className={`group flex items-start gap-3 p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] relative overflow-hidden ${
                    risk.level === "high"
                      ? "bg-red-500/10 border-red-500/40"
                      : risk.level === "medium"
                      ? "bg-amber-500/10 border-amber-500/40"
                      : "bg-emerald-500/10 border-emerald-500/40"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center shadow-lg z-10 ${
                      risk.level === "high"
                        ? "bg-gradient-to-br from-red-500 to-amber-600 text-white"
                        : risk.level === "medium"
                        ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white"
                        : "bg-gradient-to-br from-emerald-500 to-green-600 text-white"
                    }`}
                  >
                    {getRiskIcon(risk.level)}
                  </div>
                  <div className="flex-1 min-w-0 z-10">
                    <Badge
                      className={`font-semibold text-xs px-3 py-1 rounded-full mb-2 ${
                        risk.level === "high"
                          ? "bg-gradient-to-r from-red-600 to-amber-600 text-white"
                          : risk.level === "medium"
                          ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white"
                          : "bg-gradient-to-r from-emerald-600 to-green-600 text-white"
                      }`}
                    >
                      {risk.level.toUpperCase()} RISK
                    </Badge>
                    <p className="text-sm font-semibold text-slate-100 mb-1">{risk.description}</p>
                    <p className="text-xs text-slate-400 bg-slate-800/80 px-2 py-1 rounded-md inline-block font-mono border border-white/10 shadow-sm">
                      {risk.clause}
                    </p>
                  </div>
                </div>
              ))}
              
              {risks.length > RISK_DISPLAY_LIMIT && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllRisks(!showAllRisks)}
                  className="w-full mt-3 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                >
                  {showAllRisks ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less ({risks.length - RISK_DISPLAY_LIMIT} hidden)
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All {risks.length - RISK_DISPLAY_LIMIT} More Risks
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Key Clauses Section */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-950 to-black border border-white/10 shadow-2xl rounded-2xl relative overflow-hidden">
        <CardHeader className="pb-3 border-b border-white/10">
          <CardTitle className="flex items-center gap-3 text-xl font-bold text-slate-100">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Scale className="w-4 h-4 text-white" />
            </div>
            Key Clauses Explained
            {keyClauses.length > CLAUSE_DISPLAY_LIMIT && (
              <Badge variant="secondary" className="ml-auto text-xs">
                {keyClauses.length} total
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-4">
          {keyClauses.length === 0 ? (
            <p className="text-slate-400 text-sm">No key clauses identified.</p>
          ) : (
            <>
              {displayedClauses.map((clause, index) => (
                <div
                  key={index}
                  className="space-y-2 p-4 rounded-xl bg-slate-800/70 border border-white/10 hover:border-indigo-400/50 transition-all duration-300 hover:shadow-lg"
                >
                  <h4 className="font-semibold text-indigo-300 text-base bg-gradient-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent">
                    {clause.title}
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">{clause.summary}</p>
                </div>
              ))}
              
              {keyClauses.length > CLAUSE_DISPLAY_LIMIT && (
                <Button
                  variant="ghost"
                  onClick={() => setShowAllClauses(!showAllClauses)}
                  className="w-full mt-3 text-slate-300 hover:text-slate-100 hover:bg-slate-800/50"
                >
                  {showAllClauses ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Show Less ({keyClauses.length - CLAUSE_DISPLAY_LIMIT} hidden)
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Show All {keyClauses.length - CLAUSE_DISPLAY_LIMIT} More Clauses
                    </>
                  )}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { DocumentSummary };