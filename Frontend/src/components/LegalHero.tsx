import { Scale, Brain, Shield, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const LegalHero = () => {
  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-Powered Analysis",
      description: "Advanced language models trained on legal documents"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Risk Detection",
      description: "Identify potential legal and financial risks instantly"
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: "Plain English",
      description: "Complex legal jargon translated to clear explanations"
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-95"></div>
      
      {/* Content */}
      <div className="relative px-6 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <Badge className="mb-6 bg-primary-light/20 text-primary-light border-primary-light/30 hover:bg-primary-light/30">
            <Scale className="w-3 h-3 mr-1" />
            Legal AI Assistant
          </Badge>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-6xl font-bold text-primary-foreground mb-6 tracking-tight">
            Demystify Legal Documents with{" "}
            <span className="bg-gradient-to-r from-primary-light to-white bg-clip-text text-transparent">
              AI Intelligence
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-3xl mx-auto leading-relaxed">
            Upload any legal document and get instant summaries, risk assessments, and plain-English explanations. 
            Protect yourself from legal and financial risks with AI-powered analysis.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3"
            >
              Start Analyzing Documents
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 py-3"
            >
              Watch Demo
            </Button>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-xl p-6 hover:bg-primary-foreground/15 transition-all duration-300"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-light/20 flex items-center justify-center text-primary-light">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-primary-foreground">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm text-primary-foreground/70">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="mt-16 pt-8 border-t border-primary-foreground/20">
            <p className="text-sm text-primary-foreground/60 mb-4">
              Trusted by legal professionals and individuals worldwide
            </p>
            <div className="flex justify-center items-center gap-8 text-primary-foreground/40">
              <div className="text-xs">🔒 Bank-level Security</div>
              <div className="text-xs">⚡ Instant Analysis</div>
              <div className="text-xs">📊 95% Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};