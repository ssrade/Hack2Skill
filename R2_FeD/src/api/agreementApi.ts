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
      console.log('✅ getAllDocuments response:', response.data);
      
      // Map backend fields to frontend Document type
      return response.data.data.map((doc: any) => {
        // Use uploadDate or fallback to createdAt
        const dateValue = doc.uploadDate || doc.createdAt || '';
        
        console.log(`📄 Document: ${doc.title}, uploadDate: ${doc.uploadDate}, createdAt: ${doc.createdAt}, analysisMode: ${doc.analysisMode}`);
        
        return {
          id: doc.id,
          name: doc.title, // Map title to name
          description: doc.description || '',
          uploadDate: dateValue, // Use uploadDate or createdAt from backend
          status: 'analyzed', // Default to analyzed, or set logic as needed
          analysisMode: doc.analysisMode || 'basic', // Add analysis type
        };
      });
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