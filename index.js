import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;

    console.log("🔥 REQUISIÇÃO RECEBIDA:", req.body);

    if (!ean) {
      return res.status(400).json({ erro: "EAN obrigatório" });
    }

    const prompt = `
Retorne APENAS este JSON, sem nenhum texto antes ou depois:

{
  "marca": "Vinho Teste",
  "familia": "Vinho",
  "origem": "Chile",
  "grupo": "Tinto",
  "uva": "Cabernet Sauvignon",
  "descricao": "Teste funcionando",
  "harmonizacao": ["Carne", "Queijo"]
}
`;

    console.log("🚀 CHAMANDO GEMINI...");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    console.log("📡 STATUS GEMINI:", response.status);

    const data = await response.json();

    console.log(
      "🧠 DATA COMPLETA GEMINI:",
      JSON.stringify(data, null, 2)
    );

    let content =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    console.log("📄 TEXTO BRUTO:", content);

    // 🔥 extrai JSON com segurança
    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start !== -1 && end !== -1) {
      content = content.substring(start, end + 1);
    } else {
      content = "";
    }

    console.log("🧩 JSON EXTRAÍDO:", content);

    let parsed;

    try {
      parsed = JSON.parse(content);
    } catch (err) {
      console.log("❌ ERRO AO PARSEAR JSON:", err);
      parsed = null;
    }

    // 🔥 fallback
    if (!parsed || !parsed.marca) {
      parsed = {
        marca: "Vinho não identificado",
        familia: "Vinho",
        origem: "Não identificado",
        grupo: "Vinho",
        uva: "Não identificado",
        descricao:
          "Produto gerado por IA com base limitada no código EAN.",
        harmonizacao: ["Carnes", "Massas"],
      };
    }

    return res.json({
      ean,
      ...parsed,
    });
  } catch (error) {
    console.error("💥 ERRO GERAL:", error);

    return res.status(500).json({
      erro: "Erro ao processar",
      detalhe: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("API Vinhos rodando 🍷");
});

app.listen(3000, () => {
  console.log("🔥 API VINHOS ONLINE NA PORTA 3000");
});