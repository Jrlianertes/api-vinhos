import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean, nome } = req.body;

    if (!ean) {
      return res.status(400).json({ erro: "EAN obrigatório" });
    }

    const prompt = `
Você é um sommelier especialista.

Gere uma ficha técnica REALISTA para:
"${nome || ean}"

Retorne APENAS JSON válido:

{
  "marca": "",
  "familia": "",
  "origem": "",
  "grupo": "",
  "uva": "",
  "descricao": "",
  "harmonizacao": []
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      }
    );

    const data = await response.json();

    let content =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // 🔥 pega só o JSON da resposta
    const match = content.match(/\{[\s\S]*\}/);

    if (match) {
      content = match[0];
    } else {
      content = "{}";
    }

    // 🔍 log para debug
    console.log("Resposta Gemini:", content);

    // ✅ AQUI ESTAVA O ERRO (parsed não existia)
    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = {};
    }

    // 🔥 fallback inteligente
    if (!parsed.marca) {
      parsed = {
        marca: nome || "Vinho",
        familia: "Vinho",
        origem: "Não identificado",
        grupo: "Não identificado",
        uva: "Não identificado",
        descricao: "Não foi possível gerar dados confiáveis.",
        harmonizacao: ["Não disponível"]
      };
    }

    return res.json({
      ean,
      ...parsed
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("API Vinhos rodando 🍷");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});