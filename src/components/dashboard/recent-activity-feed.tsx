import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Gift, MessageSquare, ChevronRight } from "lucide-react"
import { DealBadge } from "@/components/ui/deal-badge"

export interface Activity {
  id: string
  type: "rate_card" | "gift" | "message"
  title: string
  subtitle?: string
  timestamp: Date
  dealQuality?: "excellent" | "good" | "fair" | "caution"
  isGift?: boolean
}

// Get the link for each activity type
function getActivityLink(activity: Activity): string | null {
  switch (activity.type) {
    case "rate_card":
      return `/dashboard/rate-cards/${activity.id}`
    case "gift":
      return `/dashboard/gifts`
    default:
      return null
  }
}

function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSecs < 60) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return "yesterday"
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

const iconMap = {
  rate_card: FileText,
  gift: Gift,
  message: MessageSquare,
}

export function RecentActivityFeed({ activities }: { activities: Activity[] }) {
  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <div className="text-4xl mb-3">✨</div>
          <p className="font-medium">No deals yet - but you&apos;re about to change that</p>
          <p className="text-sm text-muted-foreground mt-1">
            Paste a brand DM above to see what you should charge.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0 divide-y">
        {activities.map((activity) => {
          const Icon = iconMap[activity.type]
          const link = getActivityLink(activity)

          const content = (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.title}</p>
                {activity.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{activity.subtitle}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {activity.dealQuality && (
                  <DealBadge type="quality" value={activity.dealQuality} />
                )}
                {activity.isGift && (
                  <DealBadge type="gift" value={true} />
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </time>
              {link && (
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </>
          )

          if (link) {
            return (
              <Link
                key={activity.id}
                href={link}
                className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors"
              >
                {content}
              </Link>
            )
          }

          return (
            <div key={activity.id} className="flex items-center gap-3 p-4">
              {content}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
