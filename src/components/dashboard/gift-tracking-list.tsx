"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Gift,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Package,
  Calendar,
  DollarSign,
  MoreVertical,
  Trash2,
  Bell,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, format, isPast, isToday } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { GiftDeal } from "@/lib/types";

interface GiftTrackingListProps {
  gifts: GiftDeal[];
  followUpsDue: GiftDeal[];
  onUpdate: (id: string, data: Partial<GiftDeal>) => Promise<GiftDeal>;
  onDelete: (id: string) => Promise<void>;
}

const STATUS_CONFIG = {
  received: {
    label: "Received",
    color: "bg-purple-100 text-purple-800",
    icon: Package,
  },
  content_created: {
    label: "Content Created",
    color: "bg-blue-100 text-blue-800",
    icon: CheckCircle2,
  },
  followed_up: {
    label: "Followed Up",
    color: "bg-amber-100 text-amber-800",
    icon: Bell,
  },
  converted: {
    label: "Converted",
    color: "bg-green-100 text-green-800",
    icon: DollarSign,
  },
  declined: {
    label: "Declined",
    color: "bg-gray-100 text-gray-600",
    icon: XCircle,
  },
  archived: {
    label: "Archived",
    color: "bg-gray-100 text-gray-500",
    icon: Clock,
  },
};

export function GiftTrackingList({
  gifts,
  followUpsDue,
  onUpdate,
  onDelete,
}: GiftTrackingListProps) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (gift: GiftDeal, newStatus: GiftDeal["status"]) => {
    setLoadingId(gift.id);
    try {
      await onUpdate(gift.id, { status: newStatus });
      toast.success(`Gift marked as ${STATUS_CONFIG[newStatus].label.toLowerCase()}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (gift: GiftDeal) => {
    if (!confirm(`Delete gift from ${gift.brandName}?`)) return;
    setLoadingId(gift.id);
    try {
      await onDelete(gift.id);
      toast.success("Gift deleted");
    } catch {
      toast.error("Failed to delete gift");
    } finally {
      setLoadingId(null);
    }
  };

  const handleMarkFollowedUp = async (gift: GiftDeal) => {
    setLoadingId(gift.id);
    try {
      await onUpdate(gift.id, { followUpSent: true, status: "followed_up" });
      toast.success("Marked as followed up");
    } catch {
      toast.error("Failed to update");
    } finally {
      setLoadingId(null);
    }
  };

  // Group gifts by status
  const activeGifts = gifts.filter(
    (g) => !["converted", "declined", "archived"].includes(g.status)
  );
  const completedGifts = gifts.filter(
    (g) => ["converted", "declined", "archived"].includes(g.status)
  );

  if (gifts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <Gift className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="text-center space-y-1">
            <h3 className="font-semibold">No gift deals yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              When brands send you free products, track them here to manage follow-ups
              and convert them to paid deals.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Follow-ups Due Alert */}
      {followUpsDue.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-amber-800 text-base">
              <Bell className="h-5 w-5" />
              {followUpsDue.length} Follow-up{followUpsDue.length > 1 ? "s" : ""} Due
            </CardTitle>
            <CardDescription className="text-amber-700">
              Time to reach out and convert these gifts to paid deals
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {followUpsDue.map((gift) => (
              <div
                key={gift.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-amber-600" />
                  <div>
                    <p className="font-medium">{gift.brandName}</p>
                    <p className="text-xs text-muted-foreground">
                      ${gift.productValue} product · {gift.followUpDate && (
                        isPast(new Date(gift.followUpDate))
                          ? `Due ${formatDistanceToNow(new Date(gift.followUpDate))} ago`
                          : isToday(new Date(gift.followUpDate))
                            ? "Due today"
                            : `Due in ${formatDistanceToNow(new Date(gift.followUpDate))}`
                      )}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleMarkFollowedUp(gift)}
                  disabled={loadingId === gift.id}
                  className="border-amber-300 text-amber-800 hover:bg-amber-100"
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Done
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Gifts */}
      {activeGifts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Active Gifts ({activeGifts.length})
          </h3>
          <div className="grid gap-3">
            {activeGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                isLoading={loadingId === gift.id}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNavigate={() => router.push(`/dashboard/gifts/${gift.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Completed Gifts */}
      {completedGifts.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Completed ({completedGifts.length})
          </h3>
          <div className="grid gap-3">
            {completedGifts.map((gift) => (
              <GiftCard
                key={gift.id}
                gift={gift}
                isLoading={loadingId === gift.id}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                onNavigate={() => router.push(`/dashboard/gifts/${gift.id}`)}
                isCompleted
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GiftCardProps {
  gift: GiftDeal;
  isLoading: boolean;
  onStatusChange: (gift: GiftDeal, status: GiftDeal["status"]) => void;
  onDelete: (gift: GiftDeal) => void;
  onNavigate: () => void;
  isCompleted?: boolean;
}

function GiftCard({
  gift,
  isLoading,
  onStatusChange,
  onDelete,
  onNavigate,
  isCompleted = false,
}: GiftCardProps) {
  const status = STATUS_CONFIG[gift.status];
  const StatusIcon = status.icon;

  return (
    <Card className={cn("transition-all", isLoading && "opacity-50", isCompleted && "bg-muted/30")}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Info */}
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", status.color)}>
              <StatusIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold truncate">{gift.brandName}</h4>
                <Badge variant="outline" className={cn("text-xs", status.color)}>
                  {status.label}
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="font-mono">${gift.productValue}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(gift.dateReceived || gift.createdAt), "MMM d")}
                </span>
                {gift.convertedAmount && (
                  <>
                    <span>·</span>
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      Converted: ${gift.convertedAmount}
                    </span>
                  </>
                )}
              </div>
              {gift.productDescription && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {gift.productDescription}
                </p>
              )}
            </div>
          </div>

          {/* Right: Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isLoading}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onNavigate}>
                <ExternalLink className="h-4 w-4 mr-2" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {gift.status === "received" && (
                <DropdownMenuItem onClick={() => onStatusChange(gift, "content_created")}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Content Created
                </DropdownMenuItem>
              )}
              {gift.status === "content_created" && (
                <DropdownMenuItem onClick={() => onStatusChange(gift, "followed_up")}>
                  <Bell className="h-4 w-4 mr-2" />
                  Mark Followed Up
                </DropdownMenuItem>
              )}
              {!["converted", "declined"].includes(gift.status) && (
                <>
                  <DropdownMenuItem onClick={() => onStatusChange(gift, "converted")}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Mark Converted
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(gift, "declined")}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Mark Declined
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(gift)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
