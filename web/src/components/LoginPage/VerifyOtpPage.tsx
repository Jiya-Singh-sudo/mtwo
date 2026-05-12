import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Alert, AlertDescription } from "../ui/alert";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { verifyOtpApi, forgotPasswordApi } from "@/api/authentication/auth.api";

export function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }

    setIsLoading(true);

    try {
      const response = await verifyOtpApi(email, otp);

      setIsLoading(false);

      if (response.verified) {
        navigate("/reset-password", {
          state: {
            email,
            verified: true,
          },
        });
      } else {
        setError("Invalid OTP. Please try again.");
        setOtp("");
      }
    } catch (err: any) {
      setIsLoading(false);

      setError(
        err?.response?.data?.message ||
        "OTP verification failed"
      );

      setOtp("");
    }
  };
  // const handleVerifyOtp = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   if (otp.length !== 6) {
  //     setError("Please enter the complete 6-digit OTP");
  //     return;
  //   }

  //   setIsLoading(true);

  //   // Simulate OTP verification
  //   setTimeout(() => {
  //     setIsLoading(false);
  //     await verifyOtpApi(email, otp)
  //     // For demo: accept "123456" as valid OTP
  //     if (otp === "123456") {
  //       navigate("/reset-password", { state: { email, verified: true } });
  //     } else {
  //       setError("Invalid OTP. Please try again or request a new one.");
  //       setOtp("");
  //     }
  //   }, 1500);
  // };

  const handleResendOtp = async () => {
    if (!canResend) return;

    setError("");
    setOtp("");
    setResendTimer(60);
    setCanResend(false);

    try {
      await forgotPasswordApi(email);
    } catch (err) {
      console.error(err);
      setError("Failed to resend OTP");
    }

    // Simulate resend OTP
    // setTimeout(() => {
    //   // Show success message (you can use toast here)
    //   console.log("OTP resent to:", email);
    // }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Back Button */}
        <button
          onClick={() => navigate("/forgot-password")}
          className="flex items-center gap-2 text-[#4267B2] hover:text-[#365899] mb-6 group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <KeyRound className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="mb-2">Verify OTP</h2>
            <p className="text-sm text-gray-600">
              We've sent a 6-digit code to
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Mail size={16} className="text-[#4267B2]" />
              <span className="font-medium text-[#4267B2]">{email}</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            {/* OTP Input */}
            <div className="space-y-4">
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={(value) => {
                    setOtp(value);
                    setError("");
                  }}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} className="w-12 h-12" />
                    <InputOTPSlot index={1} className="w-12 h-12" />
                    <InputOTPSlot index={2} className="w-12 h-12" />
                    <InputOTPSlot index={3} className="w-12 h-12" />
                    <InputOTPSlot index={4} className="w-12 h-12" />
                    <InputOTPSlot index={5} className="w-12 h-12" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Enter the 6-digit code sent to your email
              </p>

              {/* Demo hint */}
              {/* <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-center">
                <p className="text-blue-700">
                  <strong>Demo:</strong> Use OTP <span className="font-mono font-semibold">123456</span> to proceed
                </p>
              </div> */}
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="w-full h-14 bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </Button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Didn't receive the code?
              </p>
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  className="text-[#4267B2] hover:text-[#365899] font-medium text-sm hover:underline"
                >
                  Resend OTP
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Resend OTP in <span className="font-semibold text-[#4267B2]">{resendTimer}s</span>
                </p>
              )}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>OTP is valid for 10 minutes</p>
        </div>
      </div>
    </div>
  );
}
