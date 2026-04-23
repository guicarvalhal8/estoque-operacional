"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../lib/auth-context";
import type { Role } from "../../lib/types";

export function RequireRole({
  allowedRoles,
  fallbackPath = "/dashboard",
  children
}: {
  allowedRoles: Role[];
  fallbackPath?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.push(fallbackPath);
    }
  }, [allowedRoles, fallbackPath, loading, router, user]);

  if (loading) return null;
  if (!user) return null;
  if (!allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}

