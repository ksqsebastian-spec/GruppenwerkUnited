/**
 * Next.js Middleware — leitet an den Werkbank-Proxy weiter.
 *
 * Der eigentliche Auth-Code liegt in proxy.ts, damit er
 * isoliert testbar ist. Hier wird er als default-Export
 * eingebunden, den Next.js als Middleware erkennt.
 */
export { proxy as default, config } from '@/proxy';
