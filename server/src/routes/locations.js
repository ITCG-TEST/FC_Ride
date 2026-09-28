import express from "express";
import crypto from "node:crypto";
import { readTable, mutateTable } from "../db.js";

const router = express.Router();
const RETENTION_MS = 48 * 60 * 60 * 1000; // keep 48h of breadcrumb history
const MAX_POINTS_PER_REQUEST = 500;

function isFiniteNumber(n) {
  return typeof n === "number" && Number.isFinite(n);
}

function isValidPoint(p) {
  return (
    p &&
    isFiniteNumber(p.lat) &&
    isFiniteNumber(p.lng) &&
    p.lat >= -90 &&
    p.lat <= 90 &&
    p.lng >= -180 &&
    p.lng <= 180 &&
    !Number.isNaN(new Date(p.recordedAt).getTime())
  );
}

// Rider devices call this every ~20s while a ride is active, and again with
// whatever queued up locally once connectivity returns after a dead zone —
// so a single request can carry many backlogged points at once.
router.post("/", (req, res) => {
  const { riderId, points } = req.body || {};

  const rider = readTable("riders").find((r) => r.id === riderId);
  if (!rider) return res.status(404).json({ error: "Rider not found." });

  if (!Array.isArray(points) || points.length === 0) {
    return res.status(400).json({ error: "At least one location point is required." });
  }
  if (points.length > MAX_POINTS_PER_REQUEST) {
    return res.status(400).json({ error: `No more than ${MAX_POINTS_PER_REQUEST} points per request.` });
  }
  if (!points.every(isValidPoint)) {
    return res.status(400).json({ error: "One or more location points are invalid." });
  }

  const now = Date.now();
  mutateTable("locations", (rows) => {
    // Prune old breadcrumbs opportunistically so this file doesn't grow forever.
    const cutoff = now - RETENTION_MS;
    let i = rows.length;
    while (i--) {
      if (new Date(rows[i].recordedAt).getTime() < cutoff) rows.splice(i, 1);
    }
    for (const p of points) {
      rows.push({
        id: crypto.randomUUID(),
        riderId,
        lat: p.lat,
        lng: p.lng,
        recordedAt: p.recordedAt,
        receivedAt: new Date(now).toISOString(),
      });
    }
  });

  res.status(201).json({ ok: true, count: points.length });
});

export default router;
