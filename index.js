import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;

    console.log("REQ BODY:", req.body);

    if (!ean) {
      return res.status(400).json({ erro: "EAN obrigatório" });
    }

    const prompt = `
Você é um sommelier profissional.

Código EAN: ${ean}

Gere uma ficha técnica REALISTA de vinho.

Retorne SOMENTE JSON válido:

{
  "marca": "",
  "familia": "",
  "origem": "",
  "grupo": "",
  "uva": "",
  "descricao": "",
  "harmonizacao": ["", ""]
}

Regras:
- Nunca deixe campos vazios
- Identifique tipo: vinho, espumante, rosé, frisante
- Seja coerente com vinhos reais
- Não invente marcas muito específicas se não tiver certeza
- Prefira respostas genéricas mas corretas quando necessário
`;

    // 🔥 timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }]
            }
          ]
        }),
      }
    );

    clearTimeout(timeout);

    const data = await response.json();

    let content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    // 🔍 log bruto
    console.log("Resposta Gemini BRUTA:", content);

    // 🔥 pega JSON seguro
    const match = content.match(/\{[\s\S]*?\}/);

    if (match) {
      content = match[0];
    } else {
      content = "{}";
    }

    console.log("JSON extraído:", content);

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.log("Erro ao parsear JSON:", err);
      parsed = {};
    }

    // 🔥 validação mais robusta
    if (
      !parsed ||
      !parsed.marca ||
      !parsed.familia ||
      !parsed.grupo
    ) {
      parsed = {
        marca: "Vinho não identificado",
        familia: "Vinho",
        origem: "Não identificado",
        grupo: "Vinho",
        uva: "Não identificado",
        descricao:
          "Produto gerado por IA com base limitada no código EAN.",
        harmonizacao: ["Carnes", "Massas"]
      };
    }

    return res.json({
      ean,
      ...parsed
    });

  } catch (error) {
    console.error("Erro geral:", error);

    return res.status(500).json({
      erro: "Erro ao processar vinho",
      detalhe: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("API Vinhos rodando 🍷");
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});