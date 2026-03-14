import { Alert } from 'react-native';

export const errorHandler = (error: any) => {
  const message = error.response?.data?.message || error.message || 'Something went wrong';
  
  // Only alert if it's not a silent error (custom property in axios config)
  if (!error.config?.silent) {
    Alert.alert('Error', message);
  }
  
  console.error('[API Error]', message, error);
};
