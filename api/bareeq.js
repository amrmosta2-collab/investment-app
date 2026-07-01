export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const response = await fetch("https://aaim.com.eg/en/what-we-offer/funds/bareeq", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });

    if (!response.ok) {
      return res.status(500).json({ error: `Page returned ${response.status}` });
    }

    const html = await response.text();

    // Price appears as: "Current price :-\n\n207.18924\n\nEGP"
    const priceMatch = html.match(/Current price\s*:-[\s\S]{0,200}?([\d]{3}\.[\d]+)/i);

    // Last update appears as: "Last update 30 Jun, 2026"
    const dateMatch = html.match(/Last update\s+([^\n<]+)/i);

    if (!priceMatch) {
      return res.status(500).json({ 
        error: "Could not find price on page",
      });
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
