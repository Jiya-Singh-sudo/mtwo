import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface RecaptchaProps {
    siteKey: string;
    action?: string;
    onExecute: (token: string) => void;
    url?: string; // Kept for interface compatibility
}

const RecaptchaInner = forwardRef<any, Omit<RecaptchaProps, 'siteKey'>>(({ action = 'login', onExecute }, ref) => {
    const { executeRecaptcha } = useGoogleReCaptcha();

    useImperativeHandle(ref, () => ({
        refreshToken: async () => {
            if (executeRecaptcha) {
                const token = await executeRecaptcha(action);
                onExecute(token);
            }
        }
    }));

    useEffect(() => {
        if (executeRecaptcha) {
            executeRecaptcha(action).then((token) => {
                onExecute(token);
            });
        }
    }, [executeRecaptcha, action, onExecute]);

    return null; // Invisible functional component
});

const Recaptcha = forwardRef<any, RecaptchaProps>((props, ref) => {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={props.siteKey}>
            <RecaptchaInner {...props} ref={ref} />
        </GoogleReCaptchaProvider>
    );
});

export default Recaptcha;
