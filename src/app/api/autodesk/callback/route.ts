import { createClient } from "@/lib/supabase/server";
import { exchangeCodeForTokens, getUserProfile } from "@/lib/autodesk/client";
import { storeTokens } from "@/lib/autodesk/tokens";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors from Autodesk
  if (error) {
    console.error("Autodesk OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent("Missing authorization code or state")}`
    );
  }

  try {
    const cookieStore = await cookies();

    // Validate state token
    const storedState = cookieStore.get("autodesk_oauth_state")?.value;
    if (!storedState || storedState !== state) {
      return NextResponse.redirect(
        `${origin}/settings?error=${encodeURIComponent("Invalid state token. Please try again.")}`
      );
    }

    // Get code_verifier from cookie
    const codeVerifier = cookieStore.get("autodesk_pkce_verifier")?.value;
    if (!codeVerifier) {
      return NextResponse.redirect(
        `${origin}/settings?error=${encodeURIComponent("Session expired. Please try again.")}`
      );
    }

    // Parse state to get user ID
    const stateData = JSON.parse(Buffer.from(state, "base64url").toString());
    const stateUserId = stateData.userId;

    // Verify user is still authenticated with same user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || user.id !== stateUserId) {
      return NextResponse.redirect(
        `${origin}/settings?error=${encodeURIComponent("Session mismatch. Please try again.")}`
      );
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, codeVerifier);

    // Get user profile from Autodesk
    const profile = await getUserProfile(tokens.access_token);
    console.log("Autodesk user profile response:", JSON.stringify(profile, null, 2));

    // Store tokens in database
    await storeTokens(user.id, tokens, profile);

    // Clear cookies
    cookieStore.delete("autodesk_pkce_verifier");
    cookieStore.delete("autodesk_oauth_state");

    // Redirect to settings with success message
    return NextResponse.redirect(`${origin}/settings?autodesk=connected`);
  } catch (err) {
    console.error("Autodesk callback error:", err);
    const message = err instanceof Error ? err.message : "Failed to complete Autodesk connection";
    return NextResponse.redirect(
      `${origin}/settings?error=${encodeURIComponent(message)}`
    );
  }
}
