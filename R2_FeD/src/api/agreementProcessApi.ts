// src/api/agreementProcessApi.ts
import axiosClient from './axiosClient';

export interface ProcessAgreementPayload {
  file: File;
  agreementId: string;
  docType: string;
  userType: 'basic' | 'pro';
}

export async function processAgreement({
  file,
  agreementId,
  docType,
  userType,
}: ProcessAgreementPayload) {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agreementId', agreementId);
    formData.append('docType', docType);
    formData.append('user_type', userType);

    // Get the user ID from sessionStorage
    const user = sessionStorage.getItem('user');
    if (user) {
      const parsedUser = JSON.parse(user);
      formData.append('userId', parsedUser.id);
      console.log('👤 User ID:', parsedUser.id);
    } else {
      console.warn('⚠️ No user found in sessionStorage');
    }

    console.log('📤 Sending agreement process request...');
    console.log('📄 File details:', {
      name: file.name,
      size: file.size,
      type: file.type
    });
    console.log('🆔 Agreement ID:', agreementId);
    console.log('📝 Document Type:', docType);
    console.log('👤 User Type:', userType);

    // Log FormData contents for debugging
    console.log('📋 FormData entries:');
    for (const pair of formData.entries()) {
      console.log(`  ${pair[0]}:`, pair[1]);
    }

    const response = await axiosClient.post('/agreement/process', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes
    });

    console.log('✅ Agreement processed successfully:', response.data);
    return response.data;
  } catch (error: any) {
    console.error('❌ Error during agreement processing:', error);
    
    // More detailed error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response headers:', error.response.headers);
      console.error('📊 Response data:', error.response.data);
      
      if (error.response.status === 500) {
        throw new Error(
          error.response.data?.message || 
          'Internal server error. The document processing service is currently unavailable. Please try again later.'
        );
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('📡 No response received:', error.request);
      throw new Error('No response from server. Please check your connection and try again.');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. The document processing is taking longer than expected. Please try again.');
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to process agreement document. Please try again.'
    );
  }
}