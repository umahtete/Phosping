import { NextResponse } from 'next/server';
import { prisma } from '@/lib/persistence/prisma-client';

export async function GET() {
  try {
    const platforms = await prisma.ltiPlatform.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, platforms });
  } catch (error) {
    console.error('Failed to list LTI platforms:', error);
    return NextResponse.json({ error: 'Failed to list platforms' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { issuer, clientId, deploymentId, authEndpoint, tokenEndpoint, jwksUri, name } = body;

    if (!issuer || !clientId || !deploymentId || !authEndpoint || !jwksUri) {
      return NextResponse.json(
        { error: 'Missing required fields: issuer, clientId, deploymentId, authEndpoint, jwksUri' },
        { status: 400 },
      );
    }

    const platform = await prisma.ltiPlatform.create({
      data: {
        issuer,
        clientId,
        deploymentId,
        authEndpoint,
        tokenEndpoint: tokenEndpoint || null,
        jwksUri,
        name: name || null,
      },
    });

    return NextResponse.json({ success: true, platform }, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Platform with this issuer/clientId/deploymentId already exists' },
        { status: 409 },
      );
    }
    console.error('Failed to create LTI platform:', error);
    return NextResponse.json({ error: 'Failed to create platform' }, { status: 500 });
  }
}
