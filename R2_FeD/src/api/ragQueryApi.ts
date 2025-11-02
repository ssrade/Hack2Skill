import axiosClient from './axiosClient';

/**
 * Message response from backend
 */
export interface BackendMessage {
  id: string;
  sender: 'USER' | 'ASSISTANT';
  content: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

/**
 * Fetch messages response from backend
 */
export interface FetchMessagesResponse {
  success: boolean;
  messages: BackendMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Query response from backend
 */
export interface QueryResponse {
  success: boolean;
  answer: string;
  // Additional fields that might come from backend
  sources?: string[];
  metadata?: Record<string, any>;
}

/**
 * Fetch chat messages for a specific agreement
 * @param agreementId - The unique ID of the agreement
 * @param limit - Number of messages to fetch (default: 50)
 * @param cursor - ID of the last message for pagination (optional)
 * @returns Messages array with pagination info
 */
export const fetchChatMessages = async (
  agreementId: string,
  limit: number = 10, // Changed from 50 to 10 to match API default
  cursor?: string
): Promise<FetchMessagesResponse> => {
  try {
    const params: Record<string, string | number> = { limit };
    if (cursor) {
      params.cursor = cursor;
    }

    console.log('📡 Fetching messages with params:', { agreementId, limit, cursor });
    
    const response = await axiosClient.get(`/chat/messages/${agreementId}`, {
      params,
    });

    console.log('✅ Messages fetched successfully:', {
      messageCount: response.data.messages?.length,
      nextCursor: response.data.nextCursor,
      hasMore: response.data.hasMore
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        messages: response.data.messages || [],
        nextCursor: response.data.nextCursor || null,
        hasMore: response.data.hasMore || false,
      };
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (error: any) {
    // Handle case where no chat session exists yet
    if (error.response?.status === 500) {
      console.warn('No chat session found for agreement, returning empty messages:', agreementId);
      return {
        success: true,
        messages: [],
        nextCursor: null,
        hasMore: false,
      };
    }
    
    console.error('Error fetching chat messages:', error);
    throw error;
  }
};

/**
 * Send a query to the RAG backend for a specific agreement
 * @param agreementId - The unique ID of the agreement
 * @param query - The user's question/query
 * @returns The AI-generated answer with metadata
 */
export const sendRAGQuery = async (
  agreementId: string,
  query: string
): Promise<QueryResponse> => {
  try {
    const response = await axiosClient.post('/chat/query', {
      query,
      agreementId,
    });

    if (response.data && response.data.success) {
      return {
        success: true,
        answer: response.data.answer || '',
        sources: response.data.sources,
        metadata: response.data.metadata,
      };
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (error: any) {
    // Handle specific error cases
    if (error.response?.status === 400) {
      throw new Error('Missing required fields. Please try again.');
    }
    
    if (error.response?.status === 500) {
      const errorMessage = error.response?.data?.message || error.message;
      if (errorMessage.includes('No analysis found')) {
        throw new Error('Document analysis not complete. Please wait for processing to finish.');
      }
      throw new Error('Failed to process query. Please try again.');
    }
    
    console.error('Error sending RAG query:', error);
    throw error;
  }
};