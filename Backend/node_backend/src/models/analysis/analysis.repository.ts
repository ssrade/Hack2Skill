import { prisma } from "../../config/database";


export const updateAnalysisData = async (
  agreementId: string,
  data: {
    summary: any;
    key_terms: any;
    clauses: any;
    risks: any;
  }
) => {
  try {
    const updatedAgreement = await prisma.agreement.update({
      where: { id: agreementId },
      data: {
        summaryJson: data.summary,
        clausesJson: data.clauses,
        risksJson: data.risks,
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