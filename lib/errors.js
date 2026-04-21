// Small helpers for consistent HTTP error responses across route handlers.
//
// Body is always plain text so the frontend's `useErrorAlert` hook
// (react_main/src/components/Alerts.jsx) can display it verbatim.
// Messages should stay under ~200 chars — the hook replaces longer
// bodies with "Connection error".

function respond(res, status, message) {
  res.status(status);
  res.send(message);
}

module.exports = {
  // 400 — client sent malformed input (wrong type, bad enum, regex mismatch).
  badRequest: (res, message) => respond(res, 400, message),

  // 401 — not authenticated / token expired.
  unauthorized: (res, message) => respond(res, 401, message),

  // 403 — authenticated but not permitted (missing item, permission, role).
  forbidden: (res, message) => respond(res, 403, message),

  // 404 — resource lookup returned null.
  notFound: (res, message) => respond(res, 404, message),

  // 409 — request conflicts with current state (already exists, at capacity).
  conflict: (res, message) => respond(res, 409, message),

  // 413 — payload too large (files, bodies).
  payloadTooLarge: (res, message) => respond(res, 413, message),

  // 422 — semantically invalid input (required field missing, over limit).
  unprocessable: (res, message) => respond(res, 422, message),

  // 429 — rate-limited; client should back off.
  tooManyRequests: (res, message) => respond(res, 429, message),

  // 500 — truly unexpected: caught exception from DB, network, or async.
  serverError: (res, message = "Something went wrong. Please try again.") =>
    respond(res, 500, message),
};
