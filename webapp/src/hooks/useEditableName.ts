import { useEffect, useState } from "react";

export function useEditableName(initialName: string, onSubmit?: (name: string) => void) {
    const [editing, setEditing] = useState(false);
    const [input, setInput] = useState(initialName);

    useEffect(() => {
        if (!editing)
            setInput(initialName);
    }, [initialName, editing])
    
    const sanitize = (value: string): string => {
        return value.replace(/[^\x20-\x7E]/g, "").trim().slice(0, 20);
    };

    const handleChange = (value: string) => {
        setInput(sanitize(value));
    };

    const handleSubmit = () => {
        const clean = sanitize(input);
        if (clean.length > 0 && onSubmit)
            onSubmit(clean);
        setEditing(false);
    };

    return {
        editing,
        input,
        setEditing,
        handleChange,
        handleSubmit,
    };
}
