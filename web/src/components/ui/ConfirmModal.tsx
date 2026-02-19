import { X } from "lucide-react";
import React from "react";

interface ConfirmModalProps {
    isOpen: boolean;
    title?: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
}

export function ConfirmModal({
    isOpen,
    title = "Confirm Action",
    message,
    onConfirm,
    onCancel,
    confirmText = "OK",
    cancelText = "Cancel",
}: ConfirmModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modalOverlay">
            <div className="nicModal">
                <div className="nicModalHeader">
                    <h2>{title}</h2>
                    <button onClick={onCancel}>
                        <X />
                    </button>
                </div>

                <p className="px-6 py-4 text-gray-700">{message}</p>

                <div className="nicModalActions">
                    <button className="cancelBtn" onClick={onCancel}>
                        {cancelText}
                    </button>

                    <button
                        className="saveBtn"
                        onClick={() => {
                            onConfirm();
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
