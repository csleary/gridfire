const clientErrorHandler = (error, req, res, next) => {
  if (req.xhr) {
    console.error('Error processing client request: %s', req.headers.host);
    res.status(500).send({ error: 'An API server error occurred.' });
  } else {
    next(error);
  }
};

const logErrors = (error, req, res, next) => {
  console.error(error);
  next(error);
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  res.status(500).send({ error });
};

process.on('uncaughtException', error => {
  console.log('Uncaught error:\n', error);
  if (process.env.NODE_ENV === 'production') process.exit(1);
});

module.exports = { clientErrorHandler, errorHandler, logErrors };
