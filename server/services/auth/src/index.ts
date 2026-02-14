import "dotenv/config";
import { initDb } from './db.js'
import Fastify from "fastify";
import crypto from "crypto";
import bcrypt from "bcrypt";
import fastifyCookie from "@fastify/cookie";
import fastifyJwt from "@fastify/jwt";
import fs from "fs";
import path from "path";
import { authenticator } from "otplib";
import QRCode from "qrcode";
import {
	findUserById,
	findUserByIntraId,
	findUserByDisplayName,
	findUserByLogin,
	findUserByEmail,
	createLocalUser,
	createIntraUser,
	setTwoFASecret,
	enable2FA,
	disable2FA,
	updateUserAvatar,
	updateUserDisplayName,
	initDisplayNameIfNull,
} from "./user.repository.js";
import { registerUsersHandlers } from "./handlers/users.js";
import { register, startDbFileStatsPolling } from "./metrics.js";
import { requireAuth } from "./authGuard.js";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { validateDisplayName } from "./utils.js";




const db = initDb();

const fastify = Fastify({ logger: true });

startDbFileStatsPolling(process.env.DB_PATH ?? "/app/data/auth.db");

declare module "@fastify/jwt" {
	interface FastifyJWT {
		payload: {
			id: number;
			login: string;
			email: string | null;
			image: string | null;
			displayName: string | null;
			twofaPassed: boolean;
		};
		user: {
			id: number;
			login: string;
			email: string | null;
			image: string | null;
			displayName: string | null;
			twofaPassed: boolean;
		};
	}
}


fastify.register(fastifyCookie, { secret: process.env.COOKIE_SECRET! });
fastify.register(fastifyJwt, {
	secret: process.env.JWT_SECRET!,
	cookie: {
		cookieName: 'appToken',
		signed: false,
	},
});
fastify.register(multipart);
fastify.register(fastifyStatic, {
	root: path.join(process.cwd(), "avatars"),
	prefix: "/auth/avatars/",
});

registerUsersHandlers(fastify, db);


fastify.get("/auth/metrics", async (_, reply) => {
	reply.header("Content-Type", register.contentType);
	return register.metrics();
});



function generateState(): string {
	return crypto.randomBytes(16).toString("hex");
}


const pendingStates = new Map<string, number>();


fastify.get("/auth/42/login", async (_request: any, reply: any) => {
	const state = generateState();
	console.log("LOGIN - Generated state:", state);
	pendingStates.set(state, Date.now() + 5 * 60 * 1000);

	const url = `https://api.intra.42.fr/oauth/authorize` + `?client_id=${process.env.CLIENT_ID}` +
		`&redirect_uri=${encodeURIComponent("https://localhost:8443/auth/callback")}` +
		`&response_type=code` + `&state=${state}`;

	return reply.redirect(url);
});


fastify.get("/auth/callback", async (request: any, reply: any) => {
	const code = request.query.code;
	const state42 = request.query.state;

	if (!code || !state42) {
		return reply.code(400).send({ error: "No code/state" });
	}

	const expiry = pendingStates.get(state42);
	if (!expiry || Date.now() > expiry) {
		return reply.code(400).send({ error: "Invalid or expired state" });
	}
	pendingStates.delete(state42);

	const tokenRes = await fetch("https://api.intra.42.fr/oauth/token", {
		method: "POST",
		body: new URLSearchParams({
			grant_type: "authorization_code",
			client_id: process.env.CLIENT_ID!,
			client_secret: process.env.CLIENT_SECRET!,
			code: code,
			redirect_uri: process.env.REDIRECT_URI!, // https://localhost:8443/auth/callback
		}),
	});

	if (!tokenRes.ok) {
		const t = await tokenRes.text();
		return reply.code(500).send({ error: "token_exchange_failed", details: t });
	}

	const tokenData = await tokenRes.json();
	const intraAccessToken = tokenData.access_token;

	const meRes = await fetch("https://api.intra.42.fr/v2/me", {
		headers: { Authorization: `Bearer ${intraAccessToken}` },
	});

	if (!meRes.ok) {
		const t = await meRes.text();
		return reply.code(500).send({ error: "fetch_me_failed", details: t });
	}

	const intraUser = await meRes.json();

	let user = findUserByIntraId(intraUser.id);

	if (!user) {
		createIntraUser(
			intraUser.id,
			intraUser.login,
			intraUser.email,
			intraUser.image?.link
		);
		user = findUserByIntraId(intraUser.id);
	}

	initDisplayNameIfNull(user.id);
	const updatedUser = findUserById(user.id);
	const appToken = fastify.jwt.sign(
		{
			id: updatedUser.id,
			login: updatedUser.login,
			email: updatedUser.email,
			image: updatedUser.image,
			displayName: updatedUser.display_name || updatedUser.login,
			twofaPassed: updatedUser.is_2fa_enabled === 0,
		},
		{ expiresIn: "1h" }
	);

	return reply
		.setCookie("appToken", appToken, {
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60,
		})
		.redirect(`${process.env.FRONTEND_URL}/home`);
});


