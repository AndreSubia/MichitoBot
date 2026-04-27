import { NextResponse } from "next/server";
import { readFile, appendFile } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { randomUUID } from "node:crypto";

const rulesPath = join(process.cwd(), "../../data/style_rules.jsonl");

export async function GET() {
  try {
    if (!existsSync(rulesPath)) {
      return NextResponse.json([]);
    }
    const content = await readFile(rulesPath, "utf-8");
    const rules = content.split("\n")
      .filter(Boolean)
      .map(line => JSON.parse(line));
    
    // Devolvemos solo las últimas 20 para el demo web
    return NextResponse.json(rules.slice(-20).reverse());
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json({ error: "Failed to fetch rules" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const ruleData = await req.json();
    const { text, rawInput, title, ruleType, tags, priority, guildId, ownerUserId, targetType, targetUserId, language } = ruleData;
    
    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const newRule = {
      id: ruleData.id || `rule_${randomUUID().split("-")[0]}`,
      guildId: guildId || "518266435928195116",
      ownerUserId: ownerUserId || "445753855230345219",
      targetType: targetType || "web-user", // Identificamos que el target es un usuario de la web
      targetUserId: targetUserId || "web-demo-user",
      ruleType: ruleType || "behavior",
      title: title || "Web Training Rule",
      text: text.trim(),
      rawInput: rawInput || text.trim(),
      language: language || "es",
      tags: [...(tags || ["training"]), "web"], // Añadimos siempre el tag 'web'
      priority: priority || 80,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    await appendFile(rulesPath, JSON.stringify(newRule) + "\n", "utf-8");
    return NextResponse.json(newRule);
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json({ error: "Failed to create rule" }, { status: 500 });
  }
}
