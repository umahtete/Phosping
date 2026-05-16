/**
 * Shared constants for agent profile generation.
 *
 * Used by both the client-side agent-profiles API route and the
 * server-side classroom-generation pipeline to keep colors / avatars in sync.
 */

/** Color palette cycled for generated agents */
export const AGENT_COLOR_PALETTE = [
  '#614335',
  '#d08b5b',
  '#d08b5b',
  '#f8d25c',
  '#edb98a',
  '#ae5d29',
  '#fd9841',
  '#ffdbb4',
  '#edb98a',
  '#614335',
  '#d08b5b',
  '#ae5d29',
] as const;

/**
 * Default avatar paths cycled for generated agents.
 *
 * Every entry MUST correspond to a file that exists under `public/avatars/`.
 */
export const AGENT_DEFAULT_AVATARS = [
  '/avatars/explorer.svg',
  '/avatars/coder.svg',
  '/avatars/creative.svg',
  '/avatars/student3.svg',
  '/avatars/reader.svg',
  '/avatars/builder.svg',
  '/avatars/dreamer.svg',
  '/avatars/curious.svg',
  '/avatars/assistant.svg',
  '/avatars/student1.svg',
] as const;
