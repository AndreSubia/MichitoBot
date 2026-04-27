import { CommandDefinition } from "@michito/discord";
import { config } from "../config.js";
import { splitDiscordMessages, replyEphemeralPages } from "../lib/utils.js";

export const helpCommand: CommandDefinition = {
  name: "help",
  description: "How to use Michito",
  async handle(interaction) {
    const triggerList = config.triggerWords.length ? config.triggerWords.join(", ") : "(sin triggers)";
    const guide = [
      "Guía completa de Michito",
      "",
      "1) Cómo interactuar",
      "- Mensajes normales: escribe algo que contenga un trigger y te responde.",
      `  Triggers actuales: ${triggerList}`,
      '- Configura triggers con BOT_TRIGGER_WORDS="michi,michito,gato"',
      "- Slash commands: úsalos para acciones específicas (guardar reglas, ver perfil, etc.).",
      "",
      "2) Comandos disponibles",
      "- /ping",
      '- /chat ask prompt:"..."',
      "- /train rule text:\"...\" (regla del server)",
      "- /train rule user:@alguien text:\"...\" (regla para ese usuario, dentro del server)",
      "- /train profile (muestra reglas del server actual)",
      "- /train forget query:\"...\" (borra reglas del server actual que contengan ese texto)",
      "- /train add prompt:\"...\" ideal:\"...\" tags:\"...\" (guarda ejemplos para futuro fine-tune/LoRA)",
      "",
      "3) Cómo usar /train (memoria por server)",
      "- Las reglas y ejemplos se guardan en disco (data/*.jsonl).",
      "- Cada server tiene su propio estilo: las reglas se filtran por guildId.",
      "- Las reglas por usuario aplican solo cuando Michito le responde a esa persona.",
      "",
      "4) Ejemplos recomendados",
      '- /train rule text:"En este server: responde en 1–2 frases, directo y sin relleno."',
      '- /train rule text:"En este server: usa humor felino sutil, sin groserías."',
      '- /train rule user:@alguien text:"Con esta persona sé más sarcástico (suave) y súper breve."',
      '- /train rule user:@alguien text:"A esta persona llámala Cabeloco."',
      '- /train add prompt:"Dame 3 ideas de desayuno rápido" ideal:"Tres ideas: yogur con fruta, tostada con huevo, avena instantánea." tags:"ejemplos,estilo"',
      "- /train profile",
      '- /train forget query:"humor"',
      "",
      "5) Seguridad",
      "- No guardes tokens/contraseñas/claves. /train los rechaza si parece sensible.",
      "- Michito neutraliza @everyone/@here en respuestas."
    ].join("\n");
    const pages = splitDiscordMessages(guide, 1900);
    await replyEphemeralPages(interaction, pages);
  }
};