fastify.get("/auth/session", async (req, reply) => {
	const token = (req.cookies as any)?.appToken;
	if (!token) {
		return reply.code(401).send({ error: "no cookie" });
	}

	try {
		const payload = await fastify.jwt.verify(token) as {
			id: number;
			twofaPassed?: boolean;
		};

		const user = findUserById(payload.id);
		if (!user) {
			return reply.code(401).send({ error: "user_not_found" });
		}

		return reply.send({
			user: {
				id: user.id,
				login: user.login,
				// email: user.email,
				image: user.image,
				displayName: user.display_name || user.login,
				is2faEnabled: user.is_2fa_enabled === 1,
				twofaPassed: payload.twofaPassed === true,
				preferredLanguage: user.preferred_language,
			},
		});
	} catch {
		return reply.code(401).send({ error: "invalid_token" });
	}
});


fastify.post('/auth/logout', async (_req, reply) => {
	reply.clearCookie('appToken', {
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		path: '/',
	}).code(204).send();
});



// Public profile (for chat)
fastify.get("/auth/api/profile/:id", async (req, reply) => {
	await req.jwtVerify({ onlyCookie: true });

	const id = Number((req.params as any).id);
	if (Number.isNaN(id)) {
		return reply.code(400).send({ error: "invalid_id" });
	}

	const user = findUserById(id);
	if (!user) {
		return reply.code(404).send({ error: "user_not_found" });
	}

	return reply.send({
		userId: user.id,
		login: user.login,
		avatar: user.image,
		displayName: user.display_name,
	});
});

fastify.patch("/auth/language", { preHandler: requireAuth }, async (req, reply) => {
	const { preferred_language } = req.body as { preferred_language?: string };

	if (!preferred_language || !["fr", "en", "es"].includes(preferred_language)) {
	  return reply.code(400).send({ error: "invalid_language" });
	}

	// update en DB
	db.prepare(`UPDATE user SET preferred_language = ? WHERE id = ?`)
	  .run(preferred_language, req.user.id);

	return reply.send({ ok: true, preferred_language });
  });

fastify.post("/auth/2fa/setup", async (req, reply) => {
	await req.jwtVerify({ onlyCookie: true });

	const user = findUserById(req.user.id);
	if (user.is_2fa_enabled === 1)
		return reply.code(403).send({ error: "2FA already enabled" });

	const secret = authenticator.generateSecret();
	setTwoFASecret(user.id, secret);

	const otpauth = authenticator.keyuri(
		user.email || user.login,
		"Transcendence",
		secret
	);

	const qr = await QRCode.toDataURL(otpauth);
	return reply.send({ secret, qr });
});


fastify.post("/auth/2fa/verify", async (req, reply) => {
	await req.jwtVerify({ onlyCookie: true });

	const { code } = req.body as { code: string };
	const user = findUserById(req.user.id);


	if (!code || typeof code !== 'string' || code.length !== 6) {
		return reply.code(400).send({ error: "Code requis (6 chiffres)" });
	}

	const valid = authenticator.check(code, user.twofa_secret);
	if (!valid) {
		return reply.code(400).send({ error: "invalid code" });
	}

	if (user.is_2fa_enabled === 0) {
		enable2FA(user.id);
	}

	const newJwt = fastify.jwt.sign(
		{
			id: user.id,
			login: user.login,
			email: user.email,
			image: user.image,
			displayName: user.display_name || user.login,
			twofaPassed: true,
		},
		{ expiresIn: "1h" }
	);

	reply.setCookie("appToken", newJwt, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	return reply.send({ ok: true });
});

fastify.post("/auth/2fa/disable", async (req, reply) => {
	await req.jwtVerify({ onlyCookie: true });

	const { code } = req.body as { code: string };
	const user = findUserById(req.user.id);


	if (!code || typeof code !== 'string' || code.length !== 6) {
		return reply.code(400).send({ error: "Code requis (6 chiffres)" });
	}

	if (!authenticator.check(code, user.twofa_secret)) {
		return reply.code(400).send({ error: "invalid code" });
	}

	disable2FA(user.id);

	const newJwt = fastify.jwt.sign(
		{
			id: user.id,
			login: user.login,
			email: user.email,
			image: user.image,
			displayName: user.display_name || user.login,
			twofaPassed: true,
		},
		{ expiresIn: "1h" }
	);

	reply.setCookie("appToken", newJwt, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
	});

	return reply.send({ ok: true });
});


