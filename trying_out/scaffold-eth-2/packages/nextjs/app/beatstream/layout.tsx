"use client";

import { BeatsProvider } from "./_components/BeatsContext";
import { AuthProvider } from "./_components/AuthContext";

export default function BeatStreamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <BeatsProvider>{children}</BeatsProvider>
    </AuthProvider>
  );
}
