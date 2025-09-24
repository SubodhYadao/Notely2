import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import nodemailer from "nodemailer"

const sql = neon(process.env.DATABASE_URL!)

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: "gmail", // You can change this to other services
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD, // Use App Password for Gmail
    },
  })
}

// Alternative configuration for custom SMTP
const createCustomTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number.parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

const sendOTPEmail = async (email: string, otp: string, name: string) => {
  try {
    const transporter = process.env.SMTP_HOST ? createCustomTransporter() : createTransporter()

    const mailOptions = {
      from: {
        name: "HD Notes App",
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER!,
      },
      to: email,
      subject: "Your OTP for HD Notes App",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your OTP Code</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 40px 20px; text-align: center;">
              <div style="display: inline-flex; align-items: center; gap: 8px; margin-bottom: 16px;">
                <div style="width: 32px; height: 32px; background-color: #ffffff; border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                  <div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%;"></div>
                </div>
                <span style="color: #ffffff; font-size: 24px; font-weight: bold;">HD</span>
              </div>
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Verify Your Email</h1>
            </div>

            <!-- Content -->
            <div style="padding: 40px 20px;">
              <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 24px;">Hello ${name}!</h2>
              
              <p style="color: #6b7280; margin: 0 0 24px 0; font-size: 16px; line-height: 1.5;">
                Thank you for signing up for HD Notes App. To complete your registration, please use the verification code below:
              </p>

              <!-- OTP Code -->
              <div style="background-color: #f8fafc; border: 2px dashed #e5e7eb; border-radius: 8px; padding: 32px; text-align: center; margin: 32px 0;">
                <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Your verification code</p>
                <div style="font-size: 36px; font-weight: bold; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${otp}
                </div>
                <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">This code will expire in 10 minutes</p>
              </div>

              <p style="color: #6b7280; margin: 24px 0 0 0; font-size: 14px; line-height: 1.5;">
                If you didn't request this verification code, please ignore this email or contact our support team if you have concerns.
              </p>

              <!-- Security Notice -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 4px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Security Notice:</strong> Never share this code with anyone. HD Notes App will never ask for your verification code via phone or email.
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © 2024 HD Notes App. All rights reserved.
              </p>
              <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
                This email was sent to ${email}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${name}!

Thank you for signing up for HD Notes App. 

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this verification code, please ignore this email.

Best regards,
HD Notes App Team
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log("Email sent successfully:", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error: any) {
    console.error("Email sending failed:", error)
    return { success: false, error: error.message }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, dateOfBirth } = await request.json()

    if (!email || !name || !dateOfBirth) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    // Validate email format
    if (!/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 })
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes from now

    // Store OTP in database
    await sql`
      INSERT INTO otp_verifications (email, otp, expires_at, user_data)
      VALUES (${email}, ${otp}, ${expires}, ${JSON.stringify({ name, dateOfBirth, email })})
      ON CONFLICT (email) 
      DO UPDATE SET 
        otp = ${otp}, 
        expires_at = ${expires}, 
        user_data = ${JSON.stringify({ name, dateOfBirth, email })},
        created_at = CURRENT_TIMESTAMP
    `

    // Send OTP via email
    const emailResult = await sendOTPEmail(email, otp, name)

    if (!emailResult.success) {
      // If email sending fails, still return success but log the error
      console.error("Failed to send OTP email:", emailResult.error)

      // In development, you might want to return the OTP for testing
      if (process.env.NODE_ENV === "development") {
        return NextResponse.json({
          message: "OTP generated but email sending failed (development mode)",
          debug: { otp, emailError: emailResult.error },
        })
      }

      return NextResponse.json({ error: "Failed to send OTP email. Please try again." }, { status: 500 })
    }

    return NextResponse.json({
      message: "OTP sent successfully to your email",
      // Remove debug info in production
      ...(process.env.NODE_ENV === "development" && { debug: { otp } }),
    })
  } catch (error) {
    console.error("Send OTP error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
