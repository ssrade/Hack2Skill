import { Scale, Brain, Shield, FileCheck, Zap, Sparkles, Rocket, ArrowRight, Play, Globe, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export const LegalHero = () => {
  const features = [
    {
      icon: <Brain className="w-5 h-5" />,
      title: "AI-Powered Analysis",
      description: "Advanced language models trained on millions of legal documents"
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Risk Detection",
      description: "Identify potential legal and financial risks in seconds"
    },
    {
      icon: <FileCheck className="w-5 h-5" />,
      title: "Plain English",
      description: "Complex legal jargon translated to clear, actionable insights"
    },
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Lightning Fast",
      description: "Analyze complex documents in under 30 seconds"
    }
  ];

  // Scroll to document upload section
  const scrollToUpload = () => {
    const uploadSection = document.getElementById("document-upload-section");
    if (uploadSection) {
      uploadSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black min-h-[80vh] flex items-center justify-center py-10">
      {/* Bright gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 via-purple-600/10 to-cyan-500/10"></div>

      {/* Floating soft glow */}
      <div className="absolute -top-20 -left-20 w-56 h-56 bg-gradient-to-br from-blue-500/20 to-indigo-500/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-gradient-to-br from-purple-500/20 to-pink-500/10 rounded-full blur-3xl"></div>

      {/* Content */}
      <div className="relative px-4 sm:px-6 w-full max-w-6xl mx-auto z-10">
        <div className="text-center">
          {/* Logo + name */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center mb-10"
          >
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                <Scale className="w-7 h-7 text-white" />
              </div>
              <h4 className="text-3xl sm:text-6xl lg:text-6xl font-extrabold bg-gradient-to-r from-blue-300 via-indigo-200 to-purple-300 bg-clip-text text-transparent leading-tight">
                DocuLex AI
              </h4>
            </div>
            <Badge className="bg-gray-800/60 text-blue-100 border border-blue-400/30 px-4 py-1.5 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2 text-blue-300" />
              AI-Powered Legal Intelligence
            </Badge>
          </motion.div>

          {/* Heading */}
          <motion.h3 
            className="text-4xl sm:text-6xl lg:text-5xl font-bold text-white mb-6 tracking-tight leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Demystify Legal Documents
            <span className="block mt-3 bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
              With AI Precision
            </span>
          </motion.h3>

          {/* Subtitle */}
          <motion.p 
            className="text-lg sm:text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed font-light"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            Transform complex legal language into clear, actionable insights. 
            <span className="text-white font-medium"> Protect your interests</span> with AI-powered analysis that identifies risks and opportunities in seconds.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <Button 
  size="lg" 
  onClick={scrollToUpload}
  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg transition-all duration-300 px-7 py-3.5 rounded-lg group text-lg font-semibold"
>
  <Rocket className="w-5 h-5 mr-2 group-hover:rotate-45 transition-transform duration-300" />
  Start Free Analysis
  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
</Button>

<Button 
  size="lg" 
  className="bg-gradient-to-r from-blue-700/80 via-purple-700/70 to-blue-700/80 text-white hover:from-blue-600/80 hover:to-purple-600/80 shadow-md transition-all duration-300 px-7 py-3.5 rounded-lg group text-lg font-semibold"
>
  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
  Watch Demo
</Button>

          </motion.div>

          {/* Trust badges */}
          <motion.div 
            className="flex items-center justify-center gap-4 mb-12 text-gray-400 text-sm flex-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="flex items-center gap-2 bg-gray-800/40 px-3 py-1.5 rounded-full">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/40 px-3 py-1.5 rounded-full">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>10,000+ professionals</span>
            </div>
            <div className="flex items-center gap-2 bg-gray-800/40 px-3 py-1.5 rounded-full">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>Bank-level security</span>
            </div>
          </motion.div>

          {/* Features grid */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 mt-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            {features.map((feature, index) => (
              <motion.div 
                key={index} 
                className="bg-gray-800/30 backdrop-blur-md border border-gray-700/30 rounded-xl p-6 hover:bg-gray-800/40 transition-all duration-300 group cursor-pointer"
                whileHover={{ y: -3 }}
              >
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center text-blue-300 group-hover:text-blue-200 transition-colors duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-semibold text-white text-lg">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};
