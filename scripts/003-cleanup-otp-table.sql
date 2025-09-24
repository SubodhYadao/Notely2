-- Remove OTP verification table since we're using password-based auth
DROP TABLE IF EXISTS otp_verifications;
