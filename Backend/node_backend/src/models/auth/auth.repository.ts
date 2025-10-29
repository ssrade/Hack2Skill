import { prisma } from "../../config/database"


export const signup = (data:any) => {
    return prisma.user.create({
        data: data
    })
}

export const findUserByEmail = (email:string) => {
    return prisma.user.findUnique({where:{email: email}})
}

export const addProfilePhoto = (profilePhotoUrl: string, email: string) => {
    return prisma.user.update({
        where: {
            email: email
        },
        data: {
            profilePhoto: profilePhotoUrl
        }
    })
}

