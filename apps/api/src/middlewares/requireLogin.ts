import type { NextFunction, Request, Response } from "express";

export default (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated() || !req.user) {
    return void res.status(401).json({ error: "You must be logged in to do this." });
  }

  next();
};
