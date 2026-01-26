"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Check, Trash2, Bookmark, Zap, FileText, Loader2 } from "lucide-react";
import { useRateCards } from "@/hooks/use-rate-cards";
import { trackEvent } from "@/lib/analytics";

// Legacy interface for backwards compatibility
export interface SavedRate {
  id: string;
  name: string;
  platform: string;
  format: string;
  usageRights: string;
  price: number;
  createdAt: string;
}

// Legacy localStorage save function for backwards compatibility with share-actions
// TODO: Migrate share-actions to use API-based saving via useRateCards hook
export function saveRate(rate: Omit<SavedRate, "id" | "createdAt">) {
  const savedRates = JSON.parse(localStorage.getItem("savedRates") || "[]") as SavedRate[];
  const newRate: SavedRate = {
    ...rate,
    id: `rate-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  savedRates.push(newRate);
  localStorage.setItem("savedRates", JSON.stringify(savedRates));
  return newRate;
}

interface SavedRatesProps {
  onQuickQuote?: () => void;
  onUploadBrief?: () => void;
}

export function SavedRates({ onQuickQuote, onUploadBrief }: SavedRatesProps) {
  const { rateCards, isLoading, isError, updateRateCard, deleteRateCard } = useRateCards();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const copyRate = async (rateCard: typeof rateCards[0]) => {
    const text = `$${rateCard.finalRate} for ${rateCard.contentFormat} on ${rateCard.platform}`;
    await navigator.clipboard.writeText(text);
    setCopiedId(rateCard.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;

    setDeletingId(confirmDeleteId);
    setConfirmDeleteId(null);
    try {
      await deleteRateCard(confirmDeleteId);
      trackEvent("rate_deleted", { rateId: confirmDeleteId });
    } catch (error) {
      console.error("Failed to delete rate card:", error);
    } finally {
      setDeletingId(null);
    }
  };

  const rateToDelete = rateCards.find((r) => r.id === confirmDeleteId);

  const startEditing = (rateCard: typeof rateCards[0]) => {
    setEditingId(rateCard.id);
    setEditName(rateCard.name);
  };

  const saveEdit = async (id: string) => {
    try {
      await updateRateCard(id, { name: editName });
    } catch (error) {
      console.error("Failed to update rate card:", error);
    }
    setEditingId(null);
    setEditName("");
  };

  // Loading state
  if (isLoading) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <div role="status" aria-label="Loading saved rates">
            <Loader2 className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3 animate-spin" aria-hidden="true" />
            <p className="text-muted-foreground">Loading your saved rates...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (isError) {
    return (
      <Card className="border-dashed border-destructive/50">
        <CardContent className="py-8 text-center">
          <Bookmark className="h-8 w-8 text-destructive/50 mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground mb-4">
            Failed to load saved rates. Please try refreshing the page.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (rateCards.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" aria-hidden="true" />
          <p className="text-muted-foreground mb-4">
            No saved rates yet. Generate a quote and save it for quick access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onQuickQuote && (
              <Button onClick={onQuickQuote}>
                <Zap className="mr-2 h-4 w-4" aria-hidden="true" />
                Quick Quote
              </Button>
            )}
            {onUploadBrief && (
              <Button variant="outline" onClick={onUploadBrief}>
                <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
                Upload Brief
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bookmark className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <CardTitle>Saved Rates</CardTitle>
          </div>
          <div className="flex gap-2">
            {onQuickQuote && (
              <Button variant="ghost" size="sm" onClick={onQuickQuote} className="h-10 sm:h-9">
                <Zap className="mr-1 h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Quick Quote</span>
                <span className="sm:hidden">Quote</span>
              </Button>
            )}
            {onUploadBrief && (
              <Button variant="ghost" size="sm" onClick={onUploadBrief} className="h-10 sm:h-9">
                <FileText className="mr-1 h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Upload Brief</span>
                <span className="sm:hidden">Upload</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rateCards.map((rateCard) => (
          <div
            key={rateCard.id}
            className={`flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors ${
              deletingId === rateCard.id ? "opacity-50" : ""
            }`}
          >
            <div className="flex-1 min-w-0">
              {editingId === rateCard.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(rateCard.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(rateCard.id)}
                  className="h-8"
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- Intentional for inline editing UX
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => startEditing(rateCard)}
                  className="font-medium text-left hover:text-primary transition-colors"
                >
                  {rateCard.name}
                </button>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {rateCard.platform} · {rateCard.contentFormat}
                {rateCard.brandName && ` · ${rateCard.brandName}`}
              </p>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 ml-2 sm:ml-4">
              <span className="text-base sm:text-lg font-bold font-mono">
                ${rateCard.finalRate.toLocaleString()}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-9 sm:w-9"
                onClick={() => copyRate(rateCard)}
                aria-label={copiedId === rateCard.id ? "Copied to clipboard" : `Copy rate for ${rateCard.name}`}
              >
                {copiedId === rateCard.id ? (
                  <Check className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                ) : (
                  <Copy className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 sm:h-9 sm:w-9 text-muted-foreground hover:text-destructive"
                onClick={() => handleDeleteClick(rateCard.id)}
                disabled={deletingId === rateCard.id}
                aria-label={`Delete rate for ${rateCard.name}`}
              >
                {deletingId === rateCard.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmDeleteId !== null}
        onOpenChange={(open) => !open && setConfirmDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this rate?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{" "}
              <strong>&quot;{rateToDelete?.name}&quot;</strong>. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
