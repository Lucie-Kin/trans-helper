import type { FastifyInstance } from "fastify";
import type Database from "better-sqlite3";


export function registerUsersHandlers(
  app: FastifyInstance,
  db: Database.Database
) {
  // PUBLIC — через JWT (для webapp)
  app.get("/auth/api/users", async (req, reply) => {
    await req.jwtVerify({ onlyCookie: true });

    const users = db
      .prepare(`
        SELECT id, login, image AS avatar
        FROM user
        ORDER BY login ASC
      `)
      .all();

    return reply.send(users);
  });

  // INTERNAL — для chat (БЕЗ JWT)
  app.get("/auth/internal/users", async (req, reply) => {
    if (req.headers["x-internal"] !== "chat") {
      return reply.code(403).send({ error: "forbidden" });
    }

    const users = db
      .prepare(`
        SELECT id, login, image AS avatar
        FROM user
        ORDER BY login ASC
      `)
      .all();

    return reply.send(users); // 🔥 ВАЖНО: return
  });
}

