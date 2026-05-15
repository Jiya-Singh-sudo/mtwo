import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { setGlobalError } from "@/utils/errorHandler";
import { HelpCircle, X } from "lucide-react";
import { showSuccess as toastSuccess, showError as toastError, showValidation as toastWarning, showServerError as toastServer } from "@/utils/toast";

type ModalType = "confirm"; // Only confirm stays as a modal

type ModalConfig = {
    type: ModalType;
    message: string;
    onConfirm?: () => void;
};

type ErrorContextType = {
    showError: (message: string) => void;
    showSuccess: (message: string) => void;
    showWarning: (message: string) => void;
    showValidation: (message: string) => void;
    showServerError: (message?: string) => void;
    confirmDialog: (message: string, onConfirm: () => void) => void;
};

const ErrorContext = createContext<ErrorContextType | null>(null);

export function ErrorProvider({ children }: { children: ReactNode }) {
    const [modal, setModal] = useState<ModalConfig | null>(null);

    const showError = (msg: string) => toastError(msg);
    const showSuccess = (msg: string) => toastSuccess(msg);
    const showWarning = (msg: string) => toastWarning(msg);
    const showValidation = (msg: string) => toastWarning(msg);
    const showServerError = (msg?: string) => toastServer(msg);
    const confirmDialog = (msg: string, onConfirm: () => void) => setModal({ type: "confirm", message: msg, onConfirm });

    const closeModal = () => setModal(null);

    useEffect(() => {
        setGlobalError(showError);
    }, []);

    return (
        <ErrorContext.Provider value={{ showError, showSuccess, showWarning, showValidation, showServerError, confirmDialog }}>
            {children}

            {modal && (
                <div className="modalOverlay" style={{ zIndex: 9999 }}>
                    <div className="nicModal small">
                        <div className="nicModalHeader">
                            <h2 className="flex items-center gap-2">
                                Confirm
                            </h2>
                            <button onClick={closeModal} aria-label="Close">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modalBody" style={{ textAlign: "center", padding: "2rem 1rem" }}>
                            <div className="flex justify-center mb-4">
                                <HelpCircle size={48} className="text-blue-500" />
                            </div>
                            <p style={{ fontSize: "1.1rem", color: "#374151", margin: 0 }}>{modal.message}</p>
                        </div>

                        <div className="nicModalActions">
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
