"use client";

import { defaultUserProfile } from "./user-profile";

function getWelcomeSeenKey(email) {
  const normalized = (email || "").trim().toLowerCase();
  if (!normalized || normalized === defaultUserProfile.email) {
    return "cyberlearn:welcome-seen";
  }

  return `cyberlearn:welcome-seen:${normalized}`;
}

export function readWelcomeSeen(email) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(getWelcomeSeenKey(email)) === "true";
}

export function setWelcomeSeen(email) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getWelcomeSeenKey(email), "true");
}

export function clearWelcomeSeen(email) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(getWelcomeSeenKey(email));
}
