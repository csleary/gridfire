import { Request, Response, NextFunction } from "express";

const clientErrorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (req.xhr) {
    console.error("Error processing client request: %s", req.headers.host);
    res.status(500).send({ error: "An API server error occurred." });
  } else {
    next(error);
  }
};

const logErrors = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error(error);
  next(error);
};

const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) return next(error);
  res.status(500).send({ error });
};

process.on("uncaughtException", error => {
  console.log("Uncaught error:\n", error);
  if (process.env.NODE_ENV === "production") process.exit(1);
});

export { clientErrorHandler, errorHandler, logErrors };
