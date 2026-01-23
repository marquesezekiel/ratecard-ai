import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type AccentColor = "primary" | "coral" | "money"

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  variant?: "default" | "outline"
  accent?: AccentColor
  emoji?: string
}

const accentStyles: Record<AccentColor, { icon: string; border: string; bg: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary",
    border: "hover:border-primary/30",
    bg: "hover:bg-primary/5",
  },
  coral: {
    icon: "bg-coral/10 text-coral",
    border: "hover:border-coral/30",
    bg: "hover:bg-coral/5",
  },
  money: {
    icon: "bg-money/10 text-money",
    border: "hover:border-money/30",
    bg: "hover:bg-money/5",
  },
}

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  variant = "default",
  accent = "primary",
  emoji
}: QuickActionCardProps) {
  const styles = accentStyles[accent]

  return (
    <Link href={href} className="block group">
      <Card className={cn(
        "h-full transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        variant === "outline" && "border-2",
        styles.border,
        styles.bg
      )}>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
              styles.icon
            )}>
              {emoji ? (
                <span className="text-xl">{emoji}</span>
              ) : (
                <Icon className="h-5 w-5" />
              )}
            </div>
            {badge && (
              <Badge variant="secondary" className="text-xs">
                {badge}
              </Badge>
            )}
          </div>
          <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
