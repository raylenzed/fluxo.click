import { type NextRequest, NextResponse } from 'next/server';

// Proxy all /api/* requests to the Fastify backend (server-side, so localhost resolves correctly)
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8090';

async function proxy(req: NextRequest, params: Promise<{ path: string[] }>) {
  const { path } = await params;
  const url = `${BACKEND}/api/${path.join('/')}${req.nextUrl.search}`;

  const rawBody = req.method !== 'GET' && req.method !== 'HEAD' ? await req.text() : undefined;
  // Don't forward empty body — Fastify rejects empty string with Content-Type: application/json
  const body = rawBody || undefined;

  const res = await fetch(url, {
    method: req.method,
    headers: body ? { 'content-type': 'application/json' } : {},
    body,
  });

  const text = await res.text();
  return new NextResponse(text, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
  });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
