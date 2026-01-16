export async function sendWhatsappDocument(payload: {
  to: string;
  caption: string;
  fileName: string;
  fileBuffer: Buffer;
}) {
  /**
   * IN REAL IMPLEMENTATION:
   * - Upload PDF to provider
   * - Send document message
   */

  console.log('Sending WhatsApp message:', {
    to: payload.to,
    fileName: payload.fileName,
  });

  // Simulated provider response
  return {
    success: true,
    providerMessageId: `WA_${Date.now()}`,
  };
}
