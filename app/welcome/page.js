"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { defaultUserProfile, useUserProfile } from "../lib/user-profile";
import { readWelcomeSeen, setWelcomeSeen } from "../lib/onboarding";
import { initializeModuleProgress } from "../learn/progress-state";
import "./welcome.css";

export default function WelcomePage() {
  const router = useRouter();
  const profile = useUserProfile();

  useEffect(() => {
    if (!profile?.email || profile.email === defaultUserProfile.email) {
      router.replace("/signup");
      return;
    }

    if (readWelcomeSeen(profile.email)) {
      router.replace("/dashboard");
    }
  }, [profile.email, router]);

  function handleStart() {
    if (!profile?.email || profile.email === defaultUserProfile.email) {
      router.push("/signup");
      return;
    }

    setWelcomeSeen(profile.email);
    initializeModuleProgress("sqli");
    router.push("/learn/sqli");
  }

  const displayName =
    profile?.name?.trim() && profile.name !== defaultUserProfile.name
      ? profile.name.trim()
      : "there";

  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1 className="welcome-title">Welcome, {displayName}!</h1>
        <p className="welcome-text">
          You&apos;re all set. Start with the foundational module on{" "}
          <span className="text-bold">SQL Injection</span> to
          initialize your progress and begin tracking performance.
        </p>

        <div className="button-group">
          <button
            type="button"
            onClick={handleStart}
            className="btn-primary"
          >
            Start Module
          </button>
          <Link
            href="/dashboard"
            className="btn-secondary"
          >
            Go to Dashboard
          </Link>
        </div>

        <p className="tip-text">
          Tip: You can come back anytime from the dashboard.
        </p>
      </div>
    </div>
  );
}
