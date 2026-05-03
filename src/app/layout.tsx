import type { Metadata } from "next";
import { Space_Grotesk, Montserrat } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-title",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const montserrat = Montserrat({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "SnapNote Pro — Smart Note-Taking",
  description: "Capture thoughts instantly, organize automatically, and retrieve effortlessly. A premium, intelligent note-taking companion.",
  keywords: ["SnapNote", "notes", "AI", "productivity", "smart notes"],
  authors: [{ name: "SnapNote Pro" }],
  icons: {
    icon: "/snapnote-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${spaceGrotesk.variable} ${montserrat.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
