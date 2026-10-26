import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_MESSAGING_SERVICE_SID;

let twilioClient: twilio.Twilio | null = null;

if (accountSid && authToken && accountSid.startsWith('AC')) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('[Twilio] Initialized Twilio client successfully with Account SID:', accountSid.slice(0, 6) + '...');
  } catch (err) {
    console.error('[Twilio] Failed to initialize Twilio client:', err);
  }
} else {
  console.log('[Twilio] Credentials not set or placeholder. Operating in honest fallback mode.');
}

export interface SmsDispatchResult {
  to: string;
  name?: string;
  success: boolean;
  provider: 'twilio' | 'twilio_simulated' | 'fallback_link';
  status: 'sent' | 'simulated' | 'failed';
  messageSid?: string;
  error?: string;
  timestamp: string;
}

/**
 * Normalizes South African phone numbers to E.164 (+27XXXXXXXXX).
 */
export function normalizeSouthAfricanPhone(phone: string): string {
  // Strip spaces, dashes, brackets
  let cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // If starts with 0 (e.g. 0821234567), replace with +27821234567
  if (/^0[1-9]\d{8}$/.test(cleaned)) {
    return '+27' + cleaned.slice(1);
  }
  // If starts with 27 without +
  if (/^27[1-9]\d{8}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  // If already in + format
  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  return cleaned;
}

export async function sendEmergencySms({
  to,
  name,
  pseudonym,
  campusZone,
  trackingUrl,
  batteryLevel
}: {
  to: string;
  name?: string;
  pseudonym: string;
  campusZone: string;
  trackingUrl: string;
  batteryLevel?: number;
}): Promise<SmsDispatchResult> {
  const normalizedPhone = normalizeSouthAfricanPhone(to);
  const now = new Date().toISOString();

  const batteryText = typeof batteryLevel === 'number' ? `Battery: ${batteryLevel}%. ` : '';
  const messageBody = `[SafeBand ZA EMERGENCY] Lifeline Alert: ${pseudonym} triggered a high-priority distress signal near ${campusZone}. ${batteryText}Live real-time tracker: ${trackingUrl} (Valid for 2 hours). Response teams notified.`;

  // Check if Twilio client is live with active credentials
  if (twilioClient && fromPhone) {
    try {
      const message = await twilioClient.messages.create({
        body: messageBody,
        to: normalizedPhone,
        from: fromPhone
      });

      console.log(`[Twilio SMS Sent] SID: ${message.sid} to ${normalizedPhone}`);
      return {
        to: normalizedPhone,
        name,
        success: true,
        provider: 'twilio',
        status: 'sent',
        messageSid: message.sid,
        timestamp: now
      };
    } catch (err: any) {
      console.error(`[Twilio SMS Error] Failed to send to ${normalizedPhone}:`, err.message);
      return {
        to: normalizedPhone,
        name,
        success: false,
        provider: 'twilio',
        status: 'failed',
        error: err.message || 'Twilio carrier dispatch error',
        timestamp: now
      };
    }
  }

  // Graceful honest fallback when credentials are not configured in .env
  console.log(`[Twilio Simulated] No carrier credentials for ${normalizedPhone}. Msg: "${messageBody}"`);
  return {
    to: normalizedPhone,
    name,
    success: true,
    provider: 'twilio_simulated',
    status: 'simulated',
    error: 'TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured in server .env. Carrier dispatch simulated; client fallback links available.',
    timestamp: now
  };
}

export function isTwilioConfigured(): boolean {
  return !!(twilioClient && fromPhone);
}
