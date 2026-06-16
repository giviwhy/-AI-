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

// 初始化数据库表（5张核心表）
async function initDatabase(sql: NeonQueryFunction) {
  // 1. 小组表
  await sql`CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    leader_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 2. 用户表
  await sql`CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE,
    phone VARCHAR(20) UNIQUE,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('member', 'leader', 'admin')),
    group_id INTEGER REFERENCES groups(id),
    avatar VARCHAR(10) DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 3. 任务表
  await sql`CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status VARCHAR(20) DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done', 'cancelled', 'needs-revision', 'overdue')),
    creator_id INTEGER REFERENCES users(id),
    assignee_id INTEGER REFERENCES users(id),
    group_id INTEGER REFERENCES groups(id),
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 4. 评论表
  await sql`CREATE TABLE IF NOT EXISTS comments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 5. 附件表
  await sql`CREATE TABLE IF NOT EXISTS attachments (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    uploader_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 6. 消息通知表
  await sql`CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    task_id INTEGER REFERENCES tasks(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;

  // 检查是否有初始数据
  const result = await sql`SELECT COUNT(*) as count FROM users`;
  if (Number(result[0].count) === 0) {
    const hashedPassword = await bcrypt.hash("123456", 10);

    // 创建小组
    await sql`INSERT INTO groups (name) VALUES
      (${'项目开发组'}),
      (${'前端设计组'}),
      (${'测试组'})
    `;

    // 创建用户（包含学号、手机号）
    await sql`INSERT INTO users (student_id, phone, email, username, password, role, group_id, avatar) VALUES
      (${'2024001'}, ${'13800000001'}, ${'zhangsan@example.com'}, ${'张三'}, ${hashedPassword}, ${'leader'}, ${1}, ${'ZS'}),
      (${'2024002'}, ${'13800000002'}, ${'lisi@example.com'}, ${'李四'}, ${hashedPassword}, ${'member'}, ${1}, ${'LS'}),
      (${'2024003'}, ${'13800000003'}, ${'wangwu@example.com'}, ${'王五'}, ${hashedPassword}, ${'member'}, ${1}, ${'WW'}),
      (${'2024004'}, ${'13800000004'}, ${'zhaoliu@example.com'}, ${'赵六'}, ${hashedPassword}, ${'leader'}, ${2}, ${'ZL'}),
      (${'2024005'}, ${'13800000005'}, ${'sunqi@example.com'}, ${'孙七'}, ${hashedPassword}, ${'member'}, ${2}, ${'SQ'}),
      (${'admin'}, ${null}, ${'admin@example.com'}, ${'管理员'}, ${hashedPassword}, ${'admin'}, ${null}, ${'AD'})
    `;

    // 更新小组组长
    await sql`UPDATE groups SET leader_id = 1 WHERE id = 1`;
    await sql`UPDATE groups SET leader_id = 4 WHERE id = 2`;

    // 创建任务
    await sql`INSERT INTO tasks (title, description, due_date, priority, status, creator_id, assignee_id, group_id, tags) VALUES
      (${'完成项目需求文档'}, ${'整理并完善项目需求文档，包括功能清单和技术方案'}, ${'2024-06-20'}, ${'high'}, ${'todo'}, ${1}, ${2}, ${1}, ${'{文档,需求}'}),
      (${'设计数据库架构'}, ${'根据需求设计数据库表结构，包括用户、任务、评论等表'}, ${'2024-06-18'}, ${'high'}, ${'in-progress'}, ${1}, ${3}, ${1}, ${'{数据库,设计}'}),
      (${'开发用户登录模块'}, ${'实现用户注册、登录功能，支持学号/手机号登录'}, ${'2024-06-22'}, ${'high'}, ${'review'}, ${1}, ${2}, ${1}, ${'{前端,用户}'}),
      (${'实现数据可视化'}, ${'使用图表库实现数据展示，包括任务统计、进度图表'}, ${'2024-06-25'}, ${'medium'}, ${'in-progress'}, ${4}, ${5}, ${2}, ${'{前端,图表}'}),
      (${'编写单元测试'}, ${'为核心模块编写测试用例'}, ${'2024-06-15'}, ${'medium'}, ${'done'}, ${1}, ${3}, ${1}, ${'{测试,后端}'}),
      (${'部署测试环境'}, ${'配置并部署测试环境到Vercel'}, ${'2024-06-12'}, ${'high'}, ${'done'}, ${1}, ${2}, ${1}, ${'{运维,部署}'})
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

  // ==================== 用户认证 ====================

  // 登录接口（支持学号/手机号/邮箱）
  if (pathname === "/api/login" && req.method === "POST") {
    const { account, password } = req.body || {};

    if (!account || !password) {
      return res.status(400).json({ message: "请提供账号和密码" });
    }

    try {
      // 支持学号、手机号、邮箱登录
      const users = await sql`
        SELECT u.*, g.name as group_name, g.leader_id as group_leader_id
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        WHERE u.student_id = ${account} OR u.phone = ${account} OR u.email = ${account}
      `;

      if (users.length === 0) {
        return res.status(401).json({ message: "账号或密码错误" });
      }

      const user = users[0];
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.status(401).json({ message: "账号或密码错误" });
      }

      const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

      return res.json({
        token,
        user: {
          id: user.id,
          studentId: user.student_id,
          phone: user.phone,
          email: user.email,
          username: user.username,
          role: user.role,
          groupId: user.group_id,
          groupName: user.group_name,
          isLeader: user.group_leader_id === user.id,
          avatar: user.avatar,
        },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 用户管理 ====================

  // 获取用户列表
  if (pathname === "/api/users" && req.method === "GET") {
    try {
      const users = await sql`
        SELECT u.id, u.student_id, u.phone, u.email, u.username, u.role, u.group_id, u.avatar,
               g.name as group_name
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.id
        ORDER BY u.id
      `;
      return res.json(users.map((u: any) => ({
        id: u.id,
        studentId: u.student_id,
        phone: u.phone,
        email: u.email,
        username: u.username,
        role: u.role,
        groupId: u.group_id,
        groupName: u.group_name,
        avatar: u.avatar,
      })));
    } catch (error: any) {
      console.error("Get users error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 小组管理 ====================

  // 获取小组列表
  if (pathname === "/api/groups" && req.method === "GET") {
    try {
      const groups = await sql`
        SELECT g.*, u.username as leader_name,
               (SELECT COUNT(*) FROM users WHERE group_id = g.id) as member_count
        FROM groups g
        LEFT JOIN users u ON g.leader_id = u.id
        ORDER BY g.id
      `;
      return res.json(groups.map((g: any) => ({
        id: g.id,
        name: g.name,
        leaderId: g.leader_id,
        leaderName: g.leader_name,
        memberCount: Number(g.member_count),
        createdAt: g.created_at,
      })));
    } catch (error: any) {
      console.error("Get groups error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 创建小组（管理员专属）
  if (pathname === "/api/groups" && req.method === "POST") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有管理员可以创建小组" });
    }

    try {
      const { name, leaderId } = req.body || {};

      if (!name) {
        return res.status(400).json({ message: "请提供小组名称" });
      }

      const result = await sql`
        INSERT INTO groups (name, leader_id)
        VALUES (${name}, ${leaderId || null})
        RETURNING *
      `;

      return res.status(201).json({
        id: result[0].id,
        name: result[0].name,
        leaderId: result[0].leader_id,
        createdAt: result[0].created_at,
      });
    } catch (error: any) {
      console.error("Create group error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 更新小组（管理员专属）
  if (pathname.match(/^\/api\/groups\/\d+$/) && req.method === "PUT") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有管理员可以更新小组" });
    }

    try {
      const groupId = parseInt(pathname.split("/")[3]);
      const { name, leaderId } = req.body || {};

      const updates: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (name) {
        updates.push(`name = $${paramIndex++}`);
        params.push(name);
      }
      if (leaderId !== undefined) {
        updates.push(`leader_id = $${paramIndex++}`);
        params.push(leaderId);
      }

      if (updates.length === 0) {
        return res.status(400).json({ message: "没有要更新的字段" });
      }

      params.push(groupId);
      const result = await sql.unsafe(`UPDATE groups SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`, params);

      if (result.length === 0) {
        return res.status(404).json({ message: "小组不存在" });
      }

      return res.json({
        id: result[0].id,
        name: result[0].name,
        leaderId: result[0].leader_id,
      });
    } catch (error: any) {
      console.error("Update group error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 删除小组（管理员专属）
  if (pathname.match(/^\/api\/groups\/\d+$/) && req.method === "DELETE") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有管理员可以删除小组" });
    }

    try {
      const groupId = parseInt(pathname.split("/")[3]);

      // 先将小组内的用户移出小组
      await sql`UPDATE users SET group_id = NULL WHERE group_id = ${groupId}`;

      // 删除小组的任务
      await sql`DELETE FROM tasks WHERE group_id = ${groupId}`;

      // 删除小组
      await sql`DELETE FROM groups WHERE id = ${groupId}`;

      return res.json({ message: "小组已删除" });
    } catch (error: any) {
      console.error("Delete group error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 添加组员到小组（管理员专属）
  if (pathname.match(/^\/api\/groups\/\d+\/members$/) && req.method === "POST") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有管理员可以添加组员" });
    }

    try {
      const groupId = parseInt(pathname.split("/")[3]);
      const { userId } = req.body || {};

      if (!userId) {
        return res.status(400).json({ message: "请提供用户ID" });
      }

      await sql`UPDATE users SET group_id = ${groupId} WHERE id = ${userId}`;

      return res.json({ message: "组员已添加" });
    } catch (error: any) {
      console.error("Add member error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 从小组移除组员（管理员专属）
  if (pathname.match(/^\/api\/groups\/\d+\/members\/\d+$/) && req.method === "DELETE") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有管理员可以移除组员" });
    }

    try {
      const groupId = parseInt(pathname.split("/")[3]);
      const userId = parseInt(pathname.split("/")[5]);

      // 不能移除组长
      const group = await sql`SELECT leader_id FROM groups WHERE id = ${groupId}`;
      if (group.length > 0 && group[0].leader_id === userId) {
        return res.status(400).json({ message: "不能移除组长，请先更换组长" });
      }

      await sql`UPDATE users SET group_id = NULL WHERE id = ${userId}`;

      return res.json({ message: "组员已移除" });
    } catch (error: any) {
      console.error("Remove member error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 任务管理 ====================

  // 验证 token 的辅助函数
  async function verifyToken(authHeader: string | undefined) {
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return null;

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; role: string };
      return decoded;
    } catch {
      return null;
    }
  }

  // 获取任务列表（支持筛选）
  if (pathname === "/api/tasks" && req.method === "GET") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const status = url.searchParams.get('status');
      const priority = url.searchParams.get('priority');
      const assigneeId = url.searchParams.get('assigneeId');
      const groupId = url.searchParams.get('groupId');
      const sortBy = url.searchParams.get('sortBy') || 'created_at';
      const sortOrder = url.searchParams.get('sortOrder') || 'DESC';

      let query = `
        SELECT t.*, 
               u1.username as creator_name, u1.avatar as creator_avatar,
               u2.username as assignee_name, u2.avatar as assignee_avatar,
               g.name as group_name
        FROM tasks t
        LEFT JOIN users u1 ON t.creator_id = u1.id
        LEFT JOIN users u2 ON t.assignee_id = u2.id
        LEFT JOIN groups g ON t.group_id = g.id
        WHERE 1=1
      `;

      const conditions: string[] = [];
      const params: any[] = [];
      let paramIndex = 1;

      if (status) {
        conditions.push(`t.status = $${paramIndex++}`);
        params.push(status);
      }
      if (priority) {
        conditions.push(`t.priority = $${paramIndex++}`);
        params.push(priority);
      }
      if (assigneeId) {
        conditions.push(`t.assignee_id = $${paramIndex++}`);
        params.push(Number(assigneeId));
      }
      if (groupId) {
        conditions.push(`t.group_id = $${paramIndex++}`);
        params.push(Number(groupId));
      }

      if (conditions.length > 0) {
        query += ' AND ' + conditions.join(' AND ');
      }

      // 排序
      const validSortFields = ['created_at', 'due_date', 'priority', 'status'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
      query += ` ORDER BY t.${sortField} ${sortOrder === 'ASC' ? 'ASC' : 'DESC'}`;

      const tasks = await sql.unsafe(query, params);

      return res.json(tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        description: task.description,
        dueDate: task.due_date,
        priority: task.priority,
        status: task.status,
        creatorId: task.creator_id,
        creatorName: task.creator_name,
        assigneeId: task.assignee_id,
        assigneeName: task.assignee_name || '未分配',
        assigneeAvatar: task.assignee_avatar,
        groupId: task.group_id,
        groupName: task.group_name,
        tags: task.tags || [],
        createdAt: task.created_at,
        updatedAt: task.updated_at,
      })));
    } catch (error: any) {
      console.error("Get tasks error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 创建任务（组长专属）
  if (pathname === "/api/tasks" && req.method === "POST") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    // 只有组长和管理员可以创建任务
    if (decoded.role !== 'leader' && decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有组长可以创建任务" });
    }

    try {
      const { title, description, dueDate, priority, assigneeId, groupId, tags } = req.body || {};

      const result = await sql`
        INSERT INTO tasks (title, description, due_date, priority, status, creator_id, assignee_id, group_id, tags, created_at, updated_at)
        VALUES (${title || ''}, ${description || ''}, ${dueDate || null}, ${priority || 'medium'}, ${'todo'}, ${decoded.userId}, ${assigneeId || null}, ${groupId || null}, ${tags || []}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      // 发送通知给负责人
      if (assigneeId) {
        await sql`
          INSERT INTO notifications (user_id, type, title, content, task_id)
          VALUES (${assigneeId}, ${'task_assigned'}, ${'新任务分配'}, ${'您被分配了一个新任务：' + title}, ${result[0].id})
        `;
      }

      const newTask = result[0];
      return res.status(201).json({
        id: newTask.id,
        title: newTask.title,
        description: newTask.description,
        dueDate: newTask.due_date,
        priority: newTask.priority,
        status: newTask.status,
        creatorId: newTask.creator_id,
        assigneeId: newTask.assignee_id,
        groupId: newTask.group_id,
        tags: newTask.tags,
        createdAt: newTask.created_at,
      });
    } catch (error: any) {
      console.error("Create task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 更新任务状态
  if (pathname.match(/^\/api\/tasks\/\d+\/status$/) && req.method === "PUT") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      const { status } = req.body || {};

      // 验证状态流转规则
      const validStatuses = ['todo', 'in-progress', 'review', 'done', 'cancelled', 'needs-revision', 'overdue'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "无效的任务状态" });
      }

      // 获取当前任务状态
      const currentTask = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
      if (currentTask.length === 0) {
        return res.status(404).json({ message: "任务不存在" });
      }

      const task = currentTask[0];

      // 组员只能更新自己负责的任务
      if (decoded.role === 'member' && task.assignee_id !== decoded.userId) {
        return res.status(403).json({ message: "只能更新自己负责的任务" });
      }

      // 组长才能审核任务
      if (status === 'done' && task.status === 'review') {
        if (decoded.role !== 'leader' && decoded.role !== 'admin') {
          return res.status(403).json({ message: "只有组长可以审核任务" });
        }
      }

      const result = await sql`
        UPDATE tasks 
        SET status = ${status}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `;

      // 发送通知
      if (task.creator_id && task.creator_id !== decoded.userId) {
        await sql`
          INSERT INTO notifications (user_id, type, title, content, task_id)
          VALUES (${task.creator_id}, ${'status_changed'}, ${'任务状态变更'}, ${'任务"' + task.title + '"状态已更新为：' + status}, ${taskId})
        `;
      }

      return res.json({
        id: result[0].id,
        status: result[0].status,
        updatedAt: result[0].updated_at,
      });
    } catch (error: any) {
      console.error("Update task status error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 分配/转移任务（组长专属）
  if (pathname.match(/^\/api\/tasks\/\d+\/assign$/) && req.method === "PUT") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    if (decoded.role !== 'leader' && decoded.role !== 'admin') {
      return res.status(403).json({ message: "只有组长可以分配任务" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      const { assigneeId } = req.body || {};

      const result = await sql`
        UPDATE tasks 
        SET assignee_id = ${assigneeId}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${taskId}
        RETURNING *
      `;

      if (result.length === 0) {
        return res.status(404).json({ message: "任务不存在" });
      }

      // 发送通知给新负责人
      if (assigneeId) {
        await sql`
          INSERT INTO notifications (user_id, type, title, content, task_id)
          VALUES (${assigneeId}, ${'task_assigned'}, ${'任务转移'}, ${'您被分配了任务：' + result[0].title}, ${taskId})
        `;
      }

      return res.json({
        id: result[0].id,
        assigneeId: result[0].assignee_id,
      });
    } catch (error: any) {
      console.error("Assign task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 删除任务
  if (pathname.match(/^\/api\/tasks\/\d+$/) && req.method === "DELETE") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);

      // 只有创建者、组长、管理员可以删除任务
      const task = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
      if (task.length === 0) {
        return res.status(404).json({ message: "任务不存在" });
      }

      if (decoded.role !== 'admin' && decoded.role !== 'leader' && task[0].creator_id !== decoded.userId) {
        return res.status(403).json({ message: "无权删除此任务" });
      }

      await sql`DELETE FROM tasks WHERE id = ${taskId}`;

      return res.json({ message: "任务已删除" });
    } catch (error: any) {
      console.error("Delete task error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 附件管理 ====================

  // 获取任务附件
  if (pathname.match(/^\/api\/tasks\/\d+\/attachments$/) && req.method === "GET") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);

      const attachments = await sql`
        SELECT a.*, u.username as uploader_name
        FROM attachments a
        JOIN users u ON a.uploader_id = u.id
        WHERE a.task_id = ${taskId}
        ORDER BY a.created_at DESC
      `;

      return res.json(attachments.map((a: any) => ({
        id: a.id,
        taskId: a.task_id,
        fileName: a.file_name,
        filePath: a.file_path,
        fileType: a.file_type,
        uploaderId: a.uploader_id,
        uploaderName: a.uploader_name,
        createdAt: a.created_at,
      })));
    } catch (error: any) {
      console.error("Get attachments error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 添加任务附件（基于URL）
  if (pathname.match(/^\/api\/tasks\/\d+\/attachments$/) && req.method === "POST") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      const { fileName, filePath, fileType } = req.body || {};

      if (!fileName || !filePath) {
        return res.status(400).json({ message: "请提供文件名和文件路径" });
      }

      const result = await sql`
        INSERT INTO attachments (task_id, file_name, file_path, file_type, uploader_id)
        VALUES (${taskId}, ${fileName}, ${filePath}, ${fileType || 'link'}, ${decoded.userId})
        RETURNING *
      `;

      // 发送通知
      const task = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
      if (task.length > 0) {
        const notifyUsers = [task[0].creator_id, task[0].assignee_id].filter(id => id && id !== decoded.userId);
        for (const userId of notifyUsers) {
          await sql`
            INSERT INTO notifications (user_id, type, title, content, task_id)
            VALUES (${userId}, ${'file_uploaded'}, ${'新附件上传'}, ${'任务"' + task[0].title + '"有新附件：' + fileName}, ${taskId})
          `;
        }
      }

      return res.status(201).json({
        id: result[0].id,
        taskId: result[0].task_id,
        fileName: result[0].file_name,
        filePath: result[0].file_path,
        fileType: result[0].file_type,
        uploaderId: result[0].uploader_id,
        createdAt: result[0].created_at,
      });
    } catch (error: any) {
      console.error("Add attachment error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 删除任务附件
  if (pathname.match(/^\/api\/attachments\/\d+$/) && req.method === "DELETE") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const attachmentId = parseInt(pathname.split("/")[3]);

      // 检查权限（上传者、组长、管理员可以删除）
      const attachment = await sql`SELECT * FROM attachments WHERE id = ${attachmentId}`;
      if (attachment.length === 0) {
        return res.status(404).json({ message: "附件不存在" });
      }

      const task = await sql`SELECT * FROM tasks WHERE id = ${attachment[0].task_id}`;

      if (decoded.role !== 'admin' && decoded.role !== 'leader' &&
        attachment[0].uploader_id !== decoded.userId &&
        task[0]?.creator_id !== decoded.userId) {
        return res.status(403).json({ message: "无权删除此附件" });
      }

      await sql`DELETE FROM attachments WHERE id = ${attachmentId}`;

      return res.json({ message: "附件已删除" });
    } catch (error: any) {
      console.error("Delete attachment error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 评论管理 ====================

  // 获取任务评论
  if (pathname.match(/^\/api\/tasks\/\d+\/comments$/) && req.method === "GET") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);

      const comments = await sql`
        SELECT c.*, u.username, u.avatar
        FROM comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.task_id = ${taskId}
        ORDER BY c.created_at DESC
      `;

      return res.json(comments.map((c: any) => ({
        id: c.id,
        taskId: c.task_id,
        userId: c.user_id,
        username: c.username,
        avatar: c.avatar,
        content: c.content,
        createdAt: c.created_at,
      })));
    } catch (error: any) {
      console.error("Get comments error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 添加评论
  if (pathname.match(/^\/api\/tasks\/\d+\/comments$/) && req.method === "POST") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const taskId = parseInt(pathname.split("/")[3]);
      const { content } = req.body || {};

      if (!content) {
        return res.status(400).json({ message: "评论内容不能为空" });
      }

      const result = await sql`
        INSERT INTO comments (task_id, user_id, content)
        VALUES (${taskId}, ${decoded.userId}, ${content})
        RETURNING *
      `;

      // 发送通知给任务相关人员
      const task = await sql`SELECT * FROM tasks WHERE id = ${taskId}`;
      if (task.length > 0) {
        const notifyUsers = [task[0].creator_id, task[0].assignee_id].filter(id => id && id !== decoded.userId);
        for (const userId of notifyUsers) {
          await sql`
            INSERT INTO notifications (user_id, type, title, content, task_id)
            VALUES (${userId}, ${'new_comment'}, ${'新评论'}, ${'任务"' + task[0].title + '"有新评论'}, ${taskId})
          `;
        }
      }

      return res.status(201).json({
        id: result[0].id,
        taskId: result[0].task_id,
        userId: result[0].user_id,
        content: result[0].content,
        createdAt: result[0].created_at,
      });
    } catch (error: any) {
      console.error("Add comment error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 通知管理 ====================

  // 获取用户通知
  if (pathname === "/api/notifications" && req.method === "GET") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const notifications = await sql`
        SELECT * FROM notifications
        WHERE user_id = ${decoded.userId}
        ORDER BY created_at DESC
        LIMIT 50
      `;

      return res.json(notifications.map((n: any) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        content: n.content,
        taskId: n.task_id,
        isRead: n.is_read,
        createdAt: n.created_at,
      })));
    } catch (error: any) {
      console.error("Get notifications error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // 标记通知已读
  if (pathname.match(/^\/api\/notifications\/\d+\/read$/) && req.method === "PUT") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      const notificationId = parseInt(pathname.split("/")[3]);

      await sql`
        UPDATE notifications
        SET is_read = true
        WHERE id = ${notificationId} AND user_id = ${decoded.userId}
      `;

      return res.json({ message: "已标记为已读" });
    } catch (error: any) {
      console.error("Mark notification read error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  // ==================== 统计分析 ====================

  // 获取统计数据
  if (pathname === "/api/statistics" && req.method === "GET") {
    const decoded = await verifyToken(req.headers["authorization"]);

    if (!decoded) {
      return res.status(401).json({ message: "未提供认证令牌" });
    }

    try {
      // 小组任务统计
      let groupStats = [];
      if (decoded.role === 'leader' || decoded.role === 'admin') {
        groupStats = await sql`
          SELECT 
            g.id, g.name,
            COUNT(t.id) as total_tasks,
            COUNT(CASE WHEN t.status = 'done' THEN 1 END) as completed_tasks,
            COUNT(CASE WHEN t.status = 'overdue' OR (t.due_date < CURRENT_DATE AND t.status NOT IN ('done', 'cancelled')) THEN 1 END) as overdue_tasks
          FROM groups g
          LEFT JOIN tasks t ON t.group_id = g.id
          GROUP BY g.id, g.name
        `;
      }

      // 个人任务统计
      const personalStats = await sql`
        SELECT 
          COUNT(*) as total_tasks,
          COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks,
          COUNT(CASE WHEN status = 'in-progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN status = 'review' THEN 1 END) as review_tasks,
          COUNT(CASE WHEN status = 'overdue' OR (due_date < CURRENT_DATE AND status NOT IN ('done', 'cancelled')) THEN 1 END) as overdue_tasks
        FROM tasks
        WHERE assignee_id = ${decoded.userId}
      `;

      // 任务状态分布
      const statusDistribution = await sql`
        SELECT status, COUNT(*) as count
        FROM tasks
        WHERE group_id = (SELECT group_id FROM users WHERE id = ${decoded.userId})
        GROUP BY status
      `;

      return res.json({
        groupStats: groupStats.map((s: any) => ({
          groupId: s.id,
          groupName: s.name,
          totalTasks: Number(s.total_tasks),
          completedTasks: Number(s.completed_tasks),
          overdueTasks: Number(s.overdue_tasks),
          completionRate: s.total_tasks > 0 ? Math.round(Number(s.completed_tasks) / Number(s.total_tasks) * 100) : 0,
        })),
        personalStats: {
          totalTasks: Number(personalStats[0]?.total_tasks || 0),
          completedTasks: Number(personalStats[0]?.completed_tasks || 0),
          inProgressTasks: Number(personalStats[0]?.in_progress_tasks || 0),
          reviewTasks: Number(personalStats[0]?.review_tasks || 0),
          overdueTasks: Number(personalStats[0]?.overdue_tasks || 0),
        },
        statusDistribution: statusDistribution.map((s: any) => ({
          status: s.status,
          count: Number(s.count),
        })),
      });
    } catch (error: any) {
      console.error("Get statistics error:", error);
      return res.status(500).json({ message: "服务器错误: " + error.message });
    }
  }

  return res.status(404).json({ message: "API 端点不存在" });
}