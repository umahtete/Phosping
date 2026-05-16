'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

interface Classroom {
  id: string;
  title: string | null;
  status: string;
  createdAt: string;
}

export default function DeepLinkingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background p-8 text-muted-foreground">Loading...</div>}>
      <DeepLinkingContent />
    </Suspense>
  );
}

function DeepLinkingContent() {
  const searchParams = useSearchParams();
  const platformId = searchParams.get('platformId');

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/classroom/list')
      .then((res) => res.json())
      .then((data) => {
        if (data.classrooms) setClassrooms(data.classrooms);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load classrooms');
        setLoading(false);
      });
  }, []);

  async function handleSubmit() {
    if (selected.size === 0 || !platformId) return;
    setSubmitting(true);

    try {
      const dlSettingsRaw = document.cookie
        .split('; ')
        .find((c) => c.startsWith('luxup_dl_settings='))
        ?.split('=')
        .slice(1)
        .join('=');
      const dlSettings = dlSettingsRaw ? decodeURIComponent(dlSettingsRaw) : null;

      const res = await fetch('/api/lti/deep-linking-return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId,
          classroomIds: Array.from(selected),
          dlSettingsJson: dlSettings || '{}',
        }),
      });

      if (res.ok) {
        const html = await res.text();
        document.open();
        document.write(html);
        document.close();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit selection');
        setSubmitting(false);
      }
    } catch {
      setError('Failed to submit selection');
      setSubmitting(false);
    }
  }

  function toggleSelection(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-1 text-foreground">
          Select Classroom
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Choose a classroom to link in your Moodle course.
        </p>

        {loading ? (
          <p className="text-muted-foreground">Loading classrooms...</p>
        ) : error && classrooms.length === 0 ? (
          <p className="text-destructive">{error}</p>
        ) : (
          <div className="space-y-2 mb-6">
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleSelection(c.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selected.has(c.id)
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="font-medium">{c.title || c.id}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.status} · Created {new Date(c.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={selected.size === 0 || submitting}
          className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium
            disabled:opacity-40 disabled:cursor-not-allowed
            hover:bg-primary/90 transition-colors"
        >
          {submitting
            ? 'Submitting...'
            : `Link ${selected.size} Classroom${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </div>
  );
}
