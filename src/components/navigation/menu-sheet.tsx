"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Menu, User, Gift, FileSearch, Shield, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface MenuSheetProps {
  onSignOut: () => void
}

export function MenuSheet({ onSignOut }: MenuSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const menuItems = [
    { href: "/dashboard/profile", icon: User, label: "Profile" },
    { href: "/dashboard/gifts", icon: Gift, label: "Gift Deals" },
    { href: "/dashboard/tools/brand-vetter", icon: Shield, label: "Brand Vetter" },
    { href: "/dashboard/tools/contract-scanner", icon: FileSearch, label: "Contract Scanner" },
  ]

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 text-muted-foreground">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl">
            <Menu className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 py-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                "hover:bg-accent transition-colors",
                pathname === item.href && "bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <hr className="my-2" />
          <button
            onClick={() => {
              handleLinkClick()
              onSignOut()
            }}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full text-left"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
