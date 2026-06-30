export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const prompt = `Search the web and visit this URL: https://aaim.com.eg/ar/what-we-offer/funds/bareeq

This is the official page for the بريق (Bareeq) fixed income fund in Egypt, managed by AAIM. The page shows a current unit price (labeled "السعر الحالى") as a decimal number like 207.08859, and a last updated date (labeled "أخر تحديث").

Find the current unit price number and the last updated date.

Respond with ONLY a JSON object on a single line, nothing else before or after it, no markdown formatting, no code fences, no explanation:
{"price": 207.08859, "lastUpdated": "29 يونيو 2026"}

Use the exact decimal number you found for "price" as a JSON number (not a string).`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();
    if (data.error) return res.status(500).json({ error: data.error.message });

    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");

    // Try to find a JSON object containing "price"
    const jsonMatches = text.match(/\{[^{}]*"price"[^{}]*\}/g);
    if (!jsonMatches || jsonMatches.length === 0) {
      return res.status(500).json({ error: "Could not parse price from response", rawText: text.slice(0, 300) });
    }

    // Use the last match (most likely the final answer, not search result echo)
    let parsed;
    try {
      parsed = JSON.parse(jsonMatches[jsonMatches.length - 1]);
    } catch {
      return res.status(500).json({ error: "Invalid JSON in response", rawText: text.slice(0, 300) });
    }

    if (typeof parsed.price !== "number" || isNaN(parsed.price)) {
      return res.status(500).json({ error: "Price field missing or invalid", rawText: text.slice(0, 300) });
    }

    return res.status(200).json({
      price: parsed.price,
      lastUpdated: parsed.lastUpdated || null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
