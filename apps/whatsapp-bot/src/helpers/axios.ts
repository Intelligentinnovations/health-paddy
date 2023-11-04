import axios from 'axios';

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID


export const sendWhatsAppText = async ({ message, phoneNumber }: { message: string; phoneNumber: string }) => {
  const url = `https://graph.facebook.com/v12.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`;
  axios.post(url, {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    text: {
      body: message
    },
  })
}