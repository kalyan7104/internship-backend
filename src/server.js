import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";

const app = express();
// Define base URL for API endpoints (can be overridden by environment)
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const PORT = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running!" });
});

// Zod schema for URL validation
const urlSchema = z.object({
  url: z.string().url()
});

// Helper: Scrape brand name and description
async function scrapeWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    // Brand name: Try <meta property="og:site_name">, <title>, or <meta name="application-name">
    let brandName = $("meta[property='og:site_name']").attr("content")
      || $("meta[name='application-name']").attr("content")
      || $("title").first().text().trim();
    // Description: Try <meta name="description">
    let description = $("meta[name='description']").attr("content")
      || $("meta[property='og:description']").attr("content")
      || $('body').text().trim().slice(0, 200); // fallback: first 200 chars of body
    return { brandName, description };
  } catch (err) {
    throw new Error("Failed to scrape website: " + err.message);
  }
}

// (Optional) Enhance description (placeholder for AI)
function enhanceDescription(description) {
  // For now, just capitalize first letter and add a period if missing
  if (!description) return null;
  let desc = description.trim();
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (!desc.endsWith(".")) desc += ".";
  return desc;
}

// POST /analyze: Analyze website and store in DB
app.post("/analyze", async (req, res) => {
  // Validate URL
  const parse = urlSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid URL format." });
  }
  const { url } = parse.data;
  try {
    // Scrape website
    const { brandName, description } = await scrapeWebsite(url);
    // Enhance description
    const enhancedDescription = enhanceDescription(description);
    // Store in DB
    const website = await prisma.website.create({
      data: {
        url,
        brandName,
        description,
        enhancedDescription
      }
    });
    res.json(website);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /websites: Retrieve all website records
app.get("/websites", async (req, res) => {
  try {
    const websites = await prisma.website.findMany({ orderBy: { createdAt: "desc" } });
    res.json(websites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch websites." ,details:error.message});
  }
});

// PUT /websites/:id: Update a website record
app.put("/websites/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    const update = await prisma.website.update({
      where: { id },
      data: req.body
    });
    res.json(update);
  } catch (err) {
    res.status(404).json({ error: "Website not found or update failed." });
  }
});

// DELETE /websites/:id: Delete a website record
app.delete("/websites/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    await prisma.website.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: "Website not found or delete failed." });
  }
});

// Error handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