fastify.post("/auth/avatar", { preHandler: requireAuth }, async (req, reply) => {
	const user = findUserById(req.user.id);
	if (!user)
		return reply.code(401).send({ error: "user_not_found" });

	const file = await (req as any).file();
	if (!file)
		return reply.code(400).send({ error: "no_file" });

	// only allows png/jpg
	if (file.mimetype !== "image/png" && file.mimetype !== "image/jpeg") {
		return reply.code(400).send({ error: "unsupported_type" });
	}

	// limits weight (2MB)
	const buf = await file.toBuffer();
	if (buf.length > 2 * 1024 * 1024) {
		return reply.code(400).send({ error: "file_too_large" });
	}

	// controls file name
	const ext = file.mimetype === "image/png" ? ".png" : ".jpg";
	//const filename = `avatar_${user.id}${ext}`;
	const filename = `avatar_${user.id}_${Date.now()}${ext}`;

	const uploadDir = path.join(process.cwd(), "avatars");
	fs.mkdirSync(uploadDir, { recursive: true });
	fs.writeFileSync(path.join(uploadDir, filename), buf);

	//  stocks path in DB
	const publicPath = `/auth/avatars/${filename}`;
	updateUserAvatar(user.id, publicPath);

	const newJwt = fastify.jwt.sign(
		{
			id: user.id,
			login: user.login,
			email: user.email,
			image: publicPath,
			displayName: user.display_name || user.login,
			twofaPassed: req.user.twofaPassed,
		},
		{ expiresIn: "1h" }
	);

	reply.setCookie("appToken", newJwt, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60,
	});

	return reply.send({ ok: true });
});

fastify.post("/auth/avatar/default", { preHandler: requireAuth }, async (req, reply) => {
	const user = findUserById(req.user.id);
	if (!user)
		return reply.code(401).send({ error: "user_not_found" });

	const { imageUrl } = req.body as { imageUrl?: string };

	if (imageUrl !== "/avatars/default1.png" && imageUrl !== "/avatars/default2.png")
		return reply.code(400).send({ error: "invalid_avatar" });

	updateUserAvatar(user.id, imageUrl);
	console.log("avatar/default body:", req.body);

	const newJwt = fastify.jwt.sign(
		{
			id: user.id,
			login: user.login,
			image: imageUrl,
			email: user.email,
			displayName: user.display_name || user.login,
			twofaPassed: req.user.twofaPassed,
		},
		{ expiresIn: "1h" }
	);

	reply.setCookie("appToken", newJwt, {
		path: "/",
		httpOnly: true,
		secure: true,
		sameSite: "lax",
		maxAge: 60 * 60,
	});

	return reply.send({ ok: true });
});



fastify.post("/auth/profile", { preHandler: requireAuth }, async (req, reply) => {
	const { displayName } = req.body as { displayName?: unknown };
	const v = validateDisplayName(displayName);

	if (!v.ok) {
		if ("error" in v && v.error === "invalid_characters") {
			return reply.code(400).send({ error: "invalid_characters" });
		}
		return reply.code(400).send({ error: "invalid_display_name" });
	}

	const cleanName = v.value;
	const existingUser = findUserByDisplayName(cleanName);

	if (existingUser && existingUser.id !== req.user.id) {
		return reply.code(409).send({ error: "display_name_taken" });
	}

	try {
		updateUserDisplayName(req.user.id, cleanName);

		const user = findUserById(req.user.id);
		if (!user)
			return reply.code(401).send({ error: "user_not_found" });

		// JWT renew with DB values
		const newJwt = fastify.jwt.sign(
			{
				id: user.id,
				login: user.login,
				email: user.email,
				image: user.image,
				displayName: user.display_name || user.login,
				twofaPassed: req.user.twofaPassed,
			},
			{ expiresIn: "1h" }
		);

		reply.setCookie("appToken", newJwt, {
			path: "/",
			httpOnly: true,
			secure: true,
			sameSite: "lax",
			maxAge: 60 * 60,
		});

		return reply.send({ ok: true });
	} catch (err: any) {
		if (err?.code === "SQLITE_CONSTRAINT") {
			return reply.code(409).send({ error: "display_name_taken" });
		}
		req.log?.error?.(err, "Profile update error");
		return reply.code(500).send({ error: "update_failed" });
	}
});


// Password


async function hashPassword(password: string): Promise<string> {
	const saltRounds = 10;
	return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
	return await bcrypt.compare(password, hash);
}

