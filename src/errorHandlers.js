// ERROR HANDLERS
const badRequestHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 400) {
    res.status(400).send(err);
  }
  next(err);
}; // 400

const notAuthorizedHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 401) {
    res.status(401).send(err);
  }
  next(err);
};

const forbiddenHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 403) {
    res.status(403).send(err);
  }
  next(err);
}; // 403

const notFoundHandler = (err, req, res, next) => {
  if (err.httpStatusCode === 404) {
    console.log(err);
    res.status(404).send(err || 'Resource not found!');
  }
  next(err);
}; // 404

// catch all
const genericErrorHandler = (err, req, res, next) => {
  if (!res.headersSent) {
    // checks if another error middleware already sent a response
    res.status(err.httpStatusCode || 500).send(err.message);
  }
};

module.exports = {
  badRequestHandler,
  notAuthorizedHandler,
  forbiddenHandler,
  notFoundHandler,
  genericErrorHandler,
};
