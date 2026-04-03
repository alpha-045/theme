import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient, OrderStatus, ServiceStatus, Role } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import jwt, { JwtPayload } from "jsonwebtoken";
import bcrypt from "bcryptjs";

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST ?? "localhost",
  port: Number(process.env.DATABASE_PORT ?? 3306),
  user: process.env.DATABASE_USER ?? "root",
  password: process.env.DATABASE_PASSWORD ?? "",
  database: process.env.DATABASE_NAME ?? "cooperative",
});
const prisma = new PrismaClient({ adapter });
const app = express();

app.use(cors());
app.use(express.json());

const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  created_at: true,
} as const;

const orderInclude = {
  client: { select: safeUserSelect },
  operative: { select: safeUserSelect },
  service: { include: { category: true, operative: { select: safeUserSelect } } },
} as const;

type AuthPayload = {
  sub: number;
  role: Role;
  email: string;
  name: string;
};

function toInt(v: unknown, fallback?: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback ?? NaN;
}

function sendError(res: express.Response, code: number, message: string) {
  res.status(code).json({ error: message });
}

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "dev_secret_change_me";
}

function signToken(payload: AuthPayload) {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: "7d" });
}

function parseBearerToken(req: express.Request) {
  const h = req.header("authorization") ?? req.header("Authorization");
  if (!h) return null;
  const [kind, token] = h.split(" ");
  if (kind?.toLowerCase() !== "bearer" || !token) return null;
  return token;
}

function authOptional(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = parseBearerToken(req);
  if (!token) {
    res.locals.auth = null;
    return next();
  }
  try {
    const raw = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const sub = Number(raw.sub);
    const role = String((raw as any).role).toUpperCase() as Role;
    const email = String((raw as any).email);
    const name = String((raw as any).name);
    if (!Number.isFinite(sub) || !email || !name || !Object.values(Role).includes(role)) {
      return sendError(res, 401, "Invalid token");
    }
    res.locals.auth = { sub, role, email, name };
    return next();
  } catch {
    return sendError(res, 401, "Invalid token");
  }
}

function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const token = parseBearerToken(req);
  if (!token) return sendError(res, 401, "Missing token");
  try {
    const raw = jwt.verify(token, getJwtSecret()) as JwtPayload;
    const sub = Number(raw.sub);
    const role = String((raw as any).role).toUpperCase() as Role;
    const email = String((raw as any).email);
    const name = String((raw as any).name);
    if (!Number.isFinite(sub) || !email || !name || !Object.values(Role).includes(role)) {
      return sendError(res, 401, "Invalid token");
    }
    res.locals.auth = { sub, role, email, name };
    return next();
  } catch {
    return sendError(res, 401, "Invalid token");
  }
}

function requireRole(roles: Role[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const auth = res.locals.auth as AuthPayload | null | undefined;
    if (!auth) return sendError(res, 401, "Missing token");
    if (!roles.includes(auth.role)) return sendError(res, 403, "Forbidden");
    return next();
  };
}

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$connect();
    res.json({ status: "ok" });
  } catch (err) {
    res.status(500).json({ status: "error", message: (err as Error).message });
  }
});

// Auth
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || !password || !role) return sendError(res, 400, "Missing fields");
  const normalizedRole = String(role).toUpperCase() as Role;
  if (!Object.values(Role).includes(normalizedRole)) return sendError(res, 400, "Invalid role");
  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role: normalizedRole },
    });
    const token = signToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
    });
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) return sendError(res, 400, "Missing fields");
  const user = await prisma.user.findUnique({ where: { email: String(email) } });
  if (!user) return sendError(res, 401, "Invalid credentials");
  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) return sendError(res, 401, "Invalid credentials");
  const token = signToken({ sub: user.id, role: user.role, email: user.email, name: user.name });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at },
  });
});

app.get("/api/auth/me", requireAuth, async (_req, res) => {
  const auth = res.locals.auth as AuthPayload;
  const user = await prisma.user.findUnique({ where: { id: auth.sub }, select: safeUserSelect });
  if (!user) return sendError(res, 404, "User not found");
  res.json(user);
});

