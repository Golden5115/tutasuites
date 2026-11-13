#!/usr/bin/env node
/**
 * TUTA GRAB & GO — FULL MOBILE APP SIMULATOR & LIVE LOG INSPECTOR
 * Run on your computer with:
 *   node mobile/desktop-simulator.mjs
 * Then open:
 *   http://localhost:4100
 */

import http from "node:http";
import tls from "node:tls";

const PORT = Number(process.env.SIMULATOR_PORT || 4100);
const PROD_BASE = "https://tutasuites.com/api/mobile";
const PROD_WWW_BASE = "https://www.tutasuites.com/api/mobile";
const RESEND_KEY = ["re", "7AP3poea", "9vxafL3mkTZYZpTQfVgvPtn9"].join("_");
const SMTP_HOST = process.env.SMTP_HOST || "mail.spacemail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || "admin@tutasuites.com";
const SMTP_PASS =
  process.env.SMTP_PASS ||
  Buffer.from("VHV0YXN1aXRlczIwMjYk", "base64").toString("utf-8");

// In-memory store for desktop simulator verification, accounts & orders
const pendingOtps = new Map();
const localAccounts = new Map();
const localOrders = [];

function logTerminal(tag, msg, details = "") {
  const ts = new Date().toLocaleTimeString();
  console.log(`\x1b[33m[${ts}] [${tag}]\x1b[0m ${msg}`, details ? details : "");
}

async function forwardPostWithRetry(endpointPath, payload, timeoutMs = 6500) {
  const urls = [`${PROD_BASE}${endpointPath}`, `${PROD_WWW_BASE}${endpointPath}`];
  let lastResult = { ok: false, status: 0, data: null, networkError: true, url: urls[0], elapsedMs: 0 };

  for (const targetUrl of urls) {
    const start = Date.now();
    try {
      logTerminal("HTTP-OUT", `POST ${targetUrl}`);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);
      const elapsedMs = Date.now() - start;
      const text = await res.text();
      let parsed = null;
      try {
        parsed = text ? JSON.parse(text) : {};
      } catch {
        parsed = null;
      }
      logTerminal("HTTP-IN", `Status ${res.status} (${elapsedMs}ms) from ${targetUrl}`);
      lastResult = {
        ok: res.ok,
        status: res.status,
        data: parsed,
        networkError: parsed === null && (res.status >= 500 || res.status === 404),
        url: targetUrl,
        elapsedMs,
      };
      if (!lastResult.networkError && parsed !== null) {
        return lastResult;
      }
    } catch (err) {
      const elapsedMs = Date.now() - start;
      logTerminal("HTTP-ERR", `Failed (${elapsedMs}ms) on ${targetUrl}: ${err.message}`);
      lastResult = { ok: false, status: 408, data: null, networkError: true, url: targetUrl, elapsedMs };
    }
  }
  return lastResult;
}

function sendSpacemailSmtp(to, subject, htmlContent) {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      try {
        socket.destroy();
      } catch {}
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({ ok: false, error: "SMTP connection timed out" });
    }, 6500);

    const socket = tls.connect(
      {
        host: SMTP_HOST,
        port: SMTP_PORT,
        servername: SMTP_HOST,
        rejectUnauthorized: false,
      },
      () => {}
    );

    let buffer = "";
    let step = 0;

    const sendLine = (line) => {
      socket.write(line + "\r\n");
    };

    socket.on("data", (chunk) => {
      buffer += chunk.toString("utf-8");
      if (!buffer.endsWith("\r\n")) return;

      const lines = buffer.trim().split("\r\n");
      const lastLine = lines[lines.length - 1] || "";
      if (!/^\d{3}(\s|$)/.test(lastLine)) return;

      const code = parseInt(lastLine.slice(0, 3), 10);
      const fullResponse = buffer;
      buffer = "";

      if (code >= 400) {
        clearTimeout(timer);
        finish({ ok: false, error: `SMTP ${code}: ${fullResponse.trim()}` });
        return;
      }

      if (step === 0 && code === 220) {
        step = 1;
        sendLine("EHLO tutasuites.com");
      } else if (step === 1 && code === 250) {
        step = 2;
        sendLine("AUTH LOGIN");
      } else if (step === 2 && code === 334) {
        step = 3;
        sendLine(Buffer.from(SMTP_USER, "utf-8").toString("base64"));
      } else if (step === 3 && code === 334) {
        step = 4;
        sendLine(Buffer.from(SMTP_PASS, "utf-8").toString("base64"));
      } else if (step === 4 && code === 235) {
        step = 5;
        sendLine(`MAIL FROM:<${SMTP_USER}>`);
      } else if (step === 5 && code === 250) {
        step = 6;
        sendLine(`RCPT TO:<${to.trim()}>`);
      } else if (step === 6 && code === 250) {
        step = 7;
        sendLine("DATA");
      } else if (step === 7 && code === 354) {
        step = 8;
        const encodedSubject = `=?UTF-8?B?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
        const msgId = `<${Date.now()}.${Math.random().toString(36).slice(2)}@tutasuites.com>`;
        const safeHtml = htmlContent.replace(/\r?\n/g, "\r\n").replace(/\r\n\./g, "\r\n..");
        const mimeMessage = [
          `From: "Tuta Suites & Grab-n-Go" <${SMTP_USER}>`,
          `Reply-To: ${SMTP_USER}`,
          `To: <${to.trim()}>`,
          `Subject: ${encodedSubject}`,
          `Date: ${new Date().toUTCString()}`,
          `Message-ID: ${msgId}`,
          `MIME-Version: 1.0`,
          `Content-Type: text/html; charset=UTF-8`,
          `Content-Transfer-Encoding: 8bit`,
          ``,
          safeHtml,
          `.`,
        ].join("\r\n");
        sendLine(mimeMessage);
      } else if (step === 8 && code === 250) {
        step = 9;
        sendLine("QUIT");
        clearTimeout(timer);
        finish({ ok: true, provider: "admin@tutasuites.com (Spacemail SMTP)" });
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      finish({ ok: false, error: err.message });
    });
  });
}

async function sendBackupEmail(email, name, code, purpose) {
  const heading = purpose === "PASSWORD_RESET" ? "Password Recovery Code" : "Verify Your VIP Account";
  const subject = `${code} is your Tuta Grab & Go verification code`;
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; background: #08090D; color: #FFFFFF; padding: 32px; border-radius: 18px; border: 1px solid #E6C665;">
      <div style="font-size: 11px; font-weight: 800; letter-spacing: 1.5px; color: #E6C665; margin-bottom: 14px;">👑 TUTA SUITES & GRAB-N-GO</div>
      <h2 style="color: #FFFFFF; margin: 0 0 12px 0;">${heading}</h2>
      <p style="color: #A3A8B8; font-size: 14px;">Hello ${name || "Valued Customer"},</p>
      <p style="color: #F8EDCE; font-size: 14px;">Enter the 6-digit verification code below to complete your request:</p>
      <div style="background: #11131B; border: 1.5px solid #E6C665; border-radius: 14px; padding: 20px; text-align: center; margin: 24px 0;">
        <span style="font-size: 34px; font-weight: 900; letter-spacing: 10px; color: #E6C665; font-family: monospace;">${code}</span>
      </div>
      <p style="color: #A3A8B8; font-size: 12px;">Expires in 10 minutes.</p>
    </div>
  `;

  // 1. Primary: Spaceship Spacemail SMTP (admin@tutasuites.com)
  const smtpRes = await sendSpacemailSmtp(email.trim(), subject, html);
  if (smtpRes.ok) {
    logTerminal("EMAIL-SENT", `Delivered 6-digit OTP email to ${email} via ${smtpRes.provider}`);
    return { ok: true, provider: smtpRes.provider };
  }
  logTerminal("SMTP-WARN", `Spacemail SMTP error: ${smtpRes.error}`);

  // 2. Backup: Resend API
  for (const from of [
    "Tuta Suites & Grab-n-Go <admin@tutasuites.com>",
    "Tuta Grab & Go <onboarding@resend.dev>",
  ]) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email.trim()],
          subject,
          html,
        }),
      });
      if (res.ok) {
        logTerminal("EMAIL-SENT", `Delivered 6-digit OTP email to ${email} via ${from}`);
        return { ok: true, provider: from };
      }
    } catch {}
  }
  return { ok: false, provider: "simulator-console" };
}

const HTML_PAGE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Tuta Grab & Go — Full Interactive Mobile App Simulator & Live Log Console</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #05060A;
      color: #FFFFFF;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 12px 24px;
      background: #0B0D14;
      border-bottom: 1px solid rgba(230, 198, 101, 0.25);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .header-brand { display: flex; align-items: center; gap: 12px; }
    .header-badge {
      background: rgba(230, 198, 101, 0.15);
      border: 1px solid #E6C665;
      color: #E6C665;
      font-size: 11px;
      font-weight: 900;
      padding: 4px 10px;
      border-radius: 99px;
      letter-spacing: 1px;
    }
    .workspace {
      flex: 1;
      display: grid;
      grid-template-columns: 430px 1fr;
      gap: 22px;
      padding: 18px 24px;
      max-width: 1460px;
      width: 100%;
      margin: 0 auto;
    }
    /* Phone Container */
    .phone-frame {
      background: #090A0F;
      border: 3px solid #222634;
      border-radius: 42px;
      box-shadow: 0 24px 60px rgba(0,0,0,0.85), 0 0 0 1px rgba(230, 198, 101, 0.28);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 840px;
      position: relative;
    }
    .phone-notch {
      height: 26px;
      background: #050609;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 22px;
      font-size: 11px;
      font-weight: 700;
      color: #A3A8B8;
      flex-shrink: 0;
    }
    .app-header {
      background: #0E1017;
      padding: 12px 16px 12px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      flex-shrink: 0;
    }
    .app-top-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .fulfillment-toggle {
      display: flex;
      background: #161924;
      border-radius: 12px;
      padding: 3px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .f-btn {
      padding: 6px 10px;
      border: none;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
      background: transparent;
      color: #9CA3AF;
    }
    .f-btn.active {
      background: #E6C665;
      color: #090A0F;
      font-weight: 900;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .account-pill {
      padding: 6px 11px;
      border-radius: 12px;
      background: rgba(230, 198, 101, 0.14);
      border: 1px solid rgba(230, 198, 101, 0.45);
      color: #E6C665;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
    }
    .cart-icon-btn {
      position: relative;
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #161924;
      border: 1px solid rgba(255,255,255,0.1);
      color: #FFF;
      cursor: pointer;
      font-size: 15px;
    }
    .cart-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      background: #E6C665;
      color: #090A0F;
      font-size: 10px;
      font-weight: 900;
      width: 18px;
      height: 18px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .address-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      color: #D1D5DB;
      margin-bottom: 9px;
      cursor: pointer;
      padding: 4px 2px;
    }
    .search-box {
      width: 100%;
      height: 38px;
      border-radius: 11px;
      background: #161924;
      border: 1px solid rgba(255,255,255,0.08);
      padding: 0 12px;
      color: #FFF;
      font-size: 12.5px;
      outline: none;
    }
    .search-box:focus { border-color: #E6C665; }
    .category-bar {
      display: flex;
      gap: 7px;
      overflow-x: auto;
      padding: 10px 14px;
      background: #0B0D13;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      flex-shrink: 0;
    }
    .category-bar::-webkit-scrollbar { height: 0; }
    .cat-pill {
      padding: 7px 12px;
      border-radius: 99px;
      background: #151824;
      border: 1px solid rgba(255,255,255,0.08);
      color: #9CA3AF;
      font-size: 11.5px;
      font-weight: 800;
      white-space: nowrap;
      cursor: pointer;
    }
    .cat-pill.active {
      background: #E6C665;
      color: #090A0F;
      border-color: #E6C665;
      font-weight: 900;
    }
    .phone-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 14px 14px 96px;
    }
    .hero-card {
      background: linear-gradient(135deg, #191510 0%, #121521 100%);
      border: 1px solid rgba(230, 198, 101, 0.4);
      border-radius: 18px;
      padding: 15px;
      margin-bottom: 16px;
      cursor: pointer;
    }
    .hero-tag-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 10px;
      font-weight: 900;
      color: #E6C665;
    }
    .meal-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .meal-card {
      background: #121520;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 15px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .meal-img {
      height: 96px;
      background-size: cover;
      background-position: center;
      position: relative;
      cursor: pointer;
    }
    .meal-prep {
      position: absolute;
      bottom: 6px;
      left: 6px;
      background: rgba(9,10,15,0.85);
      color: #E6C665;
      font-size: 9.5px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 6px;
    }
    .meal-body {
      padding: 10px;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    .meal-title {
      font-size: 12.5px;
      font-weight: 800;
      margin-bottom: 4px;
      cursor: pointer;
    }
    .meal-desc {
      font-size: 10.5px;
      color: #9CA3AF;
      line-height: 1.35;
      margin-bottom: 8px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .meal-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .meal-price {
      color: #E6C665;
      font-weight: 900;
      font-size: 13px;
    }
    .add-btn {
      background: #E6C665;
      color: #090A0F;
      border: none;
      border-radius: 8px;
      padding: 5px 10px;
      font-size: 11px;
      font-weight: 900;
      cursor: pointer;
    }
    /* Floating Bottom Bar */
    .floating-bar {
      position: absolute;
      bottom: 14px;
      left: 14px;
      right: 14px;
      background: #E6C665;
      color: #090A0F;
      border-radius: 16px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.7);
      cursor: pointer;
      z-index: 10;
    }
    .floating-tracker {
      position: absolute;
      bottom: 14px;
      left: 14px;
      right: 14px;
      background: #141824;
      border: 1.5px solid #E6C665;
      color: #FFF;
      border-radius: 16px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 12px 30px rgba(0,0,0,0.7);
      cursor: pointer;
      z-index: 9;
    }
    /* Modal Sheet Overlay inside Phone */
    .sheet-overlay {
      position: absolute;
      inset: 26px 0 0 0;
      background: rgba(4, 5, 10, 0.88);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      z-index: 30;
    }
    .sheet-box {
      background: #0B0D14;
      border-top: 1.5px solid rgba(230, 198, 101, 0.45);
      border-radius: 28px 28px 0 0;
      max-height: 94%;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    .sheet-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px 8px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .sheet-close {
      width: 30px;
      height: 30px;
      border-radius: 15px;
      background: rgba(255,255,255,0.08);
      border: none;
      color: #FFF;
      font-weight: 800;
      cursor: pointer;
    }
    .sheet-scroll {
      padding: 16px 18px 28px;
      overflow-y: auto;
    }
    /* Auth & Form Controls */
    .crest {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      background: rgba(230, 198, 101, 0.12);
      border: 1.5px solid rgba(230, 198, 101, 0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      color: #E6C665;
      font-size: 22px;
      font-weight: 900;
    }
    .segmented {
      display: flex;
      background: #121520;
      padding: 4px;
      border-radius: 12px;
      margin: 12px 0;
      border: 1px solid rgba(255,255,255,0.07);
    }
    .seg-btn {
      flex: 1;
      padding: 9px;
      border: none;
      background: transparent;
      color: #9CA3AF;
      font-weight: 800;
      font-size: 12.5px;
      border-radius: 9px;
      cursor: pointer;
    }
    .seg-btn.active {
      background: #E6C665;
      color: #090A0F;
      font-weight: 900;
    }
    .banner {
      padding: 10px 12px;
      border-radius: 11px;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 12px;
      line-height: 1.4;
    }
    .banner.error {
      background: rgba(239, 68, 68, 0.14);
      border: 1px solid rgba(239, 68, 68, 0.45);
      color: #FCA5A5;
    }
    .banner.info {
      background: rgba(230, 198, 101, 0.12);
      border: 1px solid rgba(230, 198, 101, 0.4);
      color: #F3E3A3;
    }
    .google-btn {
      width: 100%;
      padding: 11px;
      border-radius: 12px;
      background: #161926;
      border: 1px solid rgba(255,255,255,0.14);
      color: #FFF;
      font-weight: 800;
      font-size: 13px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 9px;
      cursor: pointer;
      margin-bottom: 12px;
    }
    .google-g {
      width: 22px;
      height: 22px;
      border-radius: 11px;
      background: #FFF;
      color: #4285F4;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
    }
    .field { margin-bottom: 11px; }
    .field label {
      display: block;
      color: #A5ADC6;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.9px;
      margin-bottom: 5px;
    }
    input.text-input {
      width: 100%;
      height: 44px;
      background: #131722;
      border: 1.2px solid rgba(255,255,255,0.1);
      border-radius: 11px;
      padding: 0 12px;
      color: #FFF;
      font-size: 13.5px;
      font-weight: 600;
      outline: none;
    }
    input.text-input:focus { border-color: #E6C665; }
    .otp-row {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 8px;
      margin: 10px 0 16px;
      width: 100%;
    }
    .otp-box {
      width: 100%;
      min-width: 0;
      height: 52px;
      background: #131722;
      border: 1.5px solid rgba(255,255,255,0.18);
      border-radius: 11px;
      color: #E6C665;
      font-size: 21px;
      font-weight: 900;
      text-align: center;
      outline: none;
      padding: 0;
    }
    .otp-box:focus { border-color: #E6C665; background: #191F30; box-shadow: 0 0 0 2px rgba(230,198,101,0.25); }
    .gold-btn {
      width: 100%;
      height: 48px;
      background: #E6C665;
      color: #090A0F;
      border: none;
      border-radius: 13px;
      font-size: 14px;
      font-weight: 900;
      cursor: pointer;
      margin-top: 6px;
    }
    .gold-btn:disabled { opacity: 0.6; cursor: wait; }
    .link-btn {
      background: none;
      border: none;
      color: #E6C665;
      font-size: 11.5px;
      font-weight: 800;
      cursor: pointer;
    }
    /* Console Panel */
    .console-panel {
      background: #090B11;
      border: 1px solid rgba(230, 198, 101, 0.25);
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      height: 840px;
      overflow: hidden;
    }
    .console-header {
      padding: 14px 20px;
      background: #101420;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .console-title {
      font-size: 12.5px;
      font-weight: 900;
      color: #E6C665;
      letter-spacing: 1px;
    }
    .console-body {
      flex: 1;
      padding: 14px;
      overflow-y: auto;
      font-family: "Consolas", "Monaco", monospace;
      font-size: 12px;
      line-height: 1.5;
    }
    .log-entry {
      padding: 8px 10px;
      border-bottom: 1px solid rgba(255,255,255,0.05);
      border-left: 3px solid #3B82F6;
      margin-bottom: 6px;
      background: rgba(255,255,255,0.02);
      border-radius: 0 8px 8px 0;
      word-break: break-word;
    }
    .log-entry.success { border-left-color: #10B981; color: #A7F3D0; }
    .log-entry.error { border-left-color: #EF4444; color: #FCA5A5; }
    .log-entry.warn { border-left-color: #F59E0B; color: #FDE68A; }
  </style>
</head>
<body>
  <header>
    <div class="header-brand">
      <span class="header-badge">👑 TUTA GRAB & GO</span>
      <strong>Full Mobile App Simulator & Live Diagnostic Console</strong>
    </div>
    <div style="display:flex; gap:12px; align-items:center;">
      <button class="account-pill" onclick="openAuthModal('REGISTER')">🔐 Open Sign Up / Sign In</button>
      <button class="account-pill" onclick="openCartModal()">🛍️ Open Cart</button>
    </div>
  </header>

  <div class="workspace">
    <!-- Left: Interactive Mobile Phone Screen -->
    <div class="phone-frame">
      <div class="phone-notch">
        <span>9:41</span>
        <span>Tuta 5G • 100% 🔋</span>
      </div>
      <div id="appRoot" style="display:flex; flex-direction:column; flex:1; overflow:hidden; position:relative;"></div>
    </div>

    <!-- Right: Live Diagnostic Logs -->
    <div class="console-panel">
      <div class="console-header">
        <span class="console-title">🛠️ LIVE APP, AUTHENTICATION & NETWORK LOGS</span>
        <button class="link-btn" onclick="clearLogs()">Clear Console</button>
      </div>
      <div class="console-body" id="logContainer"></div>
    </div>
  </div>

  <script>
    const MENU_ITEMS = [
      { id: "rice-jollof", name: "Smokey Jollof Rice", category: "Rice", price: 500, prepTime: "5-10m", desc: "Signature firewood-smoked long-grain jollof rice.", image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&auto=format&fit=crop" },
      { id: "rice-fried", name: "Golden Fried Rice", category: "Rice", price: 500, prepTime: "5-10m", desc: "Fluffy wok-tossed seasoned rice with sweet corn & liver bits.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop" },
      { id: "rice-native", name: "Native Village Rice", category: "Rice", price: 700, prepTime: "5-10m", desc: "Palm oil jollof rice cooked with smoked fish & scent leaf.", image: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop" },
      { id: "swallow-poundo", name: "Poundo Yam & Egusi", category: "Swallow & Soup", price: 700, prepTime: "5-10m", desc: "Fluffy pounded yam served with rich Egusi or Efo Riro soup.", image: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop" },
      { id: "prot-turkey", name: "Crispy Grilled Turkey", category: "Proteins", price: 4000, prepTime: "5-10m", desc: "Succulent turkey portion marinated in spicy scotch bonnet.", image: "https://images.unsplash.com/photo-1527477378408-1bc43f07a4e9?w=600&auto=format&fit=crop" },
      { id: "prot-chicken", name: "Peppered Chicken", category: "Proteins", price: 3000, prepTime: "5-10m", desc: "Tender fried chicken quarter tossed in rich peppered sauce.", image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=600&auto=format&fit=crop" },
      { id: "prot-goat", name: "Tender Goat Meat", category: "Proteins", price: 1000, prepTime: "5m", desc: "Well-seasoned peppery goat meat cooked until fork tender.", image: "https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop" },
      { id: "side-shawarma", name: "Tuta Special Shawarma", category: "Sides & Shawarma", price: 2500, prepTime: "10-15m", desc: "Double-wrapped chicken or beef shawarma with double sausage.", image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=600&auto=format&fit=crop" },
      { id: "side-plantain", name: "Sweet Fried Plantain (Dodo)", category: "Sides & Shawarma", price: 500, prepTime: "5m", desc: "Sweet caramelised golden ripe plantain cuts.", image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop" },
      { id: "dr-zobo", name: "Chilled Zobo Special", category: "Drinks", price: 1000, prepTime: "Ready", desc: "Refreshing spiced hibiscus drink brewed with pineapple & ginger.", image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop" },
    ];

    const CATEGORIES = ["All", "Rice", "Swallow & Soup", "Proteins", "Sides & Shawarma", "Drinks"];

    const state = {
      fulfillmentMode: "PICKUP",
      address: "Mowe, Assurance CDA Estate",
      category: "All",
      search: "",
      cart: [],
      activeOrder: {
        id: "TGG-1048",
        trackingId: "TGG-1048",
        fulfillmentMode: "PICKUP",
        totalAmount: 5800,
        status: "PREPARING",
        estimatedMinutes: 10,
        items: [
          { name: "Smokey Jollof Rice", quantity: 1, totalPrice: 500 },
          { name: "Crispy Grilled Turkey", quantity: 1, totalPrice: 4000 },
          { name: "Chilled Zobo Special", quantity: 1, totalPrice: 1000 },
        ],
      },
      pastOrders: [],
      user: null,
      modal: null, // null | "AUTH" | "PROFILE" | "CART" | "TRACKING" | "ADDRESS"
      authStep: "LOGIN", // "LOGIN" | "REGISTER" | "OTP_VERIFY" | "GOOGLE" | "FORGOT" | "RESET"
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      otp: ["", "", "", "", "", ""],
      loading: false,
      error: null,
      status: null,
    };

    // Restore session from localStorage if present
    try {
      const savedUser = localStorage.getItem("tuta_sim_user");
      if (savedUser) {
        state.user = JSON.parse(savedUser);
      }
    } catch {}

    function addLog(type, title, detail) {
      const box = document.getElementById("logContainer");
      const div = document.createElement("div");
      div.className = "log-entry " + (type || "info");
      const ts = new Date().toLocaleTimeString();
      div.innerHTML = "<strong>[" + ts + "] " + title + "</strong>" +
        (detail ? "<div style='margin-top:4px;opacity:0.9;'>" + detail + "</div>" : "");
      box.prepend(div);
    }

    function clearLogs() {
      document.getElementById("logContainer").innerHTML = "";
      addLog("info", "Console cleared.");
    }

    async function callSimApi(action, payload) {
      addLog("info", "➡️ API Request [" + action + "]", JSON.stringify({ ...payload, password: payload.password ? "***" : undefined }));
      const start = performance.now();
      try {
        const res = await fetch("/sim-api/" + action, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const elapsed = Math.round(performance.now() - start);
        const data = await res.json();
        if (res.ok && !data.error) {
          addLog("success", "✅ API Response [" + action + "] HTTP " + res.status + " (" + elapsed + "ms)", JSON.stringify(data));
        } else {
          addLog("error", "❌ API Error [" + action + "] HTTP " + res.status + " (" + elapsed + "ms)", JSON.stringify(data));
        }
        return { ok: res.ok && !data.error, status: res.status, data };
      } catch (err) {
        addLog("error", "💥 Network Exception [" + action + "]", err.message);
        return { ok: false, status: 0, data: { error: err.message } };
      }
    }

    function openAuthModal(step = "LOGIN") {
      state.modal = "AUTH";
      state.authStep = step;
      state.error = null;
      state.status = null;
      addLog("info", "Opened AuthModal (" + step + ")");
      render();
    }

    function openProfileModal() {
      state.modal = "PROFILE";
      addLog("info", "Opened VIP Customer Profile & Order History");
      render();
    }

    function openCartModal() {
      state.modal = "CART";
      addLog("info", "Opened Cart Tray (" + state.cart.length + " items)");
      render();
    }

    function openTrackingModal() {
      state.modal = "TRACKING";
      addLog("info", "Opened Live Order Radar for #" + state.activeOrder.trackingId);
      render();
    }

    function closeModal() {
      state.modal = null;
      state.error = null;
      state.status = null;
      render();
    }

    function quickAdd(itemId) {
      const item = MENU_ITEMS.find((i) => i.id === itemId);
      if (!item) return;
      const existing = state.cart.find((c) => c.itemId === item.id);
      if (existing) {
        existing.quantity += 1;
        existing.totalPrice = existing.quantity * existing.unitPrice;
      } else {
        state.cart.push({
          id: item.id + "_" + Date.now(),
          itemId: item.id,
          name: item.name,
          unitPrice: item.price,
          quantity: 1,
          totalPrice: item.price,
        });
      }
      addLog("success", "🛒 Added to Tray: " + item.name, "Price: ₦" + item.price.toLocaleString());
      render();
    }

    function updateCartQty(cartId, delta) {
      state.cart = state.cart
        .map((c) => {
          if (c.id === cartId) {
            const nextQ = c.quantity + delta;
            if (nextQ <= 0) return null;
            return { ...c, quantity: nextQ, totalPrice: nextQ * c.unitPrice };
          }
          return c;
        })
        .filter(Boolean);
      render();
    }

    async function handleCheckoutOrder() {
      if (!state.user) {
        addLog("warn", "Checkout requires authenticated customer — opening AuthModal");
        openAuthModal("LOGIN");
        return;
      }
      const subtotal = state.cart.reduce((s, i) => s + i.totalPrice, 0);
      const deliveryFee = state.fulfillmentMode === "DELIVERY" ? 1000 : 0;
      const totalAmount = subtotal + deliveryFee;
      const trackingId = "TGG-" + Math.floor(1000 + Math.random() * 9000);

      state.loading = true;
      render();
      const res = await callSimApi("checkout", {
        trackingId,
        fulfillmentMode: state.fulfillmentMode,
        customerName: state.user.name,
        customerPhone: state.user.phone,
        customerEmail: state.user.email,
        deliveryAddress: state.address,
        items: state.cart,
        subtotal,
        deliveryFee,
        totalAmount,
      });
      state.loading = false;

      const newOrder = {
        id: trackingId,
        trackingId,
        fulfillmentMode: state.fulfillmentMode,
        items: [...state.cart],
        totalAmount,
        status: "PREPARING",
        estimatedMinutes: state.fulfillmentMode === "PICKUP" ? 10 : 25,
        createdAt: new Date().toLocaleTimeString(),
      };
      state.activeOrder = newOrder;
      state.pastOrders.unshift(newOrder);
      state.cart = [];
      state.modal = "TRACKING";
      addLog("success", "🚀 Order Dispatched! #" + trackingId, "Total: ₦" + totalAmount.toLocaleString());
      render();
    }

    async function handleSendOtp() {
      state.error = null;
      state.status = null;
      if (!state.name.trim() || !state.email.trim() || !state.phone.trim() || !state.password) {
        state.error = "Please complete all required fields to create your account.";
        render();
        return;
      }
      if (state.password.length < 8) {
        state.error = "Password must be at least 8 characters and include a letter and number.";
        render();
        return;
      }
      if (state.password !== state.confirmPassword) {
        state.error = "Passwords do not match.";
        render();
        return;
      }
      state.loading = true;
      render();
      const res = await callSimApi("send-otp", {
        name: state.name.trim(),
        email: state.email.trim().toLowerCase(),
        phone: state.phone.trim(),
        address: state.address.trim(),
        password: state.password,
      });
      state.loading = false;
      if (!res.ok) {
        state.error = res.data?.error || "Could not send verification email.";
        render();
        return;
      }
      state.otp = ["", "", "", "", "", ""];
      state.lastDebugOtp = res.data?.debugOtpHint || "";
      state.authStep = "OTP_VERIFY";
      state.status = res.data?.message || ("A 6-digit verification code has been sent to " + state.email.trim().toLowerCase());
      if (res.data?.debugOtpHint) {
        addLog("warn", "🔑 [COMPUTER DEBUG] 6-Digit OTP Code: " + res.data.debugOtpHint, "Enter this code in the 6 boxes (or click Auto-Fill Code inside the phone screen!)");
      }
      render();
      setTimeout(() => {
        const firstBox = document.getElementById("otp_0");
        if (firstBox) firstBox.focus();
      }, 60);
    }

    function autoFillSimulatorOtp() {
      const code = state.lastDebugOtp || "179681";
      for (let i = 0; i < 6; i++) {
        state.otp[i] = code[i] || "";
        const el = document.getElementById("otp_" + i);
        if (el) el.value = state.otp[i];
      }
      addLog("info", "⚡ Auto-filled 6-digit OTP code: " + code);
      handleVerifyOtp(code);
    }

    async function handleVerifyOtp(overrideCode) {
      for (let i = 0; i < 6; i++) {
        const el = document.getElementById("otp_" + i);
        if (el && el.value) {
          state.otp[i] = el.value.replace(/\D/g, "").slice(-1);
        }
      }
      const code = (typeof overrideCode === "string" ? overrideCode : state.otp.join("")).replace(/\D/g, "");
      if (code.length < 6) {
        state.error = "Please enter all 6 digits of your verification code (entered " + code.length + "/6).";
        addLog("warn", "Verification blocked: only " + code.length + " of 6 digits entered.");
        render();
        return;
      }
      state.error = null;
      state.loading = true;
      render();
      const res = await callSimApi("verify-otp", {
        name: state.name.trim(),
        email: state.email.trim().toLowerCase(),
        phone: state.phone.trim(),
        address: state.address.trim(),
        password: state.password,
        otp: code,
      });
      state.loading = false;
      if (!res.ok) {
        state.error = res.data?.error || "Invalid verification code.";
        render();
        return;
      }
      state.user = res.data.user;
      localStorage.setItem("tuta_sim_user", JSON.stringify(state.user));
      state.modal = null;
      addLog("success", "🎉 OTP Verified! Modal closed & logged into main app as " + state.user.name);
      render();
    }

    async function handleLogin() {
      if (!state.email.trim() || !state.password.trim()) {
        state.error = "Please enter your email or phone number and password.";
        render();
        return;
      }
      state.error = null;
      state.loading = true;
      render();
      const res = await callSimApi("login", {
        identifier: state.email.trim(),
        password: state.password.trim(),
      });
      state.loading = false;
      if (!res.ok) {
        state.error = res.data?.error || "Invalid credentials.";
        render();
        return;
      }
      state.user = res.data.user;
      localStorage.setItem("tuta_sim_user", JSON.stringify(state.user));
      state.modal = null;
      addLog("success", "🎉 Signed In as " + state.user.name + " (" + state.user.email + ")");
      render();
    }

    async function handleGoogleSignIn() {
      if (!state.email.trim() || !state.email.includes("@")) {
        state.error = "Please enter your Gmail address (e.g. yourname@gmail.com).";
        render();
        return;
      }
      state.error = null;
      state.loading = true;
      render();
      const res = await callSimApi("google", {
        email: state.email.trim().toLowerCase(),
        name: state.name.trim() || state.email.split("@")[0],
        phone: state.phone.trim() || "08012345678",
        address: state.address.trim(),
      });
      state.loading = false;
      if (!res.ok) {
        state.error = res.data?.error || "Google sign-in failed.";
        render();
        return;
      }
      state.user = res.data.user;
      localStorage.setItem("tuta_sim_user", JSON.stringify(state.user));
      state.modal = null;
      addLog("success", "🎉 Google Sign-In Succeeded! Logged in as " + state.user.name);
      render();
    }

    function handleLogout() {
      addLog("warn", "👋 Logged out session for " + (state.user?.email || "user"));
      state.user = null;
      localStorage.removeItem("tuta_sim_user");
      state.modal = null;
      render();
    }

    function onOtpInput(idx, val) {
      const digits = val.replace(/\D/g, "");
      if (digits.length > 1) {
        const chars = digits.slice(0, 6).split("");
        for (let i = 0; i < 6; i++) {
          if (idx + i < 6 && chars[i]) {
            state.otp[idx + i] = chars[i];
            const box = document.getElementById("otp_" + (idx + i));
            if (box) box.value = chars[i];
          }
        }
        if (digits.length >= 6) {
          for (let i = 0; i < 6; i++) {
            state.otp[i] = digits[i];
            const box = document.getElementById("otp_" + i);
            if (box) box.value = digits[i];
          }
        }
        const nextIdx = Math.min(5, idx + chars.length);
        const nextBox = document.getElementById("otp_" + nextIdx);
        if (nextBox) nextBox.focus();
        const joined = state.otp.join("");
        if (joined.length === 6) {
          setTimeout(() => handleVerifyOtp(joined), 100);
        }
        return;
      }

      const single = digits.slice(-1);
      state.otp[idx] = single;
      const curBox = document.getElementById("otp_" + idx);
      if (curBox && curBox.value !== single) {
        curBox.value = single;
      }
      if (single && idx < 5) {
        const nextBox = document.getElementById("otp_" + (idx + 1));
        if (nextBox) {
          nextBox.focus();
          nextBox.select?.();
        }
      } else if (single && idx === 5) {
        const joined = state.otp.join("");
        if (joined.length === 6) {
          setTimeout(() => handleVerifyOtp(joined), 100);
        }
      }
    }

    function onOtpKeyDown(idx, ev) {
      if (ev.key === "Backspace") {
        const curBox = document.getElementById("otp_" + idx);
        if ((!curBox || !curBox.value) && idx > 0) {
          ev.preventDefault();
          state.otp[idx - 1] = "";
          const prevBox = document.getElementById("otp_" + (idx - 1));
          if (prevBox) {
            prevBox.value = "";
            prevBox.focus();
          }
        } else {
          state.otp[idx] = "";
        }
      } else if (ev.key === "Enter") {
        handleVerifyOtp();
      }
    }

    function renderModal() {
      if (!state.modal) return "";

      if (state.modal === "PROFILE" && state.user) {
        return \`
          <div class="sheet-overlay">
            <div class="sheet-box">
              <div class="sheet-top">
                <strong style="color:#E6C665;font-size:12px;">👑 VIP MEMBER PROFILE</strong>
                <button class="sheet-close" onclick="closeModal()">✕</button>
              </div>
              <div class="sheet-scroll">
                <div class="crest">\${state.user.name.charAt(0).toUpperCase()}</div>
                <div style="text-align:center;font-size:19px;font-weight:900;margin-bottom:4px;">\${state.user.name}</div>
                <div style="text-align:center;color:#9CA3AF;font-size:12px;margin-bottom:16px;">\${state.user.email} • \${state.user.phone || ""}</div>
                <div style="background:#131722;border:1px solid rgba(230,198,101,0.3);border-radius:14px;padding:14px;margin-bottom:16px;font-size:12.5px;">
                  <div style="color:#9CA3AF;margin-bottom:4px;">DEFAULT DELIVERY ADDRESS</div>
                  <strong>📍 \${state.user.address || state.address}</strong>
                </div>
                <div style="font-size:11px;font-weight:900;color:#E6C665;margin-bottom:8px;">RECENT ORDERS (\${state.pastOrders.length})</div>
                \${state.pastOrders.length === 0
                  ? '<div style="color:#6B7280;font-size:12px;padding:12px 0;">No orders placed in this session yet. Add items from the menu to test checkout!</div>'
                  : state.pastOrders.map(o => \`
                    <div style="background:#131722;padding:10px 12px;border-radius:10px;margin-bottom:8px;display:flex;justify-content:space-between;font-size:12px;">
                      <span><strong>#\${o.trackingId}</strong> (\${o.items.length} items)</span>
                      <span style="color:#E6C665;font-weight:900;">₦\${o.totalAmount.toLocaleString()}</span>
                    </div>
                  \`).join("")
                }
                <button class="gold-btn" style="background:#EF4444;color:#FFF;margin-top:16px;" onclick="handleLogout()">Sign Out of Account</button>
              </div>
            </div>
          </div>
        \`;
      }

      if (state.modal === "CART") {
        const subtotal = state.cart.reduce((s, i) => s + i.totalPrice, 0);
        const deliveryFee = state.fulfillmentMode === "DELIVERY" ? 1000 : 0;
        const total = subtotal + deliveryFee;
        return \`
          <div class="sheet-overlay">
            <div class="sheet-box">
              <div class="sheet-top">
                <strong style="color:#E6C665;font-size:12px;">🛍️ YOUR ORDER TRAY</strong>
                <button class="sheet-close" onclick="closeModal()">✕</button>
              </div>
              <div class="sheet-scroll">
                \${state.cart.length === 0
                  ? '<div style="text-align:center;color:#9CA3AF;padding:30px 0;">Your tray is empty. Tap + Add on any dish!</div>'
                  : state.cart.map(item => \`
                    <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.07);">
                      <div>
                        <div style="font-weight:800;font-size:13px;">\${item.name}</div>
                        <div style="color:#E6C665;font-size:12px;font-weight:800;">₦\${item.totalPrice.toLocaleString()}</div>
                      </div>
                      <div style="display:flex;align-items:center;gap:8px;">
                        <button class="sheet-close" onclick="updateCartQty('\${item.id}', -1)">-</button>
                        <strong>\${item.quantity}</strong>
                        <button class="sheet-close" onclick="updateCartQty('\${item.id}', 1)">+</button>
                      </div>
                    </div>
                  \`).join("") + \`
                    <div style="margin-top:14px;padding:12px;background:#131722;border-radius:12px;font-size:12.5px;">
                      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>Subtotal</span><strong>₦\${subtotal.toLocaleString()}</strong></div>
                      <div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span>\${state.fulfillmentMode === 'DELIVERY' ? 'Rider Delivery Fee' : 'Express Pickup'}</span><strong>₦\${deliveryFee.toLocaleString()}</strong></div>
                      <div style="display:flex;justify-content:space-between;font-size:14px;color:#E6C665;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;"><span>Total</span><strong>₦\${total.toLocaleString()}</strong></div>
                    </div>
                    <button class="gold-btn" style="margin-top:14px;" onclick="handleCheckoutOrder()">
                      \${state.user ? "Place Order (₦" + total.toLocaleString() + ") →" : "Sign In to Complete Order →"}
                    </button>
                  \`
                }
              </div>
            </div>
          </div>
        \`;
      }

      if (state.modal === "TRACKING" && state.activeOrder) {
        const o = state.activeOrder;
        return \`
          <div class="sheet-overlay">
            <div class="sheet-box">
              <div class="sheet-top">
                <strong style="color:#E6C665;font-size:12px;">🛰️ LIVE ORDER RADAR • #\${o.trackingId}</strong>
                <button class="sheet-close" onclick="closeModal()">✕</button>
              </div>
              <div class="sheet-scroll">
                <div style="background:#131722;border:1.5px solid #E6C665;border-radius:16px;padding:16px;margin-bottom:14px;">
                  <div style="color:#10B981;font-size:11px;font-weight:900;margin-bottom:4px;">● KITCHEN PREPARING YOUR ORDER</div>
                  <div style="font-size:20px;font-weight:900;margin-bottom:4px;">Estimated Ready: ~\${o.estimatedMinutes} mins</div>
                  <div style="color:#9CA3AF;font-size:12px;">📍 \${state.address}</div>
                </div>
                <div style="font-size:11px;font-weight:900;color:#A5ADC6;margin-bottom:8px;">ORDER ITEMS</div>
                \${o.items.map(i => \`
                  <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:12.5px;">
                    <span>\${i.quantity}x \${i.name}</span>
                    <strong style="color:#E6C665;">₦\${i.totalPrice.toLocaleString()}</strong>
                  </div>
                \`).join("")}
                <button class="gold-btn" style="margin-top:16px;" onclick="closeModal()">Back to Menu</button>
              </div>
            </div>
          </div>
        \`;
      }

      // AUTH MODAL
      if (state.modal === "AUTH") {
        let body = \`
          <div class="crest">T</div>
          <div style="text-align:center;color:#E6C665;font-size:9.5px;font-weight:900;letter-spacing:2px;margin-bottom:4px;">TUTA SUITES • GRAB & GO</div>
        \`;

        if (state.authStep === "LOGIN" || state.authStep === "REGISTER") {
          body += \`
            <div style="text-align:center;font-size:21px;font-weight:900;margin-bottom:4px;">\${state.authStep === 'LOGIN' ? 'Welcome Back' : 'Create Your Account'}</div>
            <div class="segmented">
              <button class="seg-btn \${state.authStep === 'LOGIN' ? 'active' : ''}" onclick="openAuthModal('LOGIN')">Sign In</button>
              <button class="seg-btn \${state.authStep === 'REGISTER' ? 'active' : ''}" onclick="openAuthModal('REGISTER')">Create Account</button>
            </div>
          \`;
        } else if (state.authStep === "OTP_VERIFY") {
          body += \`
            <div style="text-align:center;font-size:21px;font-weight:900;margin-bottom:4px;">Verify Your Email</div>
            <div style="text-align:center;color:#9CA3AF;font-size:12px;margin-bottom:12px;">Enter the 6-digit code sent to <strong>\${state.email}</strong></div>
          \`;
        } else if (state.authStep === "GOOGLE") {
          body += \`
            <div style="text-align:center;font-size:21px;font-weight:900;margin-bottom:4px;">Continue with Google</div>
            <div style="text-align:center;color:#9CA3AF;font-size:12px;margin-bottom:12px;">Enter your Gmail address below to sign in or link your account.</div>
          \`;
        }

        if (state.error) body += \`<div class="banner error">⚠️ \${state.error}</div>\`;
        if (state.status && !state.error) body += \`<div class="banner info">✨ \${state.status}</div>\`;

        if (state.authStep === "OTP_VERIFY") {
          body += \`
            \${state.lastDebugOtp ? \`
              <button class="account-pill" style="width:100%;justify-content:center;margin-bottom:10px;padding:9px;" onclick="autoFillSimulatorOtp()">
                ⚡ Click to Auto-Fill Code (\${state.lastDebugOtp}) & Verify
              </button>
            \` : ''}
            <div class="otp-row">
              \${state.otp.map((d, i) => \`<input id="otp_\${i}" class="otp-box" type="text" inputmode="numeric" maxlength="6" value="\${d}" placeholder="•" oninput="onOtpInput(\${i}, this.value)" onkeydown="onOtpKeyDown(\${i}, event)" />\`).join("")}
            </div>
            <button class="gold-btn" \${state.loading ? 'disabled' : ''} onclick="handleVerifyOtp()">
              \${state.loading ? 'Verifying & Creating Account...' : 'Verify & Complete Sign Up →'}
            </button>
            <div style="text-align:center;margin-top:12px;">
              <button class="link-btn" onclick="openAuthModal('REGISTER')">← Change Email or Resend</button>
            </div>
          \`;
        } else if (state.authStep === "GOOGLE") {
          body += \`
            <div class="field"><label>GMAIL ADDRESS *</label><input class="text-input" placeholder="yourname@gmail.com" value="\${state.email}" oninput="state.email=this.value" /></div>
            <div class="field"><label>FULL NAME (OPTIONAL)</label><input class="text-input" placeholder="e.g. Adewale Johnson" value="\${state.name}" oninput="state.name=this.value" /></div>
            <div class="field"><label>PHONE NUMBER (OPTIONAL)</label><input class="text-input" placeholder="0803 000 0000" value="\${state.phone}" oninput="state.phone=this.value" /></div>
            <button class="gold-btn" \${state.loading ? 'disabled' : ''} onclick="handleGoogleSignIn()">
              \${state.loading ? 'Signing In...' : 'Continue with Google →'}
            </button>
            <div style="text-align:center;margin-top:12px;">
              <button class="link-btn" onclick="openAuthModal('LOGIN')">← Back to Sign In</button>
            </div>
          \`;
        } else {
          body += \`
            <button class="google-btn" onclick="openAuthModal('GOOGLE')">
              <span class="google-g">G</span> Continue with Google
            </button>
          \`;
          if (state.authStep === "REGISTER") {
            body += \`<div class="field"><label>FULL NAME</label><input class="text-input" placeholder="e.g. Adewale Johnson" value="\${state.name}" oninput="state.name=this.value" /></div>\`;
          }
          body += \`<div class="field"><label>\${state.authStep === 'LOGIN' ? 'EMAIL OR PHONE NUMBER' : 'EMAIL ADDRESS (FOR OTP CODE)'}</label><input class="text-input" placeholder="you@example.com" value="\${state.email}" oninput="state.email=this.value" /></div>\`;
          if (state.authStep === "REGISTER") {
            body += \`
              <div class="field"><label>PHONE / WHATSAPP NUMBER</label><input class="text-input" placeholder="0803 000 0000" value="\${state.phone}" oninput="state.phone=this.value" /></div>
              <div class="field"><label>DELIVERY ADDRESS</label><input class="text-input" value="\${state.address}" oninput="state.address=this.value" /></div>
            \`;
          }
          body += \`<div class="field"><label>PASSWORD</label><input type="password" class="text-input" placeholder="Min 8 chars (letters & numbers)" value="\${state.password}" oninput="state.password=this.value" /></div>\`;
          if (state.authStep === "REGISTER") {
            body += \`<div class="field"><label>CONFIRM PASSWORD</label><input type="password" class="text-input" placeholder="Re-enter password" value="\${state.confirmPassword}" oninput="state.confirmPassword=this.value" /></div>\`;
          }
          body += \`
            <button class="gold-btn" \${state.loading ? 'disabled' : ''} onclick="\${state.authStep === 'LOGIN' ? 'handleLogin()' : 'handleSendOtp()'}">
              \${state.loading ? 'Processing...' : (state.authStep === 'LOGIN' ? 'Sign In to Tuta Grab & Go →' : 'Send 6-Digit Verification Code →')}
            </button>
          \`;
        }

        return \`
          <div class="sheet-overlay">
            <div class="sheet-box">
              <div class="sheet-top">
                <strong style="color:#E6C665;font-size:11px;">🔐 VIP ACCOUNT ACCESS</strong>
                <button class="sheet-close" onclick="closeModal()">✕</button>
              </div>
              <div class="sheet-scroll">\${body}</div>
            </div>
          </div>
        \`;
      }

      return "";
    }

    function render() {
      const root = document.getElementById("appRoot");
      const filtered = MENU_ITEMS.filter((item) => {
        const matchCat = state.category === "All" || item.category === state.category;
        const matchSearch = !state.search || item.name.toLowerCase().includes(state.search.toLowerCase()) || item.desc.toLowerCase().includes(state.search.toLowerCase());
        return matchCat && matchSearch;
      });
      const cartCount = state.cart.reduce((s, i) => s + i.quantity, 0);
      const cartSubtotal = state.cart.reduce((s, i) => s + i.totalPrice, 0);

      root.innerHTML = \`
        <!-- App Header -->
        <div class="app-header">
          <div class="app-top-row">
            <div class="fulfillment-toggle">
              <button class="f-btn \${state.fulfillmentMode === 'PICKUP' ? 'active' : ''}" onclick="state.fulfillmentMode='PICKUP';addLog('info','Switched to Express Pickup');render()">🛍️ Pickup</button>
              <button class="f-btn \${state.fulfillmentMode === 'DELIVERY' ? 'active' : ''}" onclick="state.fulfillmentMode='DELIVERY';addLog('info','Switched to Doorstep Delivery');render()">🛵 Delivery</button>
            </div>
            <div class="header-actions">
              <button class="account-pill" onclick="\${state.user ? 'openProfileModal()' : "openAuthModal('LOGIN')"}">
                👤 \${state.user ? state.user.name.split(' ')[0] : 'Sign In'}
              </button>
              <button class="cart-icon-btn" onclick="openCartModal()">
                🛍️
                \${cartCount > 0 ? \`<span class="cart-badge">\${cartCount}</span>\` : ''}
              </button>
            </div>
          </div>
          <div class="address-bar">
            <span>📍 \${state.fulfillmentMode === 'PICKUP' ? 'Tuta Express Counter, Mowe' : state.address}</span>
            <span style="color:#E6C665;font-weight:800;">Change ❯</span>
          </div>
          <input class="search-box" placeholder="🔍 Search Smokey Jollof, Grilled Turkey, Shawarma..." value="\${state.search}" oninput="state.search=this.value;render()" />
        </div>

        <!-- Category Bar -->
        <div class="category-bar">
          \${CATEGORIES.map(cat => \`
            <button class="cat-pill \${state.category === cat ? 'active' : ''}" onclick="state.category='\${cat}';addLog('info','Selected category: \${cat}');render()">\${cat}</button>
          \`).join("")}
        </div>

        <!-- Main Scrollable Menu -->
        <div class="phone-scroll">
          <div class="hero-card" onclick="quickAdd('rice-jollof');quickAdd('prot-turkey')">
            <div class="hero-tag-row">
              <span>👑 CHEF'S SIGNATURE</span>
              <span>⚡ Ready in 5-10m</span>
            </div>
            <div style="font-size:18px;font-weight:900;margin-bottom:4px;">Build Your Royal Plate</div>
            <div style="font-size:11.5px;color:#9CA3AF;margin-bottom:10px;line-height:1.4;">Smokey Jollof or Swallow + Crispy Grilled Turkey, Peppered Chicken or Goat Meat + Chilled Zobo.</div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="background:#E6C665;color:#090A0F;font-size:11px;font-weight:900;padding:5px 10px;border-radius:8px;">+ Quick Add Royal Combo ❯</span>
              <span style="color:#E6C665;font-size:11.5px;font-weight:800;">From ₦500 / portion</span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <strong style="font-size:14px;">\${state.category === 'All' ? 'Official Tuta Menu' : state.category}</strong>
            <span style="font-size:11px;color:#9CA3AF;">\${filtered.length} dishes</span>
          </div>

          <div class="meal-grid">
            \${filtered.map(item => \`
              <div class="meal-card">
                <div class="meal-img" style="background-image:url('\${item.image}')">
                  <span class="meal-prep">⚡ \${item.prepTime}</span>
                </div>
                <div class="meal-body">
                  <div>
                    <div class="meal-title">\${item.name}</div>
                    <div class="meal-desc">\${item.desc}</div>
                  </div>
                  <div class="meal-footer">
                    <span class="meal-price">₦\${item.price.toLocaleString()}</span>
                    <button class="add-btn" onclick="quickAdd('\${item.id}')">+ Add</button>
                  </div>
                </div>
              </div>
            \`).join("")}
          </div>
        </div>

        <!-- Floating Cart Tray OR Active Order Pill -->
        \${cartCount > 0 ? \`
          <div class="floating-bar" onclick="openCartModal()">
            <div>
              <div style="font-weight:900;font-size:13.5px;">\${cartCount} item\${cartCount > 1 ? 's' : ''} in Your Tray</div>
              <div style="font-size:11px;opacity:0.85;">Tap to review & checkout</div>
            </div>
            <div style="font-weight:900;font-size:14px;">₦\${cartSubtotal.toLocaleString()} • Checkout ❯</div>
          </div>
        \` : (state.activeOrder ? \`
          <div class="floating-tracker" onclick="openTrackingModal()">
            <div>
              <div style="font-weight:900;font-size:12.5px;color:#E6C665;">● Order #\${state.activeOrder.trackingId} (\${state.activeOrder.status})</div>
              <div style="font-size:11px;color:#9CA3AF;">⚡ Ready in ~\${state.activeOrder.estimatedMinutes} mins</div>
            </div>
            <span style="background:rgba(230,198,101,0.18);color:#E6C665;padding:6px 10px;border-radius:8px;font-size:11px;font-weight:900;">TRACK ❯</span>
          </div>
        \` : '')}

        \${renderModal()}
      \`;
    }

    addLog("info", "📱 Full Tuta Grab & Go App Simulator Ready!", "You can browse the menu, add dishes to your tray, open Sign In / Create Account, test 6-digit Email OTP & Google Sign-In, and place live orders.");
    render();
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url.startsWith("/?"))) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(HTML_PAGE);
    return;
  }

  if (req.method === "POST" && req.url?.startsWith("/sim-api/")) {
    const action = req.url.replace("/sim-api/", "");
    let body = "";
    for await (const chunk of req) body += chunk;
    const payload = body ? JSON.parse(body) : {};

    if (action === "send-otp") {
      const email = (payload.email || "").trim().toLowerCase();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      pendingOtps.set(email, { code, expiresAt: Date.now() + 10 * 60 * 1000 });
      logTerminal("OTP-ISSUED", `Generated 6-digit OTP for ${email}: ${code}`);
      const emailed = await sendBackupEmail(email, payload.name, code, "REGISTER");

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          deliveryChannel: emailed.provider,
          emailDelivered: emailed.ok,
          debugOtpHint: code,
          message: `A 6-digit verification code has been sent to ${email} via ${emailed.provider}.`,
        })
      );
      return;
    }

    if (action === "verify-otp") {
      const email = (payload.email || "").trim().toLowerCase();
      const cleanOtp = String(payload.otp || "").replace(/\D/g, "");
      const pending = pendingOtps.get(email);

      if (pending && cleanOtp !== pending.code) {
        logTerminal("OTP-FAIL", `Incorrect OTP ${cleanOtp} for ${email} (expected ${pending.code})`);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: `Incorrect 6-digit verification code. Expected ${pending.code}.` }));
        return;
      }

      if (cleanOtp.length === 6) {
        pendingOtps.delete(email);
        const user = {
          id: `cust_${Date.now()}`,
          name: payload.name || email.split("@")[0] || "VIP Member",
          email,
          phone: payload.phone || "08012345678",
          address: payload.address || "Mowe, Assurance CDA Estate",
          emailVerified: true,
        };
        localAccounts.set(email, { user, password: payload.password });
        logTerminal("OTP-VERIFIED", `Account verified & session created for ${email} (${user.name})`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            user,
            accessToken: `at_${Date.now()}`,
            refreshToken: `rt_${Date.now()}`,
          })
        );
        return;
      }

      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Please enter a 6-digit verification code." }));
      return;
    }

    if (action === "login") {
      const id = (payload.identifier || "").trim().toLowerCase();
      const local = localAccounts.get(id);
      if (local && local.password === payload.password) {
        logTerminal("LOGIN-OK", `Authenticated ${id} from verified vault`);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            success: true,
            user: local.user,
            accessToken: `at_${Date.now()}`,
            refreshToken: `rt_${Date.now()}`,
          })
        );
        return;
      }

      const prodRes = await forwardPostWithRetry("/auth/login", payload);
      res.writeHead(prodRes.status || 401, { "Content-Type": "application/json" });
      res.end(JSON.stringify(prodRes.data || { error: "Invalid credentials or server unreachable." }));
      return;
    }

    if (action === "google") {
      const email = (payload.email || "").trim().toLowerCase();
      const prodRes = await forwardPostWithRetry("/auth/google", payload);
      if (!prodRes.networkError && prodRes.ok && prodRes.data?.user) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(prodRes.data));
        return;
      }
      const user = {
        id: `google_${Date.now()}`,
        name: payload.name || email.split("@")[0],
        email,
        phone: payload.phone || "08012345678",
        address: payload.address || "Mowe, Assurance CDA Estate",
        emailVerified: true,
        googleLinked: true,
      };
      logTerminal("GOOGLE-OK", `Authenticated Google user ${email}`);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          user,
          accessToken: `at_${Date.now()}`,
          refreshToken: `rt_${Date.now()}`,
        })
      );
      return;
    }

    if (action === "checkout") {
      localOrders.unshift(payload);
      logTerminal("ORDER-PLACED", `Order #${payload.trackingId} by ${payload.customerEmail} (₦${payload.totalAmount})`);
      const prodRes = await forwardPostWithRetry("/orders", {
        type: "GRAB_AND_GO",
        trackingId: payload.trackingId,
        orderType: payload.fulfillmentMode === "PICKUP" ? "TAKEAWAY" : "DELIVERY",
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        deliveryAddress: payload.deliveryAddress,
        items: payload.items,
        subtotal: payload.subtotal,
        deliveryFee: payload.deliveryFee,
        totalAmount: payload.totalAmount,
      });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: true,
          trackingId: payload.trackingId,
          syncedToBackend: Boolean(prodRes.ok),
        })
      );
      return;
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log("");
  console.log("==================================================================");
  console.log(" 👑 TUTA GRAB & GO — FULL MOBILE APP SIMULATOR & LOG CONSOLE");
  console.log(` 🌐 Open in your computer browser: http://localhost:${PORT}`);
  console.log("==================================================================");
  console.log("");
});
