import { Request, Response } from "express";
import { prisma } from "../../client/prisma";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import {signUpSchema} from "../../validation/authTypes"

const JWT_SECRET=process.env.JWT_SECRET || "";

export const signup = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const safeParseResult=signUpSchema.safeParse(req.body);

  if(safeParseResult.error){
    return res.status(404).json(safeParseResult.error);
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const encryptedPassword = CryptoJS.AES.encrypt(password, JWT_SECRET).toString();

    const user = await prisma.user.create({
      data: { name, email, password: encryptedPassword },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};