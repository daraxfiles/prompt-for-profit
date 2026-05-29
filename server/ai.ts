import OpenAI from "openai";
import { productTypeById } from "./templates";

export type GeneratorInput = {
  productType: string;
  idea: string;
  audience: string;
  problem: string;
  helpUserDo: string;
  tools: string;
  level: string;
  tone: string;
  length: string;
  monetization: string;
  salesCopy: string;
  starterTemplate?: string;
};

const SYSTEM_INSTRUCTION = `You are an expert instructional designer, AI product strategist, prompt engineer, and digital product business coach.

Your job is to help everyday people create practical, sellable AI-agent-based digital products.

Generate content that is clear, beginner-friendly, structured, useful, and commercially practical.

Avoid vague advice. Provide step-by-step instructions, examples, prompts, use cases, worksheets, action plans, and monetization ideas where relevant.

The output should be polished enough for the user to edit, package, and sell.`;

function instructionFor(input: GeneratorInput) {
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

function localDraft(input: GeneratorInput) {
  const type = productTypeById(input.productType);
  const singularLabel =
    type.id === "agent"
      ? "agent template"
      : type.id === "service"
        ? "service package"
        : type.label.toLowerCase().replace(/s$/, "");
  const title = input.starterTemplate || `${input.idea} ${singularLabel}`;
  const price = type.price;
  const audience = input.audience || "beginners";
  const problem = input.problem || "they need a clearer AI workflow";
  const tools = input.tools || "ChatGPT";
  const outcome = input.helpUserDo || "complete a valuable AI-powered task";

  const sectionBody = (section: string) => {
    const common: Record<string, string> = {
      "Agent Name": title,
      "Agent Purpose": `Help ${audience} ${outcome}. The agent reviews the user's context, asks for missing details, and produces practical next steps.`,
      "Who It Helps": `${audience} who want a simple, repeatable way to solve this problem without needing to code or design an AI workflow from scratch.`,
      "Problem It Solves": problem,
      "System Prompt": `You are ${title}, a careful and practical assistant for ${audience}. Your job is to help the user ${outcome}. Ask for missing information before giving final advice. Use a ${input.tone || "clear"} tone. Provide specific recommendations, examples, and a checklist. Avoid vague feedback, unsupported claims, and overly technical language.`,
      "User Prompt Examples": `1. Review my current draft and tell me what to improve for this goal: [goal].\n2. Ask me for the missing details you need, then create a better version.\n3. Compare my current version against this target: [paste target/context].`,
      "Example Inputs": `Audience: ${audience}\nCurrent material: [paste current resume, lesson, offer, workflow, or draft]\nTarget: [paste job description, buyer need, classroom goal, or business outcome]\nTools available: ${tools}`,
      "Example Outputs": `- Quick diagnosis of what is working\n- Three priority improvements\n- Revised sample section\n- Action checklist\n- Quality score with next test`,
      "Setup Instructions": `1. Open ${tools.split(",")[0].trim() || "ChatGPT"}.\n2. Paste the system prompt into your custom GPT, project instructions, or first message.\n3. Add the user prompt template.\n4. Test with one simple example.\n5. Adjust the tone, required inputs, and output format for your niche.`,
      "Customization Guide": `Change the target audience, required inputs, scoring criteria, and examples. Add your own expertise so buyers get a product that feels specific rather than generic.`,
      "Quality Testing Checklist": `- The agent asks for missing information.\n- The output is specific to the user's context.\n- The response includes examples.\n- The checklist is actionable.\n- The tone matches ${input.tone || "the selected tone"}.\n- The user knows what to do next.`,
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
    if (section.includes("Checklist")) return `- Confirm the promise is clear.\n- Test the product with one real example.\n- Add your own experience.\n- Remove vague advice.\n- Make the next action obvious.`;
    if (section.includes("Sales") || section.includes("Listing") || section.includes("Registration")) {
      return `Get ${title}, a practical ${type.label.toLowerCase()} that helps ${audience} ${outcome}. Includes examples, prompts, checklists, and launch-ready copy.`;
    }
    if (section.includes("Caption") || section.includes("Post")) return `New resource: ${title}. Built for ${audience} who want to ${outcome} with ${tools}.`;
    return `Create this section for ${audience}. Focus on solving "${problem}" with ${tools}. Include clear steps, a concrete example, and one action item.`;
  };

  const sections = type.sections.map((section) => `## ${section}\n${sectionBody(section)}`).join("\n\n");

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
  1. Subject: New AI agent resource for ${input.audience || "you"}\nThis product helps you solve ${input.problem || "a practical workflow problem"} with simple AI prompts and setup steps.
  2. Subject: Save time with a ready-to-use agent\nUse this resource to set up, test, and customize an AI workflow without coding.
  3. Subject: Turn one idea into a useful AI tool\nInside you get prompts, examples, checklists, and launch-ready copy.
- Pinterest pin titles: AI Agent Template for Beginners; Sellable Digital Product Idea; No-Code AI Workflow Guide
- TikTok/Reels hooks: Stop using AI like a search box; Build this simple AI agent today; One prompt system can become a product

Review this content before selling. Add your own examples, experience, and quality checks.`;
}

function titleFromMarkdown(markdown: string, fallback: string) {
  const h1 = markdown.match(/^#\s+(.+)$/m);
  if (h1?.[1]) return h1[1].trim().slice(0, 240);
  const line = markdown.split("\n").find((value) => value.trim().length > 0);
  return (line || fallback).replace(/^#+\s*/, "").trim().slice(0, 240);
}

export async function generateProduct(input: GeneratorInput) {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  if (!process.env.OPENAI_API_KEY) {
    const content = localDraft(input);
    return { content, model: "local-fallback", title: titleFromMarkdown(content, input.idea), suggestedPrice: productTypeById(input.productType).price };
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

export async function generatePromptBuilder(input: Record<string, string>) {
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
