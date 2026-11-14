import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AudioSessionProvider } from "@/context/AudioSession";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fretwise | Understand the music. Play it your way.",
  description:
    "Your focused guitar practice companion. Explore chord progressions, transpose shapes, use a capo and discover scales on the fretboard.",
  icons: [{ rel: "icon", url: "/favicon.svg" }],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AudioSessionProvider>{children}</AudioSessionProvider>
      </body>
    </html>
  );
}
