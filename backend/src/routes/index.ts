import express from "express";
import { login, register, getUsers } from "../controllers/userController";
import { getTasks, getTasksByUser, getTask, createTask, updateTask, deleteTask } from "../controllers/taskController";
import { authenticateToken } from "../middleware/auth";

const router = express.Router();

router.post("/login", login);
router.post("/register", register);
router.get("/users", getUsers);

router.get("/tasks", authenticateToken, getTasks);
router.get("/tasks/me", authenticateToken, getTasksByUser);
router.get("/tasks/:id", authenticateToken, getTask);
router.post("/tasks", authenticateToken, createTask);
router.put("/tasks/:id", authenticateToken, updateTask);
router.delete("/tasks/:id", authenticateToken, deleteTask);

export default router;
