export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    // r.jina.ai renders JS-heavy pages server-side and returns clean text,
    // which lets us read the price even though AAIM's page loads it via JavaScript.
    const targetUrl = "https://aaim.com.eg/ar/what-we-offer/funds/bareeq";
    const response = await fetch(`https://r.jina.ai/${targetUrl}`, {
      headers: { "X-Return-Format": "text" },
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Render service returned ${response.status}` });
    }

    const text = await response.text();

    // Look for "السعر الحالى" followed by a decimal number
    const priceMatch = text.match(/السعر الحالى[\s\S]{0,40}?([\d]+\.[\d]+)/);
    const dateMatch = text.match(/أخر تحديث[\s\S]{0,40}?([^\n]+)/);

    if (!priceMatch) {
      return res.status(500).json({ error: "Could not find price in rendered page", rawText: text.slice(0, 500) });
    }

    const price = parseFloat(priceMatch[1]);
    const lastUpdated = dateMatch ? dateMatch[1].trim() : null;

    return res.status(200).json({
      price,
      lastUpdated,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
