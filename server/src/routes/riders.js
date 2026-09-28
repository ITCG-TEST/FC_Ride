import express from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { readTable, mutateTable } from "../db.js";
import { rateLimit } from "../middleware/rateLimit.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const photosDir = path.join(__dirname, "..", "..", "uploads", "photos");
fs.mkdirSync(photosDir, { recursive: true });

const PHOTO_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);
const BLOOD_GROUPS = new Set(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]);
const TSHIRT_SIZES = new Set(["XS", "S", "M", "L", "XL", "XXL", "XXXL"]);
const MOBILE_RE = /^[0-9]{10}$/;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, photosDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!PHOTO_MIME.has(file.mimetype)) {
      return cb(new Error("Profile photo must be a JPG, PNG, or WEBP image."));
    }
    cb(null, true);
  },
});

const router = express.Router();

function validateRiderInput(body) {
  const errors = [];
  const required = [
    ["name", "Name"],
    ["mobileNumber", "Mobile number"],
    ["emergencyMobileNumber", "Emergency mobile number"],
    ["address", "Address"],
    ["city", "City"],
    ["bloodGroup", "Blood group"],
    ["tshirtSize", "T-shirt size"],
    ["birthDate", "Birth date"],
  ];

  for (const [key, label] of required) {
    if (!body[key] || String(body[key]).trim() === "") {
      errors.push(`${label} is required.`);
    }
  }

  if (body.mobileNumber && !MOBILE_RE.test(body.mobileNumber)) {
    errors.push("Mobile number must be exactly 10 digits.");
  }
  if (body.emergencyMobileNumber && !MOBILE_RE.test(body.emergencyMobileNumber)) {
    errors.push("Emergency mobile number must be exactly 10 digits.");
  }
  if (body.bloodGroup && !BLOOD_GROUPS.has(body.bloodGroup)) {
    errors.push("Blood group is not valid.");
  }
  if (body.tshirtSize && !TSHIRT_SIZES.has(body.tshirtSize)) {
    errors.push("T-shirt size is not valid.");
  }
  if (body.birthDate) {
    const dob = new Date(body.birthDate);
    if (Number.isNaN(dob.getTime()) || dob > new Date()) {
      errors.push("Birth date is not valid.");
    }
  }

  return errors;
}

// Public: submit a new rider registration.
router.post("/", upload.single("profilePhoto"), (req, res) => {
  const photoFile = req.file;
  const cleanup = () => {
    if (photoFile) fs.unlink(photoFile.path, () => {});
  };

  const errors = validateRiderInput(req.body);
  if (!photoFile) errors.push("Profile photo is required.");
  if (errors.length) {
    cleanup();
    return res.status(400).json({ error: errors.join(" ") });
  }

  const id = crypto.randomUUID();
  const {
    name,
    mobileNumber,
    emergencyMobileNumber,
    address,
    city,
    bloodGroup,
    tshirtSize,
    birthDate,
  } = req.body;

  mutateTable("riders", (rows) => {
    rows.push({
      id,
      name: name.trim(),
      mobileNumber,
      emergencyMobileNumber,
      address: address.trim(),
      city: city.trim(),
      bloodGroup,
      tshirtSize,
      birthDate,
      photoPath: photoFile.filename,
      status: "pending",
      bibNumber: null,
      reviewNote: null,
      createdAt: new Date().toISOString(),
      reviewedAt: null,
    });
  });

  res.status(201).json({ id, status: "pending" });
});

const lookupLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 8 });

// Public: recover your own tracking link by mobile number, if you lost it.
router.post("/lookup", lookupLimiter, (req, res) => {
  const { mobileNumber } = req.body || {};
  if (!mobileNumber || !MOBILE_RE.test(mobileNumber)) {
    return res.status(400).json({ error: "Enter a valid 10-digit mobile number." });
  }

  const matches = readTable("riders")
    .filter((r) => r.mobileNumber === mobileNumber)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (matches.length === 0) {
    return res.status(404).json({ error: "No registration found for that mobile number." });
  }
  res.json({ id: matches[0].id, name: matches[0].name });
});

// Public: the approved-rider board, ranked by total practice distance. Only
// non-sensitive fields are exposed.
router.get("/board", (_req, res) => {
  const riders = readTable("riders").filter((r) => r.status === "approved");
  const rides = readTable("rides");

  const rows = riders.map((r) => {
    const mine = rides.filter((rd) => rd.riderId === r.id);
    const totalKm = mine.reduce((sum, rd) => sum + rd.distanceKm, 0);
    const totalSeconds = mine.reduce((sum, rd) => sum + rd.durationSeconds, 0);
    const avgSpeedKmh = totalSeconds > 0 ? totalKm / (totalSeconds / 3600) : 0;
    return {
      id: r.id,
      bibNumber: r.bibNumber,
      name: r.name,
      bloodGroup: r.bloodGroup,
      tshirtSize: r.tshirtSize,
      city: r.city,
      totalKm,
      avgSpeedKmh,
    };
  });

  rows.sort((a, b) => b.totalKm - a.totalKm || (a.bibNumber ?? 0) - (b.bibNumber ?? 0));
  res.json(rows);
});

// Public: a rider's profile photo — only served once their registration is approved.
router.get("/:id/photo", (req, res) => {
  const row = readTable("riders").find((r) => r.id === req.params.id);
  if (!row || row.status !== "approved" || !row.photoPath) {
    return res.status(404).end();
  }
  res.sendFile(path.join(photosDir, row.photoPath));
});

// Public: check status of a submission by id (so a rider can follow up on their own request).
router.get("/:id/status", (req, res) => {
  const row = readTable("riders").find((r) => r.id === req.params.id);
  if (!row) return res.status(404).json({ error: "Not found." });
  res.json({ name: row.name, status: row.status, reviewNote: row.reviewNote, bibNumber: row.bibNumber });
});

// Public: a rider's own practice ride history (route path omitted — fetch /api/rides/:id for that).
router.get("/:id/rides", (req, res) => {
  const rider = readTable("riders").find((r) => r.id === req.params.id);
  if (!rider) return res.status(404).json({ error: "Not found." });

  const rows = readTable("rides")
    .filter((r) => r.riderId === req.params.id)
    .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))
    .map(({ id, distanceKm, durationSeconds, avgSpeedKmh, startedAt, endedAt }) => ({
      id,
      distanceKm,
      durationSeconds,
      avgSpeedKmh,
      startedAt,
      endedAt,
    }));
  res.json(rows);
});

export default router;
