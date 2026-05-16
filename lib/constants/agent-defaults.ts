/**
 * Shared constants for agent profile generation.
 *
 * Used by both the client-side agent-profiles API route and the
 * server-side classroom-generation pipeline to keep colors / avatars in sync.
 */

/** Color palette cycled for generated agents */
export const AGENT_COLOR_PALETTE = [
  '#6B3A2A',
  '#A0673C',
  '#C9956B',
  '#EDCA9E',
  '#B5763E',
  '#8B5E3C',
  '#C4A67D',
  '#7A4B30',
  '#A0693D',
  '#D4A574',
  '#9E7B5A',
  '#5C3D2E',
] as const;

/**
 * Default avatar paths cycled for generated agents.
 *
 * Every entry MUST correspond to a file that exists under `public/avatars/`.
 */
export const AGENT_DEFAULT_AVATARS = [
  '/avatars/prof-amara.svg',
  '/avatars/samir.svg',
  '/avatars/carlos.svg',
  '/avatars/yuki.svg',
  '/avatars/priya.svg',
  '/avatars/fatima.svg',
  '/avatars/learner.svg',
  '/avatars/scholar.svg',
  '/avatars/prof-amara.svg',
  '/avatars/samir.svg',
] as const;
