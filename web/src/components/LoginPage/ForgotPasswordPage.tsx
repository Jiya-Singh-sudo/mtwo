
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import { ArrowLeft, Mail, Shield } from "lucide-react";
import { forgotPasswordApi } from "@/api/authentication/auth.api";

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [generatedCaptcha] = useState(generateCaptcha());
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function generateCaptcha() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   // Validate email
  //   if (!email || !email.includes("@")) {
  //     setError("Please enter a valid email address");
  //     return;
  //   }

  //   // Validate captcha
  //   if (captcha.toUpperCase() !== generatedCaptcha) {
  //     setError("Invalid captcha. Please try again.");
  //     return;
  //   }

  //   setIsLoading(true);

  //   try {
  //     const response = await forgotPasswordApi(email);

  //     setIsLoading(false);

  //     navigate("/verify-otp", {
  //       state: {
  //         email,
  //       },
  //     });
  //   } catch (err: any) {
  //     setIsLoading(false);

  //     setError(
  //       err?.response?.data?.message ||
  //       "Failed to send OTP. Please try again."
  //     );
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }

    if (captcha.toUpperCase() !== generatedCaptcha) {
      setError("Invalid captcha. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      await forgotPasswordApi(email);

      setIsLoading(false);

      navigate("/verify-otp", {
        state: { email },
      });
    } catch (err: any) {
      setIsLoading(false);

      setError(
        err?.response?.data?.message ||
        "Failed to send OTP. Please try again."
      );
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-[#4267B2] hover:text-[#365899] mb-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Login</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#4267B2]" />
            </div>
            <h2 className="mb-2">Forgot Password?</h2>
            <p className="text-sm text-gray-600">
              Enter your registered email address to receive an OTP
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Official Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-14 pl-10 w-full"
                />
              </div>
              <p className="text-xs text-gray-500">
                We'll send a One-Time Password (OTP) to this email
              </p>
            </div>

            {/* Captcha */}
            <div className="space-y-2">
              <Label htmlFor="captcha">Verify Captcha *</Label>
              <div className="flex gap-3 items-center mb-3">
                <div className="bg-gray-100 border-2 border-gray-300 rounded px-6 py-4 select-none font-mono tracking-wider">
                  <span className="text-lg font-semibold text-gray-700 line-through decoration-gray-400 decoration-1">
                    {generatedCaptcha}
                  </span>
                </div>
              </div>
              <Input
                id="captcha"
                type="text"
                placeholder="Enter the captcha above"
                value={captcha}
                onChange={(e) => setCaptcha(e.target.value)}
                required
                className="h-14 w-full"
                maxLength={6}
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              {isLoading ? "Sending OTP..." : "Send OTP"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Need help? Contact your system administrator</p>
        </div>
      </div>
    </div>
  );
}