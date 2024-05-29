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

export const sendWhatsAppCTA = async ({ message, phoneNumber, link, callToActionText }: { message: string; phoneNumber: string; link: string, callToActionText: string }) => {
  const url = `https://graph.facebook.com/v12.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`;
  axios.post(url, {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    type: "interactive",
    interactive: {
      type: "cta_url",
      body: {
        text: message
      },
      action: {
        name: "cta_url",
        parameters: {
          display_text: callToActionText,
          url: link
        }
      }
    }
  })
}

export const sendWhatsAppImageById = async ({ phoneNumber, imageObjectId }: { phoneNumber: string; imageObjectId: string }) => {
  const url = `https://graph.facebook.com/v12.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`;
  axios.post(url, {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: phoneNumber,
    type: "image",
    image: {
      id: imageObjectId
    }
  })
}
