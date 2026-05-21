'use client';

import { Stage } from '@/components/stage';
import { ThemeProvider } from '@/lib/hooks/use-theme';
import { useStageStore } from '@/lib/store';
import { loadImageMapping } from '@/lib/utils/image-storage';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useSceneGenerator } from '@/lib/hooks/use-scene-generator';
import { useMediaGenerationStore } from '@/lib/store/media-generation';
import { useWhiteboardHistoryStore } from '@/lib/store/whiteboard-history';
import { createLogger } from '@/lib/logger';
import { MediaStageProvider } from '@/lib/contexts/media-stage-context';
import { generateMediaForOutlines } from '@/lib/media/media-orchestrator';

const log = createLogger('Classroom');

/** Build timestamp injected at build time to confirm code version. */
const BUILD_TS = process.env.NEXT_PUBLIC_BUILD_TS || 'dev';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function saveClassroomToServer(stageId: string) {
  try {
    const store = useStageStore.getState();
    if (!store.stage) return;
    const { stage, scenes, outlines } = store;
    await fetch('/api/classroom', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: stageId,
        stage,
        scenes,
        outlines,
        title: stage.name || undefined,
        status: 'active',
      }),
    });
    log.info('[Classroom] Saved to PostgreSQL:', stageId, 'scenes:', scenes.length);
  } catch (err) {
    log.warn('[Classroom] Failed to save to PostgreSQL:', err);
  }
}

