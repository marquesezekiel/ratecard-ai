import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, Zap, ArrowRight, DollarSign, Clock, FileText, ChevronRight, TrendingUp, Shield, Star } from "lucide-react";

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
        {/* Background decoration - visible on desktop */}
        <div className="hidden lg:block absolute top-20 right-0 w-1/2 h-full">
          <div className="absolute top-1/4 right-12 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 right-32 w-64 h-64 bg-primary/10 rounded-full blur-2xl" />
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-[1.1]">
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
                <Link href="/sign-up">
                  <Button size="xl" className="w-full sm:w-auto text-lg px-8">
                    Create Your Rate Card
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
                      <span className="font-bold text-lg">$425</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">TikTok Video</span>
                      <span className="font-bold text-lg">$380</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-border/50">
                      <span className="text-muted-foreground">Story Bundle (3x)</span>
                      <span className="font-bold text-lg">$275</span>
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

      {/* Features - Bento Grid on Desktop */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="mx-auto max-w-7xl">
          {/* Section header - left aligned on desktop */}
          <div className="max-w-2xl mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Pricing that <span className="text-gradient">makes sense</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              We built the algorithm you wish you had when that first brand slid into your DMs.
            </p>
          </div>

          {/* Bento grid */}
          <div className="grid gap-4 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Big feature - spans 2 cols on desktop */}
            <div className="md:col-span-2 lg:col-span-2 rounded-3xl bg-primary p-8 lg:p-10 text-primary-foreground hover-scale">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                <div className="flex-1">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 mb-6">
                    <DollarSign className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl lg:text-3xl font-bold mb-3">6-Layer Pricing Engine</h3>
                  <p className="text-lg opacity-90 max-w-md">
                    Not just followers × some number. We factor in engagement, niche, content format, usage rights, and more.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 lg:max-w-xs">
                  {["Base Rate", "Engagement", "Format", "Fit Score", "Usage Rights", "Complexity"].map((layer) => (
                    <span key={layer} className="px-3 py-1.5 rounded-full bg-white/10 text-sm font-medium">
                      {layer}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick quotes */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 hover-scale">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-energy/10 mb-5">
                <Clock className="h-6 w-6 text-energy" />
              </div>
              <h3 className="text-xl font-bold mb-2">30-Second Quotes</h3>
              <p className="text-muted-foreground">
                Brand just DM&apos;d you? Get a rate before they move on.
              </p>
            </div>

            {/* PDFs */}
            <div className="rounded-3xl border border-border/50 bg-card p-8 hover-scale">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-money/10 mb-5">
                <FileText className="h-6 w-6 text-money" />
              </div>
              <h3 className="text-xl font-bold mb-2">PDFs That Close</h3>
              <p className="text-muted-foreground">
                Professional rate cards that look like they came from a talent agency.
              </p>
            </div>

            {/* Trust */}
            <div className="md:col-span-2 lg:col-span-2 rounded-3xl border border-border/50 bg-card p-8 hover-scale">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">Justify Every Dollar</h3>
                  <p className="text-muted-foreground">
                    Your rate card shows exactly how the price was calculated. No more awkward negotiations—the data speaks for itself.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Horizontal on Desktop */}
      <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
              Three steps to your rate card
            </h2>
          </div>

          {/* Steps - connected on desktop */}
          <div className="relative">
            {/* Connection line - desktop only */}
            <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-primary/20 via-primary to-primary/20" />

            <div className="grid gap-8 lg:gap-4 md:grid-cols-3">
              {/* Step 1 */}
              <div className="relative group">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-6 relative z-10">
                    1
                  </div>
                  <h3 className="text-lg font-bold mb-2">Drop your stats</h3>
                  <p className="text-muted-foreground text-sm">
                    Followers, engagement rate, your niche. Two minutes, tops.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative group">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-6 relative z-10">
                    2
                  </div>
                  <h3 className="text-lg font-bold mb-2">Describe the deal</h3>
                  <p className="text-muted-foreground text-sm">
                    What platform? What format? How long can they use it?
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative group">
                <div className="lg:text-center">
                  <div className="inline-flex lg:mx-auto h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold mb-6 relative z-10">
                    3
                  </div>
                  <h3 className="text-lg font-bold mb-2">Send your rate</h3>
                  <p className="text-muted-foreground text-sm">
                    Download a PDF that shows exactly why you&apos;re worth it.
                  </p>
                </div>
              </div>
            </div>
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
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-primary-foreground">
                  ready to know your worth?
                </h2>
                <p className="mt-4 text-lg text-primary-foreground/80 max-w-xl">
                  Join creators who stopped underselling and started getting paid what they deserve.
                </p>
                <div className="mt-8">
                  <Link href="/sign-up">
                    <Button size="xl" variant="secondary" className="bg-white text-primary hover:bg-white/90 text-lg">
                      Create Your Free Rate Card
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Minimal */}
      <footer className="border-t border-border/40 py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">RateCard.AI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Built for creators with 1K-100K followers
          </p>
        </div>
      </footer>
    </div>
  );
}
