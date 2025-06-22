import type { Request, Response, NextFunction } from "express";

export default (req: Request, res: Response, next: NextFunction): void => {
  if (!req.isAuthenticated()) {
    return void res.status(401).json({ error: "You must be logged in to do this." });
  }

  next();
};
