import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, downloadExport, type Product, type ProductType, type StarterTemplate, type User } from "./api";

const AuthContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}>({ user: null, setUser: () => undefined, loading: true });

const freeIconUrls = {
  arrow: "/icons/action.png",
  bot: "/icons/bot.png",
  chart: "/icons/chart.png",
  check: "/icons/check.png",
  copy: "/icons/layers.png",
  dashboard: "/icons/chart.png",
  document: "/icons/webdev.png",
  download: "/icons/action.png",
  edit: "/icons/check.png",
  generator: "/icons/webdev.png",
  layers: "/icons/layers.png",
  library: "/icons/webdev.png",
  logout: "/icons/action.png",
  plus: "/icons/layers.png",
  refresh: "/icons/action.png",
  rocket: "/icons/action.png",
  save: "/icons/layers.png",
  search: "/icons/webdev.png",
  sparkle: "/icons/bot.png",
  target: "/icons/chart.png",
  trash: "/icons/check.png",
  wand: "/icons/bot.png"
} as const;

type FreeIconName = keyof typeof freeIconUrls;
const typeIcons: FreeIconName[] = ["document", "bot", "library", "rocket", "layers"];

const studioImages = {
  hero: "/images/desola-lanre-ologun-kwzWjTnDPLk-unsplash.jpg",
  dashboard: "/images/charles-forerunner-3fPXt37X6UQ-unsplash.jpg",
  generator: "/images/seth-ebenezer-tetteh-DeqswsZEO3Y-unsplash.jpg",
  library: "/images/sincerely-media-os7rk_Lh-XY-unsplash.jpg",
  prompt: "/images/andrei-poenalte-JS7cBSFR9K4-unsplash.jpg",
  launch: "/images/oluwakemi-solaja-ZN52ZBFkw4Y-unsplash.jpg",
  workshop: "/images/random-institute-2zOSkNTj-Ks-unsplash.jpg"
};

const logoAssets = {
  mark: "/prompt_for_profit_logo_blue_v2.svg",
  wide: "/prompt_for_profit_logo.png"
};

const vibeAudiences = ["Creators", "Teachers", "Freelancers", "Students", "Small business owners"];
const vibeProblems = ["save time", "teach a skill", "sell a service", "organize knowledge", "automate follow-up"];
const vibeFormats = ["AI agent template", "mini-course", "client workflow", "digital guide", "workshop kit"];
const vibeTools = ["ChatGPT", "Claude", "Cursor", "Replit", "Lovable", "Bolt", "GitHub", "Canva", "Notion", "Zapier"];
const studioStages = [
  { label: "Idea", detail: "Clarify the buyer and promise." },
  { label: "Agent", detail: "Shape the prompt, inputs, and output rules." },
  { label: "Product", detail: "Package the workflow into a sellable asset." },
  { label: "Launch", detail: "Generate listings, captions, and outreach." }
];

const creatorPaths = [
  {
    id: "creator",
    label: "Creator",
    title: "Social Media Content Agent Bundle",
    audience: "creators who need repeatable content systems",
    problem: "content ideas feel scattered and hard to package",
    productType: "agent",
    template: "Social Media Content Agent",
    image: studioImages.hero,
    tools: ["ChatGPT", "Canva", "Notion"],
    outcome: "A prompt pack, setup guide, content calendar worksheet, and launch captions."
  },
  {
    id: "teacher",
    label: "Teacher",
    title: "Lesson Plan Agent Workshop",
    audience: "teachers and trainers building AI-supported lessons",
    problem: "lesson planning takes too long and examples are inconsistent",
    productType: "workshop",
    template: "Lesson Plan Agent Workshop",
    image: studioImages.generator,
    tools: ["ChatGPT", "Google Docs", "Canva"],
    outcome: "A live workshop plan, participant worksheet, demo agent, and follow-up offer."
  },
  {
    id: "freelancer",
    label: "Freelancer",
    title: "Resume Review Agent Service Kit",
    audience: "freelancers serving job seekers",
    problem: "clients need clear resume feedback tied to specific jobs",
    productType: "service",
    template: "Resume Review Agent Service Package",
    image: studioImages.library,
    tools: ["ChatGPT", "Google Docs", "LinkedIn"],
    outcome: "A done-with-you service package, intake questions, proposal copy, and upsell."
  },
  {
    id: "business",
    label: "Business Owner",
    title: "Customer Reply Agent Playbook",
    audience: "small business owners handling repetitive messages",
    problem: "customer replies are slow, inconsistent, and hard to delegate",
    productType: "manual",
    template: "Customer Service Reply Agent Playbook",
    image: studioImages.workshop,
    tools: ["ChatGPT", "Zapier", "Google Docs"],
    outcome: "A playbook with reply prompts, escalation rules, testing checklist, and pricing."
  }
];

function buildVibeIdeas(audience: string, problem: string, format: string) {
  return [
    `${audience} ${format}: a guided assistant that helps users ${problem} with prompts, examples, and export-ready outputs.`,
    `${problem} sprint: a 45-minute vibe-coding challenge that turns one messy workflow into a simple app or agent prototype.`,
    `${audience} product pack: one template, one setup guide, three demo inputs, and a launch caption for selling the finished workflow.`
  ];
}

type GeneratorForm = {
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
  starterTemplate: string;
};

type DraftSection = { heading: string; body: string };

