import fs from "fs"
import FormData from "form-data"
import axiosClient from "../../config/axios.config";
import { updateAnalysisData, addMaskingJson, getMaskingJson, FetchExistingDocAnalysis, getQuestions, storeCloudDocId, getCloudDocId, addQuestions } from "./analysis.repository";
import { addDocIdTOChatSession, createChatSessionRepo } from "../rag_query/rag_query.repository";

const unmaskData = (data: any, mapping: Record<string, string>): any => {
    if (!data) return data;

    // Replace directly only in strings
    if (typeof data === "string") {
        let result = data;
        for (const key in mapping) {
            result = result.split(key).join(mapping[key] || "");
        }
        return result;
    }

    // If array: recursive unmask each item
    if (Array.isArray(data)) {
        return data.map(item => unmaskData(item, mapping));
    }

    // If object: recursive unmask each key value
    if (typeof data === "object") {
        const updated: Record<string, any> = {};
        for (const k in data) {
            updated[k] = unmaskData(data[k], mapping);
        }
        return updated;
    }

    // Otherwise return as is
    return data;
};



export const processPdfService = async (
    agreementId: string,
    file: any,
    docType: string,
    user: string,
    user_type: string,
) => {
    try {
        console.log("STEP 1 ➜ Masking PDF…");

        const formData = new FormData();
        formData.append("file", file.buffer, {
            filename: file.originalname,
            contentType: file.mimetype || "application/pdf",
        });

        // STEP 1: Mask PDF
        const maskResponse = await axiosClient.post("/mask-pdf", formData, {
            headers: formData.getHeaders(),
        });

        const { masked_pdf_path: maskedPdfPath, mapping } = maskResponse.data;
        await addMaskingJson(agreementId, mapping);
        console.log("✅ Masking Success");

        const fileName = maskedPdfPath.split(/[\\/]/).pop();

        // STEP 2: Upload masked PDF
        console.log("STEP 2 ➜ Uploading masked PDF…");
        const uploadResponse = await axiosClient.post(
            `/upload?file_name=${fileName}&doc_type=${docType}&user_id=${user}`,
            {},
            { timeout: 120000 }
        );

        const { doc_id } = uploadResponse.data;
        await storeCloudDocId(agreementId, doc_id);
        console.log("✅ Upload Success | DOC ID:", doc_id);

        // STEP 3: Run Batch Pipeline + Upload to RAG (parallel)
        console.log("STEP 3 ➜ Running Batch Pipeline and RAG Upload in parallel…");

        const batchForm = new URLSearchParams();
        batchForm.append("doc_id", doc_id);
        batchForm.append("user_id", user);
        batchForm.append("type", user_type);

        const ragForm = new URLSearchParams();
        ragForm.append("file_name", fileName);
        ragForm.append("user_id", user);
        ragForm.append("doc_type", docType);

        // 🔥 Run both in parallel
        const [analysisResponse, ragResponse] = await Promise.all([
            axiosClient.post("/batch_pipeline", batchForm, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 120000,
            }),
            axiosClient.post("/upload-rag", ragForm, {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                timeout: 120000,
            }),
        ]);

        console.log("✅ Pipeline & RAG upload completed");

        // STEP 4: Unmask analysis results
        const { summary, clauses, risks } = analysisResponse.data;

        const unmaskedSummary = unmaskData(summary, mapping);
        const unmaskedClauses = unmaskData(clauses, mapping);
        const unmaskedRisks = unmaskData(risks, mapping);

        await updateAnalysisData(agreementId, {
            summary: unmaskedSummary,
            clauses: unmaskedClauses,
            risks: unmaskedRisks,
        });

        const chatSession = await createChatSessionRepo(user, agreementId, file.originalname)

        await addDocIdTOChatSession(ragResponse.data.doc_id,chatSession.id)

        return {
            success: true,
            message: "PDF processing completed successfully",
            docId: doc_id,
            rag: ragResponse.data,
            analysis: { unmaskedSummary, unmaskedClauses, unmaskedRisks },
        };
    } catch (err: any) {
        console.error("❌ Error in processPdfService:", err?.response?.data || err);
        return {
            success: false,
            message: err?.response?.data?.detail || "Failed during PDF processing",
        };
    }
};


export const getanalysisDetails = async (agreementId: string) => {
    try {
        const details = await FetchExistingDocAnalysis(agreementId);
        return {
            success: true,
            details: details
        }
    } catch (err: any) {
        console.error("❌ Error in processPdfService:", err?.response?.data || err);
        return {
            success: false,
            message: err?.response?.data?.detail || "Failed during PDF processing"
        };
    }
}


export const getQuestionsService = async (agreementId: string, userId: string) => {
    try {
        // Step 1️⃣ Fetch existing questions
        const initialResult = await getQuestions(agreementId);

        if (
            initialResult?.success &&
            Array.isArray(initialResult.questions) &&
            initialResult.questions.length > 0) {
            return {
                success: true,
                questions: initialResult.questions,
                source: "cached"
            };
        }

        console.log("⚠️ No stored questions — generating new ones...");

        // Step 2️⃣ Fetch agreement doc_id & user info
        // (Assuming DB provides docId too)
        const docId = await getCloudDocId(agreementId)

        if (!docId || !userId) {
            return {
                success: false,
                message: "Document ID or User ID missing — cannot generate questions"
            };
        }

        // Step 3️⃣ Call Python API to generate questions
        const formData = new FormData();
        formData.append("doc_id", docId.docId);
        formData.append("user_id", userId);

        const res = await axiosClient.post("/generate-questions", formData, {
            headers: formData.getHeaders(),
            timeout: 20000
        });

        const newQuestions = res.data?.questions || [];

        if (!newQuestions.length) {
            return {
                success: false,
                message: "Question generation failed — empty response"
            };
        }

        // Step 4️⃣ Save back into DB
        await addQuestions(agreementId, newQuestions);

        return {
            success: true,
            questions: newQuestions,
            source: "generated"
        };

    } catch (err: any) {
        console.error("❌ Error in getQuestionsService:", err);
        return {
            success: false,
            message: "Service error while fetching questions"
        };
    }
};



export const getReport = async (agreementId: string) => {
  try {
    const details = await FetchExistingDocAnalysis(agreementId);

    if (!details) {
      throw new Error("No analysis found for this document.");
    }

    const payload = {
      doc_id: details.docId,
      analysis_type: details.analysisMode,
      summary: details.summaryJson,
      clauses: details.clausesJson,
      risks: details.risksJson,
    };

    const response = await axiosClient.post(
      "/generate-report",
      payload,
      {
        responseType: "arraybuffer", // ✅ required for binary PDF
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 120000,
      }
    );

    return Buffer.from(response.data); // ✅ convert binary

  } catch (error: any) {
    console.error("Error in getReport:", error.message || error);
    throw error;
  }
};

