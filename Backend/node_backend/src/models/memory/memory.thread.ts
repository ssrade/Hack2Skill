import { randomUUID } from "crypto";
import { client } from "../../config/zep.config";
import { threadId } from "worker_threads";

export const createThread = async(userId: string) => {
    const threadId = randomUUID()
    return await client.thread.create({
        threadId: threadId,
        userId: userId
    })
}

export const getUserContextFromThreadId = async(threadId : string) => {
    return await client.thread.getUserContext(threadId, { mode: "basic" })
}

export const addUserMessageToThread = async(threadId: string, content: string) => {
    return await client.thread.addMessages(threadId, {
        messages: [{
            content: content,
            role: "user"
        }]
    })
}

export const addAssistantMessageToThread = async(threadId: string, content: string) => {
    return await client.thread.addMessages(threadId, {
        messages: [{
            content: content,
            role: "assistant"
        }]
    })
}