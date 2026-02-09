import { initDb } from './db.js';
import { timedQuerySync } from "./metrics.js";


const getDb = () => initDb();

export const findUserByIntraId = (intraId: number) => {
  return getDb().prepare(
    `SELECT * FROM user WHERE intra_id = ?`
  ).get(intraId) as any;
};

export const createIntraUser = (
  intraId: number,
  login: string,
  email: string | null,
  image: string | null
) => {
  return timedQuerySync("createIntraUser", () => {
      console.log("-------------------------------------------------------------[DB_OP] ");
      return getDb()
        .prepare(`
          INSERT INTO user (login, email, image, intra_id, auth_provider, display_name)
          VALUES (?, ?, ?, ?, 'intra', ?)
        `)
        .run(login, email, image, intraId, login);
  });
};

export const findUserById = (id: number) => {
  return timedQuerySync("createIntraUser", () => {
    return getDb().prepare(
      `SELECT * FROM user WHERE id = ?`
    ).get(id) as any;
  });
};

export const findUserByLogin = (login: string) => {
  return timedQuerySync("createIntraUser", () => {
    return getDb().prepare(
     `SELECT * FROM user WHERE login = ?`
   ).get(login) as any;
  });
};

export const findUserByDisplayName = (displayName: string) => {
  return timedQuerySync("createIntraUser", () => {
    return getDb().prepare(
     `SELECT * FROM user WHERE display_name = ?`
    ).get(displayName) as any;
  });
};

export const setTwoFASecret = (userId: number, secret: string) => {
  return timedQuerySync("setTwoFASecret", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET twofa_secret = ?
        WHERE id = ?
      `)
      .run(secret, userId);
  });
};

export const enable2FA = (userId: number) => {
  return timedQuerySync("enable2FA", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET is_2fa_enabled = 1
        WHERE id = ?
      `)
      .run(userId);
  });
};

export const disable2FA = (userId: number) => {
  return timedQuerySync("disable2FA", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET is_2fa_enabled = 0,
            twofa_secret = NULL
        WHERE id = ?
      `)
      .run(userId);
  });
};

export const updateUserAvatar = (userId: number, image: string) => {
  return timedQuerySync("updateUserAvatar", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET image = ?
        WHERE id = ?
      `)
      .run(image, userId);
  });
};

export const updateUser = (
  userId: number,
  login: string,
  email: string | null,
  image: string | null
) => {
  return timedQuerySync("updateUser", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET login = ?, email = ?, image = ?
        WHERE id = ?
      `)
      .run(login, email, image, userId);
  });
};

export const updateUserDisplayName = (userId: number, displayName: string) => {
  return timedQuerySync("updateUserDisplayName", () => {
    return getDb()
      .prepare(`
        UPDATE user
        SET display_name = ?
        WHERE id = ?
      `)
      .run(displayName, userId);
  });
};

export const initDisplayNameIfNull = (userId: number) => {
  return timedQuerySync("initDisplayNameIfNull", () => {
    const user = findUserById(userId); // findUserById est déjà instrumentée si tu l’as fait
    if (user && !user.display_name) {
      return getDb()
        .prepare(`
          UPDATE user
          SET display_name = login
          WHERE id = ? AND display_name IS NULL
        `)
        .run(userId);
    }
    return null;
  });
};

export const findAllUsers = () => {
  return timedQuerySync("findAllUsers", () => {
    return getDb()
      .prepare(`
        SELECT id, login, display_name, image FROM user
      `)
      .all();
  });
};

// add time!!!!

export const findUserByEmail = (email: string) => {
  return getDb().prepare(
    `SELECT * FROM user WHERE email = ?`
  ).get(email) as any;
};

export const createLocalUser = (
  login: string,
  email: string,
  passwordHash: string,
  image: string | null = '/avatars/3.jpg'
) => {
  return getDb().prepare(`
    INSERT INTO user (login, email, password_hash, auth_provider, display_name, image)
    VALUES (?, ?, ?, 'local', ?, ?)
  `).run(login, email, passwordHash, login, image);
};

