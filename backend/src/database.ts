import { createConnection } from "typeorm";
import { User } from "./entity/User";
import { Task } from "./entity/Task";
import bcrypt from "bcrypt";

export async function connectDatabase() {
  return createConnection({
    type: "sqlite",
    database: "./database.sqlite",
    entities: [User, Task],
    synchronize: true,
    logging: false,
  });
}

export async function seedDatabase() {
  const connection = await connectDatabase();
  const userRepository = connection.getRepository(User);
  
  const existingUsers = await userRepository.find();
  if (existingUsers.length === 0) {
    const users = [
      { email: "zhangsan@example.com", name: "张三", avatar: "ZS", role: "项目经理" },
      { email: "lisi@example.com", name: "李四", avatar: "LS", role: "后端开发" },
      { email: "wangwu@example.com", name: "王五", avatar: "WW", role: "前端开发" },
      { email: "zhaoliu@example.com", name: "赵六", avatar: "ZL", role: "UI设计" },
    ];

    for (const userData of users) {
      const user = new User();
      user.email = userData.email;
      user.password = await bcrypt.hash("123456", 10);
      user.name = userData.name;
      user.avatar = userData.avatar;
      user.role = userData.role;
      await userRepository.save(user);
    }
    console.log("初始用户数据已创建");
  }
  
  return connection;
}
