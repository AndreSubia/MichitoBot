import { NextResponse } from "next/server";
import { petRepo } from "@michito/db";
import { PET_ACTIONS, isPetActionKind } from "@michito/shared";

export const dynamic = "force-dynamic";

const DEMO_GUILD_ID = process.env.WEB_DEMO_GUILD_ID ?? "demo";
const DEMO_USER_ID = process.env.WEB_DEMO_USER_ID ?? "web-demo-user";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { action?: unknown };
    if (!isPetActionKind(body.action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const def = PET_ACTIONS[body.action];
    const result = await petRepo.applyDelta(DEMO_GUILD_ID, DEMO_USER_ID, def.kind, def.delta);

    if (!result.applied) {
      return NextResponse.json({
        applied: false,
        message: "Michi está dormido para siempre. Un admin puede revivirlo con /revive en Discord.",
        pet: result.pet,
      });
    }

    return NextResponse.json({
      applied: true,
      flavor: def.flavor,
      pet: result.pet,
    });
  } catch (error) {
    console.error("Pet action error:", error);
    return NextResponse.json({ error: "Failed to apply action" }, { status: 500 });
  }
}
