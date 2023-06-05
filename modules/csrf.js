module.exports = function (req, res, next) {
  if (
    req.method != "GET" &&
    req.session.user &&
    req.session.user.id &&
    req.get("x-csrf") != req.session.user.csrf
  ) {
    res.sendStatus(403);
    return;
  }

  return next();
};
