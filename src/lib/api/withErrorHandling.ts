import { NextResponse } from "next/server";

type RouteHandler<Args extends unknown[]> = (...args: Args) => Promise<Response>;

/**
 * Wraps a route handler so any thrown error (most commonly a MongoDB connection failure
 * in production — bad MONGODB_URI, Atlas IP allowlist blocking the host, etc.) becomes a
 * proper JSON 500 response instead of Next.js's default empty body. An empty body is what
 * crashes every client-side `res.json()` call with "Unexpected end of JSON input" — this
 * turns that into a normal, handleable error response. The real error is still logged
 * server-side (visible in Vercel's Function Logs) so the actual cause isn't lost.
 */
export function withErrorHandling<Args extends unknown[]>(handler: RouteHandler<Args>): RouteHandler<Args> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error("API route error:", error);
      return NextResponse.json(
        { error: "Something went wrong on our end. Please try again in a moment." },
        { status: 500 }
      );
    }
  };
}
