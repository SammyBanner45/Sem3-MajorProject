const prisma = require('../lib/prisma');

const categories = new Set(['travel', 'food', 'grocery']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validateApp(body) {
  const { name, category, icon, url } = body || {};
  if ([name, category, icon, url].some((value) => typeof value !== 'string' || !value.trim())) {
    throw new TypeError('name, category, icon, and url are required strings');
  }
  if (!categories.has(category)) throw new TypeError('Invalid app category');
  try { new URL(url); } catch { throw new TypeError('url must be a valid URL'); }
  return { name: name.trim(), category, icon: icon.trim(), url: url.trim() };
}

async function listApps(req, res, next) {
  try {
    const apps = await prisma.userApp.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } });
    return res.json(apps);
  } catch (error) { return next(error); }
}

async function createApp(req, res, next) {
  try {
    const app = await prisma.userApp.create({ data: { ...validateApp(req.body), userId: req.user.id } });
    return res.status(201).json(app);
  } catch (error) { return next(error); }
}

async function deleteApp(req, res, next) {
  try {
    if (!uuidPattern.test(req.params.id || '')) return res.status(400).json({ error: 'App id must be a UUID' });
    const result = await prisma.userApp.deleteMany({ where: { id: req.params.id, userId: req.user.id } });
    if (!result.count) return res.status(404).json({ error: 'App not found' });
    return res.status(204).send();
  } catch (error) { return next(error); }
}

module.exports = { listApps, createApp, deleteApp };
