import { Request, Response } from "express";
import * as agreementService from "./doc.service";

export const uploadDocument = async (req: any, res: Response) => {
  try {
    const { title, description } = req.body;
    const userId = req.user.id // ✅ from auth middleware
    console.log(userId);
    

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const result = await agreementService.uploadDocumentService(
      req,
      userId,
      title,
      description
    );

    return res.status(201).json({
      message: "Document uploaded successfully",
      data: result,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};


export const getUserDocuments = async (req: any, res: Response) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const docs = await agreementService.getUserDocumentsService(userId);
    return res.status(200).json({
      message: "Documents fetched successfully",
      data: docs,
    });
  } catch (error: any) {
    return res.status(500).json({ message: error.message });
  }
};

