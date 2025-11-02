import { Request, Response } from "express";
import multer from "multer";
import { getanalysisDetails, getQuestionsService, getReport, processPdfService } from "./analysis.service";
import { getAllDocsOfUser } from "./analysis.repository";
import { getRuleBookService } from "./analysis.service"; // adjust path as needed

// ✅ Multer setup (store file in memory as buffer)
const storage = multer.memoryStorage();
export const upload = multer({ storage });

// ✅ Controller to handle full pipeline call
export const processAgreementController = async (req: any, res: Response) => {
  try {
    const { agreementId, docType, user_type } = req.body;
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
      userId,
      user_type
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
        // console.log(response);
        

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

export const getUserDocsController = async (req: any, res: Response) => {
  const  userId  = req.user.id;

  console.log("📄 Get User Docs Controller");
  console.log("👤 User ID from token:", userId);
  

  const result = await getAllDocsOfUser(userId);

  console.log("📊 Result from getAllDocsOfUser:", result);

  if (!result.success) {
    console.log("❌ Error fetching documents");
    return res.status(500).json(result);
  }

  if (!result.data || result.data.length === 0) {
    console.log("📭 No documents found for user");
    return res.status(404).json({
      success: false,
      message: "No documents found"
    });
  }

  console.log(`✅ Found ${result.data.length} documents`);
  return res.status(200).json(result);
};


export const getquestions = async (req: any, res: Response) => {
    const { agreementId } = req.params;
    const userId = req.user.id

    const result = await getQuestionsService(agreementId, userId)
    console.log(result);
    

    if (result.success) {
    return res.status(200).json(result);
   }

  if (!result.message || result.message.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No documents found"
    });
  }

  return res.status(200).json(result);
}

export const generateReportController = async (req: Request, res: Response) => {
  try {
    const { agreementId } = req.params;

    if (!agreementId) {
      return res.status(400).json({ error: "agreementId is required" });
    }

    const pdfBuffer = await getReport(agreementId);

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="agreement_${agreementId}.pdf"`,
      "Content-Length": pdfBuffer.length,
    });

    return res.send(pdfBuffer); // ✅ send binary directly

  } catch (error: any) {
    console.error("generateReportController Error:", error.message || error);
    
    return res.status(500).json({
      error: error.message || "Failed to generate report",
    });
  }
};




export const getRuleBookController = async (req: Request, res: Response) => {
    try {
        const { agreementId } = req.body;

        if (!agreementId) {
            return res.status(400).json({ error: "agreementId is required." });
        }

        const results = await getRuleBookService(agreementId);

        return res.status(200).json({
            message: "Rulebook sources retrieved successfully.",
            agreementId,
            rulebook_explanations: results,
        });
    } catch (error: any) {
        console.error("Error in getRuleBookController:", error);
        return res.status(500).json({
            error: "Failed to fetch rulebook sources.",
            details: error.message || error,
        });
    }
};
