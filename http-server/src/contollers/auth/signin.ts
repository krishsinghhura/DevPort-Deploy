import { Request, Response } from "express";
import { prisma } from "../../client/prisma";
import CryptoJS from "crypto-js";
import jwt from "jsonwebtoken";
import { signInSchema } from "../../validation/authTypes";

const JWT_SECRET = process.env.JWT_SECRET || "";

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const safeParseResult=signInSchema.safeParse(req.body);
  
    if(safeParseResult.error){
      return res.status(404).json(safeParseResult.error);
    }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const bytes = CryptoJS.AES.decrypt(user.password, JWT_SECRET);
    const decryptedPassword = bytes.toString(CryptoJS.enc.Utf8);

    if (decryptedPassword !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

    res.status(200).json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Something went wrong" });
  }
};