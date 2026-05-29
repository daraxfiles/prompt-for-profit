import { drizzle } from "drizzle-orm/node-postgres";
import { and, desc, eq } from "drizzle-orm";
import pg from "pg";
import { generations, products, users, type Product, type User } from "../shared/schema";

type NewUser = { name: string; email: string; passwordHash: string };
export type NewProduct = {
  userId: number;
  productType: string;
  title: string;
  audience: string;
  problem: string;
  content: string;
  status?: string;
  suggestedPrice?: string;
};
export type ProductUpdate = Partial<Omit<NewProduct, "userId">>;
export type NewGeneration = {
  userId: number;
  productId: number;
  promptInput: unknown;
  generatedOutput: string;
  modelUsed: string;
};

export interface Storage {
  pool?: pg.Pool;
  createUser(user: NewUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  listProducts(userId: number, type?: string): Promise<Product[]>;
  getProduct(userId: number, id: number): Promise<Product | undefined>;
  createProduct(product: NewProduct): Promise<Product>;
  updateProduct(userId: number, id: number, update: ProductUpdate): Promise<Product | undefined>;
  deleteProduct(userId: number, id: number): Promise<boolean>;
  createGeneration(generation: NewGeneration): Promise<void>;
}

function now() {
  return new Date();
}

class MemoryStorage implements Storage {
  private users: User[] = [];
  private products: Product[] = [];
  private generations: Array<NewGeneration & { id: number; createdAt: Date }> = [];
  private userId = 1;
  private productId = 1;
  private generationId = 1;

  async createUser(user: NewUser) {
    const record = { id: this.userId++, ...user, createdAt: now() };
    this.users.push(record);
    return record;
  }

  async getUserByEmail(email: string) {
    return this.users.find((user) => user.email.toLowerCase() === email.toLowerCase());
  }

  async getUserById(id: number) {
    return this.users.find((user) => user.id === id);
  }

  async listProducts(userId: number, type?: string) {
    return this.products
      .filter((product) => product.userId === userId && (!type || type === "all" || product.productType === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getProduct(userId: number, id: number) {
    return this.products.find((product) => product.userId === userId && product.id === id);
  }

  async createProduct(product: NewProduct) {
    const record: Product = {
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

  async updateProduct(userId: number, id: number, update: ProductUpdate) {
    const product = await this.getProduct(userId, id);
    if (!product) return undefined;
    Object.assign(product, update, { updatedAt: now() });
    return product;
  }

  async deleteProduct(userId: number, id: number) {
    const before = this.products.length;
    this.products = this.products.filter((product) => product.userId !== userId || product.id !== id);
    return this.products.length !== before;
  }

  async createGeneration(generation: NewGeneration) {
    this.generations.push({ id: this.generationId++, ...generation, createdAt: now() });
  }
}

class DatabaseStorage implements Storage {
  pool: pg.Pool;
  private db;

  constructor(databaseUrl: string) {
    this.pool = new pg.Pool({ connectionString: databaseUrl });
    this.db = drizzle(this.pool);
  }

  async createUser(user: NewUser) {
    const [record] = await this.db.insert(users).values(user).returning();
    return record;
  }

  async getUserByEmail(email: string) {
    const [record] = await this.db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    return record;
  }

  async getUserById(id: number) {
    const [record] = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return record;
  }

  async listProducts(userId: number, type?: string) {
    const clauses = [eq(products.userId, userId)];
    if (type && type !== "all") clauses.push(eq(products.productType, type));
    return this.db.select().from(products).where(and(...clauses)).orderBy(desc(products.createdAt));
  }

  async getProduct(userId: number, id: number) {
    const [record] = await this.db
      .select()
      .from(products)
      .where(and(eq(products.userId, userId), eq(products.id, id)))
      .limit(1);
    return record;
  }

  async createProduct(product: NewProduct) {
    const [record] = await this.db
      .insert(products)
      .values({ ...product, status: product.status || "Draft", suggestedPrice: product.suggestedPrice || "" })
      .returning();
    return record;
  }

  async updateProduct(userId: number, id: number, update: ProductUpdate) {
    const [record] = await this.db
      .update(products)
      .set({ ...update, updatedAt: now() })
      .where(and(eq(products.userId, userId), eq(products.id, id)))
      .returning();
    return record;
  }

  async deleteProduct(userId: number, id: number) {
    const deleted = await this.db
      .delete(products)
      .where(and(eq(products.userId, userId), eq(products.id, id)))
      .returning({ id: products.id });
    return deleted.length > 0;
  }

  async createGeneration(generation: NewGeneration) {
    await this.db.insert(generations).values(generation);
  }
}

export const storage: Storage = process.env.DATABASE_URL
  ? new DatabaseStorage(process.env.DATABASE_URL)
  : new MemoryStorage();
