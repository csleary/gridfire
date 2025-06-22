import type { Request, Response, NextFunction } from "express";
import Logger from "@gridfire/shared/logger";

const logger = new Logger("errorHandlers");

const clientErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (req.xhr) {
    logger.error("Error processing client request: %s", req.headers.host);
    res.status(500).send({ error: "An API server error occurred." });
  } else {
    next(error);
  }
};

const logErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(error);
  next(error);
};

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  res.status(500).send({ error });
};

process.on("uncaughtException", error => {
  logger.log("Uncaught error:", error);
  if (process.env.NODE_ENV === "production") process.exit(1);
});

export { clientErrorHandler, errorHandler, logErrors };
