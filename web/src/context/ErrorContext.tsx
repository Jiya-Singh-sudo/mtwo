import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { setGlobalError } from "@/utils/errorHandler";
import { AlertCircle, CheckCircle, HelpCircle, X } from "lucide-react";

type ModalType = "error" | "success" | "warning" | "confirm";

type ModalConfig = {
    type: ModalType;
    message: string;
    onConfirm?: () => void;
};

type ErrorContextType = {
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
    showWarning: (message: string) => void;
    confirmDialog: (message: string, onConfirm: () => void) => void;
};

const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalConfig | null>(null);

    const showError = (msg: string) => setModal({ type: "error", message: msg });
    const showSuccess = (msg: string) => setModal({ type: "success", message: msg });
    const showWarning = (msg: string) => setModal({ type: "warning", message: msg });
    const confirmDialog = (msg: string, onConfirm: () => void) => setModal({ type: "confirm", message: msg, onConfirm });

    const closeModal = () => setModal(null);

    useEffect(() => {
        setGlobalError(showError);
    }, []);

    return (
        <ErrorContext.Provider value={{ showError, showSuccess, showWarning, confirmDialog }}>
            {children}

            {modal && (
                <div className="modalOverlay" style={{ zIndex: 9999 }}>
                    <div className="nicModal small">
                        <div className="nicModalHeader">
                            <h2 className="flex items-center gap-2">
                                {modal.type === "error" && "Error"}
                                {modal.type === "success" && "Success"}
                                {modal.type === "warning" && "Warning"}
                                {modal.type === "confirm" && "Confirm"}
                            </h2>
                            <button onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modalBody" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                            <div className="flex justify-center mb-4">
                                {modal.type === "error" && <AlertCircle size={48} className="text-red-500" />}
                                {modal.type === "success" && <CheckCircle size={48} className="text-green-500" />}
                                {modal.type === "warning" && <AlertCircle size={48} className="text-orange-500" />}
                                {modal.type === "confirm" && <HelpCircle size={48} className="text-blue-500" />}
                            </div>
                            <p style={{ fontSize: "1.1rem", color: "#374151", margin: 0 }}>{modal.message}</p>
                        </div>

                        <div className="nicModalActions">
                            {modal.type === "confirm" ? (
                                <>
                                    <button onClick={closeModal}>Cancel</button>
                                    <button
                                        className="saveBtn"
                                        style={{ backgroundColor: "#3b82f6" }}
                                        onClick={() => {
                                            modal.onConfirm?.();
                                            closeModal();
                                        }}
                                    >
                                        Confirm
                                    </button>
                                </>
                            ) : (
                                <button
                                    className="saveBtn"
                                    style={{
                                        backgroundColor:
                                            modal.type === "error" ? "#ef4444" :
                                                modal.type === "success" ? "#22c55e" :
                                                    modal.type === "warning" ? "#f59e0b" : "#00247D"
                                    }}
                                    onClick={closeModal}
                                >
                                    OK
                                </button>
                            )}
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
