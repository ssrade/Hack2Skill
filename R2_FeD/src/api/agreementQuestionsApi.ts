import axiosClient from './axiosClient';

/**
 * Fetch AI-generated questions for a given agreement.
 * 
 * @param agreementId - Unique identifier of the agreement
 * @returns Array of generated questions
 */
export const getAgreementQuestions = async (agreementId: string) => {
  try {
    const response = await axiosClient.get(`/agreement/questions/${agreementId}`);
    console.log('Agreement Questions API response:', response);

    // Accept if questions array exists, regardless of 'success' field
    if (response.data && Array.isArray(response.data.questions)) {
      const questions = response.data.questions.map((q: any) =>
        typeof q === 'string' ? q : q.question || ''
      );
      return questions.filter(Boolean);
    } else {
      throw new Error('Unexpected response from server: ' + JSON.stringify(response.data));
    }
  } catch (error: any) {
    // If error response contains questions, return them anyway (backend bug workaround)
    if (error.response && error.response.data && Array.isArray(error.response.data.questions)) {
      const questions = error.response.data.questions.map((q: any) =>
        typeof q === 'string' ? q : q.question || ''
      );
      return questions.filter(Boolean);
    }
    console.error('❌ Error fetching agreement questions:', error.message, error.response?.data);
    console.error('Full error object:', error);
    throw new Error('Failed to fetch agreement questions');
  }
};
