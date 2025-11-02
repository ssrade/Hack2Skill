// src/api/uploadDocument.ts
import axiosClient from './axiosClient';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const uploadDocument = async (
  file: File,
  userId: string,
  onProgress?: (progress: UploadProgress) => void
) => {
  try {
    const formData = new FormData();
    formData.append('title', file.name); // use file name as title
    formData.append('description', ''); // leave blank as per requirement
    formData.append('file', file);

    const response = await axiosClient.post('/docUpload/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    console.log('✅ Document uploaded successfully:', response.data);
    console.log('📄 Document ID:', response.data.data.id);
    return response.data.data;
  } catch (error: any) {
    console.error('❌ Error uploading document:', error.message);
    throw error;
  }
};
