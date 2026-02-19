import { createContext, useContext, useState, ReactNode } from "react";

type ErrorContextType = {
    showError: (message: string) => void;
};

const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);

    const showError = (msg: string) => setMessage(msg);
    const closeError = () => setMessage(null);

    return (
        <ErrorContext.Provider value={{ showError }}>
            {children}

            {message && (
                <div className="modalOverlay">
                    <div className="nicModal small">
                        <div className="nicModalHeader">
                            <h3>Error</h3>
                            <button onClick={closeError}>✕</button>
                        </div>

                        <div className="modalBody">
                            <p>{message}</p>
                        </div>

                        <div className="nicModalActions">
                            <button className="saveBtn" onClick={closeError}>
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </ErrorContext.Provider>
    );
}

export function useError() {
    const ctx = useContext(ErrorContext);
    if (!ctx) throw new Error("useError must be used inside ErrorProvider");
    return ctx;
}
