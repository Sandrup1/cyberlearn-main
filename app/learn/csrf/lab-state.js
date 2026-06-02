"use client";

import { markModuleLabSolved, useModuleLabSolved } from "../progress-state";

export const csrfLab1SolvedStorageKey = "cyberlearn:csrf-lab1-solved";

const csrfLab1SolvedEvent = "cyberlearn:csrf-lab1-solved-updated";

export function markCsrfLab1Solved() {
  window.localStorage.setItem(csrfLab1SolvedStorageKey, "true");
  markModuleLabSolved("csrf", "lab1");
  window.dispatchEvent(new Event(csrfLab1SolvedEvent));
}

export function useCsrfLab1Solved() {
  return useModuleLabSolved("csrf", "lab1");
}
