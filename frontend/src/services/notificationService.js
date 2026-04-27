// notificationService.js
// Sends SMS notifications via the Supabase Edge Function (send-sms).
// Twilio credentials live exclusively server-side as Supabase secrets.

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Formats a phone number for display in an SMS message body.
 * Strips everything except digits and leading +.
 */
const sanitizePhone = (phone) => phone.replace(/[^\d+]/g, '');

/**
 * Sends a booking confirmation SMS to the user.
 *
 * @param {Object} params
 * @param {string} params.phone       - Recipient phone number (E.164 preferred, e.g. +15550001234)
 * @param {string} params.roomName    - Name of the booked room
 * @param {string} params.building    - Building name
 * @param {string} params.date        - Human-readable date string (e.g. "Mon, Apr 28")
 * @param {string} params.startTime   - Human-readable start time (e.g. "2:00 PM")
 * @param {string} params.endTime     - Human-readable end time   (e.g. "3:00 PM")
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const sendBookingConfirmationSms = async ({
  phone,
  roomName,
  building,
  date,
  startTime,
  endTime,
}) => {
  if (!phone) return { success: false, error: 'No phone number provided.' };
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn('Supabase config missing — SMS skipped.');
    return { success: false, error: 'Service not configured.' };
  }

  const to = sanitizePhone(phone);
  const body =
    `✅ Roominate Booking Confirmed!\n\n` +
    `📍 ${roomName} — ${building}\n` +
    `📅 ${date}\n` +
    `⏰ ${startTime} – ${endTime}\n\n` +
    `Reply STOP to opt out.`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, body }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('SMS send error:', data);
      return { success: false, error: data.error || 'Failed to send SMS.' };
    }

    return { success: true };
  } catch (err) {
    console.error('SMS network error:', err);
    return { success: false, error: 'Network error — SMS not sent.' };
  }
};

/**
 * Sends a booking cancellation SMS to the user.
 *
 * @param {Object} params
 * @param {string} params.phone       - Recipient phone number
 * @param {string} params.roomName    - Name of the cancelled room
 * @param {string} params.building    - Building name
 * @param {string} params.date        - Human-readable date string
 * @param {string} params.startTime   - Human-readable start time
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const sendCancellationSms = async ({
  phone,
  roomName,
  building,
  date,
  startTime,
}) => {
  if (!phone) return { success: false, error: 'No phone number provided.' };
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { success: false, error: 'Service not configured.' };
  }

  const to = sanitizePhone(phone);
  const body =
    `❌ Roominate Booking Cancelled\n\n` +
    `📍 ${roomName} — ${building}\n` +
    `📅 ${date} at ${startTime}\n\n` +
    `You can rebook anytime at Roominate.`;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ to, body }),
    });

    const data = await response.json();
    if (!response.ok) return { success: false, error: data.error || 'Failed to send SMS.' };
    return { success: true };
  } catch (err) {
    console.error('SMS network error:', err);
    return { success: false, error: 'Network error — SMS not sent.' };
  }
};

/**
 * Sends a booking confirmation Email to the user.
 * (Placeholder stub — requires an email provider like SendGrid or AWS SES)
 *
 * @param {Object} params
 * @param {string} params.email       - Recipient email address
 * @param {string} params.roomName    - Name of the booked room
 * @param {string} params.building    - Building name
 * @param {string} params.date        - Human-readable date string
 * @param {string} params.startTime   - Human-readable start time
 * @param {string} params.endTime     - Human-readable end time
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export const sendBookingConfirmationEmail = async ({
  email,
  roomName,
  building,
  date,
  startTime,
  endTime,
}) => {
  if (!email) return { success: false, error: 'No email provided.' };
  
  console.log(`📧 Email confirmation placeholder: To ${email} for ${roomName}`);
  
  // To implement this, you would create a second Supabase Edge Function 
  // (e.g. 'send-email') that calls an email provider API.
  
  return { success: true };
};
