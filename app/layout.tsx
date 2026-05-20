import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import LoadingScreen from "@/components/LoadingScreen";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

const mono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "Autoreason — live console",
  description:
    "Watch the autoreason self-refinement tournament in real time. A, B, AB, judged by blind Borda count.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <LoadingScreen />
        {children}
      </body>
    </html>
  );
}
