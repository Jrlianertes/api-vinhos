import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;
    console.log("🍷 EAN Recebido:", ean);

    if (!ean) return res.status(400).json({ erro: "EAN obrigatorio" });

    // Prompt super direto e sem caracteres complexos
    const prompt = `Identifique o vinho do EAN ${ean}. Retorne um JSON com: marca, familia, origem, grupo, uva, descricao, harmonizacao (array).`;

    console.log("🚀 Chamando Gemini...");

    // Usando a v1beta que é mais estável para JSON puro
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          response_mime_type: "application/json"
        }
      })
    });

    const data = await response.json();
    console.log("📡 Status Google:", response.status);

    if (response.status !== 200) {
      console.error("❌ Erro detalhado do Google:", JSON.stringify(data));
    }

    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    let parsed = null;
    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error("❌ Falha ao converter texto em JSON");
      }
    }

    // Retorno final (Dados da IA ou Fallback)
    return res.json({
      ean,
      marca: parsed?.marca || "Vinho não identificado",
      familia: parsed?.familia || "Vinho",
      origem: parsed?.origem || "Desconhecida",
      grupo: parsed?.grupo || "Não identificado",
      uva: parsed?.uva || "N/A",
      descricao: parsed?.descricao || "Não foi possível encontrar detalhes para este EAN.",
      harmonizacao: parsed?.harmonizacao || []
    });

  } catch (error) {
    console.error("💥 Erro Geral:", error.message);
    res.status(500).json({ erro: error.message });
  }
});

app.get("/", (req, res) => res.send("API Online 🍷"));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🔥 Servidor na porta ${PORT}`));