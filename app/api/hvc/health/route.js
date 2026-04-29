export async function GET() {
  return Response.json({
    status: 'ok',
    app: 'hvc',
    timestamp: Date.now(),
  });
}
