export type ProductKind = "manual" | "agent" | "course" | "workshop" | "service";

export const productTypes = [
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
] as const;

export const starterTemplates = [
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

export function productTypeById(id: string) {
  return productTypes.find((type) => type.id === id) || productTypes[0];
}
