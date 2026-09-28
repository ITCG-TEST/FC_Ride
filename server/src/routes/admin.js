import express from "express";
import path from "node:path";
import fs from "node:fs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { readTable, mutateTable, nextBibNumber } from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(__dirname, "..", "..", "uploads", "photos");

const router = express.Router();

router.post("/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid username or password." });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: "12h" });
  res.json({ token });
});

router.get("/stats", requireAdmin, (_req, res) => {
  const stats = { pending: 0, approved: 0, rejected: 0 };
  for (const r of readTable("riders")) {
    if (stats[r.status] !== undefined) stats[r.status] += 1;
  }
  stats.total = stats.pending + stats.approved + stats.rejected;
  stats.flaggedRides = readTable("rides").filter((r) => r.flagged).length;
  res.json(stats);
});

router.get("/riders", requireAdmin, (req, res) => {
  const status = req.query.status;
  const valid = ["pending", "approved", "rejected"];

  let rows = readTable("riders");
  if (valid.includes(status)) rows = rows.filter((r) => r.status === status);
  rows = rows.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json(rows.map(({ photoPath: _photo, ...rest }) => rest));
});

router.get("/riders/:id", requireAdmin, (req, res) => {
  const row = readTable("riders").find((r) => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  const { photoPath: _photo, ...rest } = row;
  res.json(rest);
});

// A rider's ride history, admin view — includes the flagged/flagReason
// review fields that the public /api/riders/:id/rides deliberately omits.
router.get("/riders/:id/rides", requireAdmin, (req, res) => {
  const rider = readTable("riders").find((r) => r.id === req.params.id);
  if (!rider) return res.status(404).json({ error: "Not found." });

  const rows = readTable("rides")
    .filter((r) => r.riderId === req.params.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .map(({ id, distanceKm, durationSeconds, avgSpeedKmh, startedAt, endedAt, flagged, flagReason }) => ({
      id,
      distanceKm,
      durationSeconds,
      avgSpeedKmh,
      startedAt,
      endedAt,
      flagged: !!flagged,
      flagReason,
    }));
  res.json(rows);
});

router.get("/riders/:id/photo", requireAdmin, (req, res) => {
  const row = readTable("riders").find((r) => r.id === req.params.id);
  if (!row || !row.photoPath) return res.status(404).end();

  const filePath = path.join(photosDir, row.photoPath);
  if (!fs.existsSync(filePath)) return res.status(404).end();

  res.sendFile(filePath);
});

router.patch("/riders/:id", requireAdmin, (req, res) => {
  const { status, reviewNote } = req.body || {};
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'approved' or 'rejected'." });
  }

  const found = mutateTable("riders", (rows) => {
    const row = rows.find((r) => r.id === req.params.id);
    if (!row) return false;

    if (status === "approved" && !row.bibNumber) {
      row.bibNumber = nextBibNumber();
    }
    row.status = status;
    row.reviewNote = reviewNote || null;
    row.reviewedAt = new Date().toISOString();
    return true;
  });

  if (!found) return res.status(404).json({ error: "Not found." });
  res.json({ ok: true });
});

// Live map: each approved rider's most recent location ping, so admins can
// see where riders currently are (and how stale that "last seen" is) —
// riders keep queueing pings locally through dead zones and flush them once
// back in range, so this reflects wherever they actually are, even if the
// timestamp lags behind real-time.
router.get("/live", requireAdmin, (_req, res) => {
  const riders = readTable("riders").filter((r) => r.status === "approved");
  const locations = readTable("locations");

  const latestByRider = new Map();
  for (const loc of locations) {
    const current = latestByRider.get(loc.riderId);
    if (!current || new Date(loc.recordedAt) > new Date(current.recordedAt)) {
      latestByRider.set(loc.riderId, loc);
    }
  }

  // Riders who have never sent a ping are still listed (lat/lng/recordedAt
  // null) so admins can see who hasn't started tracking yet, not just who's
  // gone quiet — that's the window to follow up before they're unreachable.
  const rows = riders
    .map((r) => {
      const loc = latestByRider.get(r.id);
      return {
        riderId: r.id,
        name: r.name,
        bibNumber: r.bibNumber,
        mobileNumber: r.mobileNumber,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        recordedAt: loc?.recordedAt ?? null,
      };
    })
    .sort((a, b) => {
      if (!a.recordedAt && !b.recordedAt) return (a.bibNumber ?? 0) - (b.bibNumber ?? 0);
      if (!a.recordedAt) return 1;
      if (!b.recordedAt) return -1;
      return new Date(b.recordedAt) - new Date(a.recordedAt);
    });

  res.json(rows);
});

// Recent breadcrumb trail for one rider — used when an admin taps a marker
// to see where they've been, not just where they are.
router.get("/live/:riderId/trail", requireAdmin, (req, res) => {
  const rider = readTable("riders").find((r) => r.id === req.params.riderId);
  if (!rider) return res.status(404).json({ error: "Not found." });

  const points = readTable("locations")
    .filter((loc) => loc.riderId === req.params.riderId)
    .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt))
    .map((loc) => [loc.lat, loc.lng]);

  res.json({ riderId: rider.id, name: rider.name, points });
});

// Every flagged ride, across all riders, for a single anti-cheat review
// queue instead of having to check each rider one at a time.
router.get("/flagged-rides", requireAdmin, (_req, res) => {
  const riderById = new Map(readTable("riders").map((r) => [r.id, r]));

  const rows = readTable("rides")
    .filter((r) => r.flagged)
    .map((r) => {
      const rider = riderById.get(r.riderId);
      return {
        rideId: r.id,
        riderId: r.riderId,
        riderName: rider?.name ?? "Unknown rider",
        bibNumber: rider?.bibNumber ?? null,
        distanceKm: r.distanceKm,
        avgSpeedKmh: r.avgSpeedKmh,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        flagReason: r.flagReason,
      };
    })
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));

  res.json(rows);
});

export default router;
