import type { Metadata } from "next";
import { Zain } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Mökki - Ski House Manager",
  description:
    "Manage your ski lease house - track stays, split expenses, and coordinate with your group",
};

const zain = Zain({
  variable: "--font-zain",
  display: "swap",
  subsets: ["latin"],
  weight: ["200", "300", "400", "700", "800", "900"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <link
        href="https://api.fontshare.com/v2/css?f[]=telma@1&f[]=chillax@1&f[]=boska@1&display=swap"
        rel="stylesheet"
      ></link>
      <body className={`font-chillax antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
