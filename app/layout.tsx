import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://committeemap.eracx.com"),
  title: "Committee Map by Era — Map your buying committee in 60 seconds",
  description: "See who you're missing on your deal. Get real names, ways in, and your next three moves.",
  openGraph: {
    title: "Committee Map by Era",
    description: "See who you're missing on your deal. Get real names, ways in, and your next three moves.",
    type: "website",
    images: ["/og-placeholder.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Committee Map by Era",
    description: "Map your buying committee in 60 seconds.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TooltipProvider>
          {children}
          <Toaster />
        </TooltipProvider>
      </body>
    </html>
  );
}
