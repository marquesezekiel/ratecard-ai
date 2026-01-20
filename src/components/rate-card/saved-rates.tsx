"use client";

import { useState, useEffect, startTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Trash2, Bookmark, Zap, FileText } from "lucide-react";

export interface SavedRate {
  id: string;
  name: string;
  platform: string;
  format: string;
  usageRights: string;
  price: number;
  createdAt: string;
}

interface SavedRatesProps {
  onQuickQuote?: () => void;
  onUploadBrief?: () => void;
}

export function SavedRates({ onQuickQuote, onUploadBrief }: SavedRatesProps) {
  const [rates, setRates] = useState<SavedRate[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    startTransition(() => {
      const saved = localStorage.getItem("savedRates");
      if (saved) {
        setRates(JSON.parse(saved));
      }
    });
  }, []);

  const saveRates = (newRates: SavedRate[]) => {
    setRates(newRates);
    localStorage.setItem("savedRates", JSON.stringify(newRates));
  };

  const copyRate = async (rate: SavedRate) => {
    const text = `$${rate.price} for ${rate.format} on ${rate.platform} (${rate.usageRights})`;
    await navigator.clipboard.writeText(text);
    setCopiedId(rate.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const deleteRate = (id: string) => {
    saveRates(rates.filter(r => r.id !== id));
  };

  const startEditing = (rate: SavedRate) => {
    setEditingId(rate.id);
    setEditName(rate.name);
  };

  const saveEdit = (id: string) => {
    saveRates(rates.map(r => r.id === id ? { ...r, name: editName } : r));
    setEditingId(null);
    setEditName("");
  };

  if (rates.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <Bookmark className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">
            No saved rates yet. Generate a quote and save it for quick access.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onQuickQuote && (
              <Button onClick={onQuickQuote}>
                <Zap className="mr-2 h-4 w-4" />
                Quick Quote
              </Button>
            )}
            {onUploadBrief && (
              <Button variant="outline" onClick={onUploadBrief}>
                <FileText className="mr-2 h-4 w-4" />
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bookmark className="h-5 w-5 text-primary" />
            </div>
            <CardTitle>Saved Rates</CardTitle>
          </div>
          <div className="flex gap-2">
            {onQuickQuote && (
              <Button variant="ghost" size="sm" onClick={onQuickQuote}>
                <Zap className="mr-1 h-4 w-4" />
                Quick Quote
              </Button>
            )}
            {onUploadBrief && (
              <Button variant="ghost" size="sm" onClick={onUploadBrief}>
                <FileText className="mr-1 h-4 w-4" />
                Upload Brief
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {rates.map((rate) => (
          <div
            key={rate.id}
            className="flex items-center justify-between rounded-xl border border-border/50 p-3 hover:bg-muted/30 transition-colors"
          >
            <div className="flex-1 min-w-0">
              {editingId === rate.id ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEdit(rate.id)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(rate.id)}
                  className="h-8"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => startEditing(rate)}
                  className="font-medium text-left hover:text-primary transition-colors"
                >
                  {rate.name}
                </button>
              )}
              <p className="text-xs text-muted-foreground truncate">
                {rate.platform} · {rate.format} · {rate.usageRights}
              </p>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <span className="text-lg font-bold">${rate.price}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => copyRate(rate)}
              >
                {copiedId === rate.id ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => deleteRate(rate.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Helper function to save a new rate (call this from results pages)
export function saveRate(rate: Omit<SavedRate, "id" | "createdAt">) {
  const saved = localStorage.getItem("savedRates");
  const rates: SavedRate[] = saved ? JSON.parse(saved) : [];

  const newRate: SavedRate = {
    ...rate,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  rates.unshift(newRate);
  localStorage.setItem("savedRates", JSON.stringify(rates.slice(0, 20))); // Keep max 20

  return newRate;
}
