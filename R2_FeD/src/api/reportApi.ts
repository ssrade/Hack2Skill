import axiosClient from './axiosClient';

/**
 * Download PDF report for a specific agreement
 * @param agreementId - Unique identifier of the agreement
 * @returns Promise that resolves when download is triggered
 */
export const downloadAgreementReport = async (agreementId: string): Promise<void> => {
  try {
    // Request PDF as blob
    const response = await axiosClient.get(`/agreement/report/${agreementId}`, {
      responseType: 'blob', // Important: request as blob for file download
      headers: {
        Accept: 'application/pdf',
      },
    });

    // Create a blob from the response
    const blob = new Blob([response.data], { type: 'application/pdf' });
    
    // Create a temporary URL for the blob
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = url;
    
    // Extract filename from Content-Disposition header if available, otherwise use default
    const contentDisposition = response.headers['content-disposition'];
    let filename = `agreement_report_${agreementId}.pdf`;
    
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }
    
    link.download = filename;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error('Error downloading agreement report:', error);
    
    // Handle specific error cases
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('Report not found for this agreement');
      } else if (error.response.status === 500) {
        throw new Error('Error generating report. Please try again later.');
      }
    }
    
    throw new Error(error.message || 'Failed to download report');
  }
};

