import { NextRequest, NextResponse } from 'next/server';
import { validateLtiToken, isResourceLinkLaunch, isDeepLinkingLaunch } from '@/lib/lti/validate';
import { createLtiSession, SESSION_COOKIE } from '@/lib/lti/session';
import { prisma } from '@/lib/persistence/prisma-client';
import type { LtiDeepLinkingLaunch } from '@/lib/lti/types';

/**
 * LTI 1.3 Launch Callback endpoint.
 *
 * Moodle POSTs here with an `id_token` JWT containing LTI claims.
 * We validate the token, create a session cookie, and redirect:
 *   - Resource Link launches → /classroom/{id}
 *   - Deep Linking launches → /lti/deep-linking picker page
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const idToken = form.get('id_token') as string;
    const state = form.get('state') as string;

    if (!idToken) {
      return new Response('Missing id_token', { status: 400 });
    }

    // Decode JWT header to find the issuer (without verification first)
    const [headerB64] = idToken.split('.');
    const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
    // Decode payload to find issuer and client_id for platform lookup
    const payloadB64 = idToken.split('.')[1];
    const payloadRaw = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    const issuer = payloadRaw.iss as string;
    const audience = Array.isArray(payloadRaw.aud) ? payloadRaw.aud : [payloadRaw.aud];
    const clientId = payloadRaw.azp || audience[0];

    // Look up the platform
    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer, clientId },
    });

    if (!platform) {
      return new Response(`No registered LTI platform for issuer=${issuer}`, { status: 404 });
    }

    // Validate the JWT token against the platform's JWKS
    const launch = await validateLtiToken(idToken, platform.clientId, platform.jwksUri);

    const toolBaseUrl = process.env.NEXT_PUBLIC_ASSET_PREFIX || `https://${req.headers.get('host')}`;

    if (isDeepLinkingLaunch(launch)) {
      // Deep Linking — redirect to a picker page that will show available classrooms
      // Store the deep linking settings in a short-lived cookie
      const dlLaunch = launch as LtiDeepLinkingLaunch;
      const dlSettings = dlLaunch['https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings'];
      
      const response = NextResponse.redirect(`${toolBaseUrl}/lti/deep-linking?platformId=${platform.id}`);
      response.cookies.set('luxup_dl_settings', JSON.stringify({
        deploymentId: platform.deploymentId,
        deep_link_return_url: dlSettings.deep_link_return_url,
        accept_presentation_document_targets: dlSettings.accept_presentation_document_targets,
        data: dlSettings.data,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // Required for cross-origin LTI
        maxAge: 60 * 10, // 10 minutes
        path: '/',
      });
      return response;
    }

    if (isResourceLinkLaunch(launch)) {
      // Resource Link launch — redirect to the classroom
      const sessionToken = await createLtiSession(launch);
      
      // Determine classroom ID from the resource link or target_link_uri
      const resourceLink = launch['https://purl.imsglobal.org/spec/lti/claim/resource_link'];
      const targetUri = launch['https://purl.imsglobal.org/spec/lti/claim/target_link_uri'] || '';
      
      // Extract classroom ID from target_link_uri (e.g., https://tutor.luxuptraining.com/classroom/abc123)
      let classroomId = '';
      const match = targetUri.match(/\/classroom\/([a-zA-Z0-9_-]+)/);
      if (match) {
        classroomId = match[1];
      } else if (resourceLink?.id) {
        // Resource link ID might be the classroom ID
        classroomId = resourceLink.id;
      }

      if (!classroomId) {
        return new Response('Could not determine classroom ID from LTI launch', { status: 400 });
      }

      const response = NextResponse.redirect(`${toolBaseUrl}/classroom/${classroomId}`);
      response.cookies.set(SESSION_COOKIE, sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'none', // Required for cross-origin LTI
        maxAge: 60 * 60 * 8, // 8 hours
        path: '/',
      });
      return response;
    }

    return new Response('Unsupported LTI message type', { status: 400 });
  } catch (error) {
    console.error('LTI launch failed:', error);
    return new Response(
      `LTI launch failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 },
    );
  }
}
