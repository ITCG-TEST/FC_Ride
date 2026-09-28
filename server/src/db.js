import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Papa from "papaparse";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDir, { recursive: true });

const FILES = {
  riders: path.join(dataDir, "riders.csv"),
  rides: path.join(dataDir, "rides.csv"),
  counters: path.join(dataDir, "counters.csv"),
  locations: path.join(dataDir, "locations.csv"),
};

const COLUMNS = {
  riders: [
    "id", "name", "mobileNumber", "emergencyMobileNumber", "address", "city",
    "bloodGroup", "tshirtSize", "birthDate", "photoPath", "status", "bibNumber",
    "reviewNote", "createdAt", "reviewedAt",
  ],
  rides: [
    "id", "riderId", "distanceKm", "durationSeconds", "avgSpeedKmh",
    "startedAt", "endedAt", "path", "createdAt", "flagged", "flagReason",
  ],
  counters: ["name", "value"],
  locations: ["id", "riderId", "lat", "lng", "recordedAt", "receivedAt"],
};

const NUMERIC_FIELDS = {
  riders: new Set(["bibNumber"]),
  rides: new Set(["distanceKm", "durationSeconds", "avgSpeedKmh", "flagged"]),
  counters: new Set(["value"]),
  locations: new Set(["lat", "lng"]),
};

function ensureFile(table) {
  const file = FILES[table];
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, Papa.unparse({ fields: COLUMNS[table], data: [] }), "utf8");
  }
}

function readAll(table) {
  ensureFile(table);
  const raw = fs.readFileSync(FILES[table], "utf8");
  const { data } = Papa.parse(raw, { header: true, skipEmptyLines: true });
  const numeric = NUMERIC_FIELDS[table] || new Set();
  const idColumn = COLUMNS[table][0];

  return data
    // Guard against any stray trailing-newline artifact being parsed as a
    // bogus extra row — every real row has a real value in its id column.
    .filter((row) => row[idColumn] && row[idColumn].trim() !== "")
    .map((row) => {
      const out = {};
      for (const col of COLUMNS[table]) {
        let v = row[col];
        if (v === undefined || v === "") v = null;
        else if (numeric.has(col)) v = Number(v);
        out[col] = v;
      }
      return out;
    });
}

function writeAll(table, rows) {
  const cols = COLUMNS[table];
  const csv = Papa.unparse({
    fields: cols,
    data: rows.map((r) => cols.map((c) => (r[c] === null || r[c] === undefined ? "" : r[c]))),
  });
  const file = FILES[table];
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, csv, "utf8");
  fs.renameSync(tmp, file);
}

export function readTable(table) {
  return readAll(table);
}

// Read the table, let `mutator` inspect/mutate the row array (push new rows,
// edit fields in place, etc.) and optionally return a value, then persist it.
// This is safe without an explicit lock: these are synchronous fs calls, and
// Node's single-threaded event loop can't interleave another request's code
// between the read and the write within one call.
export function mutateTable(table, mutator) {
  const rows = readAll(table);
  const result = mutator(rows);
  writeAll(table, rows);
  return result;
}

export function nextBibNumber() {
  return mutateTable("counters", (rows) => {
    let counter = rows.find((r) => r.name === "bibNumber");
    if (!counter) {
      counter = { name: "bibNumber", value: 0 };
      rows.push(counter);
    }
    counter.value = (counter.value || 0) + 1;
    return counter.value;
  });
}
