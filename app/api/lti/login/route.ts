import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/persistence/prisma-client';

/**
 * LTI 1.3 OIDC Login Initiation endpoint.
 *
 * Moodle (the platform) sends a POST here with:
 *   iss, login_hint, target_link_uri, lti_message_hint, client_id
 *
 * We respond with a redirect to Moodle's authorization endpoint,
 * adding our OIDC auth request parameters.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const iss = form.get('iss') as string;
    const loginHint = form.get('login_hint') as string;
    const targetLinkUri = form.get('target_link_uri') as string;
    const ltiMessageHint = form.get('lti_message_hint') as string;
    const clientId = form.get('client_id') as string;

    if (!iss || !loginHint || !clientId) {
      return new Response('Missing required OIDC parameters (iss, login_hint, client_id)', { status: 400 });
    }

    // Look up the platform by issuer + clientId
    const platform = await prisma.ltiPlatform.findFirst({
      where: { issuer: iss, clientId },
    });

    if (!platform) {
      return new Response(`No registered LTI platform for issuer=${iss}, clientId=${clientId}`, { status: 404 });
    }

    // Build the OIDC authorization redirect URL
    const toolBaseUrl = process.env.NEXT_PUBLIC_ASSET_PREFIX || `https://${req.headers.get('host')}`;
    const redirectUri = `${toolBaseUrl}/api/lti/launch`;

    const params = new URLSearchParams({
      scope: 'openid',
      response_type: 'id_token',
      client_id: clientId,
      redirect_uri: redirectUri,
      login_hint: loginHint,
      nonce: crypto.randomUUID(),
      response_mode: 'form_post',
      prompt: 'none',
    });

    if (ltiMessageHint) {
      params.set('lti_message_hint', ltiMessageHint);
    }

    const authUrl = `${platform.authEndpoint}?${params.toString()}`;

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('LTI OIDC login initiation failed:', error);
    return new Response('Internal error during LTI login initiation', { status: 500 });
  }
}

// Also accept GET for testing convenience
export async function GET(req: NextRequest) {
  return POST(req);
}
