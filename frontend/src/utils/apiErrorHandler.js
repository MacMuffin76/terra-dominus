export const API_ERROR_EVENT_NAME = 'api-error';

export const getApiErrorMessage = (error, fallback = 'Une erreur est survenue lors de la communication avec le serveur.') => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
};

export const notifyApiError = (error, fallback) => {
  const message = getApiErrorMessage(error, fallback);
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    window.dispatchEvent(
      new CustomEvent(API_ERROR_EVENT_NAME, { detail: message })
    );
  }
  return message;
};