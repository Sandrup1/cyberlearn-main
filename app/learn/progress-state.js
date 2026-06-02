"use client";

import { useMemo, useSyncExternalStore } from "react";
import { readUserProfile, profileUpdatedEvent, defaultUserProfile } from "../lib/user-profile";

function getModuleProgressKey() {
  if (typeof window === "undefined") return "cyberlearn:module-progress";
  try {
    const profile = readUserProfile();
    if (profile && profile.email && profile.email !== defaultUserProfile.email) {
      return `cyberlearn:module-progress:${profile.email}`;
    }
  } catch {}
  return "cyberlearn:module-progress";
}

const progressUpdatedEvent = "cyberlearn:module-progress-updated";
const recentActivityUpdatedEvent = "cyberlearn:recent-activity-updated";
const performanceUpdatedEvent = "cyberlearn:performance-updated";

function getRecentActivityKey() {
  if (typeof window === "undefined") return "cyberlearn:recent-activity";
  try {
    const profile = readUserProfile();
    if (profile && profile.email && profile.email !== defaultUserProfile.email) {
      return `cyberlearn:recent-activity:${profile.email}`;
    }
  } catch {}
  return "cyberlearn:recent-activity";
}

function getPerformanceKey() {
  if (typeof window === "undefined") return "cyberlearn:performance";
  try {
    const profile = readUserProfile();
    if (profile && profile.email && profile.email !== defaultUserProfile.email) {
      return `cyberlearn:performance:${profile.email}`;
    }
  } catch {}
  return "cyberlearn:performance";
}

const moduleAliases = {
  "sqli-module": "sqli",
};

const legacyLabKeys = {
  csrf: {
    lab1: "cyberlearn:csrf-lab1-solved",
  },
};

export const moduleProgressRequirements = {
  sqli: { labIds: ["lab1", "lab2", "lab3", "lab4"] },
  xss: { labIds: ["lab1", "lab2"] },
  csrf: { labIds: ["lab1", "lab2", "lab3"] },
  xxe: { labIds: ["lab1", "lab2"] },
};

function normalizeModuleId(moduleId) {
  return moduleAliases[moduleId] || moduleId;
}

function readStoredProgress() {
  if (typeof window === "undefined") return {};

  try {
    const rawProgress = window.localStorage.getItem(getModuleProgressKey());
    return rawProgress ? JSON.parse(rawProgress) : {};
  } catch {
    return {};
  }
}

function readRecentActivity() {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(getRecentActivityKey());
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRecentActivity(next) {
  window.localStorage.setItem(getRecentActivityKey(), JSON.stringify(next));
  window.dispatchEvent(new Event(recentActivityUpdatedEvent));
}

function pushRecentActivity(entry) {
  if (typeof window === "undefined") return;

  const now = entry.createdAt || new Date().toISOString();
  const id = `${now}:${entry.type}:${entry.moduleId}:${Math.random()
    .toString(16)
    .slice(2)}`;
  const nextEntry = { ...entry, id, createdAt: now };
  const existing = readRecentActivity();

  const last = existing[0];
  if (last) {
    const lastTime = Date.parse(last.createdAt);
    const nowTime = Date.parse(now);
    const withinTwoMinutes =
      Number.isFinite(lastTime) &&
      Number.isFinite(nowTime) &&
      nowTime - lastTime < 2 * 60 * 1000;

    if (withinTwoMinutes) {
      const sameCore =
        last.type === nextEntry.type &&
        last.moduleId === nextEntry.moduleId &&
        last.status === nextEntry.status &&
        (last.type !== "lab" || last.labId === nextEntry.labId) &&
        (last.type !== "video" ||
          last.videoTitle === nextEntry.videoTitle);

      if (sameCore) {
        return;
      }
    }
  }

  const capped = [nextEntry, ...existing].slice(0, 25);
  writeRecentActivity(capped);
}

function readPerformance() {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(getPerformanceKey());
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writePerformance(next) {
  window.localStorage.setItem(getPerformanceKey(), JSON.stringify(next));
  window.dispatchEvent(new Event(performanceUpdatedEvent));

  const profile = readUserProfile();
  if (profile && profile.email && profile.email !== defaultUserProfile.email) {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, performance: next }),
    }).catch(console.error);
  }
}

let isSyncing = false;
let lastSyncedEmail = "";

