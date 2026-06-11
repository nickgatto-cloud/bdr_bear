"use client";

import { useEffect, useRef, useState } from "react";

/** localStorage keys for the persisted call session. Bump the suffix to invalidate. */
export const CALL_STATE_KEY = "togal-call-coach:call:v1";
export const FANT_CHECKS_KEY = "togal-call-coach:fant-checks:v1";

/** Wipe the whole persisted call so a Reset starts clean. */
export function clearPersistedCall() {
  try {
    window.localStorage.removeItem(CALL_STATE_KEY);
    window.localStorage.removeItem(FANT_CHECKS_KEY);
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * useState that mirrors itself to localStorage.
 *
 * SSR-safe: the first render (server + client) always uses `initial`, so there's
 * no hydration mismatch. The persisted value is loaded in an effect after mount,
 * and writes are suppressed until that load has run so we never clobber storage
 * with the default before reading it.
 */
export function usePersistedState<T>(key: string, initial: T | (() => T)) {
  const [state, setState] = useState<T>(initial);
  const loaded = useRef(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) setState(JSON.parse(raw) as T);
    } catch {
      /* ignore */
    }
    loaded.current = true;
  }, [key]);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [key, state]);

  return [state, setState] as const;
}
