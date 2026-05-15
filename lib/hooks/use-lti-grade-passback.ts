'use client';

import { useState, useCallback, useRef } from 'react';
import { createLogger } from '@/lib/logger';

const log = createLogger('LTIGrade');

interface GradePassbackResult {
  success: boolean;
  error?: string;
}

/**
 * Hook to submit quiz scores to the LMS via LTI AGS grade passback.
 * Checks if AGS is available, then posts the score.
 */
export function useLtiGradePassback() {
  const [passing, setPassing] = useState(false);
  const [passed, setPassed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittedRef = useRef<string | false>(false);

  const submitGrade = useCallback(
    async (scoreGiven: number, scoreMaximum: number) => {
      // Prevent duplicate submissions
      const key = `${scoreGiven}:${scoreMaximum}`;
      if (submittedRef.current === key) return;
      submittedRef.current = key;

      setPassing(true);
      setError(null);

      try {
        // Check if AGS is available
        const statusRes = await fetch('/api/lti/ags/status');
        const status = await statusRes.json();

        if (!status.available) {
          log.info('AGS not available, skipping grade passback');
          setPassing(false);
          return;
        }

        // Submit the score
        const res = await fetch('/api/lti/ags/score', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scoreGiven,
            scoreMaximum,
            comment: `Quiz score: ${scoreGiven}/${scoreMaximum}`,
          }),
        });

        const data = await res.json();

        if (data.success) {
          setPassed(true);
          log.info(`Grade passback successful: ${scoreGiven}/${scoreMaximum}`);
        } else {
          setError(data.error || 'Unknown error');
          log.warn('Grade passback failed:', data.error);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        setError(msg);
        log.warn('Grade passback error:', msg);
      } finally {
        setPassing(false);
      }
    },
    [],
  );

  return { submitGrade, passing, passed, error };
}
