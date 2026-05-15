import { NextRequest, NextResponse } from 'next/server';
import {
  buildDeepLinkingResponse,
  type DeepLinkingContentItem,
} from '@/lib/lti/deep-linking';
import { prisma } from '@/lib/persistence/prisma-client';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { platformId, classroomIds, dlSettingsJson } = body;

    if (!platformId || !classroomIds?.length || !dlSettingsJson) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      );
    }

    const platform = await prisma.ltiPlatform.findUnique({
      where: { id: platformId },
    });
    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 },
      );
    }

    const dlSettings = JSON.parse(dlSettingsJson);
    const toolBaseUrl =
      process.env.NEXT_PUBLIC_ASSET_PREFIX ||
      `https://${req.headers.get('host')}`;

    const items: DeepLinkingContentItem[] = [];
    for (const id of classroomIds) {
      const classroom = await prisma.classroom.findUnique({ where: { id } });
      items.push({
        type: 'ltiResourceLink',
        title: classroom?.title || `Classroom ${id}`,
        url: `${toolBaseUrl}/classroom/${id}`,
        lineItem: {
          scoreMaximum: 100,
          label: classroom?.title || `Classroom ${id}`,
        },
      });
    }

    const { jwt, returnUrl } = await buildDeepLinkingResponse(
      items,
      platform.deploymentId,
      dlSettings,
    );

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
    console.error('Deep linking return failed:', error);
    return NextResponse.json(
      {
        error: `Deep linking failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 },
    );
  }
}
