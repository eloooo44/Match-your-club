import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import prisma from "../../lib/prisma";
import { LoginBody, RegisterBody } from "./auth.types";

export const register = async (data: RegisterBody) => {
  const existingUser = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role: data.role,
    },
  });

  const { password, ...safeUser } = user;

  return safeUser;
};

export const login = async (data: LoginBody) => {
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (!user) {
    throw new Error("Invalid credentials");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password);

  if (!isPasswordValid) {
    throw new Error("Invalid credentials");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET!,
  );

  const { password, ...safeUser } = user;

  return {
    token,
    user: safeUser,
  };
};

export const getAllUsers = async () => {
  return prisma.user.findMany();
};
