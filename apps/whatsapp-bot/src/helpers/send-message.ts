const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID
const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages?access_token=${WHATSAPP_TOKEN}`;

export const sendWhatsAppText = async ({ message, phoneNumber }: { message: string; phoneNumber: string }) => {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phoneNumber,
          text: {
            body: message
          },
        }),
      });

      if (response.ok) {
        return { status: true, message: "message sent" }
      }

      retries++;
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      retries++;
    }
  }

  return {
    status: false,
    message: "message not sent after 3 attempts"
  }
}

export const sendWhatsAppImageById = async ({
  phoneNumber, imageObjectId
}: { phoneNumber: string; imageObjectId: string }) => {
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: phoneNumber,
          type: "image",
          image: {
            id: imageObjectId
          }
        }),
      });

      if (response.ok) {
        return { success: true, message: "message sent" }
      }

      retries++;
    } catch (error) {
      console.error(`Attempt ${retries + 1} failed:`, error);
      retries++;
    }
  }

  return { success: false, message: "Message not sent after 3 attempts" }
}
