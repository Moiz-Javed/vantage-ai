import { applyCors } from "../../lib/cors.js";
import { PERSONA_IDS } from "../../services/gemini.js";

export default function handler(req, res) {
  if (applyCors(req, res)) return;
  res.status(200).json(PERSONA_IDS);
}
