// server/index.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";

// server/routes.ts
import bcrypt from "bcryptjs";
import { z } from "zod";

// server/ai.ts
import OpenAI from "openai";

// server/templates.ts
var productTypes = [
  {
    id: "manual",
    label: "Manuals & Guides",
    short: "Turn a useful agent idea into a practical guide or playbook.",
    price: "$9-$29 short manuals, $39-$79 complete playbooks",
    examples: [
      "Beginner Guide: How to Build Your First AI Agent Without Coding",
      "Business Guide: How to Turn an AI Agent Idea into a Digital Product",
      "Prompt Guide: The AI Agent Prompting Manual",
      "Automation Guide: How to Automate Repetitive Work with AI Agents",
      "Vibe Coding Guide: From Idea to Working Tool"
    ],
    sections: [
      "Cover Title",
      "Subtitle",
      "Who This Guide Is For",
      "What You Will Build",
      "Tools Needed",
      "Key Terms Explained Simply",
      "Step-by-Step Instructions",
      "Example AI Agent Ideas",
      "Prompt Templates",
      "Worksheets",
      "Use Cases",
      "Testing Checklist",
      "7-Day Action Plan",
      "How to Package and Sell It",
      "Suggested Price",
      "Gumroad/Etsy Product Description",
      "Launch Post Caption",
      "Hashtags"
    ]
  },
  {
    id: "agent",
    label: "Agent Templates",
    short: "Package a reusable agent system prompt, setup flow, and examples.",
    price: "$9-$19 for one template, $49-$99 for a bundle of 10",
    examples: [
      "Customer Service Reply Agent",
      "Lesson Plan Agent",
      "Resume Review Agent",
      "Business Idea Validator Agent",
      "Grant Writing Assistant Agent",
      "Social Media Content Agent",
      "Real Estate Rental Response Agent",
      "Email Sorting Agent",
      "Research Summary Agent",
      "Product Description Agent",
      "Job Application Agent",
      "Study Coach Agent"
    ],
    sections: [
      "Agent Name",
      "Agent Purpose",
      "Who It Helps",
      "Problem It Solves",
      "System Prompt",
      "User Prompt Examples",
      "Example Inputs",
      "Example Outputs",
      "Setup Instructions",
      "Customization Guide",
      "Quality Testing Checklist",
      "Monetization Ideas",
      "Suggested Price",
      "Product Listing Description",
      "Social Media Launch Caption",
      "Hashtags"
    ]
  },
  {
    id: "course",
    label: "Mini-Courses",
    short: "Map a teachable transformation into modules, lessons, and sales copy.",
    price: "$49-$149 self-paced, $199-$499 cohort/live version",
    examples: [
      "Build Your First AI Agent in 7 Days",
      "AI Agents for Small Business Automation",
      "Vibe Coding for Nontechnical Entrepreneurs",
      "Create and Sell AI-Powered Digital Products"
    ],
    sections: [
      "Course Title",
      "Subtitle",
      "Target Audience",
      "Course Promise",
      "Learning Outcomes",
      "Course Modules",
      "Lesson Descriptions",
      "Practice Activities",
      "Assignments",
      "Final Project",
      "Tools Needed",
      "Course Completion Checklist",
      "Suggested Price",
      "Sales Page Copy",
      "Launch Email",
      "Social Media Captions",
      "Hashtags"
    ]
  },
  {
    id: "workshop",
    label: "Workshops",
    short: "Design a live session for schools, groups, business owners, or teams.",
    price: "$25-$49/person, $500-$2,500 org workshops, $3,000+ custom training",
    examples: [
      "Build Your First AI Agent",
      "AI Agents for Teachers and Trainers",
      "AI Automation for Small Business Owners",
      "Vibe Coding Your First App",
      "Turn Your Idea into an AI Tool"
    ],
    sections: [
      "Workshop Title",
      "Audience",
      "Duration",
      "Workshop Promise",
      "Learning Goals",
      "Agenda",
      "Live Demo",
      "Hands-On Activity",
      "Materials Needed",
      "Participant Worksheet",
      "Follow-Up Offer",
      "Suggested Price",
      "Outreach Email to Organizations",
      "Registration Page Copy",
      "Social Media Caption",
      "Hashtags"
    ]
  },
  {
    id: "service",
    label: "Done-With-You Packages",
    short: "Turn agent implementation into a service package with proposal copy.",
    price: "$99 starter, $299 builder, $799+ business package",
    examples: [
      "Starter Package: One AI agent prompt/system setup",
      "Builder Package: Agent + workflow + tutorial video",
      "Business Package: Custom agent workflow for a business use case"
    ],
    sections: [
      "Package Name",
      "Target Client",
      "Problem Solved",
      "Deliverables",
      "Timeline",
      "Client Intake Questions",
      "Process Steps",
      "Tools Used",
      "Pricing",
      "Proposal Copy",
      "Sales Page Copy",
      "Follow-Up Email",
      "Optional Upsell",
      "Social Media Caption",
      "Hashtags"
    ]
  }
];
var starterTemplates = [
  ["Customer Service Reply Agent", "Draft clear, on-brand responses for customer questions and complaints.", "Business"],
  ["Lesson Plan Agent", "Turn topics and standards into structured classroom lesson plans.", "Education"],
  ["Resume Review Agent", "Review a resume against a job posting and suggest practical improvements.", "Career"],
  ["Business Idea Validator Agent", "Evaluate an idea, audience, offer, risks, and next tests.", "Entrepreneurship"],
  ["Grant Writing Assistant Agent", "Help nonprofits prepare grant answers, summaries, and checklists.", "Nonprofit"],
  ["Social Media Content Agent", "Create weekly content ideas, captions, and hooks from a brand brief.", "Marketing"],
  ["Real Estate Rental Response Agent", "Respond to rental inquiries and prequalify prospects politely.", "Real Estate"],
  ["Email Sorting Agent", "Classify inbox messages and draft next actions.", "Productivity"],
  ["Research Summary Agent", "Condense long articles, notes, or sources into usable summaries.", "Research"],
  ["Product Description Agent", "Write benefit-focused product descriptions for ecommerce listings.", "Commerce"],
  ["Job Application Agent", "Adapt cover letters, resume bullets, and outreach messages to roles.", "Career"],
  ["Study Coach Agent", "Create study plans, quizzes, and accountability check-ins.", "Education"]
].map(([title, description, category]) => ({ title, description, category }));
function productTypeById(id) {
  return productTypes.find((type) => type.id === id) || productTypes[0];
}

