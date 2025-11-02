// src/api/deleteDocumentApi.ts
import axiosClient from './axiosClient';

export interface DeleteDocumentResponse {
  success: boolean;
  message: string;
}

/**
 * Delete a specific agreement by its ID
 * @param agreementId - The unique ID of the agreement to delete
 * @returns Success response
 */
export const deleteDocument = async (agreementId: string): Promise<DeleteDocumentResponse> => {
  try {
    const response = await axiosClient.delete(`/docUpload/delete?agreementId=${encodeURIComponent(agreementId)}`);

    // Backend returns { success: true, message: "..." }
    if (response.data && response.data.success !== false) {
      console.log('✅ Document deleted successfully:', agreementId);
      return {
        success: true,
        message: response.data.message || 'Document deleted successfully',
      };
    } else {
      // If success is explicitly false, treat as error
      throw new Error(response.data?.message || 'Unexpected response from server');
    }
  } catch (error: any) {
    console.error('❌ Error deleting document:', error);
    
    if (error.response?.status === 400) {
      throw new Error('Invalid document ID. Please try again.');
    }
    
    if (error.response?.status === 404) {
      throw new Error('Document not found or already deleted.');
    }
    
    if (error.response?.status === 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw new Error(error.response?.data?.message || error.message || 'Failed to delete document');
  }
};