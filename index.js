import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;
    console.log("🍷 EAN Recebido:", ean);

    if (!ean) return res.status(400).json({ erro: "EAN obrigatorio" });

    // Prompt pedindo o JSON de forma direta
    const prompt = `Identifique o vinho do EAN ${ean}. Retorne APENAS um objeto JSON com: marca, familia, origem, grupo, uva, descricao, harmonizacao (array). Não use blocos de código markdown.`;

    // URL usando v1beta que é mais flexível
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();
    console.log("📡 Status Google:", response.status);

    // Se der erro, o log do Render vai mostrar o motivo real
    if (response.status !== 200) {
      console.log("❌ Erro detalhado do Google:", JSON.stringify(data));
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (texto) {
      try {
        // Limpa possíveis marcações de código (```json) que o Gemini às vezes coloca
        const jsonLimpo = texto.replace(/```json|```/g, "").trim();
        const vinculo = JSON.parse(jsonLimpo);
        return res.json({ ean, ...vinculo });
      } catch (e) {
        console.error("❌ Falha ao processar JSON da IA:", e.message);
      }
    }

    res.json({ ean, marca: "Vinho não identificado", erro: "IA não retornou dados válidos" });

  } catch (error) {
    console.error("💥 Erro Geral:", error.message);
    res.status(500).json({ erro: error.message });
  }
});

app.get("/", (req, res) => res.send("API Online 🍷"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Servidor na porta ${PORT}`));