// server/ai.ts
var SYSTEM_INSTRUCTION = `You are an expert instructional designer, AI product strategist, prompt engineer, and digital product business coach.

Your job is to help everyday people create practical, sellable AI-agent-based digital products.

Generate content that is clear, beginner-friendly, structured, useful, and commercially practical.

Avoid vague advice. Provide step-by-step instructions, examples, prompts, use cases, worksheets, action plans, and monetization ideas where relevant.

The output should be polished enough for the user to edit, package, and sell.`;
function instructionFor(input) {
  const type = productTypeById(input.productType);
  return `${SYSTEM_INSTRUCTION}

Create a polished ${type.label} draft for Prompt For Profit.

User input:
- Product idea: ${input.idea}
- Starter template: ${input.starterTemplate || "None"}
- Audience: ${input.audience}
- Problem solved: ${input.problem}
- Product or agent helps the user do: ${input.helpUserDo}
- Tools: ${input.tools}
- Audience level: ${input.level}
- Tone: ${input.tone}
- Desired format depth: ${input.length}
- Include monetization suggestions: ${input.monetization}
- Include sales copy: ${input.salesCopy}

The generated output must include:
- Product title
- Product description
- Target audience
- Problem solved
- Promise/outcome
- What is included
- Step-by-step content
- Examples
- Prompts
- Worksheets/checklists
- Tool recommendations
- Monetization ideas when requested
- Suggested pricing
- Sales page copy when requested
- Social media post copy
- Hashtags

Use this exact section template for the selected product type:
${type.sections.map((section, index) => `${index + 1}. ${section}`).join("\n")}

Also include a final section titled "Sell This Product" with suggested price, product title, short product description, long product description, Gumroad listing copy, Etsy listing copy, 5 launch captions, 15 hashtags, 3 email marketing messages, 3 Pinterest pin titles, and 3 TikTok/Reels hooks.

Finish with this reminder: "Review this content before selling. Add your own examples, experience, and quality checks."

Return clean Markdown.`;
}
function localDraft(input) {
  const type = productTypeById(input.productType);
  const singularLabel = type.id === "agent" ? "agent template" : type.id === "service" ? "service package" : type.label.toLowerCase().replace(/s$/, "");
  const title = input.starterTemplate || `${input.idea} ${singularLabel}`;
  const price = type.price;
  const audience = input.audience || "beginners";
  const problem = input.problem || "they need a clearer AI workflow";
  const tools = input.tools || "ChatGPT";
  const outcome = input.helpUserDo || "complete a valuable AI-powered task";
  const sectionBody = (section) => {
    const common = {
      "Agent Name": title,
      "Agent Purpose": `Help ${audience} ${outcome}. The agent reviews the user's context, asks for missing details, and produces practical next steps.`,
      "Who It Helps": `${audience} who want a simple, repeatable way to solve this problem without needing to code or design an AI workflow from scratch.`,
      "Problem It Solves": problem,
      "System Prompt": `You are ${title}, a careful and practical assistant for ${audience}. Your job is to help the user ${outcome}. Ask for missing information before giving final advice. Use a ${input.tone || "clear"} tone. Provide specific recommendations, examples, and a checklist. Avoid vague feedback, unsupported claims, and overly technical language.`,
      "User Prompt Examples": `1. Review my current draft and tell me what to improve for this goal: [goal].
2. Ask me for the missing details you need, then create a better version.
3. Compare my current version against this target: [paste target/context].`,
      "Example Inputs": `Audience: ${audience}
Current material: [paste current resume, lesson, offer, workflow, or draft]
Target: [paste job description, buyer need, classroom goal, or business outcome]
Tools available: ${tools}`,
      "Example Outputs": `- Quick diagnosis of what is working
- Three priority improvements
- Revised sample section
- Action checklist
- Quality score with next test`,
      "Setup Instructions": `1. Open ${tools.split(",")[0].trim() || "ChatGPT"}.
2. Paste the system prompt into your custom GPT, project instructions, or first message.
3. Add the user prompt template.
4. Test with one simple example.
5. Adjust the tone, required inputs, and output format for your niche.`,
      "Customization Guide": `Change the target audience, required inputs, scoring criteria, and examples. Add your own expertise so buyers get a product that feels specific rather than generic.`,
      "Quality Testing Checklist": `- The agent asks for missing information.
- The output is specific to the user's context.
- The response includes examples.
- The checklist is actionable.
- The tone matches ${input.tone || "the selected tone"}.
- The user knows what to do next.`,
      "Monetization Ideas": `Sell this as a $9-$19 standalone template, bundle it with related agents, offer a setup call, or include it inside a workshop for ${audience}.`,
      "Suggested Price": price,
      "Product Listing Description": `A ready-to-use ${title} template for ${audience}. Includes a system prompt, user prompt examples, setup steps, testing checklist, and customization ideas.`,
      "Social Media Launch Caption": `I created a ${title} for ${audience} who want to ${outcome}. It includes prompts, examples, setup steps, and a quality checklist so you can start faster.`,
      "Hashtags": "#AIagents #DigitalProducts #PromptEngineering #NoCodeAI #PromptForProfit #CreatorTools #AIAutomation"
    };
    if (common[section]) return common[section];
    if (section.includes("Price") || section === "Pricing") return price;
    if (section.includes("Tools")) return tools;
    if (section.includes("Audience") || section.includes("Who")) return audience;
    if (section.includes("Problem")) return problem;
    if (section.includes("Checklist")) return `- Confirm the promise is clear.
- Test the product with one real example.
- Add your own experience.
- Remove vague advice.
- Make the next action obvious.`;
    if (section.includes("Sales") || section.includes("Listing") || section.includes("Registration")) {
      return `Get ${title}, a practical ${type.label.toLowerCase()} that helps ${audience} ${outcome}. Includes examples, prompts, checklists, and launch-ready copy.`;
    }
    if (section.includes("Caption") || section.includes("Post")) return `New resource: ${title}. Built for ${audience} who want to ${outcome} with ${tools}.`;
    return `Create this section for ${audience}. Focus on solving "${problem}" with ${tools}. Include clear steps, a concrete example, and one action item.`;
  };
  const sections = type.sections.map((section) => `## ${section}
${sectionBody(section)}`).join("\n\n");
  return `# ${title}

${input.idea} for ${input.audience}. This ${singularLabel} helps users ${input.helpUserDo || "complete a valuable AI-powered task"} with a ${input.tone || "friendly"} tone.

## Product Description
This product gives ${input.audience || "beginners"} a clear path from idea to working AI-agent workflow. It includes instructions, prompts, examples, checklists, and sales-ready positioning.

## Target Audience
${input.audience || "Beginners, creators, freelancers, students, teachers, and small business owners."}

## Problem Solved
${input.problem || "People know AI agents are useful but do not know how to package one into a practical product."}

## Promise / Outcome
By the end, the buyer can understand the agent, set it up, test it, customize it, and use it or sell it as a practical digital product.

${sections}

## Sell This Product
- Suggested price: ${price}
- Short description: A practical ${singularLabel} for ${input.audience || "everyday users"} who want a ready-to-use AI agent product.
- Long description: This resource walks buyers through the exact setup, prompts, examples, and quality checks needed to use the agent with confidence. It is designed for ${input.level || "beginner"} users and can be sold as a standalone digital product or bundled with training.
- Gumroad listing copy: Get a ready-to-edit AI agent product draft with prompts, examples, setup steps, checklists, and launch copy.
- Etsy listing copy: Download a beginner-friendly AI agent template and guide that helps you save time, solve a specific problem, and start using AI more practically.
- Launch captions:
  1. I made a practical AI agent resource for ${input.audience || "beginners"} who want faster results without coding.
  2. Turn one AI workflow into something useful, repeatable, and sellable.
  3. This template helps you go from blank page to working AI agent setup.
  4. Built for people who want simple steps, not technical overwhelm.
  5. Use it, customize it, or package it as your next digital product.
- Hashtags: #AIagents #DigitalProducts #PromptEngineering #SmallBusinessAI #CreatorTools #NoCodeAI #AIAutomation #OnlineBusiness #ProductivityTools #AIEducation #SideHustle #Templates #MiniCourse #Workshops #PromptForProfit
- Email messages:
  1. Subject: New AI agent resource for ${input.audience || "you"}
This product helps you solve ${input.problem || "a practical workflow problem"} with simple AI prompts and setup steps.
  2. Subject: Save time with a ready-to-use agent
Use this resource to set up, test, and customize an AI workflow without coding.
  3. Subject: Turn one idea into a useful AI tool
Inside you get prompts, examples, checklists, and launch-ready copy.
- Pinterest pin titles: AI Agent Template for Beginners; Sellable Digital Product Idea; No-Code AI Workflow Guide
- TikTok/Reels hooks: Stop using AI like a search box; Build this simple AI agent today; One prompt system can become a product

Review this content before selling. Add your own examples, experience, and quality checks.`;
}
function titleFromMarkdown(markdown, fallback) {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1?.[1]) return h1[1].trim().slice(0, 240);
  const line = markdown.split("\n").find((value) => value.trim().length > 0);
  return (line || fallback).replace(/^#+\s*/, "").trim().slice(0, 240);
}
async function generateProduct(input) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!process.env.OPENAI_API_KEY) {
    const content2 = localDraft(input);
    return { content: content2, model: "local-fallback", title: titleFromMarkdown(content2, input.idea), suggestedPrice: productTypeById(input.productType).price };
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.7,
    messages: [
      { role: "system", content: SYSTEM_INSTRUCTION },
      { role: "user", content: instructionFor(input) }
    ]
  });
  const content = response.choices[0]?.message?.content || localDraft(input);
  return { content, model, title: titleFromMarkdown(content, input.idea), suggestedPrice: productTypeById(input.productType).price };
}
async function generatePromptBuilder(input) {
  const prompt = `Create an agent prompt kit with these inputs:
- Agent role: ${input.role}
- User: ${input.user}
- Task: ${input.task}
- Information to ask for: ${input.info}
- Output format: ${input.format}
- Tone: ${input.tone}
- Avoid: ${input.avoid}

Return Markdown with: System Prompt, User Prompt Template, Test Input, Sample Output, Improvement Suggestions.`;
  if (!process.env.OPENAI_API_KEY) {
    return `# Agent Prompt Kit

## System Prompt
You are a ${input.role}. Help ${input.user} complete this task: ${input.task}. Ask for ${input.info}. Respond in this format: ${input.format}. Use a ${input.tone} tone. Avoid ${input.avoid}.

## User Prompt Template
I need help with ${input.task}. Here is the context: [paste context]. My goal is: [goal]. Please ask any missing questions before creating the final response.

## Test Input
Create a first version for a beginner who needs clear steps and examples.

## Sample Output
A structured response with a short summary, the requested output, next steps, and a quality checklist.

## Improvement Suggestions
- Add examples from your niche.
- Include quality rules for what a good answer should contain.
- Test the prompt with three different use cases.`;
  }
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const response = await openai.chat.completions.create({
    model,
    temperature: 0.5,
    messages: [
      { role: "system", content: "You are an expert prompt engineer. Return practical beginner-friendly Markdown." },
      { role: "user", content: prompt }
    ]
  });
  return response.choices[0]?.message?.content || "";
}

