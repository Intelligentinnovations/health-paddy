import axios from "axios";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID
const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`;

export const sendWhatsAppText = async ({ message, phoneNumber }: { message: string; phoneNumber: string }) => {
  try {
    axios.post(url, {
      messaging_product: "whatsapp",
      to: phoneNumber,
      text: {
        body: message
      },
    })
    return { success: true }

  } catch (error) {
    console.log("Error sending message")
    console.log(error);
    return { success: false }

  }
}


export const sendWhatsAppImageById = async ({ phoneNumber, imageObjectId }: { phoneNumber: string; imageObjectId: string }) => {
  try {
    axios.post(url, {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: phoneNumber,
      type: "image",
      image: {
        id: imageObjectId
      }
    })
    return { success: true }

  } catch (error) {
    console.log({ error });
    return { success: false }

  }
}
