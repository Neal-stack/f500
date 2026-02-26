import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "F500 - Market Events",
  description: "Explore earnings and market events for top companies.",
};

export default function RootLayout({ children }) {
  const navItems = [
    { href: "/stocks", label: "Stocks" },
    { href: "/news", label: "News" },
    { href: "/timeline", label: "Timeline" },
    { href: "/strategies", label: "Strategies" },
  ];

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <Link
                href="/"
                className="rounded-xl px-4 py-2 text-sm font-medium bg-white/10 hover:bg-white/20 border border-white/10 transition"
              >
                F500
              </Link>
            </div>
            <nav className="flex items-center gap-1 text-sm">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white transition"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pb-8 pt-28 md:pt-32">
          {children}
        </main>
        <footer className="mt-10 border-t border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-8 text-sm muted-text">
            © {new Date().getFullYear()} F500. Built for quick earnings tracking.
          </div>
        </footer>
      </body>
    </html>
  );
}
