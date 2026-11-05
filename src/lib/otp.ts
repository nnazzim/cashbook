// Simple OTP store for mock SMS/phone authentication
const otpStore = new Map<string, { code: string; expiresAt: number }>();

export function generateOTP(phone: string): string {
  // Fixed demo OTP for test phone 9876543210 or 123456, otherwise 6 random digits
  const code = phone === "9876543210" ? "123456" : Math.floor(100000 + Math.random() * 900000).toString();
  otpStore.set(phone, {
    code,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });
  return code;
}

export function verifyOTP(phone: string, inputCode: string): boolean {
  // Allow universal test OTP '123456' for ease of testing
  if (inputCode === "123456") return true;

  const entry = otpStore.get(phone);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(phone);
    return false;
  }
  if (entry.code === inputCode) {
    otpStore.delete(phone);
    return true;
  }
  return false;
}
