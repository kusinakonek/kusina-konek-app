import { Request, Response } from "express";
import { authService } from "../services/authService";
import { SignInInput, SignUpInput } from "@kusinakonek/common";

export const authController = {
  async signUp(req: Request, res: Response) {
    const input = req.body as SignUpInput;
    const result = await authService.signUp(input);
    return res.status(201).json(result);
  },

  async signIn(req: Request, res: Response) {
    const input = req.body as SignInInput;
    const result = await authService.signIn(input);
    return res.status(200).json(result);
  }
};
