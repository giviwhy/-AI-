import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { Task } from "../entity/Task";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";

export async function getTasks(req: AuthRequest, res: Response) {
  const taskRepository = getRepository(Task);
  const tasks = await taskRepository.find({ relations: ["assignee"] });
  res.json(tasks);
}

export async function getTasksByUser(req: AuthRequest, res: Response) {
  const taskRepository = getRepository(Task);
  const tasks = await taskRepository.find({ 
    where: { assignee: req.user?.id },
    relations: ["assignee"] 
  });
  res.json(tasks);
}

export async function getTask(req: AuthRequest, res: Response) {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(req.params.id, { relations: ["assignee"] });
  
  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }
  
  res.json(task);
}

export async function createTask(req: AuthRequest, res: Response) {
  const { title, description, status, priority, dueDate, tags, assigneeId } = req.body;
  
  const taskRepository = getRepository(Task);
  const userRepository = getRepository(User);
  
  const assignee = await userRepository.findOne(assigneeId);
  if (!assignee) {
    return res.status(400).json({ message: "负责人不存在" });
  }
  
  const task = new Task();
  task.title = title;
  task.description = description;
  task.status = status || "todo";
  task.priority = priority || "medium";
  task.dueDate = dueDate;
  task.tags = tags || [];
  task.assignee = assignee;
  
  await taskRepository.save(task);
  
  res.status(201).json(task);
}

export async function updateTask(req: AuthRequest, res: Response) {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(req.params.id);
  
  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }
  
  const { title, description, status, priority, dueDate, tags, assigneeId } = req.body;
  
  if (title) task.title = title;
  if (description) task.description = description;
  if (status) task.status = status;
  if (priority) task.priority = priority;
  if (dueDate) task.dueDate = dueDate;
  if (tags) task.tags = tags;
  
  if (assigneeId) {
    const userRepository = getRepository(User);
    const assignee = await userRepository.findOne(assigneeId);
    if (assignee) {
      task.assignee = assignee;
    }
  }
  
  task.updatedAt = new Date();
  
  await taskRepository.save(task);
  
  res.json(task);
}

export async function deleteTask(req: AuthRequest, res: Response) {
  const taskRepository = getRepository(Task);
  const task = await taskRepository.findOne(req.params.id);
  
  if (!task) {
    return res.status(404).json({ message: "任务不存在" });
  }
  
  await taskRepository.delete(req.params.id);
  
  res.json({ message: "任务已删除" });
}
