import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { setSessionExpiredDialogHandler } from "@/lib/session";

export function SessionHandler({ setIsOpen }: { setIsOpen: (value: boolean) => void }) {
    const { token } = useAuth();

    useEffect(() => {
        // If no token, show session expired dialog
        const storedToken = localStorage.getItem("auth_token");
        if (!storedToken || !token) {
            setIsOpen(true);
        }

        // Register global handler (for API interceptors)
        setSessionExpiredDialogHandler(() => setIsOpen(true));

        return () => {
            setSessionExpiredDialogHandler(() => { });
        };
    }, [token]);

    return null;
}
