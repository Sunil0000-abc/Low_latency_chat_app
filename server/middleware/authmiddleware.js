import { verifyToken } from "../utils/jwt.js";

export function auth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    req.user = verifyToken(token);
    next();
  } catch (err) {
    return res.sendStatus(403);
  }
}