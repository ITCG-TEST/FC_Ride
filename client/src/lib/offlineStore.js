// Thin, failure-safe localStorage wrapper. Used to survive dead zones during
// a ride: GPS keeps recording locally even with no signal, and whatever
// hasn't synced yet (location pings, or a just-finished ride) is persisted
// here so it isn't lost if the tab gets closed or the phone sleeps before
// connectivity returns.

function safeGet(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // private browsing, storage quota, etc. — degrade silently
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function loadPendingLocations(riderId) {
  return safeGet(`fc_pending_locations_${riderId}`, []);
}
export function savePendingLocations(riderId, points) {
  safeSet(`fc_pending_locations_${riderId}`, points);
}

export function loadPendingRides(riderId) {
  return safeGet(`fc_pending_rides_${riderId}`, []);
}
export function savePendingRides(riderId, rides) {
  safeSet(`fc_pending_rides_${riderId}`, rides);
}

export function loadActiveRide(riderId) {
  return safeGet(`fc_active_ride_${riderId}`, null);
}
export function saveActiveRide(riderId, state) {
  safeSet(`fc_active_ride_${riderId}`, state);
}
export function clearActiveRide(riderId) {
  safeRemove(`fc_active_ride_${riderId}`);
}
