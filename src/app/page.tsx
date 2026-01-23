import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles, Zap, ArrowRight, FileText, TrendingUp, Star, MessageSquare, Check, User, Download } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground animate-sparkle" />
              </div>
              <span className="text-lg font-bold tracking-tight">RateCard.AI</span>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Asymmetric on Desktop */}
      <section className="pt-24 lg:pt-32 pb-16 lg:pb-24 px-4 sm:px-6 lg:px-8 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          {/* Mobile: Simple gradient */}
          <div className="lg:hidden absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />

          {/* Desktop: Animated blobs */}
          <div className="hidden lg:block absolute top-20 right-0 w-1/2 h-full">
            <div className="absolute top-1/4 right-12 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-1/2 right-32 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
          </div>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            {/* Left - Copy */}
            <div className="text-center lg:text-left animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary mb-6">
                <Zap className="h-4 w-4" />
                100% free for creators
              </div>

              {/* Main headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-display font-bold tracking-tight leading-[1.1]">
                stop guessing.
                <br />
                <span className="text-gradient">start charging.</span>
              </h1>

              {/* Subhead */}
              <p className="mt-6 text-lg lg:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Get a professional rate card in 30 seconds.
                Know exactly what to charge brands—and justify every dollar.
              </p>

              {/* CTA */}
              <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Link href="/quote">
                  <Button size="xl" className="w-full sm:w-auto text-lg px-8">
                    Get Your Rate — Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              <p className="mt-4 text-sm text-muted-foreground">
                No credit card. No catch. Just clarity.
              </p>
            </div>

            {/* Right - Visual element (rate card preview) */}
            <div className="hidden lg:block relative animate-slide-up">
              {/* Fake rate card preview */}
              <div className="relative">
                {/* Main card */}
                <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                    <div>
                      <div className="font-bold">@maya.creates</div>
                      <div className="text-sm text-muted-foreground">18.5K followers</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Instagram Reel</span>
                      <span className="font-bold text-lg font-money">$425</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">TikTok Video</span>
                      <span className="font-bold text-lg font-money">$380</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Story Bundle (3x)</span>
                      <span className="font-bold text-lg font-money">$275</span>
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <TrendingUp className="h-4 w-4" />
                      Based on 4.2% engagement rate
                    </div>
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -left-4 bg-money text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg animate-bounce-subtle">
                  +40% vs average
                </div>
                <div className="absolute -bottom-4 -right-4 bg-card border border-border/50 px-4 py-2 rounded-full text-sm shadow-lg flex items-center gap-2">
                  <Star className="h-4 w-4 text-energy fill-energy" />
                  <span className="font-medium">Fit score: 92</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - 2 Hero Features */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
            Everything you need to get paid fairly
          </h2>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* Feature 1: Message Analyzer - Primary Feature */}
            <Card className="p-6 md:p-8 border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:shadow-lg transition-all hover:-translate-y-1">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                  <MessageSquare className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-display font-semibold">
                  Analyze Any Brand Message
                </h3>
                <p className="text-muted-foreground">
                  Paste a DM or email. We&apos;ll tell you if it&apos;s legit, what to charge,
                  and give you a response to copy-paste.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    Detects gift offers vs paid opportunities
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    Spots scams and red flags
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary" />
                    </div>
                    Generates ready-to-send responses
                  </li>
                </ul>
              </div>
            </Card>

            {/* Feature 2: Rate Cards - Secondary Feature with coral accent */}
            <Card className="p-6 md:p-8 border-2 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-coral/30">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-xl bg-coral/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-coral" />
                </div>
                <h3 className="text-xl font-display font-semibold">
                  Professional Rate Cards
                </h3>
                <p className="text-muted-foreground">
                  Generate a PDF rate card you can send to any brand. Backed by real
                  market data so you never undercharge.
                </p>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-coral/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-coral" />
                    </div>
                    10+ pricing factors calculated
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-coral/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-coral" />
                    </div>
                    Negotiation talking points included
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-coral/10 flex items-center justify-center">
                      <Check className="h-3 w-3 text-coral" />
                    </div>
                    Looks like it came from an agency
                  </li>
                </ul>
              </div>
            </Card>
          </div>

          {/* Link to see all features */}
          <p className="text-center mt-8 text-muted-foreground">
            Plus gift deal tracking, contract scanning, brand vetting, and more.
          </p>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">
            Get your rate in 60 seconds
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Tell us about you",
                description: "Platform, followers, engagement rate",
                icon: User,
                delay: "delay-100",
              },
              {
                step: "02",
                title: "Describe the deal",
                description: "Content type, usage rights, timeline",
                icon: FileText,
                delay: "delay-200",
              },
              {
                step: "03",
                title: "Get your rate card",
                description: "Download a PDF ready to send",
                icon: Download,
                delay: "delay-300",
              },
            ].map((item) => (
              <div key={item.step} className={`text-center space-y-4 animate-fade-in ${item.delay}`}>
                <div className="mx-auto h-16 w-16 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25">
                  <item.icon className="h-8 w-8" />
                </div>
                <div className="text-4xl font-display font-bold text-primary/20">
                  {item.step}
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Bold on Desktop */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="relative rounded-3xl bg-primary overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 bg-grid opacity-10" />

            <div className="relative px-8 py-16 lg:px-16 lg:py-20">
              <div className="max-w-2xl">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-primary-foreground">
                  ready to know your worth?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl">
                  Join creators who stopped underselling and started getting paid what they deserve.
                </p>
                <div className="mt-8">
                  <Link href="/quote">
                    <Button size="xl" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg">
                      Get Your Rate — Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer with Social Proof */}
      <footer className="py-12 border-t border-border/40 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          {/* Social proof stats - more creator-native styling */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="text-center space-y-1">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary">10K+</div>
              <div className="text-sm text-muted-foreground">rate cards generated</div>
            </div>
            <div className="text-center space-y-1">
              <div className="text-3xl md:text-4xl font-display font-bold font-money text-money">$2.4M</div>
              <div className="text-sm text-muted-foreground">in rates calculated</div>
            </div>
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-1">
                <span className="text-3xl md:text-4xl font-display font-bold">4.9</span>
                <Star className="h-6 w-6 text-energy fill-energy" />
              </div>
              <div className="text-sm text-muted-foreground">creator rating</div>
            </div>
          </div>

          {/* Creator-style social proof */}
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="flex -space-x-2">
              {/* Avatar placeholders - represents real creator community */}
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 border-2 border-background" />
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-400 border-2 border-background" />
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-400 border-2 border-background" />
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 border-2 border-background" />
            </div>
            <span className="text-sm text-muted-foreground">
              Trusted by creators like <span className="font-medium text-foreground">@maya.creates</span>
            </span>
          </div>

          {/* Footer links */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">RateCard.AI</span>
            </div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <a href="mailto:hello@ratecard.ai" className="hover:text-foreground transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
