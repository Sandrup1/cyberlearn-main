import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import clientPromise from "../../lib/mongodb";
import { consumeOtp, deleteOtpForEmail } from "../../../lib/otp-store";

export async function POST(req) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, message: "Missing fields" },
        { status: 400 }
      );
    }

    const result = await consumeOtp({ email, otp });
    if (!result.ok) {
      const messageMap = {
        OTP_NOT_FOUND: "OTP not found. Please request a new OTP.",
        OTP_EXPIRED: "OTP expired. Please request a new OTP.",
        OTP_INVALID: "Invalid OTP.",
        OTP_TOO_MANY_ATTEMPTS: "Too many attempts. Please request a new OTP.",
      };
      const statusMap = {
        OTP_NOT_FOUND: 404,
        OTP_EXPIRED: 410,
        OTP_INVALID: 401,
        OTP_TOO_MANY_ATTEMPTS: 429,
      };

      return NextResponse.json(
        { success: false, message: messageMap[result.code] ?? "OTP verification failed" },
        { status: statusMap[result.code] ?? 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("cyberlearn");

    const normalizedEmail = String(result.payload.email).trim().toLowerCase();

    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      await deleteOtpForEmail(normalizedEmail);
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(result.payload.password, 10);

    await db.collection("users").insertOne({
      name: result.payload.name,
      email: normalizedEmail,
      password: hashedPassword,
      createdAt: new Date(),
    });

    await deleteOtpForEmail(normalizedEmail);

    return NextResponse.json(
      { success: true, message: "Signup successful" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Verify OTP error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
