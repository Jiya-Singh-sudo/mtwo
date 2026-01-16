import api from './apiClient';
import {
  InfoPackageGuestSearchResponse,
  InfoPackageGuestInfo,
  InfoPackageWhatsappResponse,
} from '../types/info-package.types';

/* ======================================================
   INFO PACKAGE – API
====================================================== */

/* ---------- Search Guests ---------- */
export const getInfoPackageGuests = async (params: {
  search?: string;
  page?: number;
  limit?: number;
}): Promise<InfoPackageGuestSearchResponse> => {
  const response = await api.get('/info-package/guests', {
    params,
  });
  return response.data;
};

/* ---------- Get Aggregated Guest Info ---------- */
export const getInfoPackageGuestInfo = async (
  guestId: string,
): Promise<InfoPackageGuestInfo> => {
  const response = await api.get(`/info-package/${guestId}`);
  return response.data;
};

/* ---------- Download PDF ---------- */
export const downloadInfoPackagePdf = async (guestId: string) => {
  const response = await api.post(
    `/info-package/${guestId}/pdf`,
    {},
    {
      responseType: 'blob',
    },
  );

  return response.data as Blob;
};

/* ---------- Send WhatsApp ---------- */
export const sendInfoPackageWhatsapp = async (
  guestId: string,
): Promise<InfoPackageWhatsappResponse> => {
  const response = await api.post(`/info-package/${guestId}/whatsapp`);
  return response.data;
};
