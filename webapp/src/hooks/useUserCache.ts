type User = { id: number; login: string };

// общий кэш на весь фронт (singleton)
const cache = new Map<number, string>();

export function useUserCache() {
  function update(users: User[]) {
    users.forEach((u) => cache.set(u.id, u.login));
  }

  function get(id: number) {
    return cache.get(id);
  }

  return { update, get };
}
