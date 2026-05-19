"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PlayerAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || role !== "player") {
      router.replace("/login");
      return;
    }

    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return null;
  }

  return <>{children}</>;
}
