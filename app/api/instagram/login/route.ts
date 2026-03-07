import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const callbackUrl = requestUrl.searchParams.get("callbackUrl") || "/";

  const target = new URL("/api/auth/signin/instagram", requestUrl.origin);
  target.searchParams.set("callbackUrl", callbackUrl);

  return NextResponse.redirect(target);
}
