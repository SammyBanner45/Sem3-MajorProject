const { getPointsHistory, getPointsLedger, getPointsSummary } = require('../services/points.service');
const prisma = require('../lib/prisma');

async function summary(req, res, next) {
  try { return res.json(await getPointsSummary(req.user.id, prisma)); } catch (error) { return next(error); }
}

async function history(req, res, next) {
  try { return res.json(await getPointsHistory(req.user.id, req.query.months, prisma)); } catch (error) { return next(error); }
}

async function ledger(req, res, next) {
  try { return res.json(await getPointsLedger(req.user.id, req.query.limit, prisma)); } catch (error) { return next(error); }
}

module.exports = { history, ledger, summary };
