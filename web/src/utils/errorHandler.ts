let globalErrorFn: ((msg: string) => void) | null = null;

export const setGlobalError = (fn: (msg: string) => void) => {
    globalErrorFn = fn;
};

export const errorHandler = (err: any) => {
    const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Server error";

    if (globalErrorFn) {
        globalErrorFn(msg);
    } else {
        console.error("Global Error (unhandled):", msg);
    }
};