function scoreFields(values: Array<string | undefined>) {
  const filled = values.filter((value) => (value || "").trim().length > 8).length;
  const score = Math.min(96, 28 + filled * 11);
  return Math.max(score, values.some((value) => value?.trim()) ? 42 : 28);
}

function productScore(product: Product) {
  return scoreFields([product.title, product.audience, product.problem, product.content, product.suggestedPrice]);
}

function scoreLabel(score: number) {
  if (score >= 82) return "Ready to refine";
  if (score >= 62) return "Strong direction";
  return "Needs sharper inputs";
}

function FreeIcon({ name, size = 18, className = "" }: { name: FreeIconName; size?: number; className?: string }) {
  return (
    <img
      className={`free-icon ${className}`.trim()}
      src={freeIconUrls[name]}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      alt=""
      aria-hidden="true"
      loading="lazy"
    />
  );
}

function splitMarkdownSections(markdown: string): DraftSection[] {
  const lines = markdown.split("\n");
  const sections: DraftSection[] = [];
  let current: DraftSection | null = null;

  lines.forEach((line) => {
    const match = line.match(/^(#{1,3})\s+(.+)$/);
    if (match) {
      if (current) sections.push(current);
      current = { heading: match[2].trim(), body: "" };
    } else if (current) {
      current.body += `${line}\n`;
    } else if (line.trim()) {
      current = { heading: "Opening Notes", body: `${line}\n` };
    }
  });

  if (current) sections.push(current);
  return sections.length ? sections.map((section) => ({ ...section, body: section.body.trim() })) : [{ heading: "Product Draft", body: markdown }];
}

function sectionsToMarkdown(sections: DraftSection[]) {
  return sections.map((section, index) => `${index === 0 ? "#" : "##"} ${section.heading}\n\n${section.body.trim()}`).join("\n\n");
}

function makeLaunchKit(product: Product) {
  return `## Launch Kit

### Gumroad Listing
${product.title} helps ${product.audience} solve: ${product.problem}. It includes a ready-to-edit product draft, agent prompts, setup guidance, examples, and launch copy.

### Etsy Listing
Download a practical AI-agent digital product for ${product.audience}. Use it to learn, customize, and package a useful AI workflow without coding.

### 5 Launch Captions
1. I built ${product.title} for ${product.audience} who want a clearer way to get results with AI.
2. Turn one useful workflow into a product people can understand, use, and buy.
3. This resource gives you prompts, examples, and setup steps in one place.
4. For anyone tired of blank-page AI experiments, this gives you a structured starting point.
5. Use it, edit it, and make it your own before you sell or share it.

### 3 Email Messages
1. Subject: A practical AI agent resource for ${product.audience}
2. Subject: Save time with a ready-to-use AI workflow
3. Subject: Turn this idea into a useful digital product

### Pinterest Pin Titles
- AI Agent Template for Beginners
- Sellable Digital Product Idea
- No-Code AI Workflow Guide

### TikTok/Reels Hooks
- Stop using AI like a search box.
- One agent idea can become a digital product.
- Build this AI workflow before your next launch.`;
}

function useAuth() {
  return useContext(AuthContext);
}

function Shell({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  async function logout() {
    await api.logout();
    setUser(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-navy text-white">
      <div className="app-ambient fixed inset-0 -z-10" />
      <div className="fixed inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(#D8E3F0_1px,transparent_1px),linear-gradient(90deg,#D8E3F0_1px,transparent_1px)] [background-size:56px_56px]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="brand-logo-shell">
              <img src={logoAssets.mark} alt="Prompt For Profit logo" />
            </span>
            <span className="font-semibold tracking-wide">Prompt For Profit</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <NavLink to="/dashboard" icon={<FreeIcon name="dashboard" size={16} />} label="Dashboard" />
            <NavLink to="/library" icon={<FreeIcon name="library" size={16} />} label="Library" />
            <NavLink to="/prompt-builder" icon={<FreeIcon name="wand" size={16} />} label="Prompt Builder" />
            <NavLink to="/vibe-coding" icon={<FreeIcon name="sparkle" size={16} />} label="Vibe Coding" />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              className="icon-button md:hidden"
              type="button"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              title="Open menu"
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              <FreeIcon name={mobileMenuOpen ? "check" : "layers"} size={17} />
              <span className="sr-only">Toggle menu</span>
            </button>
            {user ? (
              <>
                <span className="hidden text-sm text-mist/80 sm:block">{user.name}</span>
                <button className="icon-button" onClick={logout} title="Log out">
                  <FreeIcon name="logout" size={17} />
                </button>
              </>
            ) : (
              <Link className="button button-small button-ghost" to="/login">
                Log in
              </Link>
            )}
          </div>
        </nav>
        {mobileMenuOpen ? (
          <div id="mobile-menu" className="mobile-nav-panel border-t border-white/10 px-5 pb-4 md:hidden">
            <div className="mx-auto grid max-w-7xl gap-2 pt-3">
              <NavLink to="/dashboard" icon={<FreeIcon name="dashboard" size={16} />} label="Dashboard" />
              <NavLink to="/library" icon={<FreeIcon name="library" size={16} />} label="Library" />
              <NavLink to="/prompt-builder" icon={<FreeIcon name="wand" size={16} />} label="Prompt Builder" />
              <NavLink to="/vibe-coding" icon={<FreeIcon name="sparkle" size={16} />} label="Vibe Coding" />
            </div>
          </div>
        ) : null}
      </header>
      {children}
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <Link className="nav-link" to={to}>
      {icon}
      {label}
    </Link>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return <>{children}</>;
}

function LoadingScreen() {
  return (
    <main className="grid min-h-[70vh] place-items-center">
      <div className="rounded-lg border border-white/10 bg-white/[0.06] px-6 py-4 text-mist">Loading studio...</div>
    </main>
  );
}

function Landing() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const scrollToHash = () => document.querySelector(location.hash)?.scrollIntoView({ block: "start" });
    scrollToHash();
    const handle = window.setTimeout(scrollToHash, 250);
    return () => window.clearTimeout(handle);
  }, [location.hash]);

  return (
    <main>
      <section className="mx-auto grid min-h-[calc(100vh-74px)] max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1fr_0.92fr]">
        <div>
          <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-white md:text-7xl">
            Create Sellable AI Agent Products Without Coding
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-mist">
            Prompt For Profit helps you turn ideas into AI agent manuals, templates, mini-courses, workshops, and service packages you can use, share, or sell.
          </p>
          <p className="mt-3 text-cyan">Turn prompts into agents, products, and income systems.</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button className="button button-primary" onClick={() => navigate("/generator")}>
              Start Creating <FreeIcon name="arrow" size={18} />
            </button>
            <a className="button button-secondary" href="#product-types">
              View Product Types
            </a>
          </div>
        </div>
        <div className="hero-stack-column">
          <div className="hero-media-stack">
            <img className="hero-photo" src={studioImages.hero} alt="Creators collaborating at computers" />
            <div className="hero-photo-card">
              <img src={studioImages.prompt} alt="Phone and laptop workspace" />
              <span>Built for everyday creators</span>
            </div>
          </div>
          <div className="studio-preview">
            <div className="preview-top">
              <span>Product Studio</span>
              <span className="status-dot">Ready</span>
            </div>
            <div className="preview-grid">
              <div className="metric-panel">
                <FreeIcon name="sparkle" size={24} />
                <strong>Guided generator</strong>
                <span>Idea to draft in under 10 minutes</span>
              </div>
              <div className="metric-panel">
                <FreeIcon name="download" size={24} />
                <strong>Exports</strong>
                <span>PDF and DOCX downloads</span>
              </div>
            </div>
            <div className="document-mini">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 pb-10">
        <div className="relational-strip">
          <img src={studioImages.dashboard} alt="Business team looking over a city" />
          <div>
            <h2>Build products for real people, not abstract prompts.</h2>
            <p>Prompt For Profit now centers the human use case: students, teachers, freelancers, business owners, and local experts packaging AI workflows into sellable products.</p>
          </div>
        </div>
      </section>
      <ImmersiveStudio />
      <ProductTypes />
      <HowItWorks />
      <UseCases />
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="cta-band">
          <h2>Ready to turn your AI agent idea into a product?</h2>
          <button className="button button-primary" onClick={() => navigate("/generator")}>
            Start Building Now <FreeIcon name="rocket" size={18} />
          </button>
        </div>
      </section>
      <Disclaimer />
    </main>
  );
}

function ImmersiveStudio() {
  const [activePath, setActivePath] = useState(creatorPaths[0]);
  const [activeStage, setActiveStage] = useState(studioStages[0]);
  const stageIndex = studioStages.findIndex((stage) => stage.label === activeStage.label);
  const progress = `${((stageIndex + 1) / studioStages.length) * 100}%`;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="immersion-lab">
        <div className="immersion-copy">
          <h2>Choose your creation path</h2>
          <p>Start with who you are, then move through the exact journey from rough idea to sellable AI-agent product.</p>
          <div className="path-switcher">
            {creatorPaths.map((path) => (
              <button
                key={path.id}
                className={activePath.id === path.id ? "active" : ""}
                onClick={() => setActivePath(path)}
              >
                {path.label}
              </button>
            ))}
          </div>
        </div>
        <div className="immersive-stage">
          <div className="stage-visual">
            <img src={activePath.image} alt={`${activePath.label} creation path`} />
            <div className="stage-overlay">
              <span>{activePath.label}</span>
              <strong>{activePath.title}</strong>
            </div>
          </div>
          <div className="stage-console">
            <div className="journey-map">
              {studioStages.map((stage, index) => (
                <button
                  key={stage.label}
                  className={stage.label === activeStage.label ? "active" : ""}
                  onClick={() => setActiveStage(stage)}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {stage.label}
                </button>
              ))}
            </div>
            <div className="journey-progress">
              <i style={{ width: progress }} />
            </div>
            <div className="stage-details">
              <span>{activeStage.label}</span>
              <h3>{activeStage.detail}</h3>
              <p><strong>Audience:</strong> {activePath.audience}</p>
              <p><strong>Problem:</strong> {activePath.problem}</p>
              <p><strong>Outcome:</strong> {activePath.outcome}</p>
              <div className="tool-row">
                {activePath.tools.map((tool) => <span key={tool}>{tool}</span>)}
              </div>
              <Link className="button button-primary" to={`/generator?type=${activePath.productType}&template=${encodeURIComponent(activePath.template)}`}>
                Build This Path <FreeIcon name="arrow" size={18} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductTypes() {
  const [types, setTypes] = useState<ProductType[]>([]);
  useEffect(() => {
    api.meta().then((data) => setTypes(data.productTypes));
  }, []);
  return (
    <section id="product-types" className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle title="Product Types" text="Five ways to package an AI agent idea into something useful, teachable, and sellable." />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {types.map((type, index) => {
          const icon = typeIcons[index] || "document";
          return (
            <Link to={`/generator?type=${type.id}`} className="type-card" key={type.id}>
              <FreeIcon name={icon} size={25} />
              <h3>{type.label}</h3>
              <p>{type.short}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle title="How It Works" text="A simple guided flow keeps beginners moving without staring at a blank page." />
      <div className="grid gap-4 md:grid-cols-4">
        {["Choose a product type", "Describe your idea or audience", "Generate a structured product draft", "Edit, export, and sell"].map((step, index) => (
          <div className="step-card" key={step}>
            <span>{index + 1}</span>
            <h3>{step}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}

function VibeCoding() {
  const [audience, setAudience] = useState(vibeAudiences[0]);
  const [problem, setProblem] = useState(vibeProblems[0]);
  const [format, setFormat] = useState(vibeFormats[0]);
  const ideas = buildVibeIdeas(audience, problem, format);
  const howToVibe = [
    "Name the outcome before the tool: who is this for, what should it do, and what does success look like?",
    "Prompt in small loops: ask for one screen, one feature, one fix, or one workflow at a time.",
    "Test like a beginner buyer: click every path, read every output, and collect what feels confusing.",
    "Package the result: add setup notes, example prompts, screenshots, pricing, and launch copy."
  ];
  const resources = [
    "Starter prompt: Act as my product-minded coding partner. Ask clarifying questions before building.",
    "Build checklist: idea, audience, inputs, outputs, edge cases, demo data, export path, sales angle.",
    "Quality pass: mobile layout, empty states, error messages, privacy notes, and buyer instructions.",
    "Sellable asset: record a short walkthrough and include a one-page setup guide."
  ];

  return (
    <section id="vibe-coding" className="mx-auto max-w-7xl px-5 py-16">
      <div className="vibe-section">
        <div className="vibe-intro">
          <img src={logoAssets.wide} alt="Prompt For Profit logo" />
          <div>
            <h2>Vibe Coding Studio</h2>
            <p>
              Vibe coding is the practice of turning a clear idea into a working prototype by guiding AI coding tools with plain-language prompts, fast testing, and practical product thinking.
            </p>
          </div>
        </div>
        <div className="vibe-grid">
          <article className="vibe-panel">
            <span className="vibe-label">What It Entails</span>
            <h3>Think like a product creator, prompt like a builder.</h3>
            <p>
              You define the buyer, workflow, inputs, outputs, constraints, and final package. The AI helps create the app, agent, guide, or automation while you steer usefulness and quality.
            </p>
          </article>
          <article className="vibe-panel">
            <span className="vibe-label">How To Vibe</span>
            <div className="vibe-steps">
              {howToVibe.map((step, index) => (
                <div key={step}>
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          </article>
          <article className="vibe-panel">
            <span className="vibe-label">Resources</span>
            <ul className="vibe-resource-list">
              {resources.map((item) => (
                <li key={item}>
                  <FreeIcon name="check" size={15} />
                  {item}
                </li>
              ))}
            </ul>
          </article>
          <article className="vibe-panel">
            <span className="vibe-label">Tools</span>
            <div className="vibe-tool-cloud">
              {vibeTools.map((tool) => (
                <span key={tool}>{tool}</span>
              ))}
            </div>
          </article>
        </div>
        <div className="vibe-idea-lab">
          <div>
            <span className="vibe-label">Practical Idea Generator</span>
            <h3>Pick a buyer, problem, and format to find products worth vibe coding.</h3>
            <p>Use these as starting points for a prototype, product draft, template, or paid service package.</p>
          </div>
          <div className="vibe-controls">
            <Select label="Audience" value={audience} options={vibeAudiences} onChange={setAudience} />
            <Select label="Problem" value={problem} options={vibeProblems} onChange={setProblem} />
            <Select label="Format" value={format} options={vibeFormats} onChange={setFormat} />
          </div>
          <div className="vibe-ideas">
            {ideas.map((idea, index) => (
              <article key={idea}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{idea}</p>
              </article>
            ))}
          </div>
          <Link className="button button-primary" to={`/generator?type=manual&template=${encodeURIComponent(ideas[0])}`}>
            Turn This Into A Product <FreeIcon name="arrow" size={18} />
          </Link>
        </div>
      </div>
    </section>
  );
}

function UseCases() {
  const cases = [
    "Create a customer service reply agent",
    "Build a lesson plan agent",
    "Package a resume review agent",
    "Create a business idea validator",
    "Design a social media content agent",
    "Build a grant writing assistant"
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <SectionTitle title="Use Cases" text="Start with a practical workflow, then turn it into an asset buyers can understand fast." />
      <div className="grid gap-3 md:grid-cols-3">
        {cases.map((item) => (
          <div className="use-case" key={item}>
            <FreeIcon name="check" size={18} />
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = mode === "register" ? await api.register(form) : await api.login(form);
      setUser(result.user);
      navigate((location.state as { from?: string } | null)?.from || "/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[calc(100vh-74px)] max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-[0.9fr_1.1fr]">
      <div>
        <h1 className="text-4xl font-black md:text-5xl">{mode === "register" ? "Create your product studio" : "Welcome back"}</h1>
        <p className="mt-4 text-lg leading-8 text-mist">
          Sign in to generate, save, edit, and export AI-agent-based digital products from one focused workspace.
        </p>
      </div>
      <form className="panel p-6" onSubmit={submit}>
        {mode === "register" && <Field label="Name" value={form.name} onChange={(name) => setForm({ ...form, name })} />}
        <Field label="Email" type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Field label="Password" type="password" value={form.password} onChange={(password) => setForm({ ...form, password })} />
        {error && <p className="form-error">{error}</p>}
        <button className="button button-primary w-full justify-center" disabled={busy}>
          {busy ? "Working..." : mode === "register" ? "Create Account" : "Log In"}
        </button>
        <p className="mt-5 text-center text-sm text-mist/75">
          {mode === "register" ? "Already have an account?" : "Need an account?"}{" "}
          <Link className="text-cyan" to={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Log in" : "Sign up"}
          </Link>
        </p>
      </form>
    </main>
  );
}

function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filter, setFilter] = useState("all");
  const [types, setTypes] = useState<ProductType[]>([]);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.meta().then((data) => setTypes(data.productTypes));
  }, []);
  useEffect(() => {
    api.products(filter).then((data) => setProducts(data.products));
  }, [filter]);

  async function remove(id: number) {
    await api.deleteProduct(id);
    setProducts((items) => items.filter((item) => item.id !== id));
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="dashboard-hero">
        <div>
          <h1>Welcome back, {user?.name}</h1>
          <p>Build, save, improve, and export your AI-agent product drafts.</p>
        </div>
        <button className="button button-primary" onClick={() => navigate("/generator")}>
          <FreeIcon name="plus" size={18} /> Create New Product
        </button>
      </div>
      <div className="studio-canvas">
        <img src={studioImages.launch} alt="Creator workspace with laptop" />
        <div className="canvas-stage active">
          <span>Idea</span>
          <strong>{products.length ? products[0].title : "Choose a product angle"}</strong>
        </div>
        <div className="canvas-stage">
          <span>Agent</span>
          <strong>Prompts, setup, examples</strong>
        </div>
        <div className="canvas-stage">
          <span>Product</span>
          <strong>Guide, template, workshop</strong>
        </div>
        <div className="canvas-stage">
          <span>Launch</span>
          <strong>Listings, captions, emails</strong>
        </div>
      </div>
      <div className="toolbar">
        <FreeIcon name="search" size={17} />
        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
          <option value="all">All product types</option>
          {types.map((type) => (
            <option value={type.id} key={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard product={product} key={product.id} onDelete={() => remove(product.id)} />
        ))}
      </div>
      {!products.length && (
        <div className="empty-state">
          <FreeIcon name="sparkle" size={34} />
          <h2>No saved drafts yet</h2>
          <p>Create your first AI agent product and it will appear here.</p>
          <button className="button button-primary" onClick={() => navigate("/generator")}>
            Start Creating
          </button>
        </div>
      )}
    </main>
  );
}

function ProductCard({ product, onDelete }: { product: Product; onDelete: () => void }) {
  const navigate = useNavigate();
  const score = productScore(product);
  return (
    <article className="product-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="pill">{product.status}</span>
          <h3>{product.title}</h3>
        </div>
        <button className="icon-button" onClick={onDelete} title="Delete product">
          <FreeIcon name="trash" size={16} />
        </button>
      </div>
      <p>{product.problem}</p>
      <div className="card-meta">
        <span>{product.productType}</span>
        <span>{new Date(product.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="mini-score">
        <span>{scoreLabel(score)}</span>
        <strong>{score}%</strong>
        <div><i style={{ width: `${score}%` }} /></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="button button-small button-secondary" onClick={() => navigate(`/editor/${product.id}`)}>
          <FreeIcon name="edit" size={15} /> Edit
        </button>
        <button className="button button-small button-ghost" onClick={() => downloadExport(product, "pdf")}>
          <FreeIcon name="download" size={15} /> PDF
        </button>
      </div>
    </article>
  );
}

function Generator() {
  const [types, setTypes] = useState<ProductType[]>([]);
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const initialTemplate = params.get("template") || "";
  const [form, setForm] = useState({
    productType: params.get("type") || (initialTemplate ? "agent" : "manual"),
    idea: initialTemplate || "",
    audience: "",
    problem: "",
    helpUserDo: "",
    tools: "ChatGPT",
    level: "Beginner",
    tone: "Friendly",
    length: "Complete Playbook",
    monetization: "Yes",
    salesCopy: "Yes",
    starterTemplate: initialTemplate
  });

  useEffect(() => {
    api.meta().then((data) => setTypes(data.productTypes));
  }, []);

  const selected = types.find((type) => type.id === form.productType) || types[0];

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { product } = await api.generate(form);
      navigate(`/editor/${product.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Generation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="page-heading">
        <h1>Product Generator</h1>
        <p>Answer the guided form and Prompt For Profit will shape your idea into a structured draft.</p>
      </div>
      <div className="stepper">
        {["Choose Product Type", "Product Inputs", "Generate Draft"].map((label, index) => (
          <button className={step === index + 1 ? "active" : ""} onClick={() => setStep(index + 1)} key={label}>
            <span>{index + 1}</span> {label}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="generator-grid">
        <div className="panel p-5">
          {step === 1 && (
            <div className="grid gap-3">
              {types.map((type) => (
                <button
                  type="button"
                  className={`select-card ${form.productType === type.id ? "selected" : ""}`}
                  onClick={() => setForm({ ...form, productType: type.id, length: type.id === "agent" ? "Template" : form.length })}
                  key={type.id}
                >
                  <strong>{type.label}</strong>
                  <span>{type.short}</span>
                </button>
              ))}
              <button type="button" className="button button-primary justify-center" onClick={() => setStep(2)}>
                Continue <FreeIcon name="arrow" size={18} />
              </button>
            </div>
          )}
          {step >= 2 && (
            <div className="grid gap-4">
              <Field label="What is your product idea?" value={form.idea} onChange={(idea) => setForm({ ...form, idea })} />
              <Field label="Who is this product for?" value={form.audience} onChange={(audience) => setForm({ ...form, audience })} />
              <TextArea label="What problem does it solve?" value={form.problem} onChange={(problem) => setForm({ ...form, problem })} />
              <TextArea label="What should the AI agent or product help the user do?" value={form.helpUserDo} onChange={(helpUserDo) => setForm({ ...form, helpUserDo })} />
              <Field label="What tools should be included?" value={form.tools} onChange={(tools) => setForm({ ...form, tools })} />
              <div className="grid gap-4 md:grid-cols-2">
                <Select label="Audience level" value={form.level} options={["Beginner", "Intermediate", "Advanced"]} onChange={(level) => setForm({ ...form, level })} />
                <Select
                  label="Tone"
                  value={form.tone}
                  options={["Friendly", "Professional", "Simple", "Academic", "Business-focused", "Motivational"]}
                  onChange={(tone) => setForm({ ...form, tone })}
                />
                <Select
                  label="Product depth"
                  value={form.length}
                  options={["Short Manual", "Complete Playbook", "Template", "Course", "Workshop", "Service Package"]}
                  onChange={(length) => setForm({ ...form, length })}
                />
                <Select label="Monetization suggestions" value={form.monetization} options={["Yes", "No"]} onChange={(monetization) => setForm({ ...form, monetization })} />
                <Select label="Sales copy" value={form.salesCopy} options={["Yes", "No"]} onChange={(salesCopy) => setForm({ ...form, salesCopy })} />
              </div>
              {error && <p className="form-error">{error}</p>}
              <button className="button button-primary justify-center" disabled={busy}>
                {busy ? "Generating..." : "Generate Product Draft"} <FreeIcon name="sparkle" size={18} />
              </button>
            </div>
          )}
        </div>
        <aside className="generator-sidebar">
          <ProductBlueprint form={form} selected={selected} />
          <div className="panel p-5">
            <img className="sidebar-photo" src={studioImages.generator} alt="Student using laptop" />
            <h2>{selected?.label || "Product Type"}</h2>
            <p className="mt-2 text-sm leading-6 text-mist/80">{selected?.short}</p>
            <p className="mt-4 rounded-lg border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan">{selected?.price}</p>
            <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-mist/60">Example Ideas</h3>
            <ul className="mt-3 space-y-2 text-sm text-mist/80">
              {selected?.examples.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </aside>
      </form>
    </main>
  );
}

function ProductBlueprint({ form, selected }: { form: GeneratorForm; selected?: ProductType }) {
  const title = form.idea || form.starterTemplate || "Untitled AI Agent Product";
  const score = scoreFields([form.idea, form.audience, form.problem, form.helpUserDo, form.tools]);
  const sections = selected?.sections.slice(0, 6) || ["Product title", "Audience", "Problem", "Promise", "Launch kit"];
  return (
    <section className="blueprint-panel">
      <div className="blueprint-top">
        <span>Live Blueprint</span>
        <strong>{score}%</strong>
      </div>
      <div className="score-ring" style={{ ["--score" as string]: `${score}%` }}>
        <FreeIcon name="chart" size={24} />
        <span>{scoreLabel(score)}</span>
      </div>
      <h2>{title}</h2>
      <p>{form.audience ? `For ${form.audience}` : "Add an audience to sharpen the promise."}</p>
      <div className="blueprint-promise">
        <FreeIcon name="target" size={16} />
        <span>{form.helpUserDo || "Describe what the buyer will be able to do."}</span>
      </div>
      <div className="blueprint-sections">
        {sections.map((section) => (
          <span key={section}>{section}</span>
        ))}
      </div>
    </section>
  );
}

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [sections, setSections] = useState<DraftSection[]>([]);
  const [status, setStatus] = useState("Draft");
  const [message, setMessage] = useState("");
  const [activePanel, setActivePanel] = useState<"draft" | "simulator" | "launch">("draft");
  const [testInput, setTestInput] = useState("Paste a sample buyer input here, such as a resume, lesson topic, or business idea.");
  const [testOutput, setTestOutput] = useState("");

  useEffect(() => {
    if (id) api.product(id).then(({ product }) => {
      setProduct(product);
      setSections(splitMarkdownSections(product.content));
      setStatus(product.status);
    });
  }, [id]);

  const draftContent = sectionsToMarkdown(sections);

  async function save() {
    if (!product) return;
    const result = await api.updateProduct(product.id, { content: draftContent, status });
    setProduct(result.product);
    setMessage("Saved");
    setTimeout(() => setMessage(""), 1800);
  }

  async function duplicate() {
    if (!product) return;
    const result = await api.duplicateProduct(product.id);
    navigate(`/editor/${result.product.id}`);
  }

  async function appendAssist(mode: string) {
    if (!product) return;
    const { content: addition } = await api.assist(product.id, { mode });
    setSections((value) => splitMarkdownSections(`${sectionsToMarkdown(value)}\n\n${addition}`));
  }

  function updateSection(index: number, patch: Partial<DraftSection>) {
    setSections((current) => current.map((section, sectionIndex) => (sectionIndex === index ? { ...section, ...patch } : section)));
  }

  function improveSection(index: number) {
    const section = sections[index];
    updateSection(index, {
      body: `${section.body.trim()}

Improvement pass:
- Add one specific example for the target buyer.
- Make the next action clear and beginner-friendly.
- Include a quality check so the buyer knows when this section is complete.`
    });
  }

  function runSimulator() {
    if (!product) return;
    const promptSection = sections.find((section) => section.heading.toLowerCase().includes("system prompt"));
    setTestOutput(`Agent test result for "${product.title}"

What the agent understood:
- Audience: ${product.audience}
- Problem: ${product.problem}
- Input received: ${testInput.slice(0, 220)}

Suggested response shape:
1. Ask one clarifying question if key context is missing.
2. Give a concise diagnosis.
3. Provide 3 specific improvements.
4. Show a revised sample.
5. End with a checklist the user can follow.

Prompt used:
${promptSection?.body.slice(0, 520) || "No system prompt section found yet. Add one or regenerate the product."}`);
  }

  function addLaunchKit() {
    if (!product) return;
    setSections((value) => splitMarkdownSections(`${sectionsToMarkdown(value)}\n\n${makeLaunchKit(product)}`));
    setActivePanel("launch");
  }

  if (!product) return <LoadingScreen />;
  const score = productScore({ ...product, content: draftContent, status });
  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="editor-shell">
        <aside className="editor-tools">
          <button className="button button-primary w-full justify-center" onClick={save}>
            <FreeIcon name="save" size={16} /> Save Draft
          </button>
          <button className="button button-secondary w-full justify-center" onClick={duplicate}>
            <FreeIcon name="copy" size={16} /> Duplicate
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => navigator.clipboard.writeText(draftContent)}>
            <FreeIcon name="copy" size={16} /> Copy
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => downloadExport(product, "pdf")}>
            <FreeIcon name="download" size={16} /> Export PDF
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => downloadExport(product, "docx")}>
            <FreeIcon name="download" size={16} /> Export DOCX
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("section")}>
            <FreeIcon name="wand" size={16} /> Regenerate Section
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("sales")}>
            <FreeIcon name="sparkle" size={16} /> Sales Copy Only
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("social")}>
            <FreeIcon name="rocket" size={16} /> Social Posts Only
          </button>
          <button className="button button-ghost w-full justify-center" onClick={addLaunchKit}>
            <FreeIcon name="layers" size={16} /> Full Launch Kit
          </button>
          <label className="field mt-4">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Draft</option>
              <option>Ready to Sell</option>
            </select>
          </label>
          <SellabilityScore score={score} />
          {message && <p className="text-sm text-cyan">{message}</p>}
        </aside>
        <section className="document-editor">
          <div className="document-header">
            <div>
              <h1>{product.title}</h1>
              <p>{product.productType} | {product.suggestedPrice}</p>
            </div>
            <span className="pill">{status}</span>
          </div>
          <div className="editor-tabs">
            <button className={activePanel === "draft" ? "active" : ""} onClick={() => setActivePanel("draft")}>
              <FreeIcon name="document" size={16} /> Sections
            </button>
            <button className={activePanel === "simulator" ? "active" : ""} onClick={() => setActivePanel("simulator")}>
              <FreeIcon name="bot" size={16} /> Agent Simulator
            </button>
            <button className={activePanel === "launch" ? "active" : ""} onClick={() => setActivePanel("launch")}>
              <FreeIcon name="rocket" size={16} /> Launch Kit
            </button>
          </div>
          {activePanel === "draft" && (
            <div className="section-editor-list">
              {sections.map((section, index) => (
                <article className="section-block" key={`${section.heading}-${index}`}>
                  <div className="section-block-header">
                    <input value={section.heading} onChange={(event) => updateSection(index, { heading: event.target.value })} aria-label="Section heading" />
                    <button className="button button-small button-secondary" onClick={() => improveSection(index)}>
                      <FreeIcon name="refresh" size={14} /> Improve
                    </button>
                  </div>
                  <textarea value={section.body} onChange={(event) => updateSection(index, { body: event.target.value })} aria-label={`${section.heading} body`} />
                </article>
              ))}
            </div>
          )}
          {activePanel === "simulator" && (
            <div className="simulator-panel">
              <div>
                <h2>Test This Agent</h2>
                <p>Paste a realistic sample input and see how the agent should respond before you sell the template.</p>
              </div>
              <div className="simulator-grid">
                <label className="field">
                  <span>Sample buyer input</span>
                  <textarea value={testInput} onChange={(event) => setTestInput(event.target.value)} />
                </label>
                <div className="simulator-output">
                  <div className="flex items-center justify-between gap-3">
                    <strong>Simulated response</strong>
                    <button className="button button-small button-primary" onClick={runSimulator}>
                      <FreeIcon name="arrow" size={14} /> Run Test
                    </button>
                  </div>
                  <pre>{testOutput || "Run a test to preview the agent's response structure, missing-context questions, and output quality."}</pre>
                </div>
              </div>
            </div>
          )}
          {activePanel === "launch" && (
            <div className="launch-panel">
              <img src={studioImages.workshop} alt="Local business district" />
              <div>
                <h2>Sell This Product</h2>
                <p>Package the generated draft with listings, launch captions, email messages, pin titles, and short-form video hooks.</p>
                <button className="button button-primary" onClick={addLaunchKit}>
                  <FreeIcon name="sparkle" size={16} /> Add Launch Kit To Draft
                </button>
              </div>
            </div>
          )}
          <div className="quality-note">Review this content before selling. Add your own examples, experience, and quality checks.</div>
        </section>
      </div>
    </main>
  );
}

function SellabilityScore({ score }: { score: number }) {
  const checks = [
    ["Clear buyer", score >= 48],
    ["Specific problem", score >= 60],
    ["Useful examples", score >= 70],
    ["Sales assets", score >= 82]
  ];
  return (
    <div className="scorecard">
      <div className="scorecard-top">
        <FreeIcon name="chart" size={17} />
        <span>Sellability</span>
        <strong>{score}%</strong>
      </div>
      <div className="scorebar"><i style={{ width: `${score}%` }} /></div>
      <p>{scoreLabel(score)}</p>
      {checks.map(([label, done]) => (
        <div className="score-check" key={label as string}>
          <FreeIcon name="check" size={14} />
          <span className={done ? "done" : ""}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function TemplateLibrary() {
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    api.meta().then((data) => setTemplates(data.starterTemplates));
  }, []);
  const filtered = templates.filter((template) => `${template.title} ${template.description} ${template.category}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="library-hero">
        <img src={studioImages.library} alt="Creator working by a cafe window" />
        <div>
          <h1>Agent Template Library</h1>
          <p>Choose a proven starter agent and the generator will prefill your product idea.</p>
          <label className="library-search">
            <FreeIcon name="search" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by category, buyer, or agent..." />
          </label>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((template, index) => (
          <article className="product-card" key={template.title}>
            <div className="flex items-center justify-between gap-3">
              <span className="pill">{template.category}</span>
              {index < 3 && <span className="pill">Most sellable</span>}
            </div>
            <h3>{template.title}</h3>
            <p>{template.description}</p>
            <button className="button button-secondary mt-5" onClick={() => navigate(`/generator?type=agent&template=${encodeURIComponent(template.title)}`)}>
              Use this template <FreeIcon name="arrow" size={15} />
            </button>
          </article>
        ))}
      </div>
    </main>
  );
}

function PromptBuilder() {
  const [form, setForm] = useState({ role: "", user: "", task: "", info: "", format: "", tone: "Friendly", avoid: "" });
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    const result = await api.promptBuilder(form);
    setContent(result.content);
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="page-heading">
        <h1>Prompt Builder</h1>
        <p>Create better agent prompts before packaging them into products.</p>
      </div>
      <div className="prompt-hero-card">
        <img src={studioImages.prompt} alt="Phone and laptop workspace" />
        <div>
          <h2>Prompt craft starts with context.</h2>
          <p>Define the role, task, input rules, output shape, tone, and guardrails before you turn an agent into a sellable product.</p>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <form className="panel grid gap-4 p-5" onSubmit={submit}>
          <Field label="What is the agent's role?" value={form.role} onChange={(role) => setForm({ ...form, role })} />
          <Field label="Who will use it?" value={form.user} onChange={(user) => setForm({ ...form, user })} />
          <TextArea label="What task should it complete?" value={form.task} onChange={(task) => setForm({ ...form, task })} />
          <TextArea label="What information should it ask for?" value={form.info} onChange={(info) => setForm({ ...form, info })} />
          <Field label="What output format should it provide?" value={form.format} onChange={(format) => setForm({ ...form, format })} />
          <Field label="What tone should it use?" value={form.tone} onChange={(tone) => setForm({ ...form, tone })} />
          <TextArea label="What should it avoid?" value={form.avoid} onChange={(avoid) => setForm({ ...form, avoid })} />
          <button className="button button-primary justify-center" disabled={busy}>
            {busy ? "Building..." : "Generate Prompt Kit"} <FreeIcon name="wand" size={18} />
          </button>
        </form>
        <section className="document-editor min-h-[640px]">
          <div className="document-header">
            <h2>Generated Prompt Kit</h2>
            <button className="icon-button" onClick={() => navigator.clipboard.writeText(content)} title="Copy prompt kit">
              <FreeIcon name="copy" size={16} />
            </button>
          </div>
          <textarea value={content} onChange={(event) => setContent(event.target.value)} placeholder="Your system prompt, user prompt template, test input, sample output, and improvement suggestions will appear here." />
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ title, text }: { title: string; text: string }) {
  return (
    <div className="mb-8 max-w-3xl">
      <h2 className="text-3xl font-black md:text-4xl">{title}</h2>
      <p className="mt-3 text-mist/80">{text}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input required type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea required value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function Disclaimer() {
  return (
    <div className="mx-auto max-w-7xl px-5 pb-8">
      <p className="rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm text-mist/75">
        Prompt For Profit helps users create educational and business planning materials. Users should review, edit, and verify all generated content before selling or publishing it.
        <span className="mt-2 block">
          Interface icons by <a className="text-cyan" href="https://freeicons.io" target="_blank" rel="noreferrer">Freeicons.io</a>.
        </span>
      </p>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const value = useMemo(() => ({ user, setUser, loading }), [user, loading]);

  useEffect(() => {
    api.me()
      .then((data) => setUser(data.user))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthContext.Provider value={value}>
      <Shell>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
          <Route path="/generator" element={<Protected><Generator /></Protected>} />
          <Route path="/editor/:id" element={<Protected><Editor /></Protected>} />
          <Route path="/library" element={<Protected><TemplateLibrary /></Protected>} />
          <Route path="/prompt-builder" element={<Protected><PromptBuilder /></Protected>} />
          <Route path="/vibe-coding" element={<VibeCoding />} />
        </Routes>
      </Shell>
    </AuthContext.Provider>
  );
}
