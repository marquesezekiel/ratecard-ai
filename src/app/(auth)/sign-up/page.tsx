"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { trackEvent } from "@/lib/analytics";

export default function SignUpPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const hasTrackedStart = useRef(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Track signup start once
  useEffect(() => {
    if (!hasTrackedStart.current && !authLoading && !isAuthenticated) {
      trackEvent('signup_start');
      hasTrackedStart.current = true;
    }
  }, [authLoading, isAuthenticated]);

  // Redirect authenticated users
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check if user has completed onboarding
      fetch("/api/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.quickSetupComplete) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        })
        .catch(() => {
          // If profile fetch fails, redirect to onboarding
          router.push("/onboarding");
        });
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        email,
        password,
        name,
      });

      if (result.error) {
        setError(result.error.message || "Failed to create account");
        setIsLoading(false);
        return;
      }

      // Track successful signup
      trackEvent('signup_complete', { source: 'email' });

      // Clear any existing profile data so new users start fresh
      localStorage.removeItem("creatorProfile");

      // Use full page navigation to ensure cookies are properly attached
      // Redirect to onboarding for new users
      window.location.href = "/onboarding";
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
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
    <div className="min-h-screen flex">
      {/* Left Panel - Branding (desktop only) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary to-primary/90 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 bg-grid opacity-10" />

        <div className="relative flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">RateCard.AI</span>
          </div>

          {/* Main content */}
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight">
                Stop underselling
                <br />
                yourself.
              </h1>
              <p className="mt-4 text-lg text-white/70 max-w-md">
                Join creators who know their worth—and get paid for it.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-white/60" />
                <span>100% free forever for basic use</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-white/60" />
                <span>Professional PDF rate cards</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-white/60" />
                <span>Multi-factor pricing algorithm</span>
              </div>
              <div className="flex items-center gap-3 text-white/80">
                <CheckCircle2 className="h-5 w-5 text-white/60" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <p className="text-sm text-white/50">
            Built for creators with 1K-100K followers
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background lg:bg-muted/30">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="flex flex-col items-center space-y-3 lg:hidden">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
              <Sparkles className="h-7 w-7 text-primary-foreground animate-sparkle" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">RateCard.AI</h1>
          </div>

          {/* Form card */}
          <div className="bg-card rounded-2xl p-8 shadow-xl border-0 lg:shadow-2xl animate-fade-in">
            <div className="space-y-2 text-center lg:text-left mb-6">
              <h2 className="text-2xl font-bold">Create your account</h2>
              <p className="text-muted-foreground">
                time to get paid what you&apos;re worth
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl animate-fade-in">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  What should we call you?
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name or creator handle"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Type it again"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Let&apos;s go
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
