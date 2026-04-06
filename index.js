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

Retorne um JSON com exatamente estes campos:
- marca
- familia
- origem
- grupo
- uva
- descricao
- pontuacao
- teoralcoolico
- temperaturadeserviço
- harmonizacao (array de strings)

Se não souber algum campo, retorne null.
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
        text: {
          format: {
            type: "json_object"
          }
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Erro OpenAI:", JSON.stringify(data, null, 2));
      return res.status(response.status).json({
        erro: "Erro na OpenAI",
        detalhes: data
      });
    }

    const texto = data.output?.[0]?.content?.[0]?.text;

    if (!texto) {
      return res.json({
        ean,
        erro: "Resposta vazia da IA",
        raw: data
      });
    }

    try {
      const parsed = JSON.parse(texto);

      return res.json({
        ean,
        ...parsed
      });

    } catch (parseError) {
      return res.json({
        ean,
        erro: "Erro ao converter JSON",
        resposta_bruta: texto
      });
    }

  } catch (error) {
    console.error("❌ Erro geral:", error);
    return res.status(500).json({
      erro: error.message
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