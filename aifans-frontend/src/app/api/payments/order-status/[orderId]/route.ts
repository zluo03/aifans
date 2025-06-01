import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, context: { params: { orderId: string } }) {
  const { params } = context;
  const orderId = params?.orderId;
  const auth = request.headers.get('authorization') || '';
  const response = await fetch(`http://localhost:3001/api/payments/order-status/${orderId}`, {
    method: 'GET',
    headers: {
      ...(auth ? { 'Authorization': auth } : {}),
    },
  });
  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
} 