import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NexusOS | Agent Mission Control",
  description: "Next-generation orchestration for AI agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen selection:bg-violet-500/30">
        <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
        <main className="relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