app.patch("/api/auth/me", requireAuth, async (req, res) => {
  const auth = res.locals.auth as AuthPayload;
  const { name, email, password } = req.body ?? {};
  try {
    const passwordHash = password ? await bcrypt.hash(String(password), 10) : undefined;
    const user = await prisma.user.update({
      where: { id: auth.sub },
      data: {
        name,
        email,
        password: passwordHash,
      },
      select: safeUserSelect,
    });
    res.json(user);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.post("/api/auth/logout", requireAuth, async (_req, res) => {
  res.json({ status: "ok" });
});

// Users
app.get("/api/users", async (req, res) => {
  const role = req.query.role as string | undefined;
  const where = role ? { role: role.toUpperCase() as Role } : undefined;
  const users = await prisma.user.findMany({ where, orderBy: { id: "desc" }, select: safeUserSelect });
  res.json(users);
});

app.post("/api/users", async (req, res) => {
  const { name, email, password, role } = req.body ?? {};
  if (!name || !email || !password || !role) return sendError(res, 400, "Missing fields");
  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: { name, email, password: passwordHash, role: String(role).toUpperCase() as Role },
      select: safeUserSelect,
    });
    res.status(201).json(user);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.get("/api/users/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const user = await prisma.user.findUnique({ where: { id }, select: safeUserSelect });
  if (!user) return sendError(res, 404, "User not found");
  res.json(user);
});

app.patch("/api/users/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const { name, email, password, role } = req.body ?? {};
  try {
    const passwordHash = password ? await bcrypt.hash(String(password), 10) : undefined;
    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        email,
        password: passwordHash,
        role: role ? (String(role).toUpperCase() as Role) : undefined,
      },
      select: safeUserSelect,
    });
    res.json(user);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

// Categories
app.get("/api/categories", async (_req, res) => {
  const categories = await prisma.category.findMany({ orderBy: { id: "desc" } });
  res.json(categories);
});

app.post("/api/categories", async (req, res) => {
  const { name } = req.body ?? {};
  if (!name) return sendError(res, 400, "Missing name");
  try {
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.get("/api/categories/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) return sendError(res, 404, "Category not found");
  res.json(category);
});

app.patch("/api/categories/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const { name } = req.body ?? {};
  try {
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json(category);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

// Services
app.get("/api/services", async (req, res) => {
  const status = req.query.status as string | undefined;
  const categoryId = toInt(req.query.categoryId);
  const operativeId = toInt(req.query.operativeId);
  const where: any = {};
  if (status) where.status = String(status).toUpperCase() as ServiceStatus;
  if (Number.isFinite(categoryId)) where.category_id = categoryId;
  if (Number.isFinite(operativeId)) where.operative_id = operativeId;
  const services = await prisma.service.findMany({
    where,
    include: { category: true, operative: { select: safeUserSelect } },
    orderBy: { id: "desc" },
  });
  res.json(services);
});

app.post("/api/services", async (req, res) => {
  const { title, description, price, status, category_id, operative_id } = req.body ?? {};
  if (!title || !description || price == null || !status || !category_id || !operative_id)
    return sendError(res, 400, "Missing fields");
  try {
    const service = await prisma.service.create({
      data: {
        title,
        description,
        price: Number(price),
        status: String(status).toUpperCase() as ServiceStatus,
        category_id: toInt(category_id),
        operative_id: toInt(operative_id),
      },
      include: { category: true, operative: { select: safeUserSelect } },
    });
    res.status(201).json(service);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.get("/api/services/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const service = await prisma.service.findUnique({
    where: { id },
    include: { category: true, operative: { select: safeUserSelect } },
  });
  if (!service) return sendError(res, 404, "Service not found");
  res.json(service);
});

app.patch("/api/services/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const { title, description, price, status, category_id, operative_id } = req.body ?? {};
  try {
    const service = await prisma.service.update({
      where: { id },
      data: {
        title,
        description,
        price: price == null ? undefined : Number(price),
        status: status ? (String(status).toUpperCase() as ServiceStatus) : undefined,
        category_id: Number.isFinite(toInt(category_id)) ? toInt(category_id) : undefined,
        operative_id: Number.isFinite(toInt(operative_id)) ? toInt(operative_id) : undefined,
      },
      include: { category: true, operative: { select: safeUserSelect } },
    });
    res.json(service);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

// Orders
app.get("/api/orders", async (req, res) => {
  const status = req.query.status as string | undefined;
  const clientId = toInt(req.query.clientId);
  const operativeId = toInt(req.query.operativeId);
  const where: any = {};
  if (status) where.status = String(status).toUpperCase() as OrderStatus;
  if (Number.isFinite(clientId)) where.client_id = clientId;
  if (Number.isFinite(operativeId)) where.operative_id = operativeId;
  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { id: "desc" },
  });
  res.json(orders);
});

app.post("/api/orders", authOptional, async (req, res) => {
  const { service_id, client_id, address, note } = req.body ?? {};
  const auth = res.locals.auth as AuthPayload | null;
  const resolvedClientId =
    auth?.role === Role.CLIENT ? auth.sub : client_id ? toInt(client_id) : NaN;
  if (!service_id || !Number.isFinite(resolvedClientId) || !address) return sendError(res, 400, "Missing fields");
  try {
    const service = await prisma.service.findUnique({ where: { id: toInt(service_id) } });
    if (!service) return sendError(res, 404, "Service not found");
    const order = await prisma.order.create({
      data: {
        service_id: toInt(service_id),
        client_id: resolvedClientId,
        operative_id: service.operative_id,
        price_at_order: service.price,
        address,
        note,
        status: OrderStatus.PENDING,
      },
      include: orderInclude,
    });
    res.status(201).json(order);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.get("/api/orders/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const order = await prisma.order.findUnique({
    where: { id },
    include: orderInclude,
  });
  if (!order) return sendError(res, 404, "Order not found");
  res.json(order);
});

app.patch("/api/orders/:id", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const { status, address, note } = req.body ?? {};
  try {
    const order = await prisma.order.update({
      where: { id },
      data: {
        status: status ? (String(status).toUpperCase() as OrderStatus) : undefined,
        address,
        note,
      },
      include: orderInclude,
    });
    res.json(order);
  } catch (err) {
    sendError(res, 400, (err as Error).message);
  }
});

app.post("/api/orders/:id/accept", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const order = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.ACCEPTED },
    include: orderInclude,
  });
  res.json(order);
});

app.post("/api/orders/:id/in-progress", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const order = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.IN_PROGRESS },
    include: orderInclude,
  });
  res.json(order);
});

app.post("/api/orders/:id/done", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const order = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.DONE },
    include: orderInclude,
  });
  res.json(order);
});

app.post("/api/orders/:id/cancel", async (req, res) => {
  const id = toInt(req.params.id);
  if (!Number.isFinite(id)) return sendError(res, 400, "Invalid id");
  const order = await prisma.order.update({
    where: { id },
    data: { status: OrderStatus.CANCELLED },
    include: orderInclude,
  });
  res.json(order);
});

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
