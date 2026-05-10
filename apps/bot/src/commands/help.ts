import { CommandDefinition } from "@michito/discord";
import { config } from "../config.js";
import { splitDiscordMessages, replyEphemeralPages } from "../lib/utils.js";

export const helpCommand: CommandDefinition = {
  name: "help",
  description: "Cómo usar Michi",
  async handle(interaction) {
    const triggerList = config.triggerWords.length ? config.triggerWords.join(", ") : "(sin triggers)";
    const guide = [
      "🐱 Guía de Michi",
      "",
      "1) Mascota virtual",
      "- `/status` — ver hambre, energía, salud, ánimo y estado.",
      "- `/feed` — alimentar a Michi (baja hambre, sube ánimo).",
      "- `/play` — jugar (baja energía, sube ánimo).",
      "- `/sleep` — descansar (sube energía).",
      "- `/pet` — caricias (sube ánimo).",
      "- `/heal` — medicina (admin, sube salud).",
      "- `/revive` — revivir a Michi cuando muere (admin).",
      "",
      "2) Conversación",
      `- Triggers ambient: ${triggerList}. Si tu mensaje contiene uno, Michi responde.`,
      '- `/chat ask prompt:"..."` — pregúntale algo directamente.',
      "",
      "3) Personalidad",
      "- `/rules list` — ver reglas activas.",
      "- `/rules add text:\"...\"` — añadir una regla (admin).",
      "- `/rules remove id:<id>` — desactivar una regla (admin).",
      "",
      "4) Configuración del servidor",
      "- `/config channels add channel:#sala` — limitar canales (admin).",
      "- `/config channels remove channel:#sala`",
      "- `/config channels list`",
      "",
      "5) Otros",
      "- `/about` — versión, modelo y enlace al código.",
      "- `/ping` — health check.",
      "",
      "6) Seguridad",
      "- Michi neutraliza @everyone/@here.",
      "- Las reglas no pueden anular las reglas duras de seguridad del bot.",
      "- No guardes tokens/contraseñas en reglas: `/rules add` los rechaza.",
    ].join("\n");
    const pages = splitDiscordMessages(guide, 1900);
    await replyEphemeralPages(interaction, pages);
  },
};
