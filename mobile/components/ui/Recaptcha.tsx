import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface RecaptchaProps {
    siteKey: string;
    url?: string;
    action?: string;
    onExecute: (token: string) => void;
}

const Recaptcha = forwardRef<any, RecaptchaProps>(({ siteKey, url = 'https://localhost', action = 'login', onExecute }, ref) => {
    const webViewRef = useRef<WebView>(null);
    const [html, setHtml] = useState('');

    useEffect(() => {
        setHtml(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <script src="https://www.google.com/recaptcha/api.js?render=${siteKey}"></script>
                <script>
                    function executeRecaptcha() {
                        grecaptcha.ready(function() {
                            grecaptcha.execute('${siteKey}', {action: '${action}'}).then(function(token) {
                                window.ReactNativeWebView.postMessage(token);
                            });
                        });
                    }
                    // Execute immediately on load
                    executeRecaptcha();
                </script>
            </head>
            <body style="background-color: transparent;"></body>
            </html>
        `);
    }, [siteKey, action]);

    useImperativeHandle(ref, () => ({
        refreshToken: () => {
            webViewRef.current?.injectJavaScript('executeRecaptcha(); true;');
        }
    }));

    if (!html) return null;

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                source={{ html, baseUrl: url }}
                onMessage={(event) => {
                    const token = event.nativeEvent.data;
                    if (onExecute) onExecute(token);
                }}
                javaScriptEnabled
                style={{ backgroundColor: 'transparent' }}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                bounces={false}
                scrollEnabled={false}
            />
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        width: 1, // Minimize visibility 
        height: 1,
        opacity: 0,
        overflow: 'hidden'
    }
});

export default Recaptcha;
