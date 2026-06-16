import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getRepository } from "typeorm";
import { User } from "../entity/User";

export interface AuthRequest extends Request {
  user?: User;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "未提供认证令牌" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    const userRepository = getRepository(User);
    const user = await userRepository.findOne(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ message: "用户不存在" });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "无效的认证令牌" });
  }
}
