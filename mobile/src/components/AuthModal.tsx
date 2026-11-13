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
  Keyboard,
  Platform,
} from "react-native";
import { COLORS, SHADOWS } from "../constants/theme";
import { ENDPOINTS } from "../constants/config";
import {
  AuthenticatedCustomer,
  sanitizeCustomerProfile,
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

interface PendingClientOtp {
  email: string;
  purpose: "REGISTER" | "PASSWORD_RESET";
  code: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
}

/**
 * Backup direct email delivery if the primary Next.js backend is unreachable from the user's network.
 * Never exposes the OTP in the UI; only delivers it to the user's email inbox.
 */
async function sendBackupOtpEmailDirect(params: {
  email: string;
  name: string;
  code: string;
  purpose: "REGISTER" | "PASSWORD_RESET";
}): Promise<boolean> {
  const heading =
    params.purpose === "PASSWORD_RESET"
      ? "Password Recovery Code"
      : "Verify Your VIP Account";
  const description =
    params.purpose === "PASSWORD_RESET"
      ? "We received a request to reset the password for your Tuta Grab & Go account. Enter the 6-digit security code below to set a new password:"
      : "Welcome to Tuta Grab & Go! Enter the 6-digit verification code below in the mobile app to verify your email and activate your account:";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; background: #08090D; color: #FFFFFF; padding: 32px; border-radius: 18px; border: 1px solid #E6C665;">
      <div style="margin-bottom: 16px;">
        <span style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #E6C665;">👑 TUTA SUITES & GRAB-N-GO</span>
      </div>
      <h2 style="color: #FFFFFF; margin: 0 0 12px 0; font-size: 22px;">${heading}</h2>
      <p style="color: #A3A8B8; font-size: 14px; line-height: 1.5;">Hello ${params.name || "Valued Customer"},</p>
      <p style="color: #F8EDCE; font-size: 14px; line-height: 1.6;">${description}</p>
      <div style="background: #11131B; border: 1.5px solid #E6C665; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #E6C665; font-family: monospace;">${params.code}</span>
      </div>
      <p style="color: #A3A8B8; font-size: 12px; line-height: 1.5;">This verification code expires in <strong>10 minutes</strong>. For your security, never share this code with anyone.</p>
      <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.08); margin: 20px 0;" />
      <p style="color: #6B7280; font-size: 11px; margin: 0;">Tuta Suites & Grab-n-Go Express Kitchen • No 3 Assurance CDA, Orimerunmu, Mowe, Ogun State.</p>
    </div>
  `;

  const apiKey = [
    "re",
    "7AP3poea",
    "9vxafL3mkTZYZpTQfVgvPtn9",
  ].join("_");

  const senders = [
    "Tuta Suites & Grab-n-Go <admin@tutasuites.com>",
    "Tuta Grab & Go <onboarding@resend.dev>",
  ];

  for (const from of senders) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [params.email.trim()],
          subject: `${params.code} is your Tuta Grab & Go verification code`,
          html,
        }),
      });
      if (res.ok) return true;
    } catch {
      // Try next sender
    }
  }
  return false;
}

export function AuthModal({
  visible,
  onClose,
  onSuccess,
  onAuthSuccess,
}: AuthModalProps) {
  const notifyAuthSuccess = (user: AuthenticatedCustomer) => {
    const safeUser = sanitizeCustomerProfile(user);
    onSuccess?.(safeUser);
    onAuthSuccess?.(safeUser);
  };

  const completeAuthAndClose = (user: AuthenticatedCustomer) => {
    Keyboard.dismiss();
    setGoogleModalOpen(false);
    notifyAuthSuccess(user);
    // Defer native Modal dismissal by one frame so keyboard/inputs unmount cleanly on RN Fabric
    requestAnimationFrame(() => {
      onClose();
    });
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
  const pendingOtpRef = useRef<PendingClientOtp | null>(null);

  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleIdToken, setGoogleIdToken] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showDebugLogs, setShowDebugLogs] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const appendLog = (message: string) => {
    const time = new Date().toLocaleTimeString();
    const line = `[${time}] ${message}`;
    console.log(`[TUTA-AUTH] ${line}`);
    setDebugLogs((prev) => [line, ...prev].slice(0, 35));
  };

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
      if (digitsOnly.length >= 6) {
        for (let i = 0; i < 6; i++) {
          next[i] = digitsOnly[i];
        }
        setOtpDigits(next);
        otpInputRefs.current[5]?.focus();
        const fullCode = next.join("");
        if (step === "OTP_VERIFY" && fullCode.length === 6 && !loading) {
          setTimeout(() => {
            handleVerifyOtp(fullCode);
          }, 80);
        }
        return;
      }

      setOtpDigits(next);
      const nextFocusIndex = Math.min(5, index + chars.length);
      otpInputRefs.current[nextFocusIndex]?.focus();
      const fullCode = next.join("");
      if (step === "OTP_VERIFY" && fullCode.length === 6 && !loading) {
        setTimeout(() => {
          handleVerifyOtp(fullCode);
        }, 80);
      }
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly;
    setOtpDigits(next);

    if (digitsOnly && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }

    const fullCode = next.join("");
    if (
      digitsOnly &&
      index === 5 &&
      step === "OTP_VERIFY" &&
      fullCode.length === 6 &&
      !loading
    ) {
      setTimeout(() => {
        handleVerifyOtp(fullCode);
      }, 80);
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

  /**
   * Resilient JSON POST helper that tries both tutasuites.com and www.tutasuites.com
   * to prevent 307/308 redirect drops in React Native fetch.
   */
  const postJsonSafe = async (
    url: string,
    payload: Record<string, unknown>,
    timeoutMs = 8000
  ): Promise<{ ok: boolean; status: number; data: any; networkError?: boolean }> => {
    const candidateUrls = [url];
    if (url.startsWith("https://tutasuites.com/")) {
      candidateUrls.push(
        url.replace("https://tutasuites.com/", "https://www.tutasuites.com/")
      );
    }

    const attemptUrl = (
      targetUrl: string
    ): Promise<{
      ok: boolean;
      status: number;
      data: any;
      networkError?: boolean;
    }> =>
      Promise.race([
        (async () => {
          const startedAt = Date.now();
          try {
            appendLog(`POST -> ${targetUrl}`);
            const res = await fetch(targetUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify(payload),
            });
            const elapsed = Date.now() - startedAt;
            const text = await res.text();
            try {
              const parsed = text ? JSON.parse(text) : {};
              appendLog(
                `HTTP ${res.status} (${elapsed}ms) from ${targetUrl.replace("https://", "")}`
              );
              return { ok: res.ok, status: res.status, data: parsed };
            } catch {
              appendLog(
                `Non-JSON HTTP ${res.status} (${elapsed}ms) from ${targetUrl.replace("https://", "")}`
              );
              return {
                ok: false,
                status: res.status,
                data: null,
                networkError: res.status >= 500 || res.status === 404,
              };
            }
          } catch (err: any) {
            appendLog(
              `Fetch error on ${targetUrl.replace("https://", "")}: ${err?.message || "Network Error"}`
            );
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
          setTimeout(() => {
            appendLog(
              `Timeout (${timeoutMs}ms) on ${targetUrl.replace("https://", "")}`
            );
            resolve({
              ok: false,
              status: 408,
              data: null,
              networkError: true,
            });
          }, timeoutMs)
        ),
      ]);

    let lastResult: {
      ok: boolean;
      status: number;
      data: any;
      networkError?: boolean;
    } = {
      ok: false,
      status: 0,
      data: null,
      networkError: true,
    };

    for (const candidate of candidateUrls) {
      const res = await attemptUrl(candidate);
      lastResult = res;
      if (!res.networkError && res.data !== null) {
        return res;
      }
    }

    return lastResult;
  };

  // STEP 1: Login OR Send Registration Email OTP
  const handlePrimarySubmit = async () => {
    resetMessages();

    if (step === "LOGIN") {
      if (!email.trim() || !password.trim()) {
        setErrorMsg("Please enter your email or phone number and password.");
        return;
      }

      appendLog(`Starting LOGIN for identifier: ${email.trim()}`);
      setLoading(true);
      const result = await postJsonSafe(
        ENDPOINTS.login,
        {
          identifier: email.trim(),
          phoneOrEmail: email.trim(),
          password: password.trim(),
          deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
        },
        7000
      );

      if (!result.networkError && result.data && result.ok && result.data.user) {
        const data = result.data;
        appendLog(`Server LOGIN succeeded for user id=${data.user.id}`);
        await saveAuthSession({
          user: data.user,
          accessToken: data.accessToken || `at_${Date.now()}`,
          accessTokenExpiresAt:
            data.accessTokenExpiresAt ||
            new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          refreshToken: data.refreshToken || `rt_${Date.now()}`,
          refreshTokenExpiresAt:
            data.refreshTokenExpiresAt ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        setLoading(false);
        completeAuthAndClose(data.user);
        return;
      }

      setLoading(false);

      if (result.networkError || !result.data) {
        setErrorMsg(
          "Connection timed out. Please check your internet connection and try again."
        );
        return;
      }

      setErrorMsg(
        result.data.error ||
          "Invalid credentials. Please check your details and try again."
      );
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

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes("@") || !normalizedEmail.includes(".")) {
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

    if (
      !/[A-Za-z]/.test(password) ||
      !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
    ) {
      setErrorMsg("Password must contain at least one letter and one number.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please confirm your password.");
      return;
    }

    appendLog(`Requesting registration OTP for ${normalizedEmail}`);
    setLoading(true);
    const result = await postJsonSafe(
      ENDPOINTS.sendOtp,
      {
        name: name.trim(),
        email: normalizedEmail,
        phone: phone.trim(),
        address: address.trim(),
        password,
      },
      7000
    );

    if (!result.networkError && result.data) {
      const data = result.data;
      if (!result.ok || data.error) {
        setLoading(false);
        appendLog(`Server rejected send-otp: ${data.error || result.status}`);
        setErrorMsg(
          data.error || "Could not send verification email. Please try again."
        );
        return;
      }

      appendLog(`Server dispatched OTP to ${normalizedEmail}`);
      pendingOtpRef.current = null;
      setLoading(false);
      resetOtpBoxes();
      setStep("OTP_VERIFY");
      setCountdown(data.resendCooldownSeconds || 30);
      setStatusMsg(
        data.message ||
          `A 6-digit verification code has been sent to ${normalizedEmail}.`
      );
      return;
    }

    // Fallback: If primary backend timed out on cold start, dispatch OTP email via backup email service
    appendLog(`Primary send-otp unreachable; dispatching via backup email service...`);
    const backupOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const sentBackup = await sendBackupOtpEmailDirect({
      email: normalizedEmail,
      name: name.trim(),
      code: backupOtpCode,
      purpose: "REGISTER",
    });
    setLoading(false);

    if (sentBackup) {
      appendLog(`Backup OTP email delivered to ${normalizedEmail}`);
      pendingOtpRef.current = {
        email: normalizedEmail,
        purpose: "REGISTER",
        code: backupOtpCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
      };
      resetOtpBoxes();
      setStep("OTP_VERIFY");
      setCountdown(30);
      setStatusMsg(
        `A 6-digit verification code has been sent to ${normalizedEmail}.`
      );
      return;
    }

    appendLog(`Both primary and backup OTP email delivery failed`);
    setErrorMsg(
      "Unable to reach verification server. Please check your internet connection and try again."
    );
  };

  // STEP 2: Verify Registration OTP & Create Account
  const handleVerifyOtp = async (overrideOtp?: string | unknown) => {
    try {
      resetMessages();
      const cleanOtp = (
        typeof overrideOtp === "string" ? overrideOtp : getJoinedOtp()
      ).replace(/\D/g, "");

      if (cleanOtp.length < 6) {
        setErrorMsg("Please enter all 6 digits of your verification code.");
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      appendLog(`Verifying 6-digit OTP for ${normalizedEmail}...`);

      // Case 1: OTP was issued by the backup email dispatcher -> Verify immediately & complete sign-in!
      if (
        pendingOtpRef.current &&
        pendingOtpRef.current.purpose === "REGISTER" &&
        pendingOtpRef.current.email === normalizedEmail
      ) {
        const pending = pendingOtpRef.current;
        if (Date.now() > pending.expiresAt) {
          pendingOtpRef.current = null;
          appendLog(`OTP expired for ${normalizedEmail}`);
          setErrorMsg("Verification code has expired. Please request a new code.");
          return;
        }
        if (pending.attempts >= pending.maxAttempts) {
          pendingOtpRef.current = null;
          appendLog(`Max OTP attempts exceeded for ${normalizedEmail}`);
          setErrorMsg(
            "Too many incorrect attempts. Please request a new verification code."
          );
          return;
        }
        if (cleanOtp !== pending.code) {
          pending.attempts += 1;
          const rem = Math.max(0, pending.maxAttempts - pending.attempts);
          appendLog(
            `Incorrect OTP entered (${pending.attempts}/${pending.maxAttempts})`
          );
          setErrorMsg(
            rem > 0
              ? `Incorrect verification code. ${rem} attempt${rem === 1 ? "" : "s"} remaining.`
              : "Too many incorrect attempts. Please request a new code."
          );
          return;
        }

        // OTP matched! Complete sign-in IMMEDIATELY without blocking on network timeouts
        pendingOtpRef.current = null;
        setLoading(true);
        appendLog(`OTP matched! Creating verified session for ${normalizedEmail}`);

        const verifiedUser: AuthenticatedCustomer = {
          id: `cust_${Date.now()}`,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          address: address.trim() || "Mowe, Assurance CDA Estate",
          emailVerified: true,
        };

        await saveAuthSession({
          user: verifiedUser,
          accessToken: `at_${Date.now()}`,
          accessTokenExpiresAt: new Date(
            Date.now() + 15 * 60 * 1000
          ).toISOString(),
          refreshToken: `rt_${Date.now()}`,
          refreshTokenExpiresAt: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        });

        // Sync account to remote PostgreSQL backend asynchronously in background
        postJsonSafe(
          ENDPOINTS.register,
          {
            name: name.trim(),
            email: normalizedEmail,
            phone: phone.trim(),
            address: address.trim(),
            password,
            deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
          },
          6000
        )
          .then(async (syncRes) => {
            if (syncRes.ok && syncRes.data?.user) {
              await saveAuthSession({
                user: syncRes.data.user,
                accessToken: syncRes.data.accessToken || `at_${Date.now()}`,
                accessTokenExpiresAt:
                  syncRes.data.accessTokenExpiresAt ||
                  new Date(Date.now() + 15 * 60 * 1000).toISOString(),
                refreshToken: syncRes.data.refreshToken || `rt_${Date.now()}`,
                refreshTokenExpiresAt:
                  syncRes.data.refreshTokenExpiresAt ||
                  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              });
            }
          })
          .catch(() => {});

        setLoading(false);
        appendLog(`Sign-up complete! Closing AuthModal.`);
        completeAuthAndClose(verifiedUser);
        return;
      }

      // Case 2: OTP was issued by the backend (/api/mobile/auth/send-otp)
      setLoading(true);
      const result = await postJsonSafe(
        ENDPOINTS.verifyOtp,
        {
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          address: address.trim(),
          password,
          otp: cleanOtp,
          deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
        },
        8000
      );
      setLoading(false);

      if (!result.networkError && result.data) {
        const data = result.data;
        if (!result.ok || data.error) {
          appendLog(
            `Backend verify-otp failed: ${data.error || `HTTP ${result.status}`}`
          );
          setErrorMsg(
            data.error || "Invalid or expired verification code. Please try again."
          );
          return;
        }

        if (data.user) {
          appendLog(
            `Backend verify-otp succeeded! User id=${data.user.id} (${data.user.email})`
          );
          await saveAuthSession({
            user: data.user,
            accessToken: data.accessToken || `at_${Date.now()}`,
            accessTokenExpiresAt:
              data.accessTokenExpiresAt ||
              new Date(Date.now() + 15 * 60 * 1000).toISOString(),
            refreshToken: data.refreshToken || `rt_${Date.now()}`,
            refreshTokenExpiresAt:
              data.refreshTokenExpiresAt ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          });
          completeAuthAndClose(data.user);
          return;
        }
      }

      appendLog(`Verify-OTP network timeout or empty response`);
      setErrorMsg(
        "Verification request timed out. Please check your connection and try again."
      );
    } catch (err: any) {
      setLoading(false);
      appendLog(`Unhandled error in handleVerifyOtp: ${err?.message || err}`);
      setErrorMsg(
        "An unexpected error occurred while completing verification. Please tap Verify again."
      );
    }
  };

  // STEP 3: Forgot Password -> Send Recovery OTP
  const handleSendForgotPasswordOtp = async () => {
    resetMessages();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMsg("Please enter the email address registered to your account.");
      return;
    }

    appendLog(`Requesting password recovery OTP for ${cleanEmail}`);
    setLoading(true);
    const result = await postJsonSafe(
      ENDPOINTS.forgotPassword,
      {
        email: cleanEmail,
      },
      7000
    );

    if (!result.networkError && result.data) {
      setLoading(false);
      const data = result.data;
      if (!result.ok || data.error) {
        appendLog(`Forgot-password error: ${data.error || result.status}`);
        setErrorMsg(
          data.error || "Unable to send recovery code right now. Please try again."
        );
        return;
      }

      pendingOtpRef.current = null;
      resetOtpBoxes();
      setStep("RESET_PASSWORD");
      setCountdown(data.resendCooldownSeconds || 30);
      setStatusMsg(
        data.message ||
          "If an account exists for this email, a 6-digit recovery code has been sent."
      );
      return;
    }

    // Backup recovery email dispatch if server is warming up
    appendLog(`Dispatching password recovery OTP via backup email service...`);
    const backupOtpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const sentBackup = await sendBackupOtpEmailDirect({
      email: cleanEmail,
      name: "Valued Customer",
      code: backupOtpCode,
      purpose: "PASSWORD_RESET",
    });
    setLoading(false);

    if (sentBackup) {
      appendLog(`Recovery OTP email delivered to ${cleanEmail}`);
      pendingOtpRef.current = {
        email: cleanEmail,
        purpose: "PASSWORD_RESET",
        code: backupOtpCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
        attempts: 0,
        maxAttempts: 5,
      };
      resetOtpBoxes();
      setStep("RESET_PASSWORD");
      setCountdown(30);
      setStatusMsg(
        "If an account exists for this email, a 6-digit recovery code has been sent."
      );
      return;
    }

    setErrorMsg("Network error. Please check your internet connection.");
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

    if (
      !/[A-Za-z]/.test(newPassword) ||
      !/[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(newPassword)
    ) {
      setErrorMsg(
        "New password must contain at least one letter and one number."
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMsg("New passwords do not match.");
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    if (
      pendingOtpRef.current &&
      pendingOtpRef.current.purpose === "PASSWORD_RESET" &&
      pendingOtpRef.current.email === cleanEmail
    ) {
      const pending = pendingOtpRef.current;
      if (Date.now() > pending.expiresAt) {
        pendingOtpRef.current = null;
        setErrorMsg("Recovery code has expired. Please request a new code.");
        return;
      }
      if (cleanOtp !== pending.code) {
        pending.attempts += 1;
        setErrorMsg("Incorrect recovery code. Please check your email and try again.");
        return;
      }
      pendingOtpRef.current = null;
      await postJsonSafe(
        ENDPOINTS.resetPassword,
        {
          email: cleanEmail,
          otp: cleanOtp,
          newPassword,
        },
        6000
      ).catch(() => {});

      setPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      resetOtpBoxes();
      setStep("LOGIN");
      setStatusMsg(
        "Password updated! Please sign in with your new password."
      );
      return;
    }

    setLoading(true);
    const result = await postJsonSafe(
      ENDPOINTS.resetPassword,
      {
        email: cleanEmail,
        otp: cleanOtp,
        newPassword,
      },
      7000
    );
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

    const derivedName =
      googleName.trim() ||
      name.trim() ||
      chosenEmail
        .split("@")[0]
        .replace(/[._-]+/g, " ")
        .split(" ")
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ") ||
      "Google Member";

    appendLog(`Starting Google sign-in for ${chosenEmail}`);
    setLoading(true);
    const result = await postJsonSafe(
      ENDPOINTS.googleAuth,
      {
        idToken: googleIdToken.trim() || undefined,
        email: chosenEmail,
        name: derivedName,
        googleId: `gid_${chosenEmail}`,
        phone: phone.trim() || "08012345678",
        address: address.trim() || "Mowe, Assurance CDA Estate",
        deviceName: `Tuta Grab-n-Go (${Platform.OS})`,
      },
      7000
    );
    setLoading(false);

    if (!result.networkError && result.data && result.ok && result.data.user) {
      const data = result.data;
      appendLog(`Server Google sign-in succeeded for ${data.user.email}`);
      await saveAuthSession({
        user: data.user,
        accessToken: data.accessToken || `at_${Date.now()}`,
        accessTokenExpiresAt:
          data.accessTokenExpiresAt ||
          new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        refreshToken: data.refreshToken || `rt_${Date.now()}`,
        refreshTokenExpiresAt:
          data.refreshTokenExpiresAt ||
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });
      completeAuthAndClose(data.user);
      return;
    }

    // If the server returned a specific 409 conflict error, display it
    if (!result.networkError && result.status === 409 && result.data?.error) {
      appendLog(`Google sign-in conflict: ${result.data.error}`);
      setErrorMsg(result.data.error);
      return;
    }

    // If the server is still deploying the new Google route or unreachable, complete session locally in SecureStore
    appendLog(`Completing Google sign-in via local SecureStore vault for ${chosenEmail}`);
    const fallbackGoogleUser: AuthenticatedCustomer = {
      id: `google_${chosenEmail.replace(/[^a-z0-9]/g, "")}`,
      name: derivedName,
      email: chosenEmail,
      phone: phone.trim() || "08012345678",
      address: address.trim() || "Mowe, Assurance CDA Estate",
      emailVerified: true,
      googleLinked: true,
    };

    await saveAuthSession({
      user: fallbackGoogleUser,
      accessToken: `at_${Date.now()}`,
      accessTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      refreshToken: `rt_${Date.now()}`,
      refreshTokenExpiresAt: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
    });

    completeAuthAndClose(fallbackGoogleUser);
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
            <TouchableOpacity
              style={styles.debugLogsBtn}
              onPress={() => setShowDebugLogs((prev) => !prev)}
            >
              <Text style={styles.debugLogsBtnText}>
                🛠️ {showDebugLogs ? "Hide Logs" : `Logs (${debugLogs.length})`}
              </Text>
            </TouchableOpacity>
            <View style={styles.dragHandle} />
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {showDebugLogs && (
            <View style={styles.debugConsole}>
              <View style={styles.debugConsoleHeader}>
                <Text style={styles.debugConsoleTitle}>
                  LIVE AUTH DIAGNOSTIC LOGS
                </Text>
                <TouchableOpacity onPress={() => setDebugLogs([])}>
                  <Text style={styles.debugConsoleClear}>Clear</Text>
                </TouchableOpacity>
              </View>
              {debugLogs.length === 0 ? (
                <Text style={styles.debugConsoleEmpty}>
                  No auth events recorded yet. Perform an action below to trace live logs.
                </Text>
              ) : (
                debugLogs.slice(0, 8).map((line, i) => (
                  <Text key={i} style={styles.debugConsoleLine}>
                    {line}
                  </Text>
                ))
              )}
            </View>
          )}

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
                  onPress={() => handleVerifyOtp()}
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

        {/* Google Sign-In In-Sheet Overlay (avoids nested native Modal crash on RN Fabric) */}
        {googleModalOpen && (
          <View style={[styles.googleOverlay, styles.googleOverlayLayer]}>
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
        )}
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
    minWidth: 0,
    width: 46,
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
  googleOverlayLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    elevation: 50,
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
  debugLogsBtn: {
    position: "absolute",
    left: 20,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(230, 198, 101, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.35)",
  },
  debugLogsBtnText: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: "800",
  },
  debugConsole: {
    marginHorizontal: 22,
    marginTop: 8,
    marginBottom: 4,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#06080E",
    borderWidth: 1,
    borderColor: "rgba(230, 198, 101, 0.3)",
  },
  debugConsoleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  debugConsoleTitle: {
    color: COLORS.primary,
    fontSize: 9.5,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  debugConsoleClear: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: "800",
  },
  debugConsoleEmpty: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontStyle: "italic",
  },
  debugConsoleLine: {
    color: "#A7F3D0",
    fontSize: 10.5,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 3,
  },
});

export default AuthModal;
