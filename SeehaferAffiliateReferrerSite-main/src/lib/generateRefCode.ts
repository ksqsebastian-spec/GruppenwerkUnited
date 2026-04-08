export function generateRefCode(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `#SEE-${year}-${rand}`;
}
