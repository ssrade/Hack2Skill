import apiClient from "./index";
import qs from "qs"; // npm install qs

export interface QueryResponse {
  answer: string;
  source: string;
  retrievedClausesLocal: string[];
  retrievedClausesRulebook: string[];
}

export const queryDocument = async (question: string): Promise<QueryResponse> => {
  try {
    const payload = qs.stringify({ question }); // convert to x-www-form-urlencoded

    const response = await apiClient.post("/query", payload, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    const data = response.data;

    return {
      answer: data.response_json?.answer || "",
      source: data.response_json?.source || "",
      retrievedClausesLocal: data.retrieved_clauses_local || [],
      retrievedClausesRulebook: data.retrieved_clauses_rulebook || [],
    };
  } catch (error) {
    console.error("Error querying document:", error);
    return {
      answer: "",
      source: "",
      retrievedClausesLocal: [],
      retrievedClausesRulebook: [],
    };
  }
};