// server/export.ts
import { Document, Packer, Paragraph, TextRun } from "docx";
import PDFDocument from "pdfkit";
function clean(markdown) {
  return markdown.replace(/\r/g, "").replace(/```/g, "");
}
function createPdf(product) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 54, size: "LETTER" });
    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.fontSize(22).fillColor("#061A2E").text(product.title, { lineGap: 6 });
    doc.moveDown();
    doc.fontSize(10).fillColor("#2F8CFF").text(`Prompt For Profit | ${product.productType} | ${product.status}`);
    doc.moveDown();
    clean(product.content).split("\n").forEach((line) => {
      if (line.startsWith("# ")) doc.moveDown().fontSize(18).fillColor("#061A2E").text(line.replace("# ", ""));
      else if (line.startsWith("## ")) doc.moveDown().fontSize(14).fillColor("#0B3156").text(line.replace("## ", ""));
      else doc.fontSize(10.5).fillColor("#1F2A37").text(line || " ", { lineGap: 3 });
    });
    doc.end();
  });
}
async function createDocx(product) {
  const children = clean(product.content).split("\n").map((line) => {
    const isTitle = line.startsWith("# ");
    const isHeading = line.startsWith("## ");
    const text2 = line.replace(/^#{1,2}\s*/, "");
    return new Paragraph({
      spacing: { after: isTitle || isHeading ? 180 : 90 },
      children: [
        new TextRun({
          text: text2 || " ",
          bold: isTitle || isHeading,
          size: isTitle ? 34 : isHeading ? 26 : 22,
          color: isTitle || isHeading ? "061A2E" : "111827"
        })
      ]
    });
  });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            children: [new TextRun({ text: product.title, bold: true, size: 38, color: "061A2E" })],
            spacing: { after: 240 }
          }),
          ...children
        ]
      }
    ]
  });
  return Packer.toBuffer(doc);
}

// server/storage.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq } from "drizzle-orm";
import pg from "pg";

// shared/schema.ts
import { integer, jsonb, pgTable, serial, text, timestamp, varchar } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});
var products = pgTable("products", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productType: varchar("product_type", { length: 80 }).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  audience: text("audience").notNull(),
  problem: text("problem").notNull(),
  content: text("content").notNull(),
  status: varchar("status", { length: 40 }).default("Draft").notNull(),
  suggestedPrice: varchar("suggested_price", { length: 120 }).default("").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});
var generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  productId: integer("product_id").references(() => products.id).notNull(),
  promptInput: jsonb("prompt_input").notNull(),
  generatedOutput: text("generated_output").notNull(),
  modelUsed: varchar("model_used", { length: 120 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

// server/storage.ts
function now() {
  return /* @__PURE__ */ new Date();
}
var MemoryStorage = class {
  users = [];
  products = [];
  generations = [];
  userId = 1;
  productId = 1;
  generationId = 1;
  async createUser(user) {
    const record = { id: this.userId++, ...user, createdAt: now() };
    this.users.push(record);
    return record;
  }
  async getUserByEmail(email) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }
  async getUserById(id) {
    return this.users.find((user) => user.id === id);
  }
  async listProducts(userId2, type) {
    return this.products.filter((product) => product.userId === userId2 && (!type || type === "all" || product.productType === type)).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  async getProduct(userId2, id) {
    return this.products.find((product) => product.userId === userId2 && product.id === id);
  }
  async createProduct(product) {
    const record = {
      id: this.productId++,
      userId: product.userId,
      productType: product.productType,
      title: product.title,
      audience: product.audience,
      problem: product.problem,
      content: product.content,
      status: product.status || "Draft",
      suggestedPrice: product.suggestedPrice || "",
      createdAt: now(),
      updatedAt: now()
    };
    this.products.push(record);
    return record;
  }
  async updateProduct(userId2, id, update) {
    const product = await this.getProduct(userId2, id);
    if (!product) return void 0;
    Object.assign(product, update, { updatedAt: now() });
    return product;
  }
  async deleteProduct(userId2, id) {
    const before = this.products.length;
    this.products = this.products.filter((product) => product.userId !== userId2 || product.id !== id);
    return this.products.length !== before;
  }
  async createGeneration(generation) {
    this.generations.push({ id: this.generationId++, ...generation, createdAt: now() });
  }
};
var DatabaseStorage = class {
  pool;
  db;
  constructor(databaseUrl) {
    this.pool = new pg.Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool);
  }
  async createUser(user) {
    const [record] = await this.db.insert(users).values(user).returning();
    return record;
  }
  async getUserByEmail(email) {
    const [record] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return record;
  }
  async getUserById(id) {
    const [record] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return record;
  }
  async listProducts(userId2, type) {
    const clauses = [eq(products.userId, userId2)];
    if (type && type !== "all") clauses.push(eq(products.productType, type));
    return this.db.select().from(products).where(and(...clauses)).orderBy(desc(products.createdAt));
  }
  async getProduct(userId2, id) {
    const [record] = await this.db.select().from(products).where(and(eq(products.userId, userId2), eq(products.id, id))).limit(1);
    return record;
  }
  async createProduct(product) {
    const [record] = await this.db.insert(products).values({ ...product, status: product.status || "Draft", suggestedPrice: product.suggestedPrice || "" }).returning();
    return record;
  }
  async updateProduct(userId2, id, update) {
    const [record] = await this.db.update(products).set({ ...update, updatedAt: now() }).where(and(eq(products.userId, userId2), eq(products.id, id))).returning();
    return record;
  }
  async deleteProduct(userId2, id) {
    const deleted = await this.db.delete(products).where(and(eq(products.userId, userId2), eq(products.id, id))).returning({ id: products.id });
    return deleted.length > 0;
  }
  async createGeneration(generation) {
    await this.db.insert(generations).values(generation);
  }
};
var storage = process.env.DATABASE_URL ? new DatabaseStorage(process.env.DATABASE_URL) : new MemoryStorage();

// server/routes.ts
var authSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});
var generatorSchema = z.object({
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
function userId(req) {
  return req.session.userId;
}
function requireAuth(req, res, next) {
  if (!userId(req)) return res.status(401).json({ message: "Please log in to continue." });
  next();
}
function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email };
}
function registerRoutes(app2) {
  app2.get("/api/meta", (_req, res) => {
    res.json({ productTypes, starterTemplates });
  });
  app2.get("/api/auth/me", async (req, res) => {
    const id = userId(req);
    if (!id) return res.json({ user: null });
    const user = await storage.getUserById(id);
    res.json({ user: user ? publicUser(user) : null });
  });
  app2.post("/api/auth/register", async (req, res) => {
    const parsed = authSchema.safeParse(req.body);
    if (!parsed.success || !parsed.data.name) return res.status(400).json({ message: "Enter a name, valid email, and 6+ character password." });
    const email = parsed.data.email.toLowerCase();
    const existing = await storage.getUserByEmail(email);
    if (existing) return res.status(409).json({ message: "An account with this email already exists." });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await storage.createUser({ name: parsed.data.name, email, passwordHash });
    req.session.userId = user.id;
    res.status(201).json({ user: publicUser(user) });
  });
  app2.post("/api/auth/login", async (req, res) => {
    const parsed = authSchema.omit({ name: true }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Enter a valid email and password." });
    const user = await storage.getUserByEmail(parsed.data.email.toLowerCase());
    if (!user || !await bcrypt.compare(parsed.data.password, user.passwordHash)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    req.session.userId = user.id;
    res.json({ user: publicUser(user) });
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => res.json({ ok: true }));
  });
  app2.get("/api/products", requireAuth, async (req, res) => {
    const products2 = await storage.listProducts(userId(req), String(req.query.type || "all"));
    res.json({ products: products2 });
  });
  app2.get("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req), Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  });
  app2.post("/api/products", requireAuth, async (req, res) => {
    const product = await storage.createProduct({ userId: userId(req), ...req.body });
    res.status(201).json({ product });
  });
  app2.put("/api/products/:id", requireAuth, async (req, res) => {
    const product = await storage.updateProduct(userId(req), Number(req.params.id), req.body);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ product });
  });
  app2.post("/api/products/:id/duplicate", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req), Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found." });
    const duplicate = await storage.createProduct({
      userId: userId(req),
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
  app2.delete("/api/products/:id", requireAuth, async (req, res) => {
    const ok = await storage.deleteProduct(userId(req), Number(req.params.id));
    res.json({ ok });
  });
  app2.post("/api/generate", requireAuth, async (req, res, next) => {
    try {
      const input = generatorSchema.parse(req.body);
      const output = await generateProduct(input);
      const product = await storage.createProduct({
        userId: userId(req),
        productType: input.productType,
        title: output.title,
        audience: input.audience,
        problem: input.problem,
        content: output.content,
        status: "Draft",
        suggestedPrice: output.suggestedPrice
      });
      await storage.createGeneration({
        userId: userId(req),
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
  app2.post("/api/prompt-builder", requireAuth, async (req, res, next) => {
    try {
      const content = await generatePromptBuilder(req.body);
      res.json({ content });
    } catch (error) {
      next(error);
    }
  });
  app2.post("/api/products/:id/assist", requireAuth, async (req, res) => {
    const product = await storage.getProduct(userId(req), Number(req.params.id));
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
  app2.get("/api/products/:id/export/:format", requireAuth, async (req, res, next) => {
    try {
      const product = await storage.getProduct(userId(req), Number(req.params.id));
      if (!product) return res.status(404).json({ message: "Product not found." });
      if (req.params.format === "docx") {
        const buffer2 = await createDocx(product);
        res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        res.setHeader("Content-Disposition", `attachment; filename="${product.title.replace(/[^a-z0-9]+/gi, "-")}.docx"`);
        return res.send(buffer2);
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

// server/index.ts
var __dirname = path.dirname(fileURLToPath(import.meta.url));
var app = express();
var isProduction = process.env.NODE_ENV === "production";
var port = Number(process.env.PORT || 5e3);
app.set("trust proxy", 1);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
var PgSession = connectPgSimple(session);
app.use(
  session({
    store: storage.pool ? new PgSession({
      pool: storage.pool,
      createTableIfMissing: true
    }) : void 0,
    secret: process.env.SESSION_SECRET || "dev-prompt-for-profit-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      maxAge: 1e3 * 60 * 60 * 24 * 14
    }
  })
);
registerRoutes(app);
app.use((error, _req, res, _next) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Something went wrong.";
  res.status(500).json({ message });
});
if (isProduction) {
  const clientDist = path.resolve(__dirname, "../client");
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true, host: "0.0.0.0" },
    appType: "spa"
  });
  app.use(vite.middlewares);
}
app.listen(port, "0.0.0.0", () => {
  console.log(`Prompt For Profit running on http://0.0.0.0:${port}`);
});
