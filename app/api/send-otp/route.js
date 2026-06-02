import { NextResponse } from "next/server";
import { transporter } from "../../../lib/mailer";
import clientPromise from "../../lib/mongodb";
import { createOrReplaceOtp, deleteOtpForEmail } from "../../../lib/otp-store";

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

export async function POST(req) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Please fill all fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = normalizeEmail(email);

    const client = await clientPromise;
    const db = client.db("cyberlearn");

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 }
      );
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return NextResponse.json(
        { success: false, message: "Email service is not configured" },
        { status: 500 }
      );
    }

    const { otp, expiresAt } = await createOrReplaceOtp({
      name,
      email: normalizedEmail,
      password,
    });

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: normalizedEmail,
        subject: "Your OTP Code",
        text: `Your OTP is ${otp}`,
      });
    } catch (mailError) {
      await deleteOtpForEmail(normalizedEmail);
      throw mailError;
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      expiresAt,
    });

  } catch (error) {
    console.error("Send OTP error:", error);
    return NextResponse.json({
      success: false,
      message: error.message,
    }, { status: 500 });
  }
}
