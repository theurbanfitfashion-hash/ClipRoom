const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ITEMS = 100;
const MAX_TEXT_LENGTH = 100000;
const rooms = new Map();

app.disable("x-powered-by");
app.use(express.json({ limit: "120kb" }));
app.use(express.static(path.join(__dirname, "public")));

function cleanExpiredRooms() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.updatedAt > ROOM_TTL_MS) rooms.delete(code);
  }
}
setInterval(cleanExpiredRooms, 10 * 60 * 1000).unref();

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from(crypto.randomBytes(6), b => alphabet[b % alphabet.length]).join("");
  } while (rooms.has(code));
  return code;
}
function getRoom(req, res) {
  const code = String(req.params.code || "").toUpperCase();
  const room = rooms.get(code);
  if (!room) {
    res.status(404).json({ error: "Room not found. It may have expired." });
    return null;
  }
  room.updatedAt = Date.now();
  return room;
}

app.get("/api/health", (_req, res) => res.json({ ok: true, app: "ClipRoom" }));
app.post("/api/rooms", (_req, res) => {
  cleanExpiredRooms();
  const code = makeCode();
  rooms.set(code, { code, items: [], createdAt: Date.now(), updatedAt: Date.now() });
  res.status(201).json({ code, expiresInHours: 12 });
});
app.get("/api/rooms/:code", (req, res) => {
  const room = getRoom(req, res);
  if (room) res.json({ code: room.code, items: room.items, expiresAt: room.updatedAt + ROOM_TTL_MS });
});
app.post("/api/rooms/:code/items", (req, res) => {
  const room = getRoom(req, res);
  if (!room) return;
  const text = req.body && req.body.text;
  const title = req.body && req.body.title;
  if (typeof text !== "string" || !text.trim()) return res.status(400).json({ error: "Enter some text or code first." });
  if (text.length > MAX_TEXT_LENGTH) return res.status(413).json({ error: "Maximum item size is 100,000 characters." });
  const item = { id: crypto.randomUUID(), title: typeof title === "string" ? title.trim().slice(0, 80) : "", text, createdAt: Date.now() };
  room.items.unshift(item);
  room.items = room.items.slice(0, MAX_ITEMS);
  room.updatedAt = Date.now();
  res.status(201).json({ item });
});
app.delete("/api/rooms/:code/items/:id", (req, res) => {
  const room = getRoom(req, res);
  if (!room) return;
  const before = room.items.length;
  room.items = room.items.filter(item => item.id !== req.params.id);
  room.updatedAt = Date.now();
  res.json({ deleted: room.items.length !== before });
});
app.delete("/api/rooms/:code", (req, res) => {
  const code = String(req.params.code || "").toUpperCase();
  if (!rooms.has(code)) return res.status(404).json({ error: "Room not found." });
  rooms.delete(code);
  res.json({ deleted: true });
});
app.get("*", (_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));
app.listen(PORT, "0.0.0.0", () => console.log(`ClipRoom listening on port ${PORT}`));
