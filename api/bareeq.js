export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const response = await fetch("https://aaim.com.eg/ar/what-we-offer/funds/bareeq", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const html = await response.text();

    // Extract the unit price - it appears after "السعر الحالى" in the page
    // Looking for a decimal number pattern near that text
    const priceMatch = html.match(/السعر الحالى[^0-9]*([\d]+\.[\d]+)/);
    const dateMatch = html.match(/أخر تحديث\s*([^\<]+)/);

    if (!priceMatch) {
      return res.status(500).json({ error: "Could not find price on page" });
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
