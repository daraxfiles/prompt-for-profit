import {
  ArrowRight,
  BookOpen,
  Boxes,
  BriefcaseBusiness,
  Check,
  Copy,
  Download,
  FileText,
  LayoutDashboard,
  Library,
  LogOut,
  Pencil,
  Plus,
  Rocket,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wand2
} from "lucide-react";
import { createContext, FormEvent, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { api, downloadExport, type Product, type ProductType, type StarterTemplate, type User } from "./api";

const AuthContext = createContext<{
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}>({ user: null, setUser: () => undefined, loading: true });

const typeIcons = [FileText, Boxes, BookOpen, Rocket, BriefcaseBusiness];

function useAuth() {
  return useContext(AuthContext);
}

function Shell({ children }: { children: ReactNode }) {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();

  async function logout() {
    await api.logout();
    setUser(null);
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-navy text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_15%,rgba(47,140,255,0.28),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(71,215,255,0.18),transparent_24%),linear-gradient(180deg,#061A2E_0%,#07111F_54%,#061A2E_100%)]" />
      <div className="fixed inset-0 -z-10 opacity-[0.08] [background-image:linear-gradient(#D8E3F0_1px,transparent_1px),linear-gradient(90deg,#D8E3F0_1px,transparent_1px)] [background-size:56px_56px]" />
      <header className="sticky top-0 z-30 border-b border-white/10 bg-navy/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-cyan/40 bg-electric/20 font-black text-cyan shadow-glow">P$</span>
            <span className="font-semibold tracking-wide">Prompt For Profit</span>
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            <NavLink to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" />
            <NavLink to="/library" icon={<Library size={16} />} label="Library" />
            <NavLink to="/prompt-builder" icon={<Wand2 size={16} />} label="Prompt Builder" />
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <span className="hidden text-sm text-mist/80 sm:block">{user.name}</span>
                <button className="icon-button" onClick={logout} title="Log out">
                  <LogOut size={17} />
                </button>
              </>
            ) : (
              <Link className="button button-small button-ghost" to="/login">
                Log in
              </Link>
            )}
          </div>
        </nav>
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
              Start Creating <ArrowRight size={18} />
            </button>
            <a className="button button-secondary" href="#product-types">
              View Product Types
            </a>
          </div>
        </div>
        <div className="studio-preview">
          <div className="preview-top">
            <span>Product Studio</span>
            <span className="status-dot">Ready</span>
          </div>
          <div className="preview-grid">
            <div className="metric-panel">
              <Sparkles className="text-cyan" />
              <strong>Guided generator</strong>
              <span>Idea to draft in under 10 minutes</span>
            </div>
            <div className="metric-panel">
              <Download className="text-electric" />
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
      </section>
      <ProductTypes />
      <HowItWorks />
      <UseCases />
      <section className="mx-auto max-w-7xl px-5 pb-20">
        <div className="cta-band">
          <h2>Ready to turn your AI agent idea into a product?</h2>
          <button className="button button-primary" onClick={() => navigate("/generator")}>
            Start Building Now <Rocket size={18} />
          </button>
        </div>
      </section>
      <Disclaimer />
    </main>
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
          const Icon = typeIcons[index] || FileText;
          return (
            <Link to={`/generator?type=${type.id}`} className="type-card" key={type.id}>
              <Icon size={25} />
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
            <Check size={18} />
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
          <Plus size={18} /> Create New Product
        </button>
      </div>
      <div className="toolbar">
        <Search size={17} />
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
          <Sparkles size={34} />
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
  return (
    <article className="product-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="pill">{product.status}</span>
          <h3>{product.title}</h3>
        </div>
        <button className="icon-button" onClick={onDelete} title="Delete product">
          <Trash2 size={16} />
        </button>
      </div>
      <p>{product.problem}</p>
      <div className="card-meta">
        <span>{product.productType}</span>
        <span>{new Date(product.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <button className="button button-small button-secondary" onClick={() => navigate(`/editor/${product.id}`)}>
          <Pencil size={15} /> Edit
        </button>
        <button className="button button-small button-ghost" onClick={() => downloadExport(product, "pdf")}>
          <Download size={15} /> PDF
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
                Continue <ArrowRight size={18} />
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
                {busy ? "Generating..." : "Generate Product Draft"} <Sparkles size={18} />
              </button>
            </div>
          )}
        </div>
        <aside className="panel p-5">
          <h2>{selected?.label || "Product Type"}</h2>
          <p className="mt-2 text-sm leading-6 text-mist/80">{selected?.short}</p>
          <p className="mt-4 rounded-lg border border-cyan/20 bg-cyan/10 p-3 text-sm text-cyan">{selected?.price}</p>
          <h3 className="mt-6 text-sm font-semibold uppercase tracking-[0.18em] text-mist/60">Example Ideas</h3>
          <ul className="mt-3 space-y-2 text-sm text-mist/80">
            {selected?.examples.slice(0, 6).map((item) => <li key={item}>{item}</li>)}
          </ul>
        </aside>
      </form>
    </main>
  );
}

function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Draft");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) api.product(id).then(({ product }) => {
      setProduct(product);
      setContent(product.content);
      setStatus(product.status);
    });
  }, [id]);

  async function save() {
    if (!product) return;
    const result = await api.updateProduct(product.id, { content, status });
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
    setContent((value) => `${value}\n\n${addition}`);
  }

  if (!product) return <LoadingScreen />;
  return (
    <main className="mx-auto max-w-7xl px-5 py-8">
      <div className="editor-shell">
        <aside className="editor-tools">
          <button className="button button-primary w-full justify-center" onClick={save}>
            <Save size={16} /> Save Draft
          </button>
          <button className="button button-secondary w-full justify-center" onClick={duplicate}>
            <Copy size={16} /> Duplicate
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => navigator.clipboard.writeText(content)}>
            <Copy size={16} /> Copy
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => downloadExport(product, "pdf")}>
            <Download size={16} /> Export PDF
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => downloadExport(product, "docx")}>
            <Download size={16} /> Export DOCX
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("section")}>
            <Wand2 size={16} /> Regenerate Section
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("sales")}>
            <Sparkles size={16} /> Sales Copy Only
          </button>
          <button className="button button-ghost w-full justify-center" onClick={() => appendAssist("social")}>
            <Rocket size={16} /> Social Posts Only
          </button>
          <label className="field mt-4">
            <span>Status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option>Draft</option>
              <option>Ready to Sell</option>
            </select>
          </label>
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
          <textarea value={content} onChange={(event) => setContent(event.target.value)} aria-label="Editable product draft" />
          <div className="quality-note">Review this content before selling. Add your own examples, experience, and quality checks.</div>
        </section>
      </div>
    </main>
  );
}

function TemplateLibrary() {
  const [templates, setTemplates] = useState<StarterTemplate[]>([]);
  const navigate = useNavigate();
  useEffect(() => {
    api.meta().then((data) => setTemplates(data.starterTemplates));
  }, []);
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <div className="page-heading">
        <h1>Agent Template Library</h1>
        <p>Choose a proven starter agent and the generator will prefill your product idea.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <article className="product-card" key={template.title}>
            <span className="pill">{template.category}</span>
            <h3>{template.title}</h3>
            <p>{template.description}</p>
            <button className="button button-secondary mt-5" onClick={() => navigate(`/generator?type=agent&template=${encodeURIComponent(template.title)}`)}>
              Use this template <ArrowRight size={15} />
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
            {busy ? "Building..." : "Generate Prompt Kit"} <Wand2 size={18} />
          </button>
        </form>
        <section className="document-editor min-h-[640px]">
          <div className="document-header">
            <h2>Generated Prompt Kit</h2>
            <button className="icon-button" onClick={() => navigator.clipboard.writeText(content)} title="Copy prompt kit">
              <Copy size={16} />
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
        </Routes>
      </Shell>
    </AuthContext.Provider>
  );
}
