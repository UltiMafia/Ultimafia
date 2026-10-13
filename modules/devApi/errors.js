const codes = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  429: "rate_limited",
  500: "server_error",
};

function fail(res, status, message, code) {
  res.status(status).json({ error: { status, code: code || codes[status], message } });
}

class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

module.exports = {
  fail,
  ApiError,
  badRequest: (res, message) => fail(res, 400, message),
  unauthorized: (res, message) => fail(res, 401, message),
  forbidden: (res, message) => fail(res, 403, message),
  notFound: (res, message) => fail(res, 404, message),
  tooManyRequests: (res, message) => fail(res, 429, message),
  serverError: (res, message) => fail(res, 500, message),
};
