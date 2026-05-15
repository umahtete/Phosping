import { getPublicJwk } from '@/lib/lti/keys';

export async function GET() {
  try {
    const jwk = await getPublicJwk();

    return Response.json(
      { keys: [jwk] },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600',
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Failed to serve JWKS:', error);
    return Response.json({ error: 'Failed to load keys' }, { status: 500 });
  }
}
