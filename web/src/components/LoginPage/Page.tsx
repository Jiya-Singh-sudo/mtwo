import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, RefreshCw, AlertCircle, Shield } from 'lucide-react';
import './LoginPage.css';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3';
import Carousel from '@/components/carousel/Carousel';

// Carousel images - referenced from public folder via URL paths
const carouselImage1 = '/1st.jpeg';
const carouselImage2 = '/2nd.jpeg';
const carouselImage3 = '/3rd.jpeg';

// Government emblems - referenced from public folder via URaL paths
const ashokaEmblem = '/ashoka_emblem.png';
const goldenSeal = '/govt_Page.png';
const indianFlag = '/Flag_of_India.svg.png';

// Carousel images array (defined outside component to avoid re-creation)
const CAROUSEL_IMAGES = [
    { src: carouselImage1, alt: 'Lok Bhavan Maharashtra - Front View' },
    { src: carouselImage2, alt: 'Lok Bhavan Maharashtra - Aerial View' },
    { src: carouselImage3, alt: 'Lok Bhavan Maharashtra - Garden View' }
];

export function LoginPage() {
    const { isAuthenticated, login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // const [captchaInput, setCaptchaInput] = useState('');
    const { executeRecaptcha } = useGoogleReCaptcha();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{
        username?: string;
        password?: string;
        // captcha?: string;
        general?: string;
    }>({});
    const [touched, setTouched] = useState<{
        username: boolean;
        password: boolean;
        // captcha: boolean;
    }>({
        username: false,
        password: false,
        // captcha: false,
    });
    // const [captchaCode, setCaptchaCode] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard', { replace: true });
        }
    }, [isAuthenticated]);

    // Generate random CAPTCHA
    const generateCaptcha = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        // setCaptchaCode(code);
        // setCaptchaInput('');
        // setErrors(prev => ({ ...prev, captcha: undefined }));
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

    // Validate fields
    const validateUsername = (value: string) => {
        if (!value.trim()) {
            return 'Username is required';
        }
        if (value.length < 3) {
            return 'Username must be at least 3 characters';
        }
        return undefined;
    };

    const validatePassword = (value: string) => {
        if (!value) {
            return 'Password is required';
        }
        if (value.length < 8) {
            return 'Password must be at least 8 characters';
        }
        // Check for at least one uppercase letter
        if (!/[A-Z]/.test(value)) {
            return 'Password must contain at least one uppercase letter';
        }
        // Check for at least one number
        if (!/[0-9]/.test(value)) {
            return 'Password must contain at least one number';
        }
        // Check for at least one special character
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
            return 'Password must contain at least one special character';
        }
        return undefined;
    };

    // const validateCaptcha = (value: string) => {
    //     if (!value.trim()) {
    //         return 'CAPTCHA is required';
    //     }
    //     if (value.toUpperCase() !== captchaCode) {
    //         return 'CAPTCHA does not match';
    //     }
    //     return undefined;
    // };

    // Handle field blur
    const handleBlur = (field: 'username' | 'password') => {
        setTouched(prev => ({ ...prev, [field]: true }));

        let error: string | undefined;
        if (field === 'username') {
            error = validateUsername(username);
        } else if (field === 'password') {
            error = validatePassword(password);
        }
        // } else if (field === 'captcha') {
        //     error = validateCaptcha(captchaInput);
        // }

        setErrors(prev => ({ ...prev, [field]: error }));
    };

    // Handle input change
    const handleUsernameChange = (value: string) => {
        setUsername(value);
        if (touched.username) {
            setErrors(prev => ({ ...prev, username: validateUsername(value) }));
        }
    };

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        if (touched.password) {
            setErrors(prev => ({ ...prev, password: validatePassword(value) }));
        }
    };

    // const handleCaptchaChange = (value: string) => {
    //     setCaptchaInput(value);
    //     if (touched.captcha) {
    //         setErrors(prev => ({ ...prev, captcha: validateCaptcha(value) }));
    //     }
    // };

    // Check if form is valid
    const isFormValid = () => {
        return (
            !validateUsername(username) &&
            !validatePassword(password) &&
            // !validateCaptcha(captchaInput) &&
            username.trim() !== '' &&
            password !== ''
            // captchaInput.trim() !== ''
        );
    };

    // Handle login
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        setTouched({ username: true, password: true });

        const usernameError = validateUsername(username);
        const passwordError = validatePassword(password);
        // const captchaError = validateCaptcha(captchaInput);

        setErrors({
            username: usernameError,
            password: passwordError,
            // captcha: captchaError,
        });

        if (usernameError || passwordError) return;

        if (!executeRecaptcha) {
            setErrors({ general: "reCAPTCHA not ready" });
            return;
        }

        const token = await executeRecaptcha('login_action');

        try {
            setIsLoading(true);
            await login(username, password, token);

            // ✅ Redirect to dashboard
            navigate('/dashboard', { replace: true });

        } catch (err: any) {
            setErrors({ general: 'Invalid username or password' });
            generateCaptcha();
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page h-screen flex flex-col bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <img
                                src={ashokaEmblem}
                                alt="Government of India Emblem"
                                className="h-16 w-16 object-contain"
                            />
                            <div>
                                <p className="text-sm text-gray-600">लोक भवन महाराष्ट्र</p>
                                <h1 className="text-gray-900">Lok Bhavan Maharashtra</h1>
                                <p className="text-sm text-gray-600">Guest Management System</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <img
                                src={goldenSeal}
                                alt="Lok Bhavan Seal"
                                className="h-14 w-14 object-contain"
                            />
                            <img
                                src={indianFlag}
                                alt="Indian Flag"
                                className="h-10 w-16 object-cover rounded"
                            />
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content - Split Layout */}
            <main className="flex flex-1 min-h-0">
                {/* Left Side - Carousel */}
                <div className="hidden lg:flex lg:w-[70%] xl:w-[75%] relative overflow-hidden flex-1">
                    <Carousel images={CAROUSEL_IMAGES.map(img => img.src)} />
                </div>

                {/* Right Side - Login Form */}
                <div className="w-full lg:w-[45%] flex-1 flex items-center justify-center px-6 py-12 bg-gradient-to-br from-gray-50 to-blue-50">
                    <div className="w-full max-w-xl">
                        {/* Login Card */}
                        <div className="bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-gray-200 p-10 space-y-6">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-700 to-blue-900 rounded-full mb-4">
                                    <Shield className="h-8 w-8 text-white" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Secure Login</h2>
                                <p className="text-sm text-gray-500 mt-1">Guest Management System</p>
                            </div>

                            {/* General Error */}
                            {errors.general && (
                                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded flex items-start gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-600">{errors.general}</p>
                                </div>
                            )}

                            <form onSubmit={handleLogin} className="space-y-6">
                                {/* Username Field */}
                                <div className="space-y-2">
                                    <label htmlFor="username" className="block text-sm font-semibold text-gray-800">
                                        Username <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`flex items-center h-12 w-full rounded-lg border transition-all focus-within:ring-0
                                        ${errors.username && touched.username
                                                ? 'border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                                                : 'border-gray-300 focus-within:border-black'
                                            }`}
                                    >
                                        <input
                                            type="text"
                                            id="username"
                                            value={username}
                                            onChange={(e) => handleUsernameChange(e.target.value)}
                                            onBlur={() => handleBlur('username')}
                                            placeholder="Enter your username"
                                            disabled={isLoading}
                                            maxLength={20}
                                            className="flex-1 h-full px-4 bg-transparent border-none outline-none shadow-none focus:ring-0 appearance-none"
                                        />
                                    </div>

                                    {errors.username && touched.username && (
                                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.username}
                                        </p>
                                    )}
                                </div>


                                {/* Password Field */}
                                <div className="space-y-2">
                                    <label htmlFor="password" className="block text-sm font-semibold text-gray-800">
                                        Password <span className="text-red-500">*</span>
                                    </label>

                                    <div
                                        className={`flex items-center h-12 w-full rounded-lg border transition-all focus-within:ring-0
                                        ${errors.password && touched.password
                                                ? 'border-red-500 focus-within:ring-1 focus-within:ring-red-500'
                                                : 'border-gray-300 focus-within:border-black'
                                            }`}
                                    >
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="password"
                                            value={password}
                                            onChange={(e) => handlePasswordChange(e.target.value)}
                                            onBlur={() => handleBlur('password')}
                                            placeholder="Enter your password"
                                            disabled={isLoading}
                                            maxLength={30}
                                            className="flex-1 h-full px-4 bg-transparent border-none outline-none shadow-none focus:ring-0 appearance-none"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="px-3 text-gray-500 hover:text-black"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>

                                    {errors.password && touched.password && (
                                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.password}
                                        </p>
                                    )}
                                </div>


                                {/* CAPTCHA Section */}
                                {/* <div>
                                    <label htmlFor="captcha" className="block text-sm text-gray-700 mb-2">
                                        CAPTCHA Verification <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-3 mb-3">
                                        <div className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 border-2 border-blue-700 rounded-lg px-4 py-3 flex items-center justify-center shadow-inner">
                                            <span className="select-none tracking-widest text-xl text-black" style={{
                                                fontFamily: 'monospace',
                                                letterSpacing: '0.3em',
                                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
                                            }}>
                                                {captchaCode}
                                            </span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={generateCaptcha}
                                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-black border border-blue-700 rounded-lg transition-colors shadow-md"
                                            disabled={isLoading}
                                            title="Refresh CAPTCHA"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        id="captcha"
                                        value={captchaInput}
                                        onChange={(e) => handleCaptchaChange(e.target.value)}
                                        onBlur={() => handleBlur('captcha')}
                                        maxLength={20}
                                        className={`w-full h-12 px-4 text-base border rounded-lg focus:outline-none focus:ring-2 transition-all ${errors.captcha && touched.captcha
                                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                                            : 'border-gray-300 focus:ring-blue-600 focus:border-blue-600'
                                            }`}
                                        placeholder="Enter CAPTCHA code"
                                        disabled={isLoading}
                                    />
                                    {errors.captcha && touched.captcha && (
                                        <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                                            <AlertCircle className="h-4 w-4" />
                                            {errors.captcha}
                                        </p>
                                    )}
                                </div> */}

                                {/* Login Button */}
                                <button
                                    type="submit"
                                    disabled={!isFormValid() || isLoading}
                                    // className={`w-full py-3 rounded-lg transition-all ${!isFormValid() || isLoading
                                    //     ? 'bg-blue-200 text-blue-700 cursor-not-allowed'
                                    //     : 'bg-blue-700 hover:bg-blue-800 text-black shadow-md'
                                    //     }`}
                                    className="nicPrimaryBtn w-full mt-3"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <RefreshCw className="h-5 w-5 animate-spin" />
                                            Logging in...
                                        </span>
                                    ) : (
                                        'Login to Dashboard'
                                    )}
                                </button>

                                {/* Forgot Password Link */}
                                <div className="text-center pt-6 pb-2">
                                    <button
                                        type="button"
                                        className="text-sm font-medium text-blue-700 hover:text-blue-900 hover:underline transition-colors"
                                        disabled={isLoading}
                                    >
                                        Forgot Password?
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-gradient-to-r from-blue-900 to-blue-800 border-t border-blue-700 py-4">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <p className="text-center text-sm text-blue-200">
                        © 2026 Lok Bhavan Maharashtra | लोक भवन महाराष्ट्र | Secured by NIC
                    </p>
                </div>
            </footer>
        </div>
    );
}
export default function LoginPageWrapper() {
    return (
        <GoogleReCaptchaProvider reCaptchaKey={import.meta.env.VITE_RECAPTCHA_KEY}>
            <LoginPage />
        </GoogleReCaptchaProvider>
    );
}
// export default LoginPage;