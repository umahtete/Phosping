/**
 * LTI 1.3 AGS (Assignment and Grade Services) — grade passback to the platform.
 *
 * Flow:
 * 1. Get OAuth 2.0 access token from platform's token endpoint
 * 2. POST score to the lineitem's scores endpoint
 */

import { SignJWT } from 'jose';
import { getPrivateKey } from './keys';
import { prisma } from '@/lib/persistence/prisma-client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScorePayload {
  scoreGiven: number;
  scoreMaximum: number;
  comment?: string;
  activityProgress: 'Initialized' | 'Started' | 'InProgress' | 'Submitted' | 'Completed';
  gradingProgress: 'NotReady' | 'Failed' | 'Pending' | 'PendingManual' | 'FullyGraded';
  userId: string;
  timestamp: string;
  submission?: {
    submittedAt: string;
  };
}

export interface AgsScoreResult {
  success: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// OAuth 2.0 Client Credentials
// ---------------------------------------------------------------------------

// Simple in-memory token cache
interface CachedToken {
  token: string;
  expiresAt: number;
}

const tokenCache = new Map<string, CachedToken>();

async function getAccessToken(
  tokenEndpoint: string,
  clientId: string,
  issuer: string,
): Promise<string> {
  // Check cache first
  const cacheKey = `${tokenEndpoint}:${clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  // Build JWT assertion for RFC 7523 JWT client authentication
  const privateKey = await getPrivateKey();
  const toolBaseUrl = process.env.NEXT_PUBLIC_ASSET_PREFIX || 'https://tutor.luxuptraining.com';

  const clientAssertion = await new SignJWT({
    sub: clientId,
    iss: toolBaseUrl,
    aud: tokenEndpoint,
    jti: crypto.randomUUID(),
  })
    .setProtectedHeader({ alg: 'RS256', kid: 'luxup-tutor-key-1' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(privateKey);

  // Request access token
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
    client_assertion: clientAssertion,
    scope: [
      'https://purl.imsglobal.org/spec/lti-ags/scope/score',
      'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
    ].join(' '),
  });

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Token request failed (${response.status}): ${text}`);
  }

  const data = await response.json();
  const expiresIn = (data.expires_in as number) || 3600;
  const token = data.access_token as string;

  // Cache with 60s safety margin
  tokenCache.set(cacheKey, {
    token,
    expiresAt: Date.now() + (expiresIn - 60) * 1000,
  });

  return token;
}

// ---------------------------------------------------------------------------
// Score Submission
// ---------------------------------------------------------------------------

export async function submitScore(
  platformIssuer: string,
  lineItemUrl: string,
  score: ScorePayload,
): Promise<AgsScoreResult> {
  try {
    // Look up the platform to get client credentials
    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer: platformIssuer },
    });

    if (!platform) {
      return { success: false, error: `No registered platform for issuer: ${platformIssuer}` };
    }

    if (!platform.tokenEndpoint) {
      return { success: false, error: `Platform has no token endpoint configured` };
    }

    // Get access token
    const accessToken = await getAccessToken(
      platform.tokenEndpoint,
      platform.clientId,
      platform.issuer,
    );

    // Determine the scores URL from the lineitem URL
    // The scores endpoint is typically the lineitem URL + "/scores"
    const scoresUrl = lineItemUrl.endsWith('/scores')
      ? lineItemUrl
      : `${lineItemUrl}/scores`;

    // Submit the score
    const response = await fetch(scoresUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(score),
    });

    if (!response.ok && response.status !== 200 && response.status !== 201) {
      const text = await response.text();
      return { success: false, error: `Score submission failed (${response.status}): ${text}` };
    }

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}
