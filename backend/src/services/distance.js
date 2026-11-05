const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_URL = 'https://router.project-osrm.org/route/v1/driving';
const USER_AGENT = 'EcoSync/1.0 (contact: ecosync@example.com)';

let requestChain = Promise.resolve();
let lastNominatimRequestAt = 0;

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function scheduleNominatimRequest(request) {
  const scheduled = requestChain.then(async () => {
    const elapsed = Date.now() - lastNominatimRequestAt;
    if (elapsed < 1000) await wait(1000 - elapsed);
    lastNominatimRequestAt = Date.now();
    return request();
  });

  requestChain = scheduled.catch(() => undefined);
  return scheduled;
}

async function geocode(location) {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set('q', location);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await scheduleNominatimRequest(() => fetch(url, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
  }));
  if (!response.ok) throw new Error(`Nominatim returned ${response.status}`);

  const results = await response.json();
  if (!Array.isArray(results) || !results[0]) throw new Error(`Location not found: ${location}`);

  return { latitude: Number(results[0].lat), longitude: Number(results[0].lon) };
}

function parseCoordinatePair(location) {
  const match = String(location).trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) return null;

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;
  return { latitude, longitude };
}

function haversineKm(first, second) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(first.latitude))
    * Math.cos(toRadians(second.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function getRoadDistance(first, second) {
  const coordinates = `${first.longitude},${first.latitude};${second.longitude},${second.latitude}`;
  const response = await fetch(`${OSRM_URL}/${coordinates}?overview=false`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }
  });
  if (!response.ok) throw new Error(`OSRM returned ${response.status}`);

  const result = await response.json();
  const meters = result?.routes?.[0]?.distance;
  if (typeof meters !== 'number' || !Number.isFinite(meters)) throw new Error('OSRM returned no route');
  return meters / 1000;
}

async function getDistance(origin, destination) {
  let first;
  let second;
  let approximate = false;

  try {
    [first, second] = await Promise.all([geocode(origin), geocode(destination)]);
    return { distanceKm: await getRoadDistance(first, second), approximate: false };
  } catch (error) {
    approximate = true;
    first = first || parseCoordinatePair(origin);
    second = second || parseCoordinatePair(destination);
    if (!first || !second) {
      throw new Error(`Unable to calculate distance: ${error.message}`);
    }
    return { distanceKm: haversineKm(first, second) * 1.3, approximate };
  }
}

module.exports = { getDistance, geocode, haversineKm };
