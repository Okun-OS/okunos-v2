"use client";

import { useState } from "react";

interface Props {
  workspaceId: string;
  isActive: boolean;
}

export default function WorkspaceToggle({ workspaceId, isActive: initialActive }: Props) {
  const [isActive, setIsActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/toggle`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        setIsActive(data.isActive);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`text-xs px-2.5 py-1 rounded font-medium transition disabled:opacity-60 ${
        isActive
          ? "bg-red-900 text-red-300 hover:bg-red-800"
          : "bg-green-900 text-green-300 hover:bg-green-800"
      }`}
    >
      {loading ? "..." : isActive ? "Deaktivieren" : "Aktivieren"}
    </button>
  );
}
