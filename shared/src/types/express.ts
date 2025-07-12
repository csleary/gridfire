import { IUser } from "@gridfire/shared/models/User";
import "express";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends IUser {}
  }
}

declare module "express" {
  interface Request {
    user?: Express.User;
  }
}
