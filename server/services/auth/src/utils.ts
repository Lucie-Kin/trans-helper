export type DisplayNameValidation =
    | { ok: true; value: string }
    | { ok: false; error: "invalid_type" | "invalid_length" | "invalid_characters" };

export function validateDisplayName(raw: unknown): DisplayNameValidation {
    if (typeof raw !== "string") return { ok: false, error: "invalid_type" };

    const value = raw.trim();
    if (value.length < 3 || value.length > 20)
        return { ok: false, error: "invalid_length" };

    if (!/^[A-Za-z0-9_]+$/.test(value))
        return { ok: false, error: "invalid_characters" };

    return { ok: true, value };
}

