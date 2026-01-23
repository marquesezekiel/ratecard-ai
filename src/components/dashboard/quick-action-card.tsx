import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { type LucideIcon } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface QuickActionCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  variant?: "default" | "outline"
}

export function QuickActionCard({
  href,
  icon: Icon,
  title,
  description,
  badge,
  variant = "default"
}: QuickActionCardProps) {
  return (
    <Link href={href} className="block">
      <Card className={cn(
        "h-full transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]",
        variant === "outline" && "border-2"
      )}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
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
