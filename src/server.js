import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import * as cheerio from "cheerio";
import { z } from "zod";

const app = express();
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
    let brandName =
      $("meta[property='og:site_name']").attr("content") ||
      $("meta[name='application-name']").attr("content") ||
      $("title").first().text().trim();
    let description =
      $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      $("body").text().trim().slice(0, 200);
    return { brandName, description };
  } catch (err) {
    throw new Error("Failed to scrape website: " + err.message);
  }
}

// Enhance description
function enhanceDescription(description) {
  if (!description) return null;
  let desc = description.trim();
  desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  if (!desc.endsWith(".")) desc += ".";
  return desc;
}

// POST /analyze-website: Analyze website and store in DB (handles duplicates)
app.post("/analyze-website", async (req, res) => {
  const parse = urlSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid URL format." });
  }
  const { url } = parse.data;

  try {
    // Check if website already exists
    const existing = await prisma.website.findUnique({ where: { url } });
    if (existing) {
      return res.status(400).json({ error: "Website already exists." });
    }

    const { brandName, description } = await scrapeWebsite(url);
    const enhancedDescription = enhanceDescription(description);

    const website = await prisma.website.create({
      data: { url, brandName, description, enhancedDescription }
    });

    res.json(website);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /website-crud: Retrieve all websites
app.get("/website-crud", async (req, res) => {
  try {
    const websites = await prisma.website.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(websites);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch websites." });
  }
});

// GET /website-crud/:id: Retrieve a single website
app.get("/website-crud/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    const website = await prisma.website.findUnique({ where: { id } });
    if (!website) return res.status(404).json({ error: "Website not found." });
    res.json(website);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch website." });
  }
});

// PUT /website-crud/:id: Update website
app.put("/website-crud/:id", async (req, res) => {
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

// DELETE /website-crud/:id: Delete website
app.delete("/website-crud/:id", async (req, res) => {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ error: "Invalid ID." });
  try {
    await prisma.website.delete({ where: { id } });
    res.json({ ok: true });
  } catch (err) {
    res.status(404).json({ error: "Website not found or delete failed." });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on ${BASE_URL}`);
});
