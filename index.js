import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.post("/enriquecer", async (req, res) => {
  try {
    const { ean } = req.body;

    if (!ean) {
      return res.status(400).json({ erro: "EAN obrigatorio" });
    }

    const prompt = `
Identifique o vinho do EAN ${ean}.

Retorne APENAS um JSON válido, sem explicações, sem markdown.

Formato:
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

    // ✅ MODELO ESTÁVEL (FUNCIONA NA SUA CONTA)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_KEY}`;

    const response = await fetch(url, {
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
    });

    const data = await response.json();

    // 🔴 MOSTRA ERRO REAL (IMPORTANTE)
    if (!response.ok) {
      console.error("❌ Erro Google:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        erro: "Erro na API do Google",
        detalhes: data,
      });
    }

    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      return res.json({
        ean,
        erro: "Resposta vazia da IA",
        raw: data,
      });
    }

    try {
      // limpa markdown se vier
      const jsonLimpo = texto.replace(/```json|```/g, "").trim();

      const parsed = JSON.parse(jsonLimpo);

      return res.json({
        ean,
        ...parsed,
      });

    } catch (parseError) {
      return res.json({
        ean,
        erro: "Erro ao converter JSON",
        resposta_bruta: texto,
      });
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
    return res.status(500).json({
      erro: error.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("API Online 🚀");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});