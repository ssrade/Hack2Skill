import { prisma } from "../../config/database";


export const updateAnalysisData = async (
  agreementId: string,
  data: {
    summary: any;
    clauses: any;
    risks: any;
    analysisMode?: 'basic' | 'pro';
  }
) => {
  try {
    const updatedAgreement = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        summaryJson: data.summary,
        clausesJson: data.clauses,
        risksJson: data.risks,
        analysisMode: data.analysisMode,
        processedAt: new Date()
      }
    });

    return updatedAgreement;
  } catch (error) {
    console.error("Error updating analysis data:", error);
    throw new Error("Failed to update analysis data in database");
  }
};

export const addMaskingJson = async (
  agreementId: string,
    mapping: any
) => {
  try {
    const updatedAgreement = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        maskingJson: mapping,
      }
    });

    return updatedAgreement;
  } catch (error) {
    console.error("Error updating analysis data:", error);
    throw new Error("Failed to update analysis data in database");
  }
};

export const getMaskingJson = async(agreementId: string) => {
    try {
        const getAgreementDetails = await prisma.agreement.findUnique({
            where: {id : agreementId}
        })

        const mapping = getAgreementDetails?.maskingJson
        return mapping
    } catch (error) {
         console.error("Error getting mapping data:", error);
    throw new Error("Failed getting mapping data in database");
    }
}

export const FetchExistingDocAnalysis = async(agreementId: string) => {
  return prisma.agreement.findUnique({where: {id: agreementId}})
}

export const getAllDocsOfUser = async (userId: string) => {
  try {
    const docs = await prisma.agreement.findMany({
      where: {
        userId: userId
      },
      select: {
        id: true,
        title: true,
        description: true,
        uploadDate: true,
        createdAt: true,
        analysisMode: true
      },
      orderBy: {
        uploadDate: "desc"
      }
    });

    return {
      success: true,
      data: docs
    };
  } catch (err: any) {
    console.error("❌ Error while fetching user docs:", err);
    return {
      success: false,
      message: "Failed to fetch user documents"
    };
  }
};

export const addQuestions = async (
  agreementId: string,
  questions: any
) => {
  return prisma.agreement.update({
    where: { id: agreementId },
    data: {
      questionJson: questions
    }
  });
};

export const getQuestions = async (agreementId: string) => {
  try {
    const data = await prisma.agreement.findUnique({
      where: { id: agreementId },
      select: {
        questionJson: true,
      },
    });

    if (!data) {
      return {
        success: false,
        message: "Agreement not found",
      };
    }

    return {
      success: true,
      questions: data.questionJson,
    };

  } catch (err: any) {
    console.error("❌ Error fetching questions:", err);
    return {
      success: false,
      message: "Failed to fetch questions",
    };
  }
};


export const storeCloudDocId = async (agreementId: string, docId: string) => {
  return await prisma.agreement.update({
    where: {id: agreementId},
    data: {docId: docId}
  })
}

export const getCloudDocId = async (agreementId: string) => {
  const data = await prisma.agreement.findUnique({
    where: {id: agreementId},
  })

  if (!data) {
      return {
        success: false,
        message: "docID not found",
      };
    }

  return {
      success: true,
      docId: data.docId,
    };
}

export const getChatsessionId = async(agreementId: string) => {
 const data = await prisma.agreement.findUnique({
      where: { id: agreementId },
      include: {
        chatSessions: {
          where: { isActive: true },
          orderBy: { startedAt: "desc" },
          take: 1,
        },
      },
    });
  if (!data) {
      return {
        success: false,
        message: "docID not found",
      };
    }

  return {
      success: true,
      chatSessionId: data.chatSessions[0].id,
    };
}