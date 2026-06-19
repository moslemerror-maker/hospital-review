const axios = require('axios');

// ── Gupshup WhatsApp API Service ─────────────────────────────────────────────

const GUPSHUP_API_KEY  = process.env.GUPSHUP_API_KEY;
const GUPSHUP_SOURCE   = process.env.GUPSHUP_SOURCE_NUMBER;
const GUPSHUP_APP_NAME = process.env.GUPSHUP_APP_NAME;

/**
 * Send plain text WhatsApp message
 * (mainly for testing)
 */
async function sendWhatsAppText(toNumber, message) {
  try {

    const params = new URLSearchParams();

    params.append('channel', 'whatsapp');
    params.append('source', GUPSHUP_SOURCE);
    params.append('destination', toNumber);

    params.append(
      'message',
      JSON.stringify({
        type: 'text',
        text: message
      })
    );

    params.append('src.name', GUPSHUP_APP_NAME);

    const response = await axios.post(
      'https://api.gupshup.io/wa/api/v1/msg',
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': GUPSHUP_API_KEY
        }
      }
    );

    console.log(
      `✓ WhatsApp sent to ${toNumber}:`,
      response.data
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    console.error(
      `✗ WhatsApp failed to ${toNumber}:`,
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Send approved WhatsApp template message
 */
async function sendWhatsAppTemplate(toNumber, templateName, params) {
  try {

    const body = new URLSearchParams();

    body.append('channel', 'whatsapp');
    body.append('source', GUPSHUP_SOURCE);
    body.append('destination', toNumber);

    body.append(
      'message',
      JSON.stringify({
        type: 'template',
        template: {
          name: templateName,
          languageCode: 'en',
          bodyValues: params ? Object.values(params) : []
        }
      })
    );

    body.append('src.name', GUPSHUP_APP_NAME);

    const response = await axios.post(
      'https://api.gupshup.io/wa/api/v1/template/msg',
      body,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'apikey': GUPSHUP_API_KEY
        }
      }
    );

    console.log(
      `✓ WhatsApp template sent to ${toNumber}:`,
      response.data
    );

    return {
      success: true,
      data: response.data
    };

  } catch (error) {

    console.error(
      `✗ WhatsApp template failed to ${toNumber}:`,
      error.response?.data || error.message
    );

    return {
      success: false,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Send patient review request
 */
async function sendReviewRequest(
  toNumber,
  patientName,
  campaignId,
  hospitalName = 'Marwari Hospital'
) {

  // Dynamic review link
  const reviewUrl =
    `${process.env.FRONTEND_URL}/review/${campaignId}?source=whatsapp`;

  // USE APPROVED TEMPLATE HERE
  return await sendWhatsAppTemplate(
    toNumber,
    'refund'  ,
    {}
      
  );
}

/**
 * Send complaint acknowledgement
 */
async function sendComplaintAcknowledgement(
  toNumber,
  patientName
) {

  const message =
    `Dear ${patientName},\n\n` +
    `We have received your feedback and sincerely apologise for your experience.\n\n` +
    `Our management team will review your concern shortly.\n\n` +
    `Thank you for helping us improve.\n\n` +
    `_Marwari Hospital Management_`;

  return await sendWhatsAppText(
    toNumber,
    message
  );
}

module.exports = {
  sendWhatsAppText,
  sendWhatsAppTemplate,
  sendReviewRequest,
  sendComplaintAcknowledgement
};