import { createClient } from "@/lib/supabase/server";
import { generatePKCEChallenge, generateAuthUrl } from "@/lib/autodesk/client";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

// Force dynamic rendering for this route
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { origin } = new URL(request.url);

  try {
    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate PKCE challenge
    const { codeVerifier, codeChallenge } = await generatePKCEChallenge();

    // Generate state token (include user ID for validation)
    const state = Buffer.from(
      JSON.stringify({
        userId: user.id,
        timestamp: Date.now(),
        nonce: crypto.randomUUID(),
      })
    ).toString("base64url");

    // Store code_verifier in secure cookie (10 minute expiry)
    const cookieStore = await cookies();
    cookieStore.set("autodesk_pkce_verifier", codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    cookieStore.set("autodesk_oauth_state", state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 600, // 10 minutes
      path: "/",
    });

    // Generate and redirect to Autodesk auth URL
    const authUrl = generateAuthUrl(state, codeChallenge);

    // Log the auth URL for debugging (will appear in server console)
    console.log("Redirecting to Autodesk auth URL:", authUrl);

    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error("Autodesk auth initiation error:", error);
    const message = error instanceof Error ? error.message : "Failed to initiate Autodesk auth";
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(message)}`
    );
  }
}
