import { NextRequest, NextResponse } from 'next/server';
import {
  buildDeepLinkingResponse,
  type DeepLinkingContentItem,
} from '@/lib/lti/deep-linking';
import { prisma } from '@/lib/persistence/prisma-client';

/** Derive a readable title from stage JSON when title column is null. */
function deriveTitle(stage: unknown, id: string): string {
  if (!stage || typeof stage !== 'object') return `Classroom ${id}`;
  const s = stage as Record<string, unknown>;
  if (typeof s.name === 'string' && s.name.trim()) return s.name.trim();
  return `Classroom ${id}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platformId, classroomIds, dlSettingsJson } = body;

    if (!platformId || !classroomIds?.length || !dlSettingsJson) {
      console.error('[deep-linking-return] Missing required fields:', {
        platformId: !!platformId,
        classroomIds: classroomIds?.length,
        dlSettingsJson: !!dlSettingsJson,
      });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const platform = await prisma.ltiPlatform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      console.error('[deep-linking-return] Platform not found:', platformId);
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 },
      );
    }

    const dlSettings = JSON.parse(dlSettingsJson);

    console.log('[deep-linking-return] Deep linking settings:', {
      hasReturnUrl: !!dlSettings.deep_link_return_url,
      hasData: !!dlSettings.data,
      dataType: typeof dlSettings.data,
      deploymentId: platform.deploymentId,
      clientId: platform.clientId,
      issuer: platform.issuer,
    });

    const toolBaseUrl =
      process.env.NEXT_PUBLIC_ASSET_PREFIX ||
      `https://${req.headers.get('host')}`;

    const items: DeepLinkingContentItem[] = [];
    for (const id of classroomIds) {
      const classroom = await prisma.classroom.findUnique({ where: { id } });
      const title = classroom?.title || deriveTitle(classroom?.stage, id);
      items.push({
        type: 'ltiResourceLink',
        title,
        url: `${toolBaseUrl}/classroom/${id}`,
        lineItem: {
          scoreMaximum: 100,
          label: title,
        },
      });
    }

    console.log('[deep-linking-return] Content items:', JSON.stringify(items, null, 2));

    const { jwt, returnUrl } = await buildDeepLinkingResponse(
      items,
      { clientId: platform.clientId, issuer: platform.issuer, deploymentId: platform.deploymentId },
      dlSettings,
    );

    console.log('[deep-linking-return] JWT built successfully, returnUrl:', returnUrl);

    const html = `<!DOCTYPE html>
<html>
<head><title>Returning to LMS...</title></head>
<body>
<form id="ltijs_submit" method="POST" action="${returnUrl}">
  <input type="hidden" name="JWT" value="${jwt}" />
</form>
<script>document.getElementById('ltijs_submit').submit();</script>
<p>Returning to your learning platform...</p>
</body>
</html>`;

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' },
    });
  } catch (error) {
    console.error('[deep-linking-return] Failed:', error);
    return NextResponse.json(
      {
        error: `Deep linking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
