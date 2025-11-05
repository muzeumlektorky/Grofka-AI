import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import 'dotenv/config';
import OpenAI from "openai";
import cors from "cors";
import fs from "fs";

const port = process.env.PORT || 3000;
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cesta k súboru s vedomosťami
const knowledgePath = path.resolve("informacie/vedomosti.txt");

// Načítanie súboru s vedomosťami
let assistantContext = fs.existsSync(knowledgePath)
  ? fs.readFileSync(knowledgePath, "utf-8")
  : "Vedomosti neboli načítané.";

// Automatické obnovenie, ak súbor zmeníš
fs.watchFile(knowledgePath, () => {
  assistantContext = fs.readFileSync(knowledgePath, "utf-8");
  console.log("🟢 Aktualizované vedomosti pre Grófku načítané.");
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Root stránka
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "assistent.html"));
});

// Inicializácia OpenAI klienta
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Endpoint pre chat
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Chýba správa od používateľa" });
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-3.5-turbo",
      max_tokens: 200, // ⚙️ obmedzí dĺžku odpovede
      temperature: 0.7, // prirodzenejšie odpovede
      messages: [
        {
          role: "system",
          content: `Si múzejný asistent menom Grófka. Odpovedaj priateľsky, stručne a zrozumiteľne.
Tvoje vedomosti:\n\n${assistantContext}`,
        },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.error("❌ Chyba OpenAI API:", error);
    res.status(500).json({
      error: "Grófka je momentálne zaneprázdnená – skúste to o chvíľu.",
    });
  }
});

// Spustenie servera
app.listen(port, "0.0.0.0", () => {
  console.log(`🟢 Server beží na všetkých sieťach, port ${port}`);
});
