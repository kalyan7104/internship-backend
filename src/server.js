import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";
// import OpenAI SDK if you want AI enhancement
// import OpenAI from "openai";

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.json({ ok: true, message: "Server is running!" });
});

// Zod schema for URL validation
const urlSchema = z.object({
  url: z.string().url()
});

// Scrape website
async function scrapeWebsite(url) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    let brandName = $("meta[property='og:site_name']").attr("content")
      || $("meta[name='application-name']").attr("content")
      || $("title").first().text().trim();
    let description = $("meta[name='description']").attr("content")
      || $("meta[property='og:description']").attr("content")
      || $('body').text().trim().slice(0, 200);
    return { brandName, description };
  } catch (err) {
    throw new Error("Failed to scrape website: " + err.message);
  }
}

// Enhance description placeholder (can integrate OpenAI here)
function enhanceDescription(description) {
  if (!description) return null;
  let desc = description.trim();
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (!desc.endsWith(".")) desc += ".";
  return desc;
}

// POST /analyze
app.post("/analyze", async (req, res) => {
  const parse = urlSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid URL format." });
  }
  const { url } = parse.data;

  try {
    const { brandName, description } = await scrapeWebsite(url);
    const enhancedDescription = enhanceDescription(description);

    const website = await prisma.website.create({
      data: { url, brandName, description, enhancedDescription }
    });

    res.json(website);
  } catch (err) {
    console.error("Error in /analyze:", err);
    res.status(500).json({ error: "Failed to analyze website", details: err.message });
  }
});

// GET /websites
app.get("/websites", async (req, res) => {
  try {
    const websites = await prisma.website.findMany({ orderBy: { createdAt: "desc" } });
    res.json(websites);
  } catch (err) {
    console.error("Error fetching websites:", err);
    res.status(500).json({ error: "Failed to fetch websites", details: err.message });
  }
});

// PUT /websites/:id
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
    console.error("Error updating website:", err);
    res.status(404).json({ error: "Website not found or update failed.", details: err.message });
  }
});

// DELETE /websites/:id
app.delete("/websites/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });

  try {
    await prisma.website.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    console.error("Error deleting website:", err);
    res.status(404).json({ error: "Website not found or delete failed.", details: err.message });
  }
});

// DB test route
app.get("/db-test", async (req, res) => {
  try {
    const result = await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true, result });
  } catch (err) {
    console.error("DB connection error:", err);
    res.status(500).json({ error: "DB connection failed", details: err.message });
  }
});

// Unknown route handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
