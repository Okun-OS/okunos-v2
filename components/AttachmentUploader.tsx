"use client";

import { useState } from "react";

interface Attachment {
  filename: string;
  url: string;
}

interface Props {
  entityId: string;
  entityType: "journey-step" | "email-stage";
  attachments: Attachment[];
  onUpdated?: (attachments: Attachment[]) => void;
}

function getApiPath(entityType: Props["entityType"], entityId: string): string {
  if (entityType === "journey-step") {
    // stepId is entityId, but we need the journey id in the path.
    // The API for journey attachments is /api/journeys/[id]/steps/[stepId]/attachments
    // We'll use a simplified path that passes stepId as id when journeyId is unknown.
    return `/api/journey-steps/${entityId}/attachments`;
  }
  return `/api/outreach/stages/${entityId}/attachments`;
}

// The component accepts a direct apiPath override for flexibility
export default function AttachmentUploader({
  entityId,
  entityType,
  attachments: initialAttachments,
  onUpdated,
  apiPath,
}: Props & { apiPath: string }) {
  const [attachments, setAttachments] = useState<Attachment[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(apiPath, { method: "POST", body: form });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Upload fehlgeschlagen");
        return;
      }
      const data = await res.json();
      const updated = [...attachments, { filename: data.filename, url: data.url }];
      setAttachments(updated);
      onUpdated?.(updated);
    } catch {
      setError("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDelete(url: string) {
    try {
      await fetch(apiPath, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const updated = attachments.filter((a) => a.url !== url);
      setAttachments(updated);
      onUpdated?.(updated);
    } catch {
      setError("Löschen fehlgeschlagen");
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-gray-300">Anhänge</h3>

      {attachments.length > 0 && (
        <ul className="space-y-2">
          {attachments.map((a) => (
            <li
              key={a.url}
              className="flex items-center justify-between bg-gray-900 border border-gray-700 rounded-lg px-3 py-2"
            >
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm truncate max-w-xs"
              >
                {a.filename}
              </a>
              <button
                onClick={() => handleDelete(a.url)}
                className="text-red-400 hover:text-red-300 text-xs ml-3 shrink-0 transition"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <label className="inline-flex items-center gap-2 cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1.5 px-3 rounded-lg transition">
        {uploading ? "Hochladen..." : "+ Datei anhängen"}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          onChange={handleUpload}
        />
      </label>
    </div>
  );
}
