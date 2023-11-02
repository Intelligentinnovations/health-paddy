import axios from 'axios';
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID


export const metaTextApiConfig = () => {
  const axiosInstance = axios.create({
    baseURL: `https://graph.facebook.com/v12.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API request error:', error);
    }
  );

  return {
    api: axiosInstance,
  };
};
