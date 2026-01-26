"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Menu, User, Gift, FileSearch, Shield, LogOut, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface MenuSheetProps {
  onSignOut: () => void
}

export function MenuSheet({ onSignOut }: MenuSheetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [toolsOpen, setToolsOpen] = useState(false)
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false)

  const mainMenuItems = [
    { href: "/dashboard/profile", icon: User, label: "Profile" },
    { href: "/dashboard/gifts", icon: Gift, label: "Gift Deals" },
  ]

  const toolItems = [
    { href: "/dashboard/tools/brand-vetter", icon: Shield, label: "Brand Vetter" },
    { href: "/dashboard/tools/contract-scanner", icon: FileSearch, label: "Contract Scanner" },
  ]

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Open menu"
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 text-muted-foreground min-w-[44px]"
        >
          <div className="flex items-center justify-center w-11 h-11 rounded-xl">
            <Menu className="h-5 w-5" aria-hidden="true" />
          </div>
          <span className="text-[10px] font-medium" aria-hidden="true">Menu</span>
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>Menu</SheetTitle>
        </SheetHeader>
        <nav aria-label="Menu navigation" className="grid gap-2 py-4">
          {mainMenuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              aria-current={pathname === item.href ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg",
                "hover:bg-accent transition-colors",
                pathname === item.href && "bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}

          {/* Tools section - collapsible and de-emphasized */}
          <Collapsible open={toolsOpen} onOpenChange={setToolsOpen}>
            <CollapsibleTrigger
              aria-expanded={toolsOpen}
              className="flex items-center justify-between w-full px-4 py-3 rounded-lg text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              <span className="text-sm">More Tools</span>
              <ChevronRight
                className={cn(
                  "h-4 w-4 transition-transform",
                  toolsOpen && "rotate-90"
                )}
                aria-hidden="true"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 pt-1">
              {toolItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleLinkClick}
                  aria-current={pathname === item.href ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm",
                    "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
                    pathname === item.href && "bg-accent/50 text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>

          <hr className="my-2" />
          <button
            onClick={() => setShowSignOutConfirm(true)}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full text-left min-h-[44px]"
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            <span>Sign Out</span>
          </button>
        </nav>
      </SheetContent>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You&apos;ll need to sign in again to access your rate cards and saved
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSignOutConfirm(false)
                handleLinkClick()
                onSignOut()
              }}
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  )
}