fastify.post("/auth/register", async (req, reply) => {
	const { login, email, password } = req.body as {
		login?: string;
		email?: string;
		password?: string;
	};

	// Validate input data
	if (!login || !email || !password) {
		return reply.code(400).send({ error: "All fields are required" });
	}

	// Check login length
	if (login.length < 3 || login.length > 20) {
		return reply.code(400).send({ error: "Login must be between 3 and 20 characters" });
	}

	// Check login format (only letters, numbers and underscore)
	if (!/^[a-zA-Z0-9_]+$/.test(login)) {
		return reply.code(400).send({ error: "Login can only contain letters, numbers and underscore" });
	}

	// Check password length
	if (password.length < 6) {
		return reply.code(400).send({ error: "Password must be at least 6 characters" });
	}

	// Check email format
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		return reply.code(400).send({ error: "Invalid email format" });
	}

	// Check login uniqueness
	const existingUserByLogin = findUserByLogin(login);
	if (existingUserByLogin) {
		return reply.code(409).send({ error: "User with this login already exists" });
	}

	// Check email uniqueness
	const existingUserByEmail = findUserByEmail(email);
	if (existingUserByEmail) {
		return reply.code(409).send({ error: "User with this email already exists" });
	}

	try {
		// Hash password
		const passwordHash = await hashPassword(password);
		console.log("Registration:", { login, email, passwordHashLength: passwordHash.length });

		// Create user
		const result = createLocalUser(login, email, passwordHash);
		const userId = result.lastInsertRowid as number;

		// Check that user is created and password_hash is saved
		const createdUser = findUserById(userId);
		console.log("User created:", {
			id: createdUser?.id,
			login: createdUser?.login,
			hasPasswordHash: !!createdUser?.password_hash,
			authProvider: createdUser?.auth_provider
		});

		// Initialize display_name
		initDisplayNameIfNull(userId);

		return reply.code(201).send({
			ok: true,
			message: "User successfully registered"
		});
	} catch (err: any) {
		console.error("Registration error:", err);

		// Handle uniqueness errors
		if (err.code === "SQLITE_CONSTRAINT") {
			if (err.message.includes("login")) {
				return reply.code(409).send({ error: "User with this login already exists" });
			}
			if (err.message.includes("email")) {
				return reply.code(409).send({ error: "User with this email already exists" });
			}
		}

		return reply.code(500).send({ error: "Registration error" });
	}
});


fastify.post("/auth/login", async (req, reply) => {
	const { login, password } = req.body as {
		login?: string;
		password?: string;
	};

	// Validate input data
	if (!login || !password) {
		return reply.code(400).send({ error: "Login and password are required" });
	}

	try {
		// Find user by login or email
		let user = findUserByLogin(login);
		if (!user) {
			user = findUserByEmail(login);
		}

		// Check if user exists
		if (!user) {
			return reply.code(401).send({ error: "Invalid login or password" });
		}

		// Check that user is registered locally (not via 42)
		if (user.auth_provider !== 'local') {
			return reply.code(401).send({ error: "This account uses 42 login" });
		}

		// Check if password hash exists
		if (!user.password_hash) {
			return reply.code(401).send({ error: "Invalid login or password" });
		}

		// Verify password
		console.log("Login attempt:", { login: user.login, hasPasswordHash: !!user.password_hash });
		const isValidPassword = await verifyPassword(password, user.password_hash);
		console.log("Password verification result:", isValidPassword);
		if (!isValidPassword) {
			return reply.code(401).send({ error: "Invalid login or password" });
		}

		initDisplayNameIfNull(user.id);
		const updatedUser = findUserById(user.id);

		const appToken = fastify.jwt.sign({
			id: updatedUser.id,
			login: updatedUser.login,
			email: updatedUser.email,
			image: updatedUser.image,
			displayName: updatedUser.display_name || updatedUser.login,
			twofaPassed: updatedUser.is_2fa_enabled === 0, // If 2FA is not enabled, consider it passed
		}, {
			expiresIn: "1h"
		});

		reply.setCookie("appToken", appToken, {
			path: "/",
			httpOnly: true,
			secure: true,
			sameSite: "none",
		});

		return reply.send({
			ok: true,
			user: {
				id: updatedUser.id,
				login: updatedUser.login,
				email: updatedUser.email,
				image: updatedUser.image,
				displayName: updatedUser.display_name || updatedUser.login,
				is2faEnabled: updatedUser.is_2fa_enabled === 1,
				twofaPassed: updatedUser.is_2fa_enabled === 0,
			}
		});
	} catch (err: any) {
		console.error("Login error:", err);
		return reply.code(500).send({ error: "Login error" });
	}
});


await fastify.listen({ port: 3001, host: "0.0.0.0" });
