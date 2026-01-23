import { Card, CardContent } from "@/components/ui/card"
import { FileText, Gift, MessageSquare } from "lucide-react"

export interface Activity {
  id: string
  type: "rate_card" | "gift" | "message"
  title: string
  subtitle?: string
  timestamp: Date
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
          return (
            <div key={activity.id} className="flex items-center gap-3 p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                <Icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{activity.title}</p>
                {activity.subtitle && (
                  <p className="text-sm text-muted-foreground truncate">{activity.subtitle}</p>
                )}
              </div>
              <time className="text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeTime(activity.timestamp)}
              </time>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
