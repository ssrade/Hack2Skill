import { AlertTriangle, ExternalLink, Shield, FileText, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { motion } from "framer-motion";

export const LegalDisclaimer = () => {
  return (
    <motion.div
      className="space-y-6 mt-10"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-950 to-black shadow-xl"
        role="alert"
        aria-label="Legal Disclaimer"
      >
        {/* Background shimmer */}
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 absolute top-10 left-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md shadow-indigo-400/30 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div className="space-y-3  relative top-0 left-20 m-3 p-6">
            {/* Replaced AlertTitle with h5 */}
            <h5 className="font-bold text-lg bg-gradient-to-r from-indigo-300 to-purple-400 bg-clip-text text-transparent">
              Important Legal Disclaimer
            </h5>

            {/* Replaced AlertDescription with p */}
            <p className="text-sm max-w-[50vw] text-slate-300">
              <span className="font-semibold  text-slate-100">This AI assistant provides <span className="underline">informational analysis only</span></span>
              {" "}and does <span className="font-semibold text-slate-100 underline">not constitute legal advice</span>.
              Always consult a qualified attorney before making legal decisions.
              The analysis may contain errors or omissions.
            </p>

            {/* Replaced Badge with div, adding inline-flex and items-center to mimic badge behavior */}
            <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-0 shadow-sm shadow-indigo-400/40 text-xs px-2.5 py-0.5 rounded-full">
              <Shield className="w-3 h-3 mr-1" />
              For Informational Purposes Only
            </div>
          </div>
        </div>
      </div>
      <motion.div
        className="flex flex-wrap gap-4 justify-center text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {[
          { label: "Privacy Policy", href: "/privacy", icon: <Shield className="w-3 h-3" /> },
          { label: "Terms of Service", href: "/terms", icon: <FileText className="w-3 h-3" /> },
          { label: "Contact Legal Team", href: "/contact-legal", icon: <Mail className="w-3 h-3" /> },
        ].map((link, index) => (
          <motion.div
            key={link.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (index * 0.1), duration: 0.3 }}
          >
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs hover:underline flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors duration-200 group"
              asChild
            >
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors duration-200">
                  {link.icon}
                </span>
                {link.label}
                <ExternalLink className="w-3 h-3 ml-1 text-slate-500 group-hover:text-slate-300 transition-colors duration-200" />
              </a>
            </Button>
          </motion.div>
        ))}
      </motion.div>

      {/* Additional informational note */}
      <motion.div
        className="text-center text-xs text-slate-400 max-w-md mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
      >
        This tool is designed to assist with document analysis but should not replace professional legal counsel.
      </motion.div>
    </motion.div>
  );
};