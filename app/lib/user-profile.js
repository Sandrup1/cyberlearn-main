"use client";

import { useSyncExternalStore } from "react";

export const profileStorageKey = "cyberlearn:user-profile";
export const profileUpdatedEvent = "cyberlearn:user-profile-updated";

export const defaultUserProfile = {
  name: "CyberLearn Student",
  email: "student@cyberlearn.local",
  role: "Student",
  title: "Cybersecurity Learner",
  organization: "CyberLearn AI",
  timezone: "Asia/Calcutta",
  memberSince: new Date().getFullYear().toString(),
  emailNotifications: true,
  labReminders: true,
  weeklyDigest: true,
  twoFactorEnabled: false,
};

let cachedRawProfile;
let cachedProfile = defaultUserProfile;

function removeEmptyValues(profile) {
  return Object.fromEntries(
    Object.entries(profile).filter(([, value]) => value !== undefined)
  );
}

function normalizeProfile(profile) {
  const cleanProfile = removeEmptyValues(profile);

  return {
    ...defaultUserProfile,
    ...cleanProfile,
    name: cleanProfile.name?.trim() || defaultUserProfile.name,
    email: cleanProfile.email?.trim() || defaultUserProfile.email,
  };
}

export function readUserProfile() {
  if (typeof window === "undefined") {
    return defaultUserProfile;
  }

  const rawProfile = window.localStorage.getItem(profileStorageKey);

  if (rawProfile === cachedRawProfile && cachedProfile) {
    return cachedProfile;
  }

  try {
    cachedRawProfile = rawProfile;

    if (!rawProfile) {
      cachedProfile = defaultUserProfile;
      return cachedProfile;
    }

    cachedProfile = normalizeProfile(
      JSON.parse(rawProfile)
    );
    return cachedProfile;
  } catch {
    cachedProfile = defaultUserProfile;
    return cachedProfile;
  }
}

export function saveUserProfile(profile) {
  const nextProfile = normalizeProfile({
    ...readUserProfile(),
    ...profile,
  });

  const serializedProfile = JSON.stringify(nextProfile);
  cachedRawProfile = serializedProfile;
  cachedProfile = nextProfile;

  window.localStorage.setItem(profileStorageKey, serializedProfile);
  window.dispatchEvent(
    new CustomEvent(profileUpdatedEvent, { detail: nextProfile })
  );

  return nextProfile;
}

export function clearUserProfile() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(profileStorageKey);
  cachedRawProfile = null;
  cachedProfile = defaultUserProfile;
  window.dispatchEvent(
    new CustomEvent(profileUpdatedEvent, {
      detail: defaultUserProfile,
    })
  );
}

export function getProfileInitials(profile) {
  const source = profile.name || profile.email || "User";
  const parts = source
    .replace(/@.*/, "")
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function useUserProfile() {
  return useSyncExternalStore(
    subscribeToProfile,
    readUserProfile,
    () => defaultUserProfile
  );
}

function subscribeToProfile(onStoreChange) {
  function handleStorage(event) {
    if (event.key === profileStorageKey) {
      onStoreChange();
    }
  }

  window.addEventListener(profileUpdatedEvent, onStoreChange);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(profileUpdatedEvent, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}
