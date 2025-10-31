import { bucket, generateSignedUrl } from "../../config/gcp_doc.config";
import * as agreementRepo from "./doc.repository";
import * as memory from "../memory/memory.thread"
import { v4 as uuidv4 } from "uuid";


export const uploadDocumentService = async (
  req: any,
  userId: string,
  title: string,
  description?: string
) => {
  if (!req.file) throw new Error("No file uploaded");

  const fileName = `documents/${uuidv4()}_${req.file.originalname}`;
  const blob = bucket.file(fileName);

  const blobStream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  return new Promise(async(resolve, reject) => {
    blobStream.on("error", reject);

    const threadCreated = await memory.createThread(userId)
    const threadId:any = threadCreated?.threadId

    blobStream.on("finish", async () => {
      const agreement = await agreementRepo.createAgreement(
        userId,
        title,
        fileName,
        threadId,
        description
      );
      resolve(agreement);
    });

    blobStream.end(req.file.buffer);
  });
};

export const getUserDocumentsService = async (userId: string) => {
  const documents = await agreementRepo.getAgreementsByUser(userId);

  const signedDocs = await Promise.all(
    documents.map(async (doc) => {
      if (doc.gcpFileUrl) {
        doc.gcpFileUrl = await generateSignedUrl(doc.gcpFileUrl);
      }
      return doc;
    })
  );

  return signedDocs;
};

export const DocumentPreviewService = async(agreementId: string) => {
  const document = await agreementRepo.getAgreementById(agreementId)

  const dump = "url not provided"
  if(document){
    const previewUrl = await generateSignedUrl(document?.gcpFileUrl)

    return previewUrl;
  }

  return dump;
}


export const delAgreement = async(agreementId: string) => {
  const delDoc = await agreementRepo.delAgreementRepo(agreementId)

  if(delDoc){
    return {
      success: true
    }
  }

  return {
      success: false
    }
}