"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, User, LogOut, Sparkles, Bookmark } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Core navigation - minimal, no redundancy
const navItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/dashboard/rates", label: "My Rates", icon: Bookmark },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

function getInitials(name: string | undefined | null): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

// Desktop top nav link
function TopNavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
        isActive
          ? "bg-accent text-foreground font-semibold"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

// Mobile bottom nav link
function BottomNavLink({
  href,
  label,
  icon: Icon,
  isActive,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 press",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200",
          isActive && "bg-primary/10"
        )}
      >
        <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
      </div>
      <span className={cn("text-[10px] font-medium", isActive && "text-primary")}>
        {label}
      </span>
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-primary animate-sparkle" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop Top Navigation */}
      <header className="hidden lg:block sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold tracking-tight">RateCard.AI</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <TopNavLink
                  key={item.href}
                  {...item}
                  isActive={isActive(item.href)}
                />
              ))}
            </nav>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 rounded-xl">
                  <Avatar className="h-8 w-8 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                      {getInitials(user?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline text-sm font-medium">
                    {user?.name || "Creator"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-semibold">{user?.name || "Creator"}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="rounded-lg">
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="rounded-lg text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Mobile Header */}
      <header className="flex h-16 items-center justify-between border-b border-border/40 bg-card px-4 lg:hidden">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold">RateCard.AI</span>
        </Link>

        <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Page Content */}
      <main className="pb-24 lg:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex lg:hidden items-center justify-around bg-card border-t border-border/40 px-2 py-2 safe-area-bottom">
        {navItems.map((item) => (
          <BottomNavLink
            key={item.href}
            {...item}
            isActive={isActive(item.href)}
          />
        ))}
      </nav>
    </div>
  );
}
