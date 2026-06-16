import { Request, Response } from "express";
import { getRepository } from "typeorm";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;
  
  const userRepository = getRepository(User);
  const user = await userRepository.findOne({ where: { email } });
  
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
}

export async function register(req: Request, res: Response) {
  const { email, password, name, avatar, role } = req.body;
  
  const userRepository = getRepository(User);
  const existingUser = await userRepository.findOne({ where: { email } });
  
  if (existingUser) {
    return res.status(400).json({ message: "邮箱已被注册" });
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new User();
  user.email = email;
  user.password = hashedPassword;
  user.name = name;
  user.avatar = avatar || name.substring(0, 2).toUpperCase();
  user.role = role || "成员";
  
  await userRepository.save(user);
  
  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: "24h" });
  
  res.status(201).json({
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

export async function getUsers(req: Request, res: Response) {
  const userRepository = getRepository(User);
  const users = await userRepository.find({ select: ["id", "name", "avatar", "role", "email"] });
  res.json(users);
}
