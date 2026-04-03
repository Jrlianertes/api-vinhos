import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;

    console.log("🔥 REQUISIÇÃO RECEBIDA EAN:", ean);

    if (!ean) {
      return res.status(400).json({ erro: "EAN obrigatório" });
    }

    // Prompt ajustado para usar o EAN recebido e garantir o formato JSON
    const prompt = `Identifique o produto com código EAN ${ean}. 
    Retorne as informações técnicas no formato JSON abaixo. 
    Se não encontrar o vinho exato, tente identificar pela numeração do país no EAN.
    JSON esperado:
    {
      "marca": "Nome do Vinho",
      "familia": "Vinho",
      "origem": "País de origem",
      "grupo": "Tinto, Branco ou Rosé",
      "uva": "Casta das uvas",
      "descricao": "Breve descrição sensorial",
      "harmonizacao": ["Item 1", "Item 2"]
    }`;

    console.log("🚀 CHAMANDO GEMINI...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json", // Força a IA a responder apenas o objeto JSON
          },
        }),
      }
    );

    const data = await response.json();
    console.log("📡 STATUS GEMINI:", response.status);

    // Extração segura do conteúdo
    const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    let parsed = null;
    if (content) {
      try {
        parsed = JSON.parse(content);
      } catch (err) {
        console.error("❌ ERRO NO PARSE DO JSON:", err);
      }
    }

    // Fallback caso a IA falhe ou não encontre dados
    if (!parsed || !parsed.marca) {
      console.log("⚠️ USANDO FALLBACK");
      parsed = {
        marca: "Vinho não identificado",
        familia: "Vinho",
        origem: "Desconhecida",
        grupo: "Não identificado",
        uva: "N/A",
        descricao: "Não foi possível encontrar detalhes para este EAN.",
        harmonizacao: [],
      };
    }

    return res.json({
      ean,
      ...parsed,
    });

  } catch (error) {
    console.error("💥 ERRO GERAL NO SERVER:", error);
    return res.status(500).json({
      erro: "Erro interno no servidor",
      detalhe: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("API Vinhos rodando 🍷");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🔥 API VINHOS ONLINE NA PORTA ${PORT}`);
});