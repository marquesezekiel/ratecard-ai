"use client";

import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Shield, FileText, ArrowRight } from "lucide-react";

const tools = [
  {
    href: "/dashboard/tools/brand-vetter",
    title: "Brand Vetter",
    description: "Is this brand real? Have they worked with creators before? Find out before you reply.",
    icon: Shield,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  {
    href: "/dashboard/tools/contract-scanner",
    title: "Contract Scanner",
    description: "Upload that contract before you sign. We'll flag anything sketchy and tell you what's missing.",
    icon: FileText,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
  },
];

export default function ToolsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Wrench className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-display font-bold md:text-3xl">Creator Tools</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Before you say yes: check if the brand&apos;s legit, spot red flags in contracts.
        </p>
      </header>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${tool.bgColor}`}>
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
                      {tool.title}
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {tool.description}
                </CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tip Card */}
      <Card className="bg-muted/30">
        <CardContent className="py-4">
          <p className="text-sm text-muted-foreground">
            <strong>Tip:</strong> You can also access Brand Vetter directly from the Message Analyzer. After analyzing a brand DM, click &quot;Vet This Brand&quot; to check their legitimacy.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