async function syncProgressDown(email) {
  if (isSyncing || lastSyncedEmail === email) return;
  isSyncing = true;
  try {
    const res = await fetch(`/api/progress?email=${encodeURIComponent(email)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.progress && Object.keys(data.progress).length > 0) {
        const key = `cyberlearn:module-progress:${email}`;
        const localDataRaw = window.localStorage.getItem(key);
        let merged = { ...data.progress };
        if (localDataRaw) {
          try {
            const localData = JSON.parse(localDataRaw);
            merged = { ...localData, ...data.progress };
          } catch {}
        }
        window.localStorage.setItem(key, JSON.stringify(merged));
        window.dispatchEvent(new Event(progressUpdatedEvent));
      }

      if (data.performance && Object.keys(data.performance).length > 0) {
        const key = `cyberlearn:performance:${email}`;
        const localDataRaw = window.localStorage.getItem(key);
        let merged = { ...data.performance };
        if (localDataRaw) {
          try {
            const localData = JSON.parse(localDataRaw);
            merged = { ...localData, ...data.performance };
          } catch {}
        }
        window.localStorage.setItem(key, JSON.stringify(merged));
        window.dispatchEvent(new Event(performanceUpdatedEvent));
      }
      lastSyncedEmail = email;
    }
  } catch (e) {
    console.error("Failed to sync progress down", e);
  } finally {
    isSyncing = false;
  }
}

function writeStoredProgress(progress) {
  window.localStorage.setItem(getModuleProgressKey(), JSON.stringify(progress));
  window.dispatchEvent(new Event(progressUpdatedEvent));

  const profile = readUserProfile();
  if (profile && profile.email && profile.email !== defaultUserProfile.email) {
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.email, progress }),
    }).catch(console.error);
  }
}

export function initializeModuleProgress(moduleId) {
  if (typeof window === "undefined") return;

  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId] || {};
  const now = new Date().toISOString();

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    startedAt: existingModuleProgress.startedAt || now,
    lastVisitedAt: now,
  };

  writeStoredProgress(progress);
}

export function markModuleVisited(moduleId) {
  if (typeof window === "undefined") return;

  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId];

  if (!existingModuleProgress) {
    initializeModuleProgress(resolvedModuleId);
    return;
  }

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    lastVisitedAt: new Date().toISOString(),
  };

  writeStoredProgress(progress);
}

export function markModuleLabStarted(moduleId) {
  if (typeof window === "undefined") return;

  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId] || {};
  const now = new Date().toISOString();

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    startedAt: existingModuleProgress.startedAt || now,
    lastVisitedAt: now,
    labsStartedAt: existingModuleProgress.labsStartedAt || now,
  };

  writeStoredProgress(progress);
}

export function markLabAttempted(moduleId, labId) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  pushRecentActivity({
    type: "lab",
    moduleId: resolvedModuleId,
    labId,
    status: "attempted",
  });

  const now = new Date().toISOString();
  const performance = readPerformance();
  const modulePerf = performance[resolvedModuleId] || {};
  const labs = { ...(modulePerf.labs || {}) };
  const existingLab = labs[labId] || { attempts: [] };
  const attempts = [...(existingLab.attempts || []), { labId, createdAt: now }].slice(-50);
  labs[labId] = {
    ...existingLab,
    attempts,
  };

  performance[resolvedModuleId] = {
    ...modulePerf,
    labs,
  };

  writePerformance(performance);
}

export function markModuleVideoWatched(moduleId, videoTitle) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  pushRecentActivity({
    type: "video",
    moduleId: resolvedModuleId,
    videoTitle,
    status: "watched",
  });
}

function readLegacyLabSolved(moduleId, labId) {
  if (typeof window === "undefined") return false;

  const profile = readUserProfile();
  const canUseLegacy =
    !profile?.email || profile.email === defaultUserProfile.email;

  if (!canUseLegacy) return false;

  const key = legacyLabKeys[moduleId]?.[labId];
  return key ? window.localStorage.getItem(key) === "true" : false;
}

function subscribeToProgress(callback) {
  window.addEventListener("storage", callback);
  window.addEventListener("focus", callback);
  window.addEventListener(progressUpdatedEvent, callback);
  window.addEventListener(recentActivityUpdatedEvent, callback);
  window.addEventListener(performanceUpdatedEvent, callback);
  
  const handleProfileChange = () => {
    callback();
    const profile = readUserProfile();
    if (profile && profile.email && profile.email !== defaultUserProfile.email) {
      syncProgressDown(profile.email);
    } else {
      lastSyncedEmail = "";
    }
  };
  
  window.addEventListener(profileUpdatedEvent, handleProfileChange);

  if (typeof window !== "undefined") {
    const profile = readUserProfile();
    if (profile && profile.email && profile.email !== defaultUserProfile.email) {
      syncProgressDown(profile.email);
    }
  }

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("focus", callback);
    window.removeEventListener(progressUpdatedEvent, callback);
    window.removeEventListener(recentActivityUpdatedEvent, callback);
    window.removeEventListener(performanceUpdatedEvent, callback);
    window.removeEventListener(profileUpdatedEvent, handleProfileChange);
  };
}

function readProgressVersion() {
  if (typeof window === "undefined") return "";

  const profile = readUserProfile();
  const canUseLegacy =
    !profile?.email || profile.email === defaultUserProfile.email;

  const legacyValues = canUseLegacy
    ? Object.values(legacyLabKeys)
        .flatMap((labs) => Object.values(labs))
        .map((key) => `${key}:${window.localStorage.getItem(key) || ""}`)
        .join("|")
    : "";

  const recentRaw = window.localStorage.getItem(getRecentActivityKey()) || "";
  const perfRaw = window.localStorage.getItem(getPerformanceKey()) || "";
  return `${window.localStorage.getItem(getModuleProgressKey()) || ""}|${legacyValues}|${recentRaw}|${perfRaw}`;
}

function emptyModuleProgress(moduleId) {
  const totalLabs = moduleProgressRequirements[moduleId]?.labIds.length || 0;
  const totalItems = totalLabs + 1;

  return {
    percent: 0,
    completedItems: 0,
    totalItems,
    quizCompleted: false,
    quizScore: null,
    quizTotal: null,
    quizAttempts: 0,
    quizPassScore: 6,
    labStarted: false,
    labCompleted: false,
    solvedLabs: 0,
    totalLabs,
  };
}

export function getModuleProgress(moduleId) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  const requirements = moduleProgressRequirements[resolvedModuleId];

  if (!requirements) return emptyModuleProgress(resolvedModuleId);

  const moduleProgress = readStoredProgress()[resolvedModuleId] || {};
  const labs = moduleProgress.labs || {};
  const solvedLabs = requirements.labIds.filter(
    (labId) => labs[labId] || readLegacyLabSolved(resolvedModuleId, labId)
  ).length;
  const quizCompleted = Boolean(moduleProgress.quiz?.completed);
  const completedItems = solvedLabs + (quizCompleted ? 1 : 0);
  const totalItems = requirements.labIds.length + 1;
  const labCompleted = requirements.labIds.length > 0 && solvedLabs >= requirements.labIds.length;
  const labStarted = Boolean(moduleProgress.labsStartedAt) || solvedLabs > 0;

  return {
    percent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    completedItems,
    totalItems,
    quizCompleted,
    quizScore: moduleProgress.quiz?.score ?? null,
    quizTotal: moduleProgress.quiz?.total ?? null,
    quizAttempts: moduleProgress.quiz?.attempts ?? 0,
    quizPassScore: moduleProgress.quiz?.passScore ?? 6,
    labStarted,
    labCompleted,
    solvedLabs,
    totalLabs: requirements.labIds.length,
  };
}

export function saveModuleQuizResult(moduleId, score, total) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId] || {};
  const existingScore = existingModuleProgress.quiz?.score ?? -1;
  const bestScore = Math.max(existingScore, score);
  const attempts = (existingModuleProgress.quiz?.attempts ?? 0) + 1;
  const now = new Date().toISOString();

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    startedAt: existingModuleProgress.startedAt || now,
    lastVisitedAt: now,
    quiz: {
      score: bestScore,
      total,
      completed: bestScore > 6,
      updatedAt: now,
      attempts,
      lastScoreOutOfTen: score,
    },
  };

  writeStoredProgress(progress);
}

export function saveModuleQuizLevelResult(
  moduleId,
  levelId,
  score,
  total,
  scoreOutOfTen,
  passScore,
  passed,
  allLevelsPassed
) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId] || {};
  const existingQuiz = existingModuleProgress.quiz;
  const existingLevel = existingQuiz?.levels?.[levelId];
  const bestScoreOutOfTen = Math.max(existingLevel?.scoreOutOfTen ?? -1, scoreOutOfTen);
  const attempts = (existingQuiz?.attempts ?? 0) + 1;
  const now = new Date().toISOString();
  const nextLevels = {
    ...existingQuiz?.levels,
    [levelId]: {
      score,
      total,
      scoreOutOfTen: bestScoreOutOfTen,
      passed: passed || Boolean(existingLevel?.passed),
      updatedAt: now,
    },
  };
  const levelResults = Object.values(nextLevels);
  const bestOverallScore = Math.max(
    existingQuiz?.score ?? -1,
    ...levelResults.map((level) => level.scoreOutOfTen)
  );

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    startedAt: existingModuleProgress.startedAt || now,
    lastVisitedAt: now,
    quiz: {
      score: bestOverallScore,
      total: 10,
      completed: allLevelsPassed || Boolean(existingQuiz?.completed),
      updatedAt: now,
      attempts,
      lastScoreOutOfTen: scoreOutOfTen,
      passScore,
      levels: nextLevels,
    },
  };

  writeStoredProgress(progress);

  pushRecentActivity({
    type: "quiz",
    moduleId: resolvedModuleId,
    status: passed ? "passed" : "failed",
  });

  const performance = readPerformance();
  const modulePerf = performance[resolvedModuleId] || {};
  const quizzes = modulePerf.quizzes || { overallAttempts: 0, levels: {} };
  const levels = { ...(quizzes.levels || {}) };
  const existingLevelPerf = levels[levelId] || { attempts: [] };

  const nextAttempt = {
    score,
    total,
    scoreOutOfTen,
    passed,
    levelId,
    createdAt: now,
  };

  const nextAttempts = [...(existingLevelPerf.attempts || []), nextAttempt].slice(-50);
  levels[levelId] = { attempts: nextAttempts };

  performance[resolvedModuleId] = {
    ...modulePerf,
    quizzes: {
      overallAttempts: (quizzes.overallAttempts || 0) + 1,
      levels,
    },
  };

  writePerformance(performance);
}

export function markModuleLabSolved(moduleId, labId) {
  const resolvedModuleId = normalizeModuleId(moduleId);
  const progress = readStoredProgress();
  const existingModuleProgress = progress[resolvedModuleId] || {};
  const now = new Date().toISOString();

  progress[resolvedModuleId] = {
    ...existingModuleProgress,
    startedAt: existingModuleProgress.startedAt || now,
    lastVisitedAt: now,
    labs: {
      ...existingModuleProgress.labs,
      [labId]: true,
    },
  };

  writeStoredProgress(progress);

  pushRecentActivity({
    type: "lab",
    moduleId: resolvedModuleId,
    labId,
    status: "completed",
  });

  const performance = readPerformance();
  const modulePerf = performance[resolvedModuleId] || {};
  const labs = { ...(modulePerf.labs || {}) };
  const existingLab = labs[labId] || { attempts: [] };

  labs[labId] = {
    ...existingLab,
    completedAt: now,
  };

  performance[resolvedModuleId] = {
    ...modulePerf,
    labs,
  };

  writePerformance(performance);
}

export function useModuleProgressDetails(moduleIds) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    const stored = version === "" ? {} : readStoredProgress();

    return moduleIds.map((moduleId) => {
      const resolvedModuleId = normalizeModuleId(moduleId);
      const moduleStored = stored[resolvedModuleId];

      return {
        moduleId: resolvedModuleId,
        progress:
          version === "" ? emptyModuleProgress(resolvedModuleId) : getModuleProgress(resolvedModuleId),
        startedAt: moduleStored?.startedAt ?? null,
        lastVisitedAt: moduleStored?.lastVisitedAt ?? null,
      };
    });
  }, [moduleIds, version]);
}

export function useModuleProgress(moduleId) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    if (version === "") {
      return emptyModuleProgress(normalizeModuleId(moduleId));
    }

    return getModuleProgress(moduleId);
  }, [moduleId, version]);
}

export function useModuleLabSolved(moduleId, labId) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    if (version === "") {
      return false;
    }

    const resolvedModuleId = normalizeModuleId(moduleId);
    const moduleProgress = readStoredProgress()[resolvedModuleId];
    return Boolean(
      moduleProgress?.labs?.[labId] || readLegacyLabSolved(resolvedModuleId, labId)
    );
  }, [moduleId, labId, version]);
}

export function useModuleQuizLevels(moduleId) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    if (version === "") {
      return {};
    }

    const resolvedModuleId = normalizeModuleId(moduleId);
    return readStoredProgress()[resolvedModuleId]?.quiz?.levels || {};
  }, [moduleId, version]);
}

export function useOverallProgress(moduleIds) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    const moduleProgress = moduleIds.map((moduleId) => {
      if (version === "") {
        return emptyModuleProgress(normalizeModuleId(moduleId));
      }

      return getModuleProgress(moduleId);
    });
    const completedItems = moduleProgress.reduce(
      (total, progress) => total + progress.completedItems,
      0
    );
    const totalItems = moduleProgress.reduce(
      (total, progress) => total + progress.totalItems,
      0
    );
    const completedModules = moduleProgress.filter(
      (progress) => progress.completedItems === progress.totalItems
    ).length;

    return {
      percent: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
      completedItems,
      totalItems,
      completedModules,
      totalModules: moduleIds.length,
    };
  }, [moduleIds, version]);
}

export function useRecentActivity(limit = 8) {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    if (version === "") return [];
    return readRecentActivity().slice(0, Math.max(0, limit));
  }, [limit, version]);
}

export function usePerformanceData() {
  const version = useSyncExternalStore(
    subscribeToProgress,
    readProgressVersion,
    () => ""
  );

  return useMemo(() => {
    if (version === "") return {};
    return readPerformance();
  }, [version]);
}
