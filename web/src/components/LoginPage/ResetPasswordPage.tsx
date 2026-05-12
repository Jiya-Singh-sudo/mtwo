
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Alert, AlertDescription } from "../ui/alert";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Eye, EyeOff, Lock, CheckCircle2, X } from "lucide-react";
import { resetPasswordApi } from "@/api/authentication/auth.api";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";
  const verified = location.state?.verified || false;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Password strength indicators
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // Redirect if not verified
  useEffect(() => {
    if (!verified || !email) {
      navigate("/forgot-password");
    }
  }, [verified, email, navigate]);

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      hasMinLength: newPassword.length >= 8,
      hasUpperCase: /[A-Z]/.test(newPassword),
      hasLowerCase: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setError("");

  //   // Validate password strength
  //   const allStrengthMet = Object.values(passwordStrength).every((v) => v);
  //   if (!allStrengthMet) {
  //     setError("Password does not meet all requirements");
  //     return;
  //   }

  //   // Check if passwords match
  //   if (newPassword !== confirmPassword) {
  //     setError("Passwords do not match. Please try again.");
  //     return;
  //   }

  //   setIsLoading(true);
  //   try {
  //     await resetPasswordApi(email, newPassword);

  //     setIsLoading(false);

  //     setShowSuccessDialog(true);
  //   } catch (err: any) {
  //     setIsLoading(false);

  //     setError(
  //       err?.response?.data?.message ||
  //       "Failed to reset password"
  //     );
  //   }
  // };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password strength
    const allStrengthMet = Object.values(passwordStrength).every((v) => v);

    if (!allStrengthMet) {
      setError("Password does not meet all requirements");
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    setIsLoading(true);

    try {
      await resetPasswordApi(email, newPassword);

      setIsLoading(false);

      setShowSuccessDialog(true);
    } catch (err: any) {
      setIsLoading(false);

      setError(
        err?.response?.data?.message ||
        "Failed to reset password"
      );
    }
  };
  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-12">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="mb-2">Reset Password</h2>
            <p className="text-sm text-gray-600">
              Create a new strong password for your account
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password *</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="h-14 pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Password must contain:</p>
              <PasswordRequirement
                met={passwordStrength.hasMinLength}
                text="At least 8 characters"
              />
              <PasswordRequirement
                met={passwordStrength.hasUpperCase}
                text="One uppercase letter (A-Z)"
              />
              <PasswordRequirement
                met={passwordStrength.hasLowerCase}
                text="One lowercase letter (a-z)"
              />
              <PasswordRequirement
                met={passwordStrength.hasNumber}
                text="One number (0-9)"
              />
              <PasswordRequirement
                met={passwordStrength.hasSpecialChar}
                text="One special character (!@#$%^&*)"
              />
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password *</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-14 pr-10 w-full"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && (
                <p className={`text-xs ${newPassword === confirmPassword ? "text-green-600" : "text-red-600"}`}>
                  {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              {isLoading ? "Resetting Password..." : "Reset Password"}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>Your password will be encrypted and stored securely</p>
        </div>
      </div>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              Password Reset Successful!
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Your password has been successfully updated. You can now login with your new password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-col gap-2">
            <Button
              onClick={handleSuccessClose}
              className="w-full bg-[#4267B2] hover:bg-[#365899] text-white"
            >
              Go to Login
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Password Requirement Component
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      {met ? (
        <CheckCircle2 size={16} className="text-green-600 flex-shrink-0" />
      ) : (
        <X size={16} className="text-gray-400 flex-shrink-0" />
      )}
      <span className={`text-sm ${met ? "text-green-700" : "text-gray-600"}`}>
        {text}
      </span>
    </div>
  );
}
