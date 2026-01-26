"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SHORTCUTS, type KeyboardShortcut } from "@/hooks/use-keyboard-shortcuts";
import { Keyboard } from "lucide-react";

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function ShortcutKey({ shortcut }: { shortcut: string }) {
  const keys = shortcut.split(" ");

  return (
    <span className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && (
            <span className="text-muted-foreground text-xs">then</span>
          )}
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono font-medium text-muted-foreground bg-muted border border-border rounded">
            {key === "Escape" ? "Esc" : key}
          </kbd>
        </span>
      ))}
    </span>
  );
}

function ShortcutRow({ shortcut }: { shortcut: KeyboardShortcut }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm">{shortcut.description}</span>
      <ShortcutKey shortcut={shortcut.key} />
    </div>
  );
}

function ShortcutCategory({
  title,
  shortcuts,
}: {
  title: string;
  shortcuts: KeyboardShortcut[];
}) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="space-y-1">
      <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
        {title}
      </h3>
      <div className="divide-y divide-border/50">
        {shortcuts.map((shortcut) => (
          <ShortcutRow key={shortcut.key} shortcut={shortcut} />
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  const navigationShortcuts = SHORTCUTS.filter((s) => s.category === "navigation");
  const actionShortcuts = SHORTCUTS.filter((s) => s.category === "actions");
  const helpShortcuts = SHORTCUTS.filter((s) => s.category === "help");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" aria-hidden="true" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Navigate faster with these keyboard shortcuts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <ShortcutCategory title="Navigation" shortcuts={navigationShortcuts} />
          <ShortcutCategory title="Actions" shortcuts={actionShortcuts} />
          <ShortcutCategory title="Help" shortcuts={helpShortcuts} />
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Press <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted border border-border rounded">Esc</kbd> or click outside to close
        </p>
      </DialogContent>
    </Dialog>
  );
}
