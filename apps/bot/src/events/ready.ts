import { Client } from "discord.js";

export function registerReady(client: Client) {
  client.once("ready", () => {
    console.log(`Discord ready: user=${client.user?.tag ?? "unknown"} guilds=${client.guilds.cache.size}`);
  });
}
