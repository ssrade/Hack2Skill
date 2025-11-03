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


export const previewDoc = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log request details for debugging
    console.log('[PREVIEW DEBUG] Request body:', req.body);
    console.log('[PREVIEW DEBUG] Content-Type:', req.get('Content-Type'));
    console.log('[PREVIEW DEBUG] Request method:', req.method);
    
    // Handle case where req.body is undefined
    if (!req.body) {
      console.error('[PREVIEW ERROR] req.body is undefined');
      res.status(400).json({ 
        success: false, 
        message: "Request body is missing. Ensure Content-Type is application/json" 
      });
      return;
    }

    const { agreementId } = req.body;

    // Validate input
    if (!agreementId) {
      console.error('[PREVIEW ERROR] agreementId is missing from request body');
      res.status(400).json({ success: false, message: "agreementId is required" });
      return;
    }

    console.log('[PREVIEW DEBUG] Fetching preview for agreementId:', agreementId);

    // Call service layer
    const previewUrl = await agreementService.DocumentPreviewService(agreementId);

    if (!previewUrl) {
      console.error('[PREVIEW ERROR] Preview URL not generated for agreementId:', agreementId);
      res.status(404).json({ success: false, message: "Document not found or cannot be previewed" });
      return;
    }

    console.log('[PREVIEW SUCCESS] Preview URL generated:', previewUrl);

    // Send success response
    res.status(200).json({
      success: true,
      message: "Document preview generated successfully",
      data: { previewUrl }
    });
  } catch (error: any) {
    console.error("Error in previewDoc controller:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || "Unexpected error occurred"
    });
  }
};


export const deleteAgreementController = async (req: Request, res: Response): Promise<void> => {
  try {
    // Support agreementId from body, query or params. Some clients (or proxies) may omit
    // the request body for DELETE requests, so fall back to query string.
    const agreementId = (req as any)?.body?.agreementId || (req as any)?.query?.agreementId || (req as any)?.params?.agreementId;

    // Log incoming delete request for debugging
    console.log('Incoming delete request, agreementId sources:', {
      body: (req as any)?.body,
      query: req.query,
      params: req.params,
    });

    // Validate input
    if (!agreementId) {
      res.status(400).json({
        success: false,
        message: "agreementId is required",
      });
      return;
    }

    // Call service layer
    const result = await agreementService.delAgreement(agreementId);

    // Handle response based on service output
    if (result.success) {
      res.status(200).json({
        success: true,
        message: "Agreement deleted successfully",
      });
    } else {
      res.status(404).json({
        success: false,
        message: "Agreement not found or could not be deleted",
      });
    }
  } catch (error: any) {
    console.error("Error in deleteAgreementController:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message || "Unexpected error occurred",
    });
  }
};
