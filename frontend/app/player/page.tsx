"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PlayerPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/player/dashboard");
  }, [router]);

  return null;
}
