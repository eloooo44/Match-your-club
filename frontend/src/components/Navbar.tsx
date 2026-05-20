"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/services/api";
import { mediaUrl } from "@/src/lib/media";

import { API_BASE } from "@/src/lib/apiBase";

const publicLinks = [
  { href: "/features", label: "Features" },
  { href: "/unser-ziel", label: "Unser Ziel" },
];

const LogoLink = () => (
  <Link href="/" className="inline-flex items-center" aria-label="Zur Landingpage">
    <img
      src="/MYC.png"
      alt="Match Your Club"
      className="h-12 w-auto object-contain sm:h-14"
    />
  </Link>
);

export default function Navbar() {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const [playerAvatarUrl, setPlayerAvatarUrl] = useState<string | null>(null);
  const [playerProfileHref, setPlayerProfileHref] = useState("/player/profile");
  const [clubLogoUrl, setClubLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadPlayerProfile = async () => {
      if (!isAuthenticated || user?.role !== "player") {
        if (isMounted) {
          setPlayerAvatarUrl(null);
          setPlayerProfileHref("/player/profile");
        }
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setPlayerAvatarUrl(null);
          setPlayerProfileHref("/player/profile");
        }
        return;
      }

      try {
        const player = await apiFetch("/players/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!isMounted) return;

        const playerData = player as {
          id?: number;
          profileImagePath?: string | null;
          profileImageUrl?: string | null;
        };

        const avatar = mediaUrl(
          playerData.profileImagePath || playerData.profileImageUrl,
          API_BASE,
        );

        setPlayerAvatarUrl(avatar);
        setPlayerProfileHref(
          playerData.id ? `/player/${playerData.id}` : "/player/profile",
        );
      } catch {
        if (!isMounted) return;
        setPlayerAvatarUrl(null);
        setPlayerProfileHref("/player/profile");
      }
    };

    void loadPlayerProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    let isMounted = true;

    const loadClubProfile = async () => {
      if (!(isAuthenticated && user?.role === "club")) {
        if (isMounted) {
          setClubLogoUrl(null);
        }
        return;
      }

      const token = localStorage.getItem("token");
      if (!token) {
        if (isMounted) {
          setClubLogoUrl(null);
        }
        return;
      }

      try {
        const club = await apiFetch("/clubs/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!isMounted) return;

        const clubData = club as {
          logoPath?: string | null;
          logoUrl?: string | null;
        };

        const logo = mediaUrl(clubData.logoPath, API_BASE) || clubData.logoUrl || null;
        setClubLogoUrl(logo);
      } catch {
        if (!isMounted) return;
        setClubLogoUrl(null);
      }
    };

    void loadClubProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?.role]);

  const homeHref =
    user?.role === "player"
      ? "/player/dashboard"
      : user?.role === "club"
        ? "/club/dashboard"
        : "/";

  return (
    <nav className="border-b border-green-100 bg-[var(--card)] shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <LogoLink />

        <div className="flex items-center gap-6 text-sm text-[var(--foreground)]">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-neutral-700 hover:text-green-700"
            >
              {link.label}
            </Link>
          ))}

          {!loading && isAuthenticated && (
            <Link
              href={homeHref}
              className="font-semibold text-neutral-700 hover:text-green-700"
            >
              Dashboard
            </Link>
          )}

          {!loading && user?.role === "player" && (
            <Link
              href={playerProfileHref}
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-green-200 bg-green-50"
              aria-label="Zum Profil"
              title="Profil"
            >
              {playerAvatarUrl ? (
                <img
                  src={playerAvatarUrl}
                  alt="Profilbild"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-green-700">DU</span>
              )}
            </Link>
          )}

          {!loading && user?.role === "club" && (
            <Link
              href="/club/profile"
              aria-label="Clubprofil"
              title="Clubprofil"
              className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-green-200 bg-green-50"
            >
              {clubLogoUrl ? (
                <img
                  src={clubLogoUrl}
                  alt="Club Logo"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-green-700">
                  CLUB
                </span>
              )}
            </Link>
          )}

          {!loading && !isAuthenticated && (
            <Link
              href="/login"
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Anmelden
            </Link>
          )}

          {!loading && isAuthenticated && (
            <button
              onClick={logout}
              className="font-semibold text-green-600 hover:text-green-700"
            >
              Abmelden
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}