export default function ClassroomDetailPage() {
  const params = useParams();
  const classroomId = params?.id as string;

  const { loadFromStorage } = useStageStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState('initializing');

  const generationStartedRef = useRef(false);

  const { generateRemaining, retrySingleOutline, stop } = useSceneGenerator({
    onComplete: () => {
      log.info('[Classroom] All scenes generated');
      saveClassroomToServer(classroomId);
    },
  });

  const loadClassroom = useCallback(async () => {
    const isIframe = typeof window !== 'undefined' && window !== window.top;
    log.info('[Classroom] START loadClassroom:', classroomId, 'isIframe:', isIframe, 'build:', BUILD_TS);
    setPhase('starting');

    // ABSOLUTE SAFETY: force loading to false after 20 seconds no matter what
    const safetyTimeout = setTimeout(() => {
      log.error('[Classroom] SAFETY TIMEOUT — forcing loading=false after 20s');
      setPhase('safety-timeout');
      setError('Loading timed out. Please try refreshing the page.');
      setLoading(false);
    }, 20000);

    try {
      // Phase 1: Try IndexedDB (with timeout for cross-origin iframe safety)
      setPhase('loading-indexeddb');
      try {
        await withTimeout(loadFromStorage(classroomId), 8000, 'IndexedDB load');
        log.info('[Classroom] IndexedDB load completed');
      } catch (idbError) {
        log.warn('[Classroom] IndexedDB load failed or timed out:', idbError);
      }

      // Re-sync to PostgreSQL if IndexedDB had data (ensures LTI users get the latest)
      if (useStageStore.getState().stage) {
        saveClassroomToServer(classroomId); // fire-and-forget
      }

      // Phase 2: If no data from IndexedDB, try server API
      if (!useStageStore.getState().stage) {
        setPhase('loading-server');
        log.info('[Classroom] No IndexedDB data, fetching from server:', classroomId);
        try {
          const res = await fetch(`/api/classroom?id=${encodeURIComponent(classroomId)}`);
          log.info('[Classroom] Server response status:', res.status);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.classroom) {
              const { stage, scenes, outlines } = json.classroom;
              useStageStore.getState().setStage(stage);
              useStageStore.setState({
                scenes,
                currentSceneId: scenes[0]?.id ?? null,
                // Load outlines from server so generation state is available
                ...(Array.isArray(outlines) && { outlines }),
              });
              log.info('[Classroom] Loaded from server:', classroomId, 'scenes:', scenes?.length, 'outlines:', Array.isArray(outlines) ? outlines.length : 0);

              if (stage.generatedAgentConfigs?.length) {
                const { saveGeneratedAgents } = await import('@/lib/orchestration/registry/store');
                await saveGeneratedAgents(stage.id, stage.generatedAgentConfigs);
                log.info('[Classroom] Hydrated server-generated agents');
              }
            } else {
              log.warn('[Classroom] Server returned no classroom data for:', classroomId, json);
            }
          } else {
            const errText = await res.text().catch(() => '');
            log.warn('[Classroom] Server returned status:', res.status, errText);
          }
        } catch (fetchErr) {
          log.warn('[Classroom] Server fetch failed:', fetchErr);
        }
      }

      // Phase 3: Restore media and agents (only if we have data)
      if (useStageStore.getState().stage) {
        setPhase('restoring-media');
        try {
          await withTimeout(
            useMediaGenerationStore.getState().restoreFromDB(classroomId),
            5000,
            'Media restore',
          );
        } catch (e) {
          log.warn('[Classroom] Media restore skipped:', e);
        }

        setPhase('restoring-agents');
        try {
          const { loadGeneratedAgentsForStage, useAgentRegistry } =
            await import('@/lib/orchestration/registry/store');
          const generatedAgentIds = await withTimeout(
            loadGeneratedAgentsForStage(classroomId),
            5000,
            'Agent restore',
          );
          const { useSettingsStore } = await import('@/lib/store/settings');
          if (generatedAgentIds.length > 0) {
            useSettingsStore.getState().setAgentMode('auto');
            useSettingsStore.getState().setSelectedAgentIds(generatedAgentIds);
          } else {
            const stage = useStageStore.getState().stage;
            const stageAgentIds = stage?.agentIds;
            const registry = useAgentRegistry.getState();
            const cleanIds = stageAgentIds?.filter((id) => {
              const a = registry.getAgent(id);
              return a && !a.isGenerated;
            });
            useSettingsStore.getState().setAgentMode('preset');
            useSettingsStore
              .getState()
              .setSelectedAgentIds(
                cleanIds && cleanIds.length > 0
                  ? cleanIds
                  : ['default-1', 'default-2', 'default-3'],
              );
          }
        } catch (e) {
          log.warn('[Classroom] Agent restore skipped:', e);
          try {
            const { useSettingsStore } = await import('@/lib/store/settings');
            useSettingsStore.getState().setAgentMode('preset');
            useSettingsStore.getState().setSelectedAgentIds(['default-1', 'default-2', 'default-3']);
          } catch { /* best effort */ }
        }
      }

      // Phase 4: Check if we ended up with nothing
      if (!useStageStore.getState().stage) {
        log.error('[Classroom] No data loaded for classroom:', classroomId);
        setError(
          'Classroom not found. It may not have been saved to the server. ' +
          `ID: ${classroomId}`
        );
      } else {
        setPhase('ready');
      }
    } catch (error) {
      log.error('[Classroom] loadClassroom FAILED:', error);
      setError(error instanceof Error ? error.message : 'Failed to load classroom');
    } finally {
      clearTimeout(safetyTimeout);
      setLoading(false);
      log.info('[Classroom] loadClassroom DONE, loading=false');
    }
  }, [classroomId, loadFromStorage]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setPhase('initializing');
    generationStartedRef.current = false;

    const mediaStore = useMediaGenerationStore.getState();
    mediaStore.revokeObjectUrls();
    useMediaGenerationStore.setState({ tasks: {} });
    useWhiteboardHistoryStore.getState().clearHistory();

    loadClassroom();

    return () => {
      stop();
    };
  }, [classroomId, loadClassroom, stop]);

  // Auto-resume generation for pending outlines
  useEffect(() => {
    if (loading || error || generationStartedRef.current) return;

    const state = useStageStore.getState();
    const { outlines, scenes, stage } = state;

    const completedOrders = new Set(scenes.map((s) => s.order));
    const hasPending = outlines.some((o) => !completedOrders.has(o.order));

    if (hasPending && stage) {
      generationStartedRef.current = true;

      const genParamsStr = sessionStorage.getItem('generationParams');
      const params = genParamsStr ? JSON.parse(genParamsStr) : {};

      const storageIds = (params.pdfImages || [])
        .map((img: { storageId?: string }) => img.storageId)
        .filter(Boolean);

      loadImageMapping(storageIds).then((imageMapping) => {
        generateRemaining({
          pdfImages: params.pdfImages,
          imageMapping,
          stageInfo: {
            name: stage.name || '',
            description: stage.description,
            style: stage.style,
          },
          agents: params.agents,
          userProfile: params.userProfile,
          languageDirective: params.languageDirective || stage.languageDirective,
        });
      });
    } else if (outlines.length > 0 && stage) {
      generationStartedRef.current = true;
      generateMediaForOutlines(outlines, stage.id).catch((err) => {
        log.warn('[Classroom] Media generation resume error:', err);
      });
    }
  }, [loading, error, generateRemaining]);

  return (
    <ThemeProvider>
      <MediaStageProvider value={classroomId}>
        <div className="h-screen flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center text-muted-foreground max-w-md">
                <p className="text-lg mb-3">Loading classroom...</p>
                <p className="text-xs font-mono bg-gray-100 dark:bg-gray-800 rounded px-3 py-2 mb-2">
                  Phase: {phase}
                </p>
                <p className="text-xs text-gray-400">
                  ID: {classroomId} &middot; Build: {BUILD_TS}
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <div className="text-center max-w-md">
                <p className="text-destructive mb-4">{error}</p>
                <p className="text-xs text-muted-foreground mb-4 font-mono">
                  Phase: {phase} &middot; ID: {classroomId} &middot; Build: {BUILD_TS}
                </p>
                <button
                  onClick={() => {
                    setError(null);
                    setLoading(true);
                    loadClassroom();
                  }}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* DEBUG BANNER — remove after launch */}
              <div style={{
                position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
                background: '#059669', color: 'white', fontSize: 11,
                padding: '4px 12px', fontFamily: 'monospace',
                display: 'flex', gap: 16, justifyContent: 'center',
              }}>
                <span>STAGE RENDERED</span>
                <span>scenes: {useStageStore.getState().scenes?.length ?? '?'}</span>
                <span>currentSceneId: {useStageStore.getState().currentSceneId ?? 'null'}</span>
                <span>stage: {useStageStore.getState().stage?.name ?? 'null'}</span>
                <span>outlines: {useStageStore.getState().outlines?.length ?? '?'}</span>
                <span>build: {BUILD_TS}</span>
              </div>
              <Stage onRetryOutline={retrySingleOutline} />
            </>
          )}
        </div>
      </MediaStageProvider>
    </ThemeProvider>
  );
}
