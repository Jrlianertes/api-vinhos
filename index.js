import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;
    console.log("🍷 EAN:", ean);

    if (!ean) return res.status(400).json({ erro: "EAN obrigatorio" });

    // Pedimos o JSON no próprio texto do prompt para não depender do parâmetro que deu erro
    const prompt = `Identifique o vinho EAN ${ean}. Responda APENAS um objeto JSON com os campos: marca, familia, origem, grupo, uva, descricao, harmonizacao. Não use blocos de código markdown.`;

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
        // 🚀 Removido o generationConfig que estava causando o erro 400
      })
    });

    const data = await response.json();
    console.log("📡 Status Google:", response.status);

    const textoResposta = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    console.log("📄 Resposta Google:", textoResposta);

    if (textoResposta) {
      // Tentamos transformar o texto em JSON
      try {
        const vinculo = JSON.parse(textoResposta);
        return res.json({ ean, ...vinculo });
      } catch (e) {
        console.error("❌ Erro ao converter JSON:", e.message);
      }
    }

    res.json({ ean, marca: "Vinho não identificado", erro: "Resposta invalida do Google" });

  } catch (error) {
    console.error("💥 Erro Geral:", error.message);
    res.status(500).json({ erro: error.message });
  }
});

app.get("/", (req, res) => res.send("API ONLINE 🍷"));
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Servidor na porta ${PORT}`));