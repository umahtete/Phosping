import { NextResponse } from 'next/server';
import { prisma } from '@/lib/persistence/prisma-client';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const platform = await prisma.ltiPlatform.findUnique({ where: { id } });
    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, platform });
  } catch (error) {
    console.error('Failed to get LTI platform:', error);
    return NextResponse.json({ error: 'Failed to get platform' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const platform = await prisma.ltiPlatform.update({
      where: { id },
      data: {
        ...(body.issuer !== undefined && { issuer: body.issuer }),
        ...(body.clientId !== undefined && { clientId: body.clientId }),
        ...(body.deploymentId !== undefined && { deploymentId: body.deploymentId }),
        ...(body.authEndpoint !== undefined && { authEndpoint: body.authEndpoint }),
        ...(body.tokenEndpoint !== undefined && { tokenEndpoint: body.tokenEndpoint }),
        ...(body.jwksUri !== undefined && { jwksUri: body.jwksUri }),
        ...(body.name !== undefined && { name: body.name }),
      },
    });
    return NextResponse.json({ success: true, platform });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Record not found')) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }
    console.error('Failed to update LTI platform:', error);
    return NextResponse.json({ error: 'Failed to update platform' }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await prisma.ltiPlatform.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg.includes('Record not found')) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
    }
    console.error('Failed to delete LTI platform:', error);
    return NextResponse.json({ error: 'Failed to delete platform' }, { status: 500 });
  }
}
