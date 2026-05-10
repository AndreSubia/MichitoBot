import { NextResponse } from "next/server";
import { petRepo } from "@michito/db";

export const dynamic = "force-dynamic";

const DEMO_GUILD_ID = process.env.WEB_DEMO_GUILD_ID ?? "demo";

export async function GET() {
  try {
    const pet = await petRepo.ensurePet(DEMO_GUILD_ID);
    return NextResponse.json({
      id: pet.id,
      name: pet.name,
      state: pet.state,
      hunger: pet.hunger,
      energy: pet.energy,
      health: pet.health,
      mood: pet.mood,
      level: pet.level,
      xp: pet.xp,
      bornAt: pet.bornAt,
      diedAt: pet.diedAt,
      causeOfDeath: pet.causeOfDeath,
      deathCount: pet.deathCount,
      lastTickAt: pet.lastTickAt,
      nextTickAt: pet.nextTickAt,
    });
  } catch (error) {
    console.error("Error fetching pet:", error);
    return NextResponse.json({ error: "Failed to fetch pet" }, { status: 500 });
  }
}
