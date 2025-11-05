import 'dotenv/config';
import express from "express";
import OpenAI from "openai";
import cors from "cors";
import fs from "fs";
import path from "path";


const port = process.env.PORT || 3000;
const app = express();
// Načítanie vedomostí pre chatbota
const knowledgePath = path.resolve("informacie/vedomosti.txt");
const assistantContext = fs.readFileSync(knowledgePath, "utf-8");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Povolenie CORS pre všetky zdroje
app.use(cors());

// Pre parsovanie JSON
app.use(express.json());

// Servovanie statických súborov (HTML, CSS, JS)
app.use(express.static("public"));

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Inicializácia OpenAI klienta
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Endpoint pre chat
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Chýba správa od používateľa" });
  }

  try {
  const completion = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [
    {
      role: "system",
      content: `Si múzejný asistent menom Grófka. Odpovedaj priateľsky, stručne a zrozumiteľne. 
Tu sú tvoje vedomosti:\n\n${assistantContext}`
    },
    { role: "user", content: message }
  ]
});


    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (error) {
    console.error("Chyba OpenAI API:", error);
    res.status(500).json({ error: "Chyba pri komunikácii s OpenAI API" });
  }
});

// Spustenie servera
app.listen(port, "0.0.0.0", () => {
  console.log(`Server beží na všetkých sieťach, port ${port}`);
});
fs.watchFile(knowledgePath, () => {
  assistantContext = fs.readFileSync(knowledgePath, "utf-8");
  console.log("🟢 Aktualizované vedomosti pre Grófku načítané.");
});



