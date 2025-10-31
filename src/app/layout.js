import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "F500 - Market Events",
  description: "Explore earnings and market events for top companies.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-neutral-800/30 bg-black/20 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
            <a href="/" className="text-xl font-semibold">F500</a>
            <nav className="flex items-center gap-6 text-sm">
              <a href="/" className="hover:underline">Home</a>
              <a href="/timeline" className="hover:underline">Timeline</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">
          {children}
        </main>
        <footer className="border-t border-neutral-800/30 mt-8">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-neutral-400">
            © {new Date().getFullYear()} F500. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
