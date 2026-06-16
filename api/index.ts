import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

const DB_PATH = path.join(process.cwd(), "backend/data/db.json");

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

function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供认证令牌" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
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

export default async function handler(req: { method: string; url: string; headers: { [key: string]: string }; body: any }, res: { status: (code: number) => { json: (data: any) => void }; json: (data: any) => void }) {
  const { pathname } = new URL(req.url, `http://${req.headers.host}`);

  if (pathname === "/api/login" && req.method === "POST") {
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

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
      },
    });
  }

  if (pathname === "/api/users" && req.method === "GET") {
    const db = readDB();
    const users = db.users.map((u) => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      role: u.role,
      email: u.email,
    }));
    return res.json(users);
  }

  if (pathname === "/api/tasks" && req.method === "GET") {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const db = readDB();
      const user = db.users.find((u) => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      const tasks = db.tasks.map((task) => {
        const assignee = db.users.find((u) => u.id === task.assigneeId);
        return { ...task, assignee };
      });
      return res.json(tasks);
    } catch (error) {
      return res.status(403).json({ message: "无效的认证令牌" });
    }
  }

  if (pathname === "/api/tasks" && req.method === "POST") {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const db = readDB();
      const user = db.users.find((u) => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      const { title, description, status, priority, dueDate, tags, assignee } = req.body;

      const assigneeUser = db.users.find((u) => u.name === assignee);
      const assigneeId = assigneeUser ? assigneeUser.id : 1;

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
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

      const assigneeInfo = db.users.find((u) => u.id === assigneeId);
      return res.status(201).json({ ...newTask, assignee: assigneeInfo });
    } catch (error) {
      return res.status(403).json({ message: "无效的认证令牌" });
    }
  }

  if (pathname.match(/^\/api\/tasks\/\d+$/) && req.method === "PUT") {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const db = readDB();
      const user = db.users.find((u) => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      const taskId = parseInt(pathname.split("/")[3]);
      const taskIndex = db.tasks.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        return res.status(404).json({ message: "任务不存在" });
      }

      const task = db.tasks[taskIndex];
      const { status } = req.body;

      if (status) task.status = status as Task["status"];
      task.updatedAt = new Date().toISOString().split("T")[0];

      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

      const assignee = db.users.find((u) => u.id === task.assigneeId);
      return res.json({ ...task, assignee });
    } catch (error) {
      return res.status(403).json({ message: "无效的认证令牌" });
    }
  }

  if (pathname.match(/^\/api\/tasks\/\d+$/) && req.method === "DELETE") {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      const db = readDB();
      const user = db.users.find((u) => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ message: "用户不存在" });
      }

      const taskId = parseInt(pathname.split("/")[3]);
      const taskIndex = db.tasks.findIndex((t) => t.id === taskId);

      if (taskIndex === -1) {
        return res.status(404).json({ message: "任务不存在" });
      }

      db.tasks.splice(taskIndex, 1);
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

      return res.json({ message: "任务已删除" });
    } catch (error) {
      return res.status(403).json({ message: "无效的认证令牌" });
    }
  }

  return res.status(404).json({ message: "API 端点不存在" });
}