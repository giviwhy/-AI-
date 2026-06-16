import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const DB_PATH = path.join(__dirname, "../data/db.json");

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  avatar: string;
  role: string;
  isActive: boolean;
}

interface Task {
  id: number;
  title: string;
  description: string;
  status: "todo" | "in-progress" | "review" | "done";
  priority: "low" | "medium" | "high";
  dueDate: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  assigneeId: number;
}

function readDB(): { users: User[]; tasks: Task[] } {
  try {
    const data = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return { users: [], tasks: [] };
  }
}

function writeDB(data: { users: User[]; tasks: Task[] }) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供认证令牌" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const db = readDB();
    const user = db.users.find((u) => u.id === decoded.userId);

    if (!user) {
      return res.status(401).json({ message: "用户不存在" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "无效的认证令牌" });
  }
}

app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const db = readDB();

  const user = db.users.find((u) => u.email === email);

  if (!user) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: "邮箱或密码错误" });
  }

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "24h" });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    },
  });
});

app.post("/api/register", async (req, res) => {
  const { email, password, name, avatar, role } = req.body;
  const db = readDB();

  const existingUser = db.users.find((u) => u.email === email);

  if (existingUser) {
    return res.status(400).json({ message: "邮箱已被注册" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: Date.now(),
    email,
    password: hashedPassword,
    name,
    avatar: avatar || name.substring(0, 2).toUpperCase(),
    role: role || "成员",
    isActive: true,
  };

  db.users.push(newUser);
  writeDB(db);

  const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET!, { expiresIn: "24h" });

  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      avatar: newUser.avatar,
      role: newUser.role,
    },
  });
});

app.get("/api/users", (req, res) => {
  const db = readDB();
  const users = db.users.map((u) => ({
    id: u.id,
    name: u.name,
    avatar: u.avatar,
    role: u.role,
    email: u.email,
  }));
  res.json(users);
});

app.get("/api/tasks", authenticateToken, (req, res) => {
  const db = readDB();
  const tasks = db.tasks.map((task) => {
    const assignee = db.users.find((u) => u.id === task.assigneeId);
    return { ...task, assignee };
  });
  res.json(tasks);
});

app.get("/api/tasks/me", authenticateToken, (req: any, res) => {
  const db = readDB();
  const tasks = db.tasks
    .filter((task) => task.assigneeId === req.user.id)
    .map((task) => {
      const assignee = db.users.find((u) => u.id === task.assigneeId);
      return { ...task, assignee };
    });
  res.json(tasks);
});

app.get("/api/tasks/:id", authenticateToken, (req, res) => {
  const db = readDB();
  const task = db.tasks.find((t) => t.id === parseInt(req.params.id));

  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }

  const assignee = db.users.find((u) => u.id === task.assigneeId);
  res.json({ ...task, assignee });
});

app.post("/api/tasks", authenticateToken, (req, res) => {
  const db = readDB();
  const { title, description, status, priority, dueDate, tags, assigneeId } = req.body;

  const newTask: Task = {
    id: Date.now(),
    title,
    description,
    status: (status || "todo") as Task["status"],
    priority: (priority || "medium") as Task["priority"],
    dueDate,
    tags: tags || [],
    createdAt: new Date().toISOString().split("T")[0],
    updatedAt: new Date().toISOString().split("T")[0],
    assigneeId,
  };

  db.tasks.push(newTask);
  writeDB(db);

  const assignee = db.users.find((u) => u.id === assigneeId);
  res.status(201).json({ ...newTask, assignee });
});

app.put("/api/tasks/:id", authenticateToken, (req, res) => {
  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === parseInt(req.params.id));

  if (taskIndex === -1) {
    return res.status(404).json({ message: "任务不存在" });
  }

  const task = db.tasks[taskIndex];
  const { title, description, status, priority, dueDate, tags, assigneeId } = req.body;

  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status as Task["status"];
  if (priority) task.priority = priority as Task["priority"];
  if (dueDate) task.dueDate = dueDate;
  if (tags) task.tags = tags;
  if (assigneeId) task.assigneeId = assigneeId;
  task.updatedAt = new Date().toISOString().split("T")[0];

  writeDB(db);

  const assignee = db.users.find((u) => u.id === task.assigneeId);
  res.json({ ...task, assignee });
});

app.delete("/api/tasks/:id", authenticateToken, (req, res) => {
  const db = readDB();
  const taskIndex = db.tasks.findIndex((t) => t.id === parseInt(req.params.id));

  if (taskIndex === -1) {
    return res.status(404).json({ message: "任务不存在" });
  }

  db.tasks.splice(taskIndex, 1);
  writeDB(db);

  res.json({ message: "任务已删除" });
});

app.get("/", (req, res) => {
  res.json({ message: "小组协作任务看板 API" });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
