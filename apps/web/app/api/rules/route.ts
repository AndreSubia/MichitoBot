import { NextResponse } from "next/server";
import { trainingRuleRepo, InvalidRuleError } from "@michito/db";

export const dynamic = "force-dynamic";

const DEMO_GUILD_ID = process.env.WEB_DEMO_GUILD_ID ?? "demo";
const DEMO_USER_ID = process.env.WEB_DEMO_USER_ID ?? "web-demo-user";

export async function GET() {
  try {
    const rules = await trainingRuleRepo.listActiveRules(DEMO_GUILD_ID, 20);
    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { text?: unknown };
    const rawText = typeof body.text === "string" ? body.text : "";

    if (!rawText.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const rule = await trainingRuleRepo.addRule(DEMO_GUILD_ID, DEMO_USER_ID, rawText);
    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof InvalidRuleError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
