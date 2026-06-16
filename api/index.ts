import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here";

function getPool(): NeonQueryFunction {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return neon(connectionString);
}

// 初始化数据库表
async function initDatabase(sql: NeonQueryFunction) {
  // 创建用户表
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT '',
    role VARCHAR(50) DEFAULT '成员',
    is_active BOOLEAN DEFAULT true
  )`;

  // 创建任务表
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date DATE,
    tags TEXT[] DEFAULT '{}',
    created_at DATE DEFAULT CURRENT_DATE,
    updated_at DATE DEFAULT CURRENT_DATE,
    assignee_id INTEGER REFERENCES users(id)
  )`;

  // 检查是否有用户数据
  const result = await sql`SELECT COUNT(*) as count FROM users`;
  if (Number(result[0].count) === 0) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    await sql`INSERT INTO users (email, password, name, avatar, role) VALUES
      (${'zhangsan@example.com'}, ${hashedPassword}, ${'张三'}, ${'ZS'}, ${'项目经理'}),
      (${'lisi@example.com'}, ${hashedPassword}, ${'李四'}, ${'LS'}, ${'后端开发'}),
      (${'wangwu@example.com'}, ${hashedPassword}, ${'王五'}, ${'WW'}, ${'前端开发'}),
      (${'zhaoliu@example.com'}, ${hashedPassword}, ${'赵六'}, ${'ZL'}, ${'UI设计'})
    `;

    // 插入默认任务
    await sql`INSERT INTO tasks (title, description, status, priority, due_date, tags, assignee_id) VALUES
      (${'完成项目需求文档'}, ${'整理并完善项目需求文档'}, ${'todo'}, ${'high'}, ${'2024-02-15'}, ${'{文档,需求}'}, ${1}),
      (${'设计数据库架构'}, ${'根据需求设计数据库表结构'}, ${'todo'}, ${'high'}, ${'2024-02-18'}, ${'{数据库,设计}'}, ${2}),
      (${'开发用户登录模块'}, ${'实现用户注册、登录功能'}, ${'in-progress'}, ${'high'}, ${'2024-02-20'}, ${'{前端,用户}'}, ${3}),
      (${'实现数据可视化'}, ${'使用图表库实现数据展示'}, ${'in-progress'}, ${'medium'}, ${'2024-02-22'}, ${'{前端,图表}'}, ${4}),
      (${'代码审查'}, ${'审查团队成员提交的代码'}, ${'review'}, ${'medium'}, ${'2024-02-16'}, ${'{审查,代码}'}, ${1}),
      (${'编写单元测试'}, ${'为核心模块编写测试用例'}, ${'done'}, ${'medium'}, ${'2024-02-14'}, ${'{测试,后端}'}, ${2}),
      (${'部署测试环境'}, ${'配置并部署测试环境'}, ${'done'}, ${'high'}, ${'2024-02-12'}, ${'{运维,部署}'}, ${3})
    `;
  }
}

let dbInitialized = false;

export default async function handler(req: any, res: any) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 初始化数据库
  if (!dbInitialized) {
    try {
      const sql = getPool();
      await initDatabase(sql);
      dbInitialized = true;
    } catch (error) {
      console.error("Database initialization error:", error);
      return res.status(500).json({ message: "数据库初始化失败" });
    }
  }

  const sql = getPool();
  const { pathname } = new URL(req.url || '/', `http://${req.headers.host}`);

  // 登录接口
  if (pathname === "/api/login" && req.method === "POST") {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "请提供邮箱和密码" });
    }

    try {
      const users = await sql`SELECT * FROM users WHERE email = ${email}`;

      if (users.length === 0) {
        return res.status(401).json({ message: "邮箱或密码错误" });
      }

      const user = users[0];
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
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 获取用户列表
  if (pathname === "/api/users" && req.method === "GET") {
    try {
      const users = await sql`SELECT id, name, avatar, role, email FROM users`;
      return res.json(users);
    } catch (error: any) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 验证 token 的辅助函数
  async function verifyToken(authHeader: string | undefined) {
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
      return decoded.userId;
    } catch {
      return null;
    }
  }

  // 获取任务列表
  if (pathname === "/api/tasks" && req.method === "GET") {
    const userId = await verifyToken(req.headers["authorization"]);

    if (!userId) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const tasks = await sql`
        SELECT t.*, u.name as assignee, u.avatar as assignee_avatar
        FROM tasks t
        LEFT JOIN users u ON t.assignee_id = u.id
        ORDER BY t.created_at DESC
      `;

      return res.json(tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        tags: task.tags || [],
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        assignee: task.assignee,
        assigneeId: task.assignee_id,
      })));
    } catch (error: any) {
      console.error("Get tasks error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 创建任务
  if (pathname === "/api/tasks" && req.method === "POST") {
    const userId = await verifyToken(req.headers["authorization"]);

    if (!userId) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const { title, description, status, priority, dueDate, tags, assignee } = req.body || {};

      // 查找 assignee
      let assigneeId = null;
      if (assignee) {
        const users = await sql`SELECT id FROM users WHERE name = ${assignee} LIMIT 1`;
        if (users.length > 0) {
          assigneeId = users[0].id;
        }
      }

      const result = await sql`
        INSERT INTO tasks (title, description, status, priority, due_date, tags, assignee_id, created_at, updated_at)
        VALUES (${title || ''}, ${description || ''}, ${status || 'todo'}, ${priority || 'medium'}, ${dueDate || null}, ${tags || []}, ${assigneeId}, CURRENT_DATE, CURRENT_DATE)
        RETURNING *
      `;

      const newTask = result[0];
      return res.status(201).json({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.due_date,
        tags: newTask.tags,
        createdAt: newTask.created_at,
        updatedAt: newTask.updated_at,
        assignee: assignee,
        assigneeId: assigneeId,
      });
    } catch (error: any) {
      console.error("Create task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 更新任务
  if (pathname.match(/^\/api\/tasks\/\d+$/) && req.method === "PUT") {
    const userId = await verifyToken(req.headers["authorization"]);

    if (!userId) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      const { status } = req.body || {};

      const result = await sql`
        UPDATE tasks 
        SET status = ${status}, updated_at = CURRENT_DATE
        WHERE id = ${taskId}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({ message: "任务不存在" });
      }

      const task = result[0];
      return res.json({
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.due_date,
        tags: task.tags,
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      });
    } catch (error: any) {
      console.error("Update task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 删除任务
  if (pathname.match(/^\/api\/tasks\/\d+$/) && req.method === "DELETE") {
    const userId = await verifyToken(req.headers["authorization"]);

    if (!userId) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      await sql`DELETE FROM tasks WHERE id = ${taskId}`;

      return res.json({ message: "任务已删除" });
    } catch (error: any) {
      console.error("Delete task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  return res.status(404).json({ message: "API 端点不存在" });
}
