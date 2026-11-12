import React, { useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { COLORS, SHADOWS } from "../constants/theme";
import { ENDPOINTS } from "../constants/config";
import {
  AuthenticatedCustomer,
  saveAuthSession,
} from "../services/authService";

export type UserProfile = AuthenticatedCustomer;

interface AuthModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (user: AuthenticatedCustomer) => void;
  onAuthSuccess?: (user: AuthenticatedCustomer) => void;
}

type AuthStep =
  | "LOGIN"
  | "REGISTER"
  | "OTP_VERIFY"
  | "FORGOT_PASSWORD"
  | "RESET_PASSWORD";

const EMPTY_OTP = ["", "", "", "", "", ""];

export function AuthModal({
  visible,
  onClose,
  onSuccess,
  onAuthSuccess,
}: AuthModalProps) {
  const notifyAuthSuccess = (user: AuthenticatedCustomer) => {
    onSuccess?.(user);
    onAuthSuccess?.(user);
  };
  const [step, setStep] = useState<AuthStep>("LOGIN");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("Mowe, Assurance CDA Estate");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // 6-box OTP state
  const [otpDigits, setOtpDigits] = useState<string[]>([...EMPTY_OTP]);
  const otpInputRefs = useRef<Array<{ focus: () => void } | null>>([
    null,
    null,
    null,
    null,
    null,
    null,
  ]);

  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const resetMessages = () => {
    setErrorMsg(null);
    setStatusMsg(null);
  };

  const resetOtpBoxes = () => {
    setOtpDigits([...EMPTY_OTP]);
  };

  const getJoinedOtp = () => otpDigits.join("").replace(/\D/g, "");

  const handleOtpBoxChange = (index: number, rawValue: string) => {
    resetMessages();
    const digitsOnly = rawValue.replace(/\D/g, "");

    // Handle full paste or native oneTimeCode autofill (e.g., 6 digits pasted at once)
    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      const chars = digitsOnly.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && chars[i]) {
          next[index + i] = chars[i];
        }
      }
      // If 6 digits were pasted starting at any box, populate all 6 boxes cleanly
      if (digitsOnly.length >= 6) {
        for (let i = 0; i < 6; i++) {
          next[i] = digitsOnly[i];
        }
        setOtpDigits(next);
        otpInputRefs.current[5]?.focus();
        return;
      }

      setOtpDigits(next);
      const nextFocusIndex = Math.min(5, index + chars.length);
      otpInputRefs.current[nextFocusIndex]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly;
    setOtpDigits(next);

    if (digitsOnly && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (index: number, key: string) => {
    if (key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const next = [...otpDigits];
        next[index - 1] = "";
        setOtpDigits(next);
        otpInputRefs.current[index - 1]?.focus();
      }
    }
  };

  const postJsonSafe = async (
    url: string,
    payload: Record<string, unknown>,
    timeoutMs = 20000
  ): Promise<{ ok: boolean; status: number; data: any; networkError?: boolean }> => {
    const attemptOnce = (): Promise<{
      ok: boolean;
      status: number;
      data: any;
      networkError?: boolean;
    }> =>
      Promise.race([
        (async () => {
          try {
            const res = await fetch(url, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(payload),
            });
            const text = await res.text();
            try {
              const parsed = text ? JSON.parse(text) : {};
              return { ok: res.ok, status: res.status, data: parsed };
            } catch {
              return {
                ok: false,
                status: res.status,
                data: {
                  error:
                    res.status >= 500
                      ? "Server is warming up. Please tap again."
                      : "Unexpected server response.",
                },
              };
            }
          } catch {
            return {
              ok: false,
              status: 0,
              data: null,
              networkError: true,
            };
          }
        })(),
        new Promise<{
          ok: boolean;
          status: number;
          data: any;
          networkError?: boolean;
        }>((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: false,
                status: 408,
                data: null,
                networkError: true,
              }),
            timeoutMs
          )
        ),
      ]);

    const first = await attemptOnce();
    // Automatic retry once if serverless cold start or transient network hiccup occurs
    if (first.networkError || first.status === 502 || first.status === 504) {
      return attemptOnce();
    }
    return first;
  };

  // STEP 1: Login OR Send Registration Email OTP
  const handlePrimarySubmit = async () => {
    resetMessages();

    if (step === "LOGIN") {
      if (!email.trim() || !password.trim()) {
        setErrorMsg("Please enter your email or phone number and password.");
        return;
      }

      setLoading(true);
      const result = await postJsonSafe(ENDPOINTS.login, {
        identifier: email.trim(),
        password: password.trim(),
        deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
      });
      setLoading(false);

      if (result.networkError || !result.data) {
        setErrorMsg(
          "Connection timed out. Please check your internet connection and try again."
        );
        return;
      }

      const data = result.data;
      if (!result.ok || data.error) {
        setErrorMsg(
          data.error ||
            "Invalid credentials. Please check your details and try again."
        );
        return;
      }

      if (data.accessToken && data.refreshToken && data.user) {
        await saveAuthSession({
          user: data.user,
          accessToken: data.accessToken,
          accessTokenExpiresAt:
            data.accessTokenExpiresAt ||
            new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          refreshToken: data.refreshToken,
          refreshTokenExpiresAt:
            data.refreshTokenExpiresAt ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
      }

      notifyAuthSuccess(data.user);
      onClose();
      return;
    }

    // REGISTRATION -> Send OTP
    if (
      !name.trim() ||
      !email.trim() ||
      !phone.trim() ||
      !address.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMsg("Please complete all required fields to create your account.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMsg(
        "Please enter a valid email address to receive your verification code."
      );
      return;
    }

    if (password.length < 8) {
      setErrorMsg(
        "Password must be at least 8 characters and include a letter and a number."
      );
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
      setErrorMsg("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please confirm your password.");
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(ENDPOINTS.sendOtp, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      password,
    });
    setLoading(false);

    if (result.networkError || !result.data) {
      setErrorMsg(
        "Unable to reach verification server. Please check your connection and try again."
      );
      return;
    }

    const data = result.data;
    if (!result.ok || data.error) {
      setErrorMsg(
        data.error || "Could not send verification email. Please try again."
      );
      return;
    }

    resetOtpBoxes();
    setStep("OTP_VERIFY");
    setCountdown(data.resendCooldownSeconds || 30);
    setStatusMsg(
      data.message ||
        `A 6-digit verification code has been sent to ${email.trim().toLowerCase()}.`
    );
  };

  // STEP 2: Verify Registration OTP & Create Account
  const handleVerifyOtp = async () => {
    resetMessages();
    const cleanOtp = getJoinedOtp();
    if (cleanOtp.length < 6) {
      setErrorMsg("Please enter all 6 digits of your verification code.");
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(ENDPOINTS.verifyOtp, {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      address: address.trim(),
      password,
      otp: cleanOtp,
      deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
    });
    setLoading(false);

    if (result.networkError || !result.data) {
      setErrorMsg(
        "Verification request timed out. Please check your connection and try again."
      );
      return;
    }

    const data = result.data;
    if (!result.ok || data.error) {
      setErrorMsg(
        data.error || "Invalid or expired verification code. Please try again."
      );
      return;
    }

    if (data.accessToken && data.refreshToken && data.user) {
      await saveAuthSession({
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiresAt:
          data.accessTokenExpiresAt ||
          new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: data.refreshToken,
        refreshTokenExpiresAt:
          data.refreshTokenExpiresAt ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    notifyAuthSuccess(data.user);
    onClose();
  };

  // STEP 3: Forgot Password -> Send Recovery OTP
  const handleSendForgotPasswordOtp = async () => {
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter the email address registered to your account.");
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(ENDPOINTS.forgotPassword, {
      email: cleanEmail,
    });
    setLoading(false);

    if (result.networkError || !result.data) {
      setErrorMsg("Network error. Please check your internet connection.");
      return;
    }

    const data = result.data;
    if (!result.ok || data.error) {
      setErrorMsg(
        data.error || "Unable to send recovery code right now. Please try again."
      );
      return;
    }

    resetOtpBoxes();
    setStep("RESET_PASSWORD");
    setCountdown(data.resendCooldownSeconds || 30);
    setStatusMsg(
      data.message ||
        "If an account exists for this email, a 6-digit recovery code has been sent."
    );
  };

  // STEP 4: Reset Password with OTP + New Password
  const handleResetPasswordSubmit = async () => {
    resetMessages();
    const cleanOtp = getJoinedOtp();
    if (cleanOtp.length < 6) {
      setErrorMsg("Please enter the 6-digit recovery code sent to your email.");
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setErrorMsg(
        "New password must be at least 8 characters and include a letter and a number."
      );
      return;
    }

    if (!/[A-Za-z]/.test(newPassword) || !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)) {
      setErrorMsg(
        "New password must contain at least one letter and one number."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(ENDPOINTS.resetPassword, {
      email: email.trim().toLowerCase(),
      otp: cleanOtp,
      newPassword,
    });
    setLoading(false);

    if (result.networkError || !result.data) {
      setErrorMsg("Network error while resetting password. Please try again.");
      return;
    }

    const data = result.data;
    if (!result.ok || data.error) {
      setErrorMsg(
        data.error || "Could not reset password. Please check your recovery code."
      );
      return;
    }

    setPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    resetOtpBoxes();
    setStep("LOGIN");
    setStatusMsg(
      data.message ||
        "Password updated! Please sign in with your new password."
    );
  };

  // Google Sign-In handler
  const handleCompleteGoogleSignIn = async () => {
    resetMessages();
    const chosenEmail = (googleEmail.trim() || email.trim()).toLowerCase();
    if (!googleIdToken.trim() && (!chosenEmail || !chosenEmail.includes("@"))) {
      setErrorMsg("Please enter your Gmail address (e.g. yourname@gmail.com).");
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(ENDPOINTS.googleAuth, {
      idToken: googleIdToken.trim() || undefined,
      email: chosenEmail || undefined,
      name: googleName.trim() || name.trim() || undefined,
      phone: phone.trim() || undefined,
      address: address.trim() || "Mowe, Assurance CDA Estate",
      deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
    });
    setLoading(false);

    if (result.networkError || !result.data) {
      setErrorMsg("Unable to reach Google sign-in server. Please try again.");
      return;
    }

    const data = result.data;
    if (!result.ok || data.error) {
      setErrorMsg(data.error || "Google Sign-In verification failed.");
      return;
    }

    if (data.accessToken && data.refreshToken && data.user) {
      await saveAuthSession({
        user: data.user,
        accessToken: data.accessToken,
        accessTokenExpiresAt:
          data.accessTokenExpiresAt ||
          new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: data.refreshToken,
        refreshTokenExpiresAt:
          data.refreshTokenExpiresAt ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    setGoogleModalOpen(false);
    notifyAuthSuccess(data.user);
    onClose();
  };

  const renderSixBoxOtpInputs = () => (
    <View style={styles.otpBoxesContainer}>
      {otpDigits.map((digit, idx) => {
        const isFocused = focusedField === `otp_${idx}`;
        return (
          <TextInput
            key={idx}
            ref={(el) => {
              otpInputRefs.current[idx] = el;
            }}
            style={[
              styles.otpSingleBox,
              isFocused && styles.otpSingleBoxFocused,
              Boolean(digit) && styles.otpSingleBoxFilled,
            ]}
            value={digit}
            onChangeText={(val) => handleOtpBoxChange(idx, val)}
            onKeyPress={({ nativeEvent }) =>
              handleOtpKeyPress(idx, nativeEvent.key)
            }
            onFocus={() => setFocusedField(`otp_${idx}`)}
            onBlur={() => setFocusedField(null)}
            keyboardType="number-pad"
            maxLength={idx === 0 ? 6 : 1}
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            selectTextOnFocus
            placeholder="•"
            placeholderTextColor="rgba(255,255,255,0.18)"
          />
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          {/* Ambient Top Gold Glow Bar */}
          <View style={styles.topGlowBar} />

          {/* Drag Handle & Close Button */}
          <View style={styles.sheetTopBar}>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Brand Emblem & Luxury Header */}
            <View style={styles.brandSection}>
              <View style={styles.crestOuter}>
                <View style={styles.crestInner}>
                  <Text style={styles.crestMonogram}>T</Text>
                </View>
              </View>
              <Text style={styles.brandBadge}>TUTA SUITES • GRAB & GO</Text>
              <Text style={styles.heroTitle}>
                {step === "LOGIN" && "Welcome Back"}
                {step === "REGISTER" && "Create Your Account"}
                {step === "OTP_VERIFY" && "Verify Your Email"}
                {step === "FORGOT_PASSWORD" && "Account Recovery"}
                {step === "RESET_PASSWORD" && "Set New Password"}
              </Text>
              <Text style={styles.heroSubtitle}>
                {step === "LOGIN" &&
                  "Sign in with your registered email or phone number to access express checkout and live rider tracking."}
                {step === "REGISTER" &&
                  "Join Tuta Grab & Go for priority kitchen dispatch and real-time order updates across Mowe."}
                {step === "OTP_VERIFY" &&
                  `Enter the 6-digit security code sent to ${email.trim().toLowerCase()}`}
                {step === "FORGOT_PASSWORD" &&
                  "Enter your registered email address and we will send a 6-digit recovery code."}
                {step === "RESET_PASSWORD" &&
                  `Enter the 6-digit code sent to ${email.trim().toLowerCase()} and choose a new password.`}
              </Text>
            </View>

            {/* Segmented Mode Switcher (Only on LOGIN / REGISTER) */}
            {(step === "LOGIN" || step === "REGISTER") && (
              <View style={styles.segmentedControl}>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    step === "LOGIN" && styles.segmentBtnActive,
                  ]}
                  onPress={() => {
                    setStep("LOGIN");
                    resetMessages();
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      step === "LOGIN" && styles.segmentTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.segmentBtn,
                    step === "REGISTER" && styles.segmentBtnActive,
                  ]}
                  onPress={() => {
                    setStep("REGISTER");
                    resetMessages();
                  }}
                  activeOpacity={0.85}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      step === "REGISTER" && styles.segmentTextActive,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Status & Error Banners */}
            {errorMsg && (
              <View style={styles.errorBanner}>
                <View style={styles.errorIconBadge}>
                  <Text style={styles.errorIconText}>!</Text>
                </View>
                <Text style={styles.errorBannerText}>{errorMsg}</Text>
              </View>
            )}

            {statusMsg && !errorMsg && (
              <View style={styles.infoBanner}>
                <Text style={styles.infoBannerIcon}>✨</Text>
                <Text style={styles.infoBannerText}>{statusMsg}</Text>
              </View>
            )}

            {/* ==================== OTP VERIFICATION VIEW ==================== */}
            {step === "OTP_VERIFY" && (
              <View style={styles.otpContainer}>
                <View style={styles.otpEmailPill}>
                  <Text style={styles.otpEmailPillText}>
                    ✉️ {email.trim().toLowerCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStep("REGISTER");
                      resetMessages();
                    }}
                  >
                    <Text style={styles.otpChangeEmailLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>
                  6-DIGIT VERIFICATION CODE
                </Text>
                {renderSixBoxOtpInputs()}

                <TouchableOpacity
                  style={[
                    styles.goldPrimaryBtn,
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#090A0F" size="small" />
                      <Text style={styles.goldPrimaryBtnText}>
                        Verifying & Creating Account...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.goldPrimaryBtnText}>
                      Verify & Complete Sign Up →
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend code available in{" "}
                      <Text style={styles.resendTimerHighlight}>
                        {countdown}s
                      </Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handlePrimarySubmit}
                      disabled={loading}
                    >
                      <Text style={styles.resendActionText}>
                        Didn&apos;t receive the email? Resend Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ==================== FORGOT PASSWORD VIEW ==================== */}
            {step === "FORGOT_PASSWORD" && (
              <View style={styles.formSection}>
                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>REGISTERED EMAIL ADDRESS</Text>
                  <View
                    style={[
                      styles.inputShell,
                      focusedField === "forgot_email" &&
                        styles.inputShellFocused,
                    ]}
                  >
                    <Text style={styles.fieldIcon}>✉️</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="you@example.com"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onFocus={() => setFocusedField("forgot_email")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setEmail(t);
                        resetMessages();
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.goldPrimaryBtn,
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handleSendForgotPasswordOtp}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#090A0F" size="small" />
                      <Text style={styles.goldPrimaryBtnText}>
                        Sending Recovery Code...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.goldPrimaryBtnText}>
                      Send 6-Digit Recovery Code →
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.switchFooter}
                  onPress={() => {
                    setStep("LOGIN");
                    resetMessages();
                  }}
                >
                  <Text style={styles.switchFooterHighlight}>
                    ← Back to Sign In
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ==================== RESET PASSWORD VIEW ==================== */}
            {step === "RESET_PASSWORD" && (
              <View style={styles.formSection}>
                <View style={styles.otpEmailPill}>
                  <Text style={styles.otpEmailPillText}>
                    ✉️ {email.trim().toLowerCase()}
                  </Text>
                  <TouchableOpacity
                    onPress={() => {
                      setStep("FORGOT_PASSWORD");
                      resetMessages();
                    }}
                  >
                    <Text style={styles.otpChangeEmailLink}>Change</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>6-DIGIT RECOVERY CODE</Text>
                {renderSixBoxOtpInputs()}

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.inputShell,
                      focusedField === "new_password" &&
                        styles.inputShellFocused,
                    ]}
                  >
                    <Text style={styles.fieldIcon}>🔒</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Minimum 8 chars (letters & numbers)"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showPassword}
                      value={newPassword}
                      onFocus={() => setFocusedField("new_password")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setNewPassword(t);
                        resetMessages();
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeToggleText}>
                        {showPassword ? "HIDE" : "SHOW"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD</Text>
                  <View
                    style={[
                      styles.inputShell,
                      focusedField === "confirm_new_password" &&
                        styles.inputShellFocused,
                    ]}
                  >
                    <Text style={styles.fieldIcon}>🛡️</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Re-enter your new password"
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showPassword}
                      value={confirmNewPassword}
                      onFocus={() => setFocusedField("confirm_new_password")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setConfirmNewPassword(t);
                        resetMessages();
                      }}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[
                    styles.goldPrimaryBtn,
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handleResetPasswordSubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#090A0F" size="small" />
                      <Text style={styles.goldPrimaryBtnText}>
                        Updating Password...
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.goldPrimaryBtnText}>
                      Reset Password & Sign In →
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendRow}>
                  {countdown > 0 ? (
                    <Text style={styles.resendTimerText}>
                      Resend recovery code in{" "}
                      <Text style={styles.resendTimerHighlight}>
                        {countdown}s
                      </Text>
                    </Text>
                  ) : (
                    <TouchableOpacity
                      onPress={handleSendForgotPasswordOtp}
                      disabled={loading}
                    >
                      <Text style={styles.resendActionText}>
                        Resend Recovery Code
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ==================== SIGN IN / REGISTER FORM ==================== */}
            {(step === "LOGIN" || step === "REGISTER") && (
              <View style={styles.formSection}>
                {/* Google Quick Sign-In */}
                <TouchableOpacity
                  style={styles.googleButton}
                  onPress={() => {
                    resetMessages();
                    if (email.includes("@") && !googleEmail) {
                      setGoogleEmail(email.trim());
                    }
                    if (name.trim() && !googleName) {
                      setGoogleName(name.trim());
                    }
                    setGoogleModalOpen(true);
                  }}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <View style={styles.googleLogoCircle}>
                    <Text style={styles.googleLogoG}>G</Text>
                  </View>
                  <Text style={styles.googleButtonText}>
                    Continue with Google
                  </Text>
                </TouchableOpacity>

                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerLabel}>
                    OR CONTINUE WITH EMAIL
                  </Text>
                  <View style={styles.dividerLine} />
                </View>

                {step === "REGISTER" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>FULL NAME</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "name" && styles.inputShellFocused,
                      ]}
                    >
                      <Text style={styles.fieldIcon}>👤</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Adewale Johnson"
                        placeholderTextColor={COLORS.textMuted}
                        value={name}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(t) => {
                          setName(t);
                          resetMessages();
                        }}
                      />
                    </View>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.inputLabel}>
                    {step === "LOGIN"
                      ? "EMAIL OR PHONE NUMBER"
                      : "EMAIL ADDRESS (FOR OTP CODE)"}
                  </Text>
                  <View
                    style={[
                      styles.inputShell,
                      focusedField === "email" && styles.inputShellFocused,
                    ]}
                  >
                    <Text style={styles.fieldIcon}>✉️</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={
                        step === "LOGIN"
                          ? "you@example.com or 0803..."
                          : "you@example.com"
                      }
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onFocus={() => setFocusedField("email")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setEmail(t);
                        resetMessages();
                      }}
                    />
                  </View>
                </View>

                {step === "REGISTER" && (
                  <>
                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>
                        PHONE / WHATSAPP NUMBER
                      </Text>
                      <View
                        style={[
                          styles.inputShell,
                          focusedField === "phone" && styles.inputShellFocused,
                        ]}
                      >
                        <Text style={styles.fieldIcon}>📞</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="e.g. 0803 000 0000"
                          placeholderTextColor={COLORS.textMuted}
                          keyboardType="phone-pad"
                          value={phone}
                          onFocus={() => setFocusedField("phone")}
                          onBlur={() => setFocusedField(null)}
                          onChangeText={(t) => {
                            setPhone(t);
                            resetMessages();
                          }}
                        />
                      </View>
                    </View>

                    <View style={styles.fieldGroup}>
                      <Text style={styles.inputLabel}>
                        DEFAULT DELIVERY ADDRESS
                      </Text>
                      <View
                        style={[
                          styles.inputShell,
                          focusedField === "address" &&
                            styles.inputShellFocused,
                        ]}
                      >
                        <Text style={styles.fieldIcon}>📍</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="House No, Street, Estate in Mowe"
                          placeholderTextColor={COLORS.textMuted}
                          value={address}
                          onFocus={() => setFocusedField("address")}
                          onBlur={() => setFocusedField(null)}
                          onChangeText={(t) => {
                            setAddress(t);
                            resetMessages();
                          }}
                        />
                      </View>
                    </View>
                  </>
                )}

                <View style={styles.fieldGroup}>
                  <View style={styles.passwordHeaderRow}>
                    <Text style={styles.inputLabel}>PASSWORD</Text>
                    {step === "LOGIN" && (
                      <TouchableOpacity
                        onPress={() => {
                          resetMessages();
                          setStep("FORGOT_PASSWORD");
                        }}
                      >
                        <Text style={styles.forgotPasswordLink}>
                          Forgot Password?
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View
                    style={[
                      styles.inputShell,
                      focusedField === "password" && styles.inputShellFocused,
                    ]}
                  >
                    <Text style={styles.fieldIcon}>🔒</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder={
                        step === "REGISTER"
                          ? "Minimum 8 chars (letters & numbers)"
                          : "Enter your password"
                      }
                      placeholderTextColor={COLORS.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      onChangeText={(t) => {
                        setPassword(t);
                        resetMessages();
                      }}
                    />
                    <TouchableOpacity
                      style={styles.eyeToggle}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Text style={styles.eyeToggleText}>
                        {showPassword ? "HIDE" : "SHOW"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {step === "REGISTER" && (
                  <View style={styles.fieldGroup}>
                    <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                    <View
                      style={[
                        styles.inputShell,
                        focusedField === "confirmPassword" &&
                          styles.inputShellFocused,
                      ]}
                    >
                      <Text style={styles.fieldIcon}>🛡️</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Re-enter your password"
                        placeholderTextColor={COLORS.textMuted}
                        secureTextEntry={!showPassword}
                        value={confirmPassword}
                        onFocus={() => setFocusedField("confirmPassword")}
                        onBlur={() => setFocusedField(null)}
                        onChangeText={(t) => {
                          setConfirmPassword(t);
                          resetMessages();
                        }}
                      />
                    </View>
                  </View>
                )}

                {/* Primary Luxury Gold Submit CTA */}
                <TouchableOpacity
                  style={[
                    styles.goldPrimaryBtn,
                    loading && styles.btnDisabled,
                  ]}
                  onPress={handlePrimarySubmit}
                  disabled={loading}
                  activeOpacity={0.9}
                >
                  {loading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator color="#090A0F" size="small" />
                      <Text style={styles.goldPrimaryBtnText}>
                        {step === "LOGIN"
                          ? "Signing In..."
                          : "Sending Verification Code..."}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.goldPrimaryBtnText}>
                      {step === "LOGIN"
                        ? "Sign In to Tuta Grab & Go →"
                        : "Send 6-Digit Verification Code →"}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Switch Mode Footer */}
                <TouchableOpacity
                  style={styles.switchFooter}
                  onPress={() => {
                    setStep(step === "LOGIN" ? "REGISTER" : "LOGIN");
                    resetMessages();
                  }}
                >
                  <Text style={styles.switchFooterMuted}>
                    {step === "LOGIN"
                      ? "New to Tuta Grab & Go? "
                      : "Already have a Tuta account? "}
                    <Text style={styles.switchFooterHighlight}>
                      {step === "LOGIN" ? "Create Account" : "Sign In"}
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Google Sign-In Sub-Modal */}
        <Modal visible={googleModalOpen} transparent animationType="fade">
          <View style={styles.googleOverlay}>
            <View style={styles.googleDialog}>
              <View style={styles.googleDialogHeader}>
                <View style={styles.googleLogoCircleLarge}>
                  <Text style={styles.googleLogoGLarge}>G</Text>
                </View>
                <Text style={styles.googleDialogTitle}>
                  Continue with Google
                </Text>
                <Text style={styles.googleDialogSub}>
                  Enter your Gmail address below to sign in or create your
                  linked Tuta Grab & Go account.
                </Text>
              </View>

              {errorMsg && (
                <View style={styles.errorBanner}>
                  <View style={styles.errorIconBadge}>
                    <Text style={styles.errorIconText}>!</Text>
                  </View>
                  <Text style={styles.errorBannerText}>{errorMsg}</Text>
                </View>
              )}

              <Text style={styles.inputLabel}>GMAIL ADDRESS *</Text>
              <View style={[styles.inputShell, { marginBottom: 14 }]}>
                <Text style={styles.fieldIcon}>✉️</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="yourname@gmail.com"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={googleEmail}
                  onChangeText={(t) => {
                    setGoogleEmail(t);
                    resetMessages();
                  }}
                />
              </View>

              <Text style={styles.inputLabel}>
                FULL NAME (OPTIONAL FOR EXISTING ACCOUNTS)
              </Text>
              <View style={[styles.inputShell, { marginBottom: 14 }]}>
                <Text style={styles.fieldIcon}>👤</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Adewale Johnson"
                  placeholderTextColor={COLORS.textMuted}
                  value={googleName}
                  onChangeText={(t) => {
                    setGoogleName(t);
                    resetMessages();
                  }}
                />
              </View>

              <Text style={styles.inputLabel}>
                PHONE / WHATSAPP NUMBER (OPTIONAL FOR DELIVERY)
              </Text>
              <View style={[styles.inputShell, { marginBottom: 14 }]}>
                <Text style={styles.fieldIcon}>📞</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0803 000 0000"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={(t) => {
                    setPhone(t);
                    resetMessages();
                  }}
                />
              </View>

              <View style={styles.googleDialogActions}>
                <TouchableOpacity
                  style={styles.googleCancelBtn}
                  onPress={() => {
                    resetMessages();
                    setGoogleModalOpen(false);
                  }}
                >
                  <Text style={styles.googleCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.googleConfirmBtn}
                  onPress={handleCompleteGoogleSignIn}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.googleConfirmText}>
                      Continue with Google →
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(3, 4, 8, 0.88)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#0B0D14",
    borderTopLeftRadius: 34,
    borderTopRightRadius: 34,
    maxHeight: "94%",
    borderTopWidth: 1.5,
    borderColor: "rgba(230, 198, 101, 0.35)",
    overflow: "hidden",
    ...SHADOWS.card,
  },
  topGlowBar: {
    height: 3,
    width: "45%",
    alignSelf: "center",
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  sheetTopBar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 14,
    paddingHorizontal: 22,
    position: "relative",
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  closeBtn: {
    position: "absolute",
    right: 20,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeIcon: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 38,
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  crestOuter: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(230, 198, 101, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(230, 198, 101, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    ...SHADOWS.goldGlow,
  },
  crestInner: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#141824",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.25)",
  },
  crestMonogram: {
    color: COLORS.primary,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: 1,
  },
  brandBadge: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 8,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "#121520",
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.goldGlow,
  },
  segmentText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "800",
  },
  segmentTextActive: {
    color: "#090A0F",
    fontWeight: "900",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.4)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
    gap: 10,
  },
  errorIconBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
  },
  errorIconText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "900",
  },
  errorBannerText: {
    color: "#FCA5A5",
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
    lineHeight: 17,
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(230, 198, 101, 0.11)",
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.35)",
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
    gap: 10,
  },
  infoBannerIcon: {
    fontSize: 16,
  },
  infoBannerText: {
    color: "#F3E3A3",
    fontSize: 12.5,
    fontWeight: "700",
    flex: 1,
    lineHeight: 17,
  },
  formSection: {
    marginTop: 2,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#161926",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 16,
    paddingVertical: 14,
    gap: 12,
  },
  googleLogoCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogoG: {
    color: "#4285F4",
    fontWeight: "900",
    fontSize: 15,
  },
  googleButtonText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: "800",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  dividerLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    marginHorizontal: 12,
    letterSpacing: 1.2,
  },
  fieldGroup: {
    marginBottom: 15,
  },
  passwordHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgotPasswordLink: {
    color: COLORS.primary,
    fontSize: 11.5,
    fontWeight: "800",
    marginBottom: 7,
  },
  inputLabel: {
    color: "#A5ADC6",
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  inputShell: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#131722",
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: "rgba(255,255,255,0.09)",
    paddingHorizontal: 14,
    height: 54,
  },
  inputShellFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#171C2B",
  },
  fieldIcon: {
    fontSize: 15,
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14.5,
    fontWeight: "600",
    height: "100%",
  },
  eyeToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(230, 198, 101, 0.12)",
  },
  eyeToggleText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  goldPrimaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    ...SHADOWS.goldGlow,
  },
  btnDisabled: {
    opacity: 0.65,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  goldPrimaryBtnText: {
    color: "#090A0F",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  switchFooter: {
    marginTop: 20,
    alignItems: "center",
    paddingVertical: 6,
  },
  switchFooterMuted: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  switchFooterHighlight: {
    color: COLORS.primary,
    fontWeight: "900",
  },
  otpContainer: {
    marginTop: 4,
  },
  otpEmailPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#141824",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  otpEmailPillText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  otpChangeEmailLink: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "900",
  },
  otpBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 22,
  },
  otpSingleBox: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: "#131722",
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.12)",
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
  },
  otpSingleBoxFocused: {
    borderColor: COLORS.primary,
    backgroundColor: "#191F30",
    ...SHADOWS.goldGlow,
  },
  otpSingleBoxFilled: {
    borderColor: "rgba(230, 198, 101, 0.65)",
  },
  resendRow: {
    alignItems: "center",
    marginTop: 20,
  },
  resendTimerText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: "600",
  },
  resendTimerHighlight: {
    color: COLORS.primary,
    fontWeight: "800",
  },
  resendActionText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
  googleOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.82)",
    justifyContent: "center",
    padding: 22,
  },
  googleDialog: {
    backgroundColor: "#131722",
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.3)",
  },
  googleDialogHeader: {
    alignItems: "center",
    marginBottom: 18,
  },
  googleLogoCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  googleLogoGLarge: {
    color: "#4285F4",
    fontSize: 26,
    fontWeight: "900",
  },
  googleDialogTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: "900",
  },
  googleDialogSub: {
    color: COLORS.textSecondary,
    fontSize: 12.5,
    textAlign: "center",
    marginTop: 4,
  },
  googleDialogActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  googleCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
  },
  googleCancelText: {
    color: COLORS.textSecondary,
    fontWeight: "800",
    fontSize: 13,
  },
  googleConfirmBtn: {
    flex: 1.5,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#4285F4",
    alignItems: "center",
  },
  googleConfirmText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 13,
  },
});

export default AuthModal;

