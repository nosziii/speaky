import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Itt vagyok – családi hangüzenetek",
  description: "Meghitt, valós idejű beszélgetés és játékos betűtanulás családoknak.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="hu">
      <body>{children}</body>
    </html>
  );
}
