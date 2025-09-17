import { AlertTriangle, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export const LegalDisclaimer = () => {
  return (
    <div className="space-y-4 mt-8">
      <Alert className="border-warning/50 bg-warning/5">
        <AlertTriangle className="w-4 h-4 text-warning" />
        <AlertDescription className="text-sm">
          <strong className="font-semibold">Important Legal Disclaimer:</strong> This AI assistant provides informational analysis only and does not constitute legal advice. 
          Always consult with a qualified attorney for legal decisions. The analysis may contain errors or omissions.
        </AlertDescription>
      </Alert>

      <div className="flex flex-wrap gap-4 justify-center text-sm text-muted-foreground">
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Privacy Policy
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Terms of Service
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
        <Button variant="link" size="sm" className="h-auto p-0 text-xs">
          Contact Legal Team
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </div>
    </div>
  );
};