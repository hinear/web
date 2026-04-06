import webpush from "web-push";

const VAPID_SUBJECT = "mailto:notifications@hinear.local";

let didInitialize = false;
let isConfigured = false;

function getVapidKeys() {
  const publicKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
    process.env.NOTIFICATION_PUBLIC_KEY ??
    "";
  const privateKey = process.env.VAPID_PRIVATE_KEY ?? "";

  return { privateKey, publicKey };
}

export function getWebPushConfig() {
  const { privateKey, publicKey } = getVapidKeys();

  return {
    privateKey,
    publicKey,
    subject: VAPID_SUBJECT,
  };
}

export function ensureWebPushConfigured() {
  if (didInitialize) {
    return isConfigured;
  }

  didInitialize = true;

  const { privateKey, publicKey, subject } = getWebPushConfig();

  if (!publicKey || !privateKey) {
    return false;
  }

  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    isConfigured = true;
  } catch (error) {
    console.error("[Notification] Invalid web push configuration:", error);
    isConfigured = false;
  }

  return isConfigured;
}
