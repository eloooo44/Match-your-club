"use client";

import PlayerNav from "@/src/components/PlayerNav";

export default function DashboardLayout({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <PlayerNav />

        <section>
          <div className="mb-8">
            <h1 className="text-5xl font-bold">{title}</h1>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
