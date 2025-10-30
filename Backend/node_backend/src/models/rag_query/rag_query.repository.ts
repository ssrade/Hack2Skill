import { prisma } from "../../config/database";

/**
 * Create a chat session
 */
export const createChatSessionRepo = async (
  userId: string,
  agreementId?: string,
  title?: string
) => {
  return prisma.chatSession.create({
    data: {
      userId,
      agreementId,
      title: title || "New Chat Session",
    },
  });
};

/**
 * Add a chat message
 */
export const addChatMessageRepo = async (
  chatSessionId: string,
  sender: "USER" | "ASSISTANT",
  content: string,
  metadata?: Record<string, any>
) => {
  return prisma.chatMessage.create({
    data: {
      chatSessionId,
      sender,
      content,
      metadata,
    },
  });
};

/**
 * Fetch messages with pagination
 */
export const fetchMessagesRepo = async (
  chatSessionId: string,
  limit = 10,
  cursor?: string
) => {
  return prisma.chatMessage.findMany({
    where: { chatSessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
    ...(cursor && { skip: 1, cursor: { id: cursor } }),
  });
};


export const addDocIdTOChatSession = async(ragDocId: any, chatSessionId: string) => {
    return prisma.chatSession.update({
        where: {id: chatSessionId},
        data: {ragDocId : ragDocId}
    })
}

export const getDocId = async(chatSessionId: string) => {
    return prisma.chatSession.findUnique({
        where:{id: chatSessionId}
    })
}

export const getThreadID = async(agreementId: string) => {
    const data = await prisma.agreement.findUnique({
        where: {id: agreementId}
    })

    return data?.threadId
}