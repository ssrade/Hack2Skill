import axiosClient from './axiosClient';

export interface RulebookTerm {
  term: string;
  explanation: string;
}

export interface RulebookResponse {
  message: string;
  agreementId: string;
  rulebook_explanations: {
    id: string;
    title: string;
    rulebookJson: RulebookTerm[];
  };
}

/**
 * Fetch rulebook explanations for key terms in an analyzed agreement
 * @param agreementId - The ID of the agreement to fetch rulebook for
 * @returns Promise with rulebook explanations
 */
export async function getRulebookExplanations(agreementId: string): Promise<RulebookResponse> {
  try {
    const response = await axiosClient.post<RulebookResponse>(
      `/agreement/rulebook`,
      { agreementId }
    );

    return response.data;
  } catch (error: any) {
    if (error.response) {
      // Server responded with error
      const status = error.response.status;
      const message = error.response.data?.message || error.response.data?.error;

      if (status === 400) {
        throw new Error(message || 'Missing or invalid agreement ID');
      } else if (status === 404) {
        throw new Error(message || 'No analysis found for the given agreement');
      } else if (status === 500) {
        throw new Error(message || 'Error fetching rulebook sources');
      } else if (status === 401) {
        throw new Error('Authentication required. Please log in again.');
      } else {
        throw new Error(message || 'Failed to fetch rulebook explanations');
      }
    } else if (error.request) {
      // Request made but no response
      throw new Error('No response from server. Please check your connection.');
    } else {
      // Something else happened
      throw new Error(error.message || 'Failed to fetch rulebook explanations');
    }
  }
}
