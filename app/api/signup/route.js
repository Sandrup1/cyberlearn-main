export async function POST(req) {
  // Deprecated: signup now requires OTP verification.
  await req.json().catch(() => null);
  return Response.json(
    { message: "Signup requires OTP. Use /api/send-otp then /api/verify-otp." },
    { status: 410 }
  );
}
