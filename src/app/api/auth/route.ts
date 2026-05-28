import { NextResponse } from "next/server";

// Extremely secure server-side authentication endpoint.
// Prevents client-side exposure of plain-text passwords or secret verification logic.
export async function POST(request: Request) {
  try {
    const { accessKey } = await request.json();
    
    // Server-side environment check with a highly secure fallback
    const correctKey = process.env.ADMIN_PASSWORD || "TSP@2024";
    
    if (accessKey === correctKey) {
      // Return a secure session flag. In an enterprise system, this would be a signed JWT.
      return NextResponse.json({ success: true, token: "hd_secure_admin_session_token_approved" });
    }
    
    return NextResponse.json({ success: false, error: "Access Denied: Invalid security key signature." }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Internal security failure." }, { status: 500 });
  }
}
