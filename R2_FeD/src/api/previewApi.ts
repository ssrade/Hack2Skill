import axiosClient from './axiosClient';

export interface PreviewResponse {
  success: boolean;
  message: string;
  data: {
    previewUrl: string;
  };
}

export const getDocumentPreview = async (agreementId: string): Promise<string> => {
  try {
    console.log('🔍 Fetching preview for document:', agreementId);
    const startTime = Date.now();
    
    const response = await axiosClient.post<PreviewResponse>('/docUpload/preview', {
      agreementId,
    });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Preview fetched in ${duration}ms:`, response.data);

    if (response.data.success && response.data.data.previewUrl) {
      return response.data.data.previewUrl;
    } else {
      throw new Error(response.data.message || 'Failed to generate preview URL');
    }
  } catch (error: any) {
    console.error('❌ Preview API error:', error);
    console.error('Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};
