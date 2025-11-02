import axiosClient from './axiosClient'; // adjust path if axiosClient is elsewhere

/**
 * Fetch all uploaded agreements for the current user.
 * The backend extracts userId from JWT token automatically.
 * 
 * @returns List of documents with id, title, and description
 */
export const getAllDocuments = async () => {
  try {
    const response = await axiosClient.get(`/agreement/allDocuments`);

    if (response.data && response.data.success) {
      // Map backend fields to frontend Document type
      return response.data.data.map((doc: any) => ({
        id: doc.id,
        name: doc.title, // Map title to name
        description: doc.description || '',
        uploadDate: doc.uploadDate || '', // Use backend date if available, else blank
        status: 'analyzed', // Default to analyzed, or set logic as needed
        // Add other fields as needed for your Document type
      }));
    } else {
      throw new Error('Unexpected response from server');
    }
  } catch (error: any) {
    // Handle 404 (no documents) gracefully - return empty array
    if (error.response?.status === 404) {
      console.log('No documents found for user (new user or no uploads yet)');
      return [];
    }
    console.error('Error fetching documents:', error.message);
    throw error;
  }
};