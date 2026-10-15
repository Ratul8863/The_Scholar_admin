export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { connectDB } = await import("@/server/db/mongoose");
  void connectDB().catch(() => {
    // A failed warm-up is retried on the next request.
  });
}
