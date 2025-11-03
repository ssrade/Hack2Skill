import fs from "fs"
import axios from "axios"
import FormData from "form-data"
import axiosClient from "../../config/axios.config";
import { updateAnalysisData, addMaskingJson, getMaskingJson, FetchExistingDocAnalysis, getQuestions, storeCloudDocId, getCloudDocId, addQuestions } from "./analysis.repository";
import { addDocIdTOChatSession, createChatSessionRepo } from "../rag_query/rag_query.repository";
import { prisma } from "../../config/database";

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
        formData.append("doc_type", docType);

        // STEP 1: Mask PDF (uploads to backend and returns masked PDF path)
        const maskResponse = await axiosClient.post("/mask-pdf", formData, {
            headers: formData.getHeaders(),
            timeout: 120000,
        });

        const { masked_pdf_path, mapping } = maskResponse.data;
        const fileName = masked_pdf_path.split('/').pop(); // Extract filename from path
        
        await addMaskingJson(agreementId, mapping);
        console.log("✅ Masking Success | File:", fileName);
        console.log("📋 Masked PDF path:", masked_pdf_path);

        // STEP 2: Upload to RAG (pass the full path for the backend to locate the file)
        console.log("STEP 2 ➜ Uploading to RAG…");
        
        const ragFormData = new FormData();
        ragFormData.append('file_name', fileName); // Python endpoint expects 'file_name', not 'file_path'
        ragFormData.append('user_id', user);
        ragFormData.append('doc_type', 'electronic');
        
        const ragResponse = await axiosClient.post("/upload-rag", ragFormData, {
            headers: ragFormData.getHeaders(),
            timeout: 120000
        });

        const { doc_id } = ragResponse.data;
        await storeCloudDocId(agreementId, doc_id);
        console.log("✅ RAG Upload Success | DOC ID:", doc_id);

        // STEP 3: Run Batch Pipeline Analysis
        console.log("STEP 3 ➜ Running Batch Pipeline Analysis…");

        const batchForm = new FormData();
        batchForm.append("doc_id", doc_id);
        batchForm.append("user_id", user);
        batchForm.append("type", user_type);

        const REQUEST_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

        const batchResponse = await axiosClient.post("/batch_pipeline", batchForm, {
            headers: batchForm.getHeaders(),
            timeout: REQUEST_TIMEOUT_MS,
        });

        console.log("✅ Batch Pipeline completed");

        // STEP 4: Unmask analysis results
        const { summary, clauses, risks } = batchResponse.data;

        const unmaskedSummary = unmaskData(summary, mapping);
        const unmaskedClauses = unmaskData(clauses, mapping);
        const unmaskedRisks = unmaskData(risks, mapping);

        await updateAnalysisData(agreementId, {
            summary: unmaskedSummary,
            clauses: unmaskedClauses,
            risks: unmaskedRisks,
            analysisMode: user_type as 'basic' | 'pro',
        });

        // STEP 5: Create chat session
        const chatSession = await createChatSessionRepo(user, agreementId, file.originalname);
        await addDocIdTOChatSession(doc_id, chatSession.id);

        console.log("✅ PDF processing completed successfully");

        return {
            success: true,
            message: "PDF processing completed successfully",
            docId: doc_id,
            analysis: { unmaskedSummary, unmaskedClauses, unmaskedRisks },
        };
    } catch (err: any) {
        console.error("❌ Error in processPdfService:", err?.response?.data || err.message || err);
        return {
            success: false,
            message: err?.response?.data?.detail || err?.message || "Failed during PDF processing",
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


export const getRuleBookService = async (agreementId: string) => {
    // 1️⃣ Check if rulebook data already exists in DB
    const existingAgreement = await prisma.agreement.findUnique({
        where: { id: agreementId },
        select: {
            id: true,
            title: true,
            summaryJson: true,
            rulebookJson: true,
        },
    });

    if (!existingAgreement) {
        throw new Error("Agreement not found.");
    }

    // ✅ Return existing rulebook data if available
    if (
        existingAgreement.rulebookJson &&
        Array.isArray(existingAgreement.rulebookJson) &&
        existingAgreement.rulebookJson.length > 0
    ) {
        console.log("✅ Returning existing rulebook data from DB");
        return existingAgreement;
    }

    // 2️⃣ If not found, fetch analysis summary for key_terms
    const data = await FetchExistingDocAnalysis(agreementId);
    if (!data || !data.summaryJson) {
        throw new Error("No analysis found for this document.");
    }

    const summary = data.summaryJson;

    // 3️⃣ Call FastAPI endpoint to get rulebook explanations

    // Use configured external python service base URL. Prefer PYTHON_BASE_URL if provided
    // (your deployed Python FastAPI). Fall back to RULEBOOK_SERVICE_BASE, then localhost.
    const rulebookBase = process.env.PYTHON_BASE_URL;
    const response = await axios.post(`${rulebookBase}/view-rulebook-source`,
        { summary },
        {
            params: { top_k: 5 },
            headers: { "Content-Type": "application/json" },
            timeout: 200000,
        }
    );

    let results = response.data?.results || [];

    // 4️⃣ Filter out entries with "Not found in context."
    results = results.filter(
        (item: any) =>
            item.explanation &&
            item.explanation.trim().toLowerCase() !== "not found in context."
    );

    // If nothing valid found, just return empty
    if (results.length === 0) {
        console.warn("⚠️ No valid rulebook entries found.");
        return { ...existingAgreement, rulebookJson: [] };
    }

    // 5️⃣ Store new rulebook results in the DB
    const updatedAgreement = await prisma.agreement.update({
        where: { id: agreementId },
        data: {
            rulebookJson: results,
        },
        select: {
            id: true,
            title: true,
            rulebookJson: true,
        },
    });

    console.log("✅ Stored new rulebook data in DB");
    return updatedAgreement;
};


