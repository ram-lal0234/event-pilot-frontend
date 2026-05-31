"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/providers/app-provider";
import {
  canAccessPath,
  fieldRoleHomePath,
  isPlannerOnlyPath,
} from "@/lib/role-capabilities";

export function RoleRouteGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useApp();
  const role = user.accountRole;

  useEffect(() => {
    if (!role) return;

    if (canAccessPath(role, pathname)) return;

    const fallback = fieldRoleHomePath[role];
    if (fallback) {
      router.replace(fallback);
      return;
    }

    if (isPlannerOnlyPath(pathname)) {
      router.replace("/profile");
    }
  }, [pathname, role, router]);

  if (role && !canAccessPath(role, pathname)) {
    return null;
  }

  return children;
}
