"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveUserProfile } from "../lib/user-profile";
import styles from "./signup.module.css";

export default function Signup() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [stage, setStage] = useState("form");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);
  const [resendCooldownUntil, setResendCooldownUntil] = useState(0);

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!form.name || !form.email || !form.password) {
      setMessage("Please fill all fields");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setExpiresAt(data.expiresAt ?? null);
        setStage("otp");
        setOtp("");
        setResendCooldownUntil(Date.now() + 30000);
        setMessage("OTP sent. Please check your email.");
      } else {
        setMessage(data.message ?? "Failed to send OTP");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setMessage("Enter the OTP");
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage(data.message ?? "OTP verification failed");
        return;
      }

      saveUserProfile({
        name: form.name,
        email: form.email,
        memberSince: new Date().getFullYear().toString(),
      });

      router.push("/welcome");
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (Date.now() < resendCooldownUntil) return;

    try {
      setLoading(true);
      setMessage(null);

      const res = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        setExpiresAt(data.expiresAt ?? null);
        setOtp("");
        setResendCooldownUntil(Date.now() + 30000);
        setMessage("OTP resent. Please check your email.");
      } else {
        setMessage(data.message ?? "Failed to resend OTP");
      }
    } catch {
      setMessage("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const resendDisabled = loading || Date.now() < resendCooldownUntil;

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>Create Account</h1>

        {message ? (
          <div className={styles.message}>
            {message}
          </div>
        ) : null}

        <form onSubmit={handleSendOtp} className={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            className={styles.input}
            disabled={loading || stage === "otp"}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
            }
          />

          <input
            type="email"
            placeholder="Email"
            className={styles.input}
            disabled={loading || stage === "otp"}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
          />

          <input
            type="password"
            placeholder="Password"
            className={styles.input}
            disabled={loading || stage === "otp"}
            onChange={(e) =>
              setForm({ ...form, password: e.target.value })
            }
          />

          <button
            className={styles.registerButton}
            disabled={loading}
          >
            {loading ? "Please wait..." : "Register"}
          </button>
        </form>

        {stage === "otp" && (
          <div className={styles.otpBox}>
            <div className={styles.otpTitle}>
              Enter OTP
            </div>

            {expiresAt && (
              <div className={styles.expiry}>
                Expires at: {new Date(expiresAt).toLocaleTimeString()}
              </div>
            )}

            <input
              className={styles.otpInput}
              inputMode="numeric"
              placeholder="6-digit OTP"
              value={otp}
              maxLength={6}
              disabled={loading}
              onChange={(e) =>
                setOtp(e.target.value.replace(/\D/g, ""))
              }
            />

            <button
              type="button"
              className={styles.verifyButton}
              disabled={loading}
              onClick={handleVerifyOtp}
            >
              Verify OTP
            </button>

            <button
              type="button"
              className={styles.resendButton}
              disabled={resendDisabled}
              onClick={handleResendOtp}
            >
              Resend OTP
            </button>
          </div>
        )}

        <p className={styles.loginText}>
          Already have an account?{" "}
          <a href="/login" className={styles.loginLink}>
            Login
          </a>
        </p>
      </div>
    </div>
  );
}