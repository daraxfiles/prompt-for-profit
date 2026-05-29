export type User = { id: number; name: string; email: string };
export type Product = {
  id: number;
  userId: number;
  productType: string;
  title: string;
  audience: string;
  problem: string;
  content: string;
  status: string;
  suggestedPrice: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductType = {
  id: string;
  label: string;
  short: string;
  price: string;
  examples: string[];
  sections: string[];
};

export type StarterTemplate = { title: string; description: string; category: string };

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message || "Request failed.");
  }
  return response.json() as Promise<T>;
}

export const api = {
  meta: () => request<{ productTypes: ProductType[]; starterTemplates: StarterTemplate[] }>("/api/meta"),
  me: () => request<{ user: User | null }>("/api/auth/me"),
  register: (body: { name: string; email: string; password: string }) =>
    request<{ user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),
  products: (type = "all") => request<{ products: Product[] }>(`/api/products?type=${encodeURIComponent(type)}`),
  product: (id: string | number) => request<{ product: Product }>(`/api/products/${id}`),
  generate: (body: Record<string, string>) =>
    request<{ product: Product; model: string }>("/api/generate", { method: "POST", body: JSON.stringify(body) }),
  updateProduct: (id: number, body: Partial<Product>) =>
    request<{ product: Product }>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(body) }),
  deleteProduct: (id: number) => request<{ ok: boolean }>(`/api/products/${id}`, { method: "DELETE" }),
  duplicateProduct: (id: number) => request<{ product: Product }>(`/api/products/${id}/duplicate`, { method: "POST" }),
  assist: (id: number, body: { mode: string; section?: string }) =>
    request<{ content: string }>(`/api/products/${id}/assist`, { method: "POST", body: JSON.stringify(body) }),
  promptBuilder: (body: Record<string, string>) =>
    request<{ content: string }>("/api/prompt-builder", { method: "POST", body: JSON.stringify(body) })
};

export async function downloadExport(product: Product, format: "pdf" | "docx") {
  const response = await fetch(`/api/products/${product.id}/export/${format}`, { credentials: "include" });
  if (!response.ok) throw new Error("Export failed.");
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${product.title.replace(/[^a-z0-9]+/gi, "-")}.${format}`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}
