import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;
    if (!ean) return res.status(400).json({ erro: "EAN obrigatorio" });

    const prompt = `Identifique o vinho do EAN ${ean}. Retorne um JSON com: marca, familia, origem, grupo, uva, descricao, harmonizacao (array).`;

    // URL usando a versão estável v1
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (response.status !== 200) {
      console.error("❌ Erro Google:", data);
      return res.status(response.status).json({ ean, erro: "Erro na API do Google", detalhes: data });
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (texto) {
      // Remove possíveis blocos de código markdown que a IA possa enviar
      const jsonLimpo = texto.replace(/```json|```/g, "").trim();
      return res.json({ ean, ...JSON.parse(jsonLimpo) });
    }

    res.json({ ean, marca: "Vinho não identificado" });
  } catch (error) {
    res.status(500).json({ erro: error.message });
  }
});

app.get("/", (req, res) => res.send("API Online"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Servidor na porta ${PORT}`));