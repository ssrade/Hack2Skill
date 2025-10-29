import { client } from "../../config/zep.config";


export const addUserToMemory = async(userId: string) => {
   return await client.user.add({
        userId: userId
    })
}

export const getUser = async(userId: string) => {
   return await client.user.get(userId)
}

export const getUserNode = async(userId: string) => {
   return await client.user.getNode(userId)
}

export const getUserThread = async(userId: string) => {
   return await client.user.getThreads(userId);
}

export const warmUserCache = async(userId: string) => {
    return await client.user.warm(userId)
}