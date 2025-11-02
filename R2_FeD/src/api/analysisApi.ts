import axiosClient from './axiosClient';

/**
 * Fetch processed analysis details for a specific agreement.
 * @param agreementId - Unique identifier of the agreement
 * @returns Analysis details (summary, clauses, risks, masked content, etc.)
 */
export const getAgreementAnalysis = async (agreementId: string) => {
  try {
    const response = await axiosClient.get(`/agreement/analysis/${agreementId}`);
    if (response.data && response.data.success) {
      return response.data.details;
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (error: any) {
    console.error('Error fetching agreement analysis:', error.message);
    throw error;
  }
};
