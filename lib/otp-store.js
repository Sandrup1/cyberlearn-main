import crypto from "crypto";
import clientPromise from "../app/lib/mongodb";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

function generateOtp() {
  const n = crypto.randomInt(0, 1_000_000);
  return String(n).padStart(6, "0");
}

function hashOtp(otp, salt) {
  return crypto.createHash("sha256").update(`${salt}:${otp}`).digest("hex");
}

async function getOtpCollection() {
  const client = await clientPromise;
  const db = client.db("cyberlearn");
  const collection = db.collection("email_otps");

  try {
    await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    await collection.createIndex({ email: 1 }, { unique: true });
  } catch {}

  return collection;
}

export async function deleteOtpForEmail(email) {
  const collection = await getOtpCollection();
  await collection.deleteOne({ email: normalizeEmail(email) });
}

export async function createOrReplaceOtp(payload) {
  const email = normalizeEmail(payload.email);
  const otp = generateOtp();
  const otpSalt = crypto.randomBytes(16).toString("hex");
  const otpHash = hashOtp(otp, otpSalt);

  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  const collection = await getOtpCollection();

  await collection.updateOne(
    { email },
    {
      $set: {
        email,
        otpHash,
        otpSalt,
        expiresAt,
        createdAt: now,
        payload: { ...payload, email },
        attempts: 0,
      },
    },
    { upsert: true }
  );

  return { otp, expiresAt };
}

export async function consumeOtp(args) {
  const email = normalizeEmail(args.email);
  const otp = String(args.otp ?? "").trim();
  const collection = await getOtpCollection();

  const doc = await collection.findOne({ email });
  if (!doc) return { ok: false, code: "OTP_NOT_FOUND" };

  const now = new Date();
  if (doc.expiresAt.getTime() <= now.getTime()) {
    await collection.deleteOne({ email });
    return { ok: false, code: "OTP_EXPIRED" };
  }

  const expected = hashOtp(otp, doc.otpSalt);
  if (expected !== doc.otpHash) {
    const attempts = (doc.attempts ?? 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await collection.deleteOne({ email });
      return { ok: false, code: "OTP_TOO_MANY_ATTEMPTS" };
    }
    await collection.updateOne({ email }, { $set: { attempts } });
    return { ok: false, code: "OTP_INVALID" };
  }

  return { ok: true, payload: doc.payload };
}
