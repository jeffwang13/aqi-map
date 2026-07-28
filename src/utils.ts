export function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}
