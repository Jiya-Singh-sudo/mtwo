import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { useGoogleReCaptcha, GoogleReCaptchaProvider } from 'react-google-recaptcha-v3';

interface RecaptchaProps {
    siteKey: string;
    action?: string;
    onExecute: (token: string) => void;
    url?: string;
}

const RecaptchaInner = forwardRef<any, Omit<RecaptchaProps, 'siteKey'>>(
    ({ action = 'login', onExecute }, ref) => {
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
            if (!executeRecaptcha) return;
            executeRecaptcha(action).then((token) => {
                onExecute(token);
            });
        }, [executeRecaptcha]);

        return null;
    }
);

RecaptchaInner.displayName = 'RecaptchaInner';

const Recaptcha = forwardRef<any, RecaptchaProps>((props, ref) => {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={props.siteKey}>
            <RecaptchaInner
                action={props.action}
                onExecute={props.onExecute}
                ref={ref}
            />
        </GoogleReCaptchaProvider>
    );
});

Recaptcha.displayName = 'Recaptcha';

export default Recaptcha;