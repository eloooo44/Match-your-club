import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export interface AuthUser {
  id: number;
  email: string;
  role: "club" | "player";
}

export function useAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userRole = localStorage.getItem("userRole");
    const userId = localStorage.getItem("userId");

    setIsAuthenticated(Boolean(token));

    if (token && userRole && userId) {
      setUser({
        id: parseInt(userId),
        email: "", // We don't store email in localStorage for now
        role: userRole as "club" | "player",
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, [pathname]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("userId");
    setUser(null);
    setIsAuthenticated(false);
    router.replace("/login");
  };

  const getToken = () => {
    return localStorage.getItem("token");
  };

  return {
    user,
    loading,
    logout,
    getToken,
    isAuthenticated,
  };
}
