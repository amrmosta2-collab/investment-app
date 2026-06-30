export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const prompt = `Visit this exact URL: https://aaim.com.eg/ar/what-we-offer/funds/bareeq

Find the current unit price (السعر الحالى) of the بريق (Bareeq) fund shown on that page, and the "أخر تحديث" (last updated) date shown next to it.

Respond ONLY with this exact JSON, no markdown, no extra text:
{"price": <the exact decimal number you found, as a number not a string>, "lastUpdated": "<the date text you found>"}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 500,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("");
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return res.status(500).json({ error: "Could not parse price from response" });

    const parsed = JSON.parse(jsonMatch[0]);

    return res.status(200).json({
      price: parsed.price,
      lastUpdated: parsed.lastUpdated,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
