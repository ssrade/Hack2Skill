import { Request, Response } from "express";
import { fetchMessages, queryService } from "./rag_query.service";
import { getChatsessionId } from "../analysis/analysis.repository";

/**
 * @desc Fetch last few chat messages for a given session
 * @route GET /chat/:chatSessionId/messages
 * @query limit, cursor
 */
export const fetchMessagesController = async (req: Request, res: Response) => {
  try {
    const { agreementId } = req.params;

    const chatSession = await getChatsessionId(agreementId)
    const chatSessionId = chatSession.chatSessionId

    const limit = parseInt(req.query.limit as string) || 10;
    const cursor = req.query.cursor as string | undefined;

    const result = await fetchMessages(chatSessionId, limit, cursor);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ [Controller] fetchMessagesController:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
    });
  }
};

/**
 * @desc Process a user query for a chat session using RAG backend
 * @route POST /chat/query
 * @body { chatSessionId, query, userId, agreementId }
 */
export const queryController = async (req: any, res: Response) => {
  try {
    const {query, agreementId } = req.body;

    const userId = req.user.id

    const chatSessionId = await getChatsessionId(agreementId)

    if (!chatSessionId.chatSessionId || !query || !userId || !agreementId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields (chatSessionId, query, userId, agreementId)",
      });
    }

    const result = await queryService(chatSessionId.chatSessionId, query, userId, agreementId);

    res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error("❌ [Controller] queryController:", error);
    res.status(500).json({
      success: false,
      message: error?.response?.data?.detail || "Failed to process query",
    });
  }
};
