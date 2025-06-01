import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const auth = request.headers.get('authorization') || '';
  const response = await fetch('http://localhost:3001/api/payments/create-order', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(auth ? { 'Authorization': auth } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 