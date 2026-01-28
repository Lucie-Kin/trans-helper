// chat/src/auth.ts
import jwt from "jsonwebtoken";

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};

  return Object.fromEntries(
    cookieHeader.split(";").map((c) => {
      const [k, ...v] = c.trim().split("=");
      return [k, decodeURIComponent(v.join("="))];
    })
  );
}

export function authenticateSocket(socket: any, next: any) {
  try {
    // 1️⃣ auth.token (если передаётся явно)
    let token = socket.handshake.auth?.token;

    // 2️⃣ cookie
    if (!token) {
      const cookies = parseCookies(
        socket.handshake.headers.cookie
      );
      token = cookies.appToken;
    }

    if (!token) {
      return next(new Error("No token"));
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as {
      id: number;
      login: string;
      displayName?: string;
      twofaPassed: boolean;
    };

    if (!payload.twofaPassed) {
      return next(new Error("2FA required"));
    }

    socket.user = payload;
    next();
  } catch (err) {
    console.error("Socket auth error:", err);
    next(new Error("Unauthorized"));
  }
}
