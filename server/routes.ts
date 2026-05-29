import bcrypt from "bcryptjs";
import type { Express, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { generateProduct, generatePromptBuilder } from "./ai";
import { createDocx, createPdf } from "./export";
import { productTypes, starterTemplates } from "./templates";
import { storage } from "./storage";

const authSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

const generatorSchema = z.object({
  productType: z.string(),
  idea: z.string().min(2),
  audience: z.string().min(2),
  problem: z.string().min(2),
  helpUserDo: z.string().min(2),
  tools: z.string().default("ChatGPT"),
  level: z.string(),
  tone: z.string(),
  length: z.string(),
  monetization: z.string(),
  salesCopy: z.string(),
  starterTemplate: z.string().optional()
});

function userId(req: Request) {
  return (req.session as any).userId as number | undefined;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!userId(req)) return res.status(401).json({ message: "Please log in to continue." });
  next();
}

function publicUser(user: { id: number; name: string; email: string }) {
  return { id: user.id, name: user.name, email: user.email };
}

export function registerRoutes(app: Express) {
  app.get("/api/meta", (_req, res) => {
    res.json({ productTypes, starterTemplates });
  });

  app.get("/api/auth/me", async (req, res) => {
    const id = userId(req);
    if (!id) return res.json({ user: null });
    const user = await storage.getUserById(id);
    res.json({ user: user ? publicUser(user) : null });
  });

  app.post("/api/auth/register", async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.name) return res.status(400).json({ message: "Enter a name, valid email, and 6+ character password." });
    const email = parsed.data.email.toLowerCase();
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await storage.createUser({ name: parsed.data.name, email, passwordHash });
    (req.session as any).userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  });

  app.post("/api/auth/login", async (req, res) => {
    const parsed = authSchema.omit({ name: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
    const user = await storage.getUserByEmail(parsed.data.email.toLowerCase());
    if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    (req.session as any).userId = user.id;
    res.json({ user: publicUser(user) });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/products", requireAuth, async (req, res) => {
    const products = await storage.listProducts(userId(req)!, String(req.query.type || "all"));
    res.json({ products });
  });

  app.get("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req)!, Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    const product = await storage.createProduct({ userId: userId(req)!, ...req.body });
    res.status(201).json({ product });
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.updateProduct(userId(req)!, Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  });

  app.post("/api/products/:id/duplicate", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req)!, Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found." });
    const duplicate = await storage.createProduct({
      userId: userId(req)!,
      productType: product.productType,
      title: `${product.title} Copy`,
      audience: product.audience,
      problem: product.problem,
      content: product.content,
      status: "Draft",
      suggestedPrice: product.suggestedPrice
    });
    res.status(201).json({ product: duplicate });
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    const ok = await storage.deleteProduct(userId(req)!, Number(req.params.id));
    res.json({ ok });
  });

  app.post("/api/generate", requireAuth, async (req, res, next) => {
    try {
      const input = generatorSchema.parse(req.body);
      const output = await generateProduct(input);
      const product = await storage.createProduct({
        userId: userId(req)!,
        productType: input.productType,
        title: output.title,
        audience: input.audience,
        problem: input.problem,
        content: output.content,
        status: "Draft",
        suggestedPrice: output.suggestedPrice
      });
      await storage.createGeneration({
        userId: userId(req)!,
        productId: product.id,
        promptInput: input,
        generatedOutput: output.content,
        modelUsed: output.model
      });
      res.status(201).json({ product, model: output.model });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/prompt-builder", requireAuth, async (req, res, next) => {
    try {
      const content = await generatePromptBuilder(req.body);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/products/:id/assist", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req)!, Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found." });
    const mode = req.body.mode === "social" ? "Social Media Posts Only" : req.body.mode === "section" ? `Regenerated Section: ${req.body.section}` : "Sales Copy Only";
    const content = `## ${mode}

Use this add-on with "${product.title}".

- Product title: ${product.title}
- Audience: ${product.audience}
- Problem: ${product.problem}
- Suggested price: ${product.suggestedPrice}
- Copy angle: practical, beginner-friendly, outcome-focused.

Review this content before selling. Add your own examples, experience, and quality checks.`;
    res.json({ content });
  });

  app.get("/api/products/:id/export/:format", requireAuth, async (req, res, next) => {
    try {
      const product = await storage.getProduct(userId(req)!, Number(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found." });
      if (req.params.format === "docx") {
        const buffer = await createDocx(product);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${product.title.replace(/[^a-z0-9]+/gi, "-")}.docx"`);
        return res.send(buffer);
      }
      const buffer = await createPdf(product);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${product.title.replace(/[^a-z0-9]+/gi, "-")}.pdf"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  });
}
