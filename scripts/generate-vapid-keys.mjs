#!/usr/bin/env node
/**
 * Gera chaves VAPID para Web Push.
 * Uso: node scripts/generate-vapid-keys.mjs
 */
import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nAdicione ao .env.local:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_SUBJECT=mailto:seu-email@example.com`);
console.log(`CRON_SECRET=${crypto.randomUUID()}`);
console.log("\nOpcional (produção Vercel – Upstash Redis gratuito):");
console.log("UPSTASH_REDIS_REST_URL=...");
console.log("UPSTASH_REDIS_REST_TOKEN=...\n");
