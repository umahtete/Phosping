/**
 * LTI session management — stores launch context in a signed cookie.
 */

import { SignJWT, jwtVerify } from 'jose';
import { getPrivateKey, getPublicKey } from './keys';
import type { LtiResourceLinkLaunch } from './types';

export interface LtiSession {
  platformIssuer: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRoles: string[];
  contextId?: string;
  contextTitle?: string;
  resourceLinkId?: string;
  resourceLinkTitle?: string;
  deploymentId: string;
  launchedAt: number;
}

const SESSION_COOKIE = 'luxup_lti_session';
const SESSION_TTL = '8h';

export { SESSION_COOKIE };

export async function createLtiSession(launch: LtiResourceLinkLaunch): Promise<string> {
  const privateKey = await getPrivateKey();

  const session: LtiSession = {
    platformIssuer: launch.iss,
    userId: launch.sub,
    userName: launch.name || [launch.given_name, launch.family_name].filter(Boolean).join(' '),
    userEmail: launch.email,
    userRoles: launch['https://purl.imsglobal.org/spec/lti/claim/roles'] || [],
    contextId: launch['https://purl.imsglobal.org/spec/lti/claim/context']?.id,
    contextTitle: launch['https://purl.imsglobal.org/spec/lti/claim/context']?.title,
    resourceLinkId: launch['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.id,
    resourceLinkTitle: launch['https://purl.imsglobal.org/spec/lti/claim/resource_link']?.title,
    deploymentId: launch['https://purl.imsglobal.org/spec/lti/claim/deployment_id'],
    launchedAt: Date.now(),
  };

  const token = await new SignJWT(session as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'RS256', kid: 'luxup-tutor-key-1' })
    .setIssuedAt()
    .setExpirationTime(SESSION_TTL)
    .sign(privateKey);

  return token;
}

export async function verifyLtiSession(token: string): Promise<LtiSession | null> {
  try {
    const publicKey = await getPublicKey();
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ['RS256'],
    });
    return payload as unknown as LtiSession;
  } catch {
    return null;
  }
}

export function isLtiStudent(session: LtiSession): boolean {
  const studentRoles = [
    'http://purl.imsglobal.org/vocab/lis/v2/membership#Learner',
    'http://purl.imsglobal.org/vocab/lis/v2/institution/person#Student',
    'Learner',
    'Student',
  ];
  return session.userRoles.some((r) => studentRoles.includes(r) || r.includes('Learner'));
}
