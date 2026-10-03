/** Where to send someone after signing in. Only same-site paths are allowed, so a crafted link like
 *  /login?next=//evil.com or /login?next=/\evil.com cannot bounce users to another website. */
export function safeNext(next: string | null | undefined) {
  const n = (next ?? "").trim();
  if (!n.startsWith("/") || n.startsWith("//") || n.includes("\\") || /[\u0000-\u001f\u007f]/.test(n)) return "";
  return n;
}
