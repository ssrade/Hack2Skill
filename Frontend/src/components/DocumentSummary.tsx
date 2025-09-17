import { FileText, AlertTriangle, CheckCircle2, Clock, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface RiskItem {
  level: 'high' | 'medium' | 'low';
  description: string;
  clause: string;
}

interface KeyClause {
  title: string;
  summary: string;
  page: number;
  confidence: 'high' | 'medium' | 'low';
}

interface DocumentSummaryProps {
  documentName?: string;
  isAnalyzing?: boolean;
}

export const DocumentSummary = ({ documentName, isAnalyzing }: DocumentSummaryProps) => {
  const risks: RiskItem[] = [
    {
      level: 'high',
      description: 'Broad indemnification clause with unlimited liability',
      clause: 'Section 8.3 - Indemnification'
    },
    {
      level: 'medium',
      description: 'Non-compete period may be excessive for industry standards',
      clause: 'Section 12.1 - Non-Competition'
    },
    {
      level: 'low',
      description: 'Standard termination notice period',
      clause: 'Section 15.2 - Termination'
    }
  ];

  const keyClauses: KeyClause[] = [
    {
      title: 'Payment Terms',
      summary: 'Net 30 payment terms with 1.5% monthly late fee. Automatic renewal unless cancelled 60 days prior.',
      page: 3,
      confidence: 'high'
    },
    {
      title: 'Intellectual Property',
      summary: 'All work product becomes company property. Employee waives moral rights and assigns all IP.',
      page: 7,
      confidence: 'high'
    },
    {
      title: 'Liability Limitations',
      summary: 'Company liability capped at contract value except for gross negligence or willful misconduct.',
      page: 12,
      confidence: 'medium'
    }
  ];

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'high': return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case 'medium': return <Clock className="w-4 h-4 text-warning" />;
      case 'low': return <CheckCircle2 className="w-4 h-4 text-success" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'high': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium': return 'bg-warning/10 text-warning-foreground border-warning/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return '';
    }
  };

  const getConfidenceBadgeClass = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'confidence-high';
      case 'medium': return 'confidence-medium';
      case 'low': return 'confidence-low';
      default: return 'confidence-high';
    }
  };

  if (isAnalyzing) {
    return (
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary animate-pulse" />
            Analyzing Document
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing {documentName}...</p>
            <Progress value={65} className="w-full mt-4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Overview */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Document Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-primary">15</div>
              <div className="text-sm text-muted-foreground">Total Clauses</div>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-warning">3</div>
              <div className="text-sm text-muted-foreground">Risk Areas</div>
            </div>
            <div className="text-center p-4 bg-gradient-card rounded-lg">
              <div className="text-2xl font-bold text-success">92%</div>
              <div className="text-sm text-muted-foreground">Analysis Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Assessment */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border bg-card/50">
                {getRiskIcon(risk.level)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={getRiskBadgeClass(risk.level)} variant="outline">
                      {risk.level} risk
                    </Badge>
                  </div>
                  <p className="text-sm font-medium text-foreground">{risk.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">{risk.clause}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Key Clauses */}
      <Card className="hover-lift">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Key Clauses Explained
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {keyClauses.map((clause, index) => (
              <div key={index}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">{clause.title}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getConfidenceBadgeClass(clause.confidence)} variant="outline">
                        {clause.confidence}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        Page {clause.page}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground legal-doc-text">
                    {clause.summary}
                  </p>
                </div>
                {index < keyClauses.length - 1 && <Separator className="mt-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};