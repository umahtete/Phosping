/**
 * LTI 1.3 JWT token validation.
 */

import { jwtVerify, createRemoteJWKSet } from 'jose';
import type { LtiLaunch, LtiResourceLinkLaunch, LtiDeepLinkingLaunch } from './types';

/** In-memory nonce store with auto-expiry (5 min). */
const nonceStore = new Map<string, number>();
const NONCE_TTL_MS = 5 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [nonce, ts] of nonceStore) {
    if (now - ts > NONCE_TTL_MS) nonceStore.delete(nonce);
  }
}, 60_000).unref?.();

function checkNonce(nonce: string): boolean {
  if (nonceStore.has(nonce)) return false;
  nonceStore.set(nonce, Date.now());
  return true;
}

export async function validateLtiToken(
  idToken: string,
  expectedClientId: string,
  jwksUri: string,
): Promise<LtiLaunch> {
  const JWKS = createRemoteJWKSet(new URL(jwksUri));

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: undefined,
    audience: expectedClientId,
  });

  const claims = payload as Record<string, unknown>;

  const messageType = claims['https://purl.imsglobal.org/spec/lti/claim/message_type'] as string;
  if (messageType !== 'LtiResourceLinkRequest' && messageType !== 'LtiDeepLinkingRequest') {
    throw new Error(`Invalid LTI message type: ${messageType}`);
  }

  const nonce = claims.nonce as string;
  if (!nonce || !checkNonce(nonce)) {
    throw new Error('Invalid or replayed nonce');
  }

  const deploymentId = claims['https://purl.imsglobal.org/spec/lti/claim/deployment_id'] as string;
  if (!deploymentId) {
    throw new Error('Missing deployment_id claim');
  }

  return payload as unknown as LtiLaunch;
}

export function isResourceLinkLaunch(launch: LtiLaunch): launch is LtiResourceLinkLaunch {
  return launch['https://purl.imsglobal.org/spec/lti/claim/message_type'] === 'LtiResourceLinkRequest';
}

export function isDeepLinkingLaunch(launch: LtiLaunch): launch is LtiDeepLinkingLaunch {
  return launch['https://purl.imsglobal.org/spec/lti/claim/message_type'] === 'LtiDeepLinkingRequest';
}
