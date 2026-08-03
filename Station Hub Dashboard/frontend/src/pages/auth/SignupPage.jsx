import React, { useState } from "react";
import Logo from "../../assets/lightMainLogo.png";
import BGImage from "../../assets/WebLandingPage2.png";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { auth, googleProvider } from "../../firebase";
import { signInWithPopup } from "firebase/auth";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const id_token = await result.user.getIdToken();
      const data = await api.auth.googleLogin(id_token);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...data.user,
            avatar_url: result.user.photoURL || data.user?.avatar_url || null,
          }),
        );
        setSuccess("Account created successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      }
    } catch (err) {
      setError(err.message || "Google signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!agreed) {
      setError("Please agree to the Terms of Service");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await api.auth.register(`${firstName} ${lastName}`, email, password);
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setSuccess("Account created successfully!");
        setTimeout(() => navigate("/dashboard"), 1500);
      } else {
        setError(data.detail || "Signup failed");
      }
    } catch (err) {
      setError(err.message || "Cannot connect to server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-8 relative bg-cover bg-center"
      style={{ backgroundImage: `url(${BGImage})` }}
    >
      <div className="absolute inset-0 bg-black/55" />

      <div className="relative z-10 bg-white rounded-2xl p-8 w-full max-w-sm shadow-[0_8px_40px_rgba(0,0,0,0.18)]">

        <div className="flex flex-col items-center mb-6">
          <img src={Logo} alt="Station Hub Logo" className="w-[160px] h-[160px] object-contain mb-0" />
          <h1 className="text-[22px] font-bold text-black mb-1">Create Account</h1>
          <p className="text-xs text-gray-500 text-center">Start your journey with Station Hub</p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}
        {success && (
          <div className="mb-4 px-4 py-2.5 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-600 text-sm text-center">{success}</p>
          </div>
        )}

        {/* First + Last Name */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">First Name</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-10 bg-gray-50">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Last Name</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-10 bg-gray-50">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <input
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm text-gray-700"
              />
            </div>
          </div>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Email Address</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-10 bg-gray-50">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Password</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-10 bg-gray-50">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password */}
        <div className="mb-4">
          <label className="block text-[13px] font-semibold text-gray-800 mb-1.5">Confirm Password</label>
          <div className="flex items-center gap-2 border border-gray-300 rounded-xl px-3 h-10 bg-gray-50">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm text-gray-700"
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-gray-400 hover:text-gray-600">
              {showConfirm ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Terms */}
        <div className="flex items-start gap-2 mb-5">
          <input
            type="checkbox"
            checked={agreed}
            onChange={() => setAgreed(!agreed)}
            className="w-3.5 h-3.5 mt-0.5 accent-orange-500 flex-shrink-0"
          />
          <p className="text-xs text-gray-500 leading-5">
            I agree to the{" "}
            <a href="/terms" className="text-orange-500 font-semibold">Terms of Service</a>{" "}
            and{" "}
            <a href="/privacy" className="text-orange-500 font-semibold">Privacy Policy</a>
          </p>
        </div>

        {/* Button */}
        <button
          onClick={handleSignup}
          disabled={loading}
          className="w-full h-10 bg-orange-500 text-white rounded-xl font-bold text-[15px] flex items-center justify-center gap-2 mb-5 disabled:opacity-70"
        >
          {loading ? "Creating Account..." : "Create Account →"}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">Or sign up with</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Google only */}
        <div className="w-full mb-6">
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full h-9 border border-gray-300 rounded-xl bg-white flex items-center justify-center gap-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-70">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{" "}
          <a href="/login" className="text-orange-500 font-semibold">Sign in</a>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;