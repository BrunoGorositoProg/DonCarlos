export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, message: "Method not allowed" });
  }

  try {
    const { user, pass } = req.body;

    if (!user || !pass) {
      return res.status(400).json({ ok: false });
    }

    if (user === "admin" && pass === process.env.ADMIN_PASS) {
      return res.status(200).json({ ok: true });
    } else {
      return res.status(401).json({ ok: false });
    }

  } catch (error) {
    return res.status(500).json({ ok: false });
  }
}