export function getNYDateStr() {
  const d = new Date();
  const ny = new Date(d.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const year = ny.getFullYear();
  const month = String(ny.getMonth() + 1).padStart(2, "0");
  const day = String(ny.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMsUntilNYMidnight() {
  const now = new Date();
  const nyNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nyMidnight = new Date(nyNow);
  nyMidnight.setHours(23, 59, 0, 0);
  return Math.max(0, nyMidnight - nyNow);
}

export function getMsUntilNYNoon() {
  const now = new Date();
  const nyNow = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const nyNoon = new Date(nyNow);
  nyNoon.setHours(12, 0, 0, 0);
  if (nyNow >= nyNoon) return 0;
  return nyNoon - nyNow;
}

export function isAfterNYNoon() {
  const nyNow = new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
  return nyNow.getHours() >= 12;
}

export function formatNYDate(dateStr) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "short", month: "short", day: "numeric",
  });
}
