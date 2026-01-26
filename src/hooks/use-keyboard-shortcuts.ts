"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export interface KeyboardShortcut {
  key: string;
  description: string;
  category: "navigation" | "actions" | "help";
}

export const SHORTCUTS: KeyboardShortcut[] = [
  { key: "?", description: "Show keyboard shortcuts", category: "help" },
  { key: "g h", description: "Go to Home", category: "navigation" },
  { key: "g i", description: "Go to Inbox", category: "navigation" },
  { key: "g r", description: "Go to Rates", category: "navigation" },
  { key: "g p", description: "Go to Profile", category: "navigation" },
  { key: "n", description: "New rate card", category: "actions" },
  { key: "Escape", description: "Close modal/sheet", category: "actions" },
];

const SHORTCUT_ROUTES: Record<string, string> = {
  "g h": "/dashboard",
  "g i": "/dashboard/analyze",
  "g r": "/dashboard/rates",
  "g p": "/dashboard/profile",
  n: "/quick-calculate",
};

const KEY_SEQUENCE_TIMEOUT = 1000; // ms to wait for second key

interface UseKeyboardShortcutsOptions {
  onShowHelp?: () => void;
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  onShowHelp,
  enabled = true,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();
  const [keySequence, setKeySequence] = useState<string[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetSequence = useCallback(() => {
    setKeySequence([]);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const isInFormField = useCallback((element: EventTarget | null): boolean => {
    if (!element || !(element instanceof HTMLElement)) return false;

    const tagName = element.tagName.toLowerCase();
    const isEditable =
      tagName === "input" ||
      tagName === "textarea" ||
      tagName === "select" ||
      element.isContentEditable;

    return isEditable;
  }, []);

  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent) {
      // Don't trigger in form fields
      if (isInFormField(event.target)) {
        resetSequence();
        return;
      }

      // Don't trigger if modifier keys are held (except Shift for ?)
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }

      const key = event.key;

      // Handle Escape separately (let it bubble for modals)
      if (key === "Escape") {
        resetSequence();
        return;
      }

      // Handle ? for help
      if (key === "?" && onShowHelp) {
        event.preventDefault();
        onShowHelp();
        resetSequence();
        return;
      }

      // Handle single-key shortcuts
      if (key === "n") {
        event.preventDefault();
        router.push(SHORTCUT_ROUTES.n);
        resetSequence();
        return;
      }

      // Handle multi-key sequences
      if (key === "g") {
        event.preventDefault();
        setKeySequence(["g"]);
        // Set timeout for second key
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(resetSequence, KEY_SEQUENCE_TIMEOUT);
        return;
      }

      // Check if we're in a sequence
      if (keySequence.length > 0 && keySequence[0] === "g") {
        event.preventDefault();
        const fullSequence = `g ${key}`;

        if (fullSequence in SHORTCUT_ROUTES) {
          router.push(SHORTCUT_ROUTES[fullSequence]);
        }
        resetSequence();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, onShowHelp, router, keySequence, resetSequence, isInFormField]);

  return {
    shortcuts: SHORTCUTS,
    currentSequence: keySequence,
  };
}
