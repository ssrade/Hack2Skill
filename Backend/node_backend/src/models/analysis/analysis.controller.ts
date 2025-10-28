import { Request, Response } from "express";
import multer from "multer";
import { getanalysisDetails, processPdfService } from "./analysis.service";

// ✅ Multer setup (store file in memory as buffer)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ✅ Controller to handle full pipeline call
export const processAgreementController = async (req: any, res: Response) => {
  try {
    const { agreementId, docType } = req.body;
    const userId = req.user.id

    console.log("📌 Incoming:", { agreementId, docType, userId });

    if (!agreementId || !docType || !userId) {
      return res.status(400).json({
        success: false,
        message: "agreementId, docType, and userId are required"
      });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File is required"
      });
    }

    console.log("📄 PDF Received:", file.originalname);

    // ✅ Call the Service (mask + upload + analysis)
    const result = await processPdfService(
      agreementId,
      file,
      docType,
      userId
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.message
      });
    }

    console.log("✅ Processing Complete!");
    
    return res.status(200).json({
      success: true,
      message: "Agreement processed successfully",
      data: result.analysis || {}
    });

  } catch (error: any) {
    console.error("❌ Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Server Error"
    });
  }
};

export const getAnalysis = async (req: Request, res: Response) => {
    try {
        const { agreementId } = req.params;

        if (!agreementId) {
            return res.status(400).json({
                success: false,
                message: "AgreementId is required"
            });
        }

        const response : any = await getanalysisDetails(agreementId);

        if (!response.success) {
            return res.status(500).json(response);
        }

        return res.status(200).json(response);

    } catch (err: any) {
        console.error("❌ Error in getAnalysis:", err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};