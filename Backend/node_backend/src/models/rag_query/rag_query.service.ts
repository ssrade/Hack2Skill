import axiosClient from "../../config/axios.config";
import { FetchExistingDocAnalysis } from "../analysis/analysis.repository";
import { addAssistantMessageToThread, addUserMessageToThread, getUserContextFromThreadId } from "../memory/memory.thread";
import {
    createChatSessionRepo,
    addChatMessageRepo,
    fetchMessagesRepo,
    getThreadID,
    getDocId,
} from "./rag_query.repository";
import FormData from "form-data";


/**
 * Create a new chat session
 */
export const createChatSession = async (
    userId: string,
    agreementId?: string,
    title?: string
) => {
    try {
        const session = await createChatSessionRepo(userId, agreementId, title);
        return session;
    } catch (error) {
        console.error("❌ [Service] Failed to create chat session:", error);
        throw new Error("Failed to create chat session");
    }
};

/**
 * Add a chat message
 */
export const addChatMessage = async (
    chatSessionId: string,
    sender: "USER" | "ASSISTANT",
    content: string,
    metadata?: Record<string, any>
) => {
    try {
        await addChatMessageRepo(chatSessionId, sender, content, metadata);
    } catch (error) {
        console.error("❌ [Service] Failed to add chat message:", error);
        throw new Error("Failed to add chat message");
    }
};

/**
 * Fetch the last N messages (default 10)
 */
export const fetchMessages = async (
    chatSessionId: any,
    limit = 10,
    cursor?: string
) => {
    try {
        const messages = await fetchMessagesRepo(chatSessionId, limit, cursor);

        // Reverse order → chronological
        const ordered = messages.reverse();

        return {
            messages: ordered,
            nextCursor: ordered.length ? ordered[0].id : null,
            hasMore: messages.length === limit,
        };
    } catch (error) {
        console.error("❌ [Service] Failed to fetch messages:", error);
        throw new Error("Failed to fetch messages");
    }
};

export const queryService = async (chatSessionId: string, query: string, userId: string, agreementId: string) => {
    const threadId: any = await getThreadID(agreementId);
    const memory = await getUserContextFromThreadId(threadId);


    const finalQuery = `user Query : ${query} \n memory_retrived: ${memory.context}`;

    await addUserMessageToThread(threadId, query) // memory
    await addChatMessage(chatSessionId, "USER", query)

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

    const formData = new FormData();
    formData.append("query", finalQuery);
    formData.append("user_id", userId);
    formData.append("doc_id", details.docId);
    formData.append("clauses_json", JSON.stringify(payload));

    const response = await axiosClient.post("/query-rag", formData, {
        headers: formData.getHeaders(), // Override JSON default
        timeout: 120000, // ⏱️ 60 seconds (you can adjust as needed)
    });

    await addAssistantMessageToThread(threadId, response.data.answer); //memory
    await addChatMessage(chatSessionId, "ASSISTANT", response.data.answer)

    return response.data
}


