"use client";

import { useRouter } from "next/navigation";

export function AdminLogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin");
        router.refresh();
      }}
      className="text-sm text-muted hover:text-foreground"
    >
      Log out
    </button>
  );
}
