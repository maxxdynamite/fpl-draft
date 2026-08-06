import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bad Blokes Weekly",
  description: "Draft and Blackjack results for the Bad Blokes league",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TopNav />
        {children}
      </body>
    </html>
  );
}
