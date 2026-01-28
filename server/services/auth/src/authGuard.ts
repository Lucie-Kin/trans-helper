import { findUserById } from "./user.repository.js";

export async function requireAuth(req, reply) {
  const token = req.cookies?.appToken;
  if (!token) return reply.code(401).send({ error: "no_cookie" });

  let payload;
  try {
    payload = await req.server.jwt.verify(token);
  } catch {
    return reply.code(401).send({ error: "invalid_token" });
  }

  const user = findUserById(payload.id);
  if (!user) {
    return reply.code(401).send({ error: "user_not_found" });
  }

  req.user = {
    id: user.id,
    twofaPassed: payload.twofaPassed === true,
  };
}
