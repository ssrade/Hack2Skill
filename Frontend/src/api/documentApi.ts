import apiClient from "./index";

// Upload PDF with doc_type (scanned / electronic)
export const uploadDocument = async (file: File, docType: "scanned" | "electronic") => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("doc_type", docType);

  const response = await apiClient.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

// Summarize document
export const summarizeDocument = async () => {
  const response = await apiClient.post("/summarize");

  // Process response to include total clauses and top clauses
  const data = response.data;
  const clauses = data?.clauses_json?.top_clauses || [];
  const totalClauses = data?.clauses_json?.all_clauses?.length || clauses.length;

  const topClauses = clauses.map((clause: any) => ({
    clause: clause.clause || "Unknown Clause",
    explanation: clause.explanation || "No explanation available",
  }));

  return {
    totalClauses,
    topClauses,
    raw: data,
  };
};


export const fetchClauses = async () => {
  const response = await apiClient.post("/clauses");
  console.log("Clauses API response:", response.data);
  return response.data.clauses_json;
};

// Function to count total clauses in all_clauses
// Function to get total clauses (prefer backend field, fallback to all_clauses length)
export const getTotalClauses = (clausesData: any) => {
  const totalClauses =
    clausesData.total_clauses || (clausesData.all_clauses ? clausesData.all_clauses.length : 0);
  console.log("Total clauses returned:", totalClauses);
  return totalClauses;
};


// Function to get top clauses with explanation
export const getTopClauses = (clausesData: any) => {
  const topClauses = clausesData.top_clauses.map((clause: any) => ({
    clause: clause.clause || "Unknown Clause",
    explanation: clause.explanation || "No explanation available",
  }));
    console.log("Top clauses extracted:", topClauses);
  return topClauses;
};

// Get risks
interface RiskResponse {
  risks: {
    counts: {
      High: number;
      Medium: number;
      Low: number;
    };
    top_clauses: {
      High: string[];
      Medium: string[];
      Low: string[];
    };
  };
}

// Main function to fetch risks from API
export const fetchRisks = async (): Promise<RiskResponse | null> => {
  try {
    const response = await apiClient.post("/risks");
    console.log("Risks API response:", response.data);
    return response.data as RiskResponse;
  } catch (error) {
    console.error("Error fetching risks:", error);
    return null;
  }
};

// Function to calculate total risk count
export const getTotalRiskCount = (risks: RiskResponse): number => {
  const { High, Medium, Low } = risks.risks.counts;
  console.log("Risk counts:", risks.risks.counts);
  return High + Medium + Low;
};

// Function to segregate risks by level
export const getRisksByLevel = (risks: RiskResponse) => {
    console.log("Risks by level:", risks.risks.top_clauses);
  return {
    high: risks.risks.top_clauses.High || [],
    medium: risks.risks.top_clauses.Medium || [],
    low: risks.risks.top_clauses.Low || [],
  };
};

