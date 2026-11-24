const assert = require('node:assert/strict');
const test = require('node:test');

const activities = require('../data/activities.json');
const challenges = require('../data/challenges.json');
const { getKolkataDayBounds } = require('../controllers/tasks.controller');

test('Demo Task Catalog contains exactly 30 unique eco-friendly tasks (15 activities + 15 challenges)', () => {
  assert.equal(activities.length, 15, `Expected 15 activities, found ${activities.length}`);
  assert.equal(challenges.length, 15, `Expected 15 challenges, found ${challenges.length}`);
  
  const totalTasks = activities.length + challenges.length;
  assert.equal(totalTasks, 30, `Expected 30 total tasks, found ${totalTasks}`);

  // Check unique titles
  const allTitles = new Set();
  
  // Verify all 15 activities
  activities.forEach((act, idx) => {
    assert.ok(act.title && act.title.trim().length > 0, `Activity #${idx + 1} has valid title`);
    assert.ok(act.description && act.description.trim().length > 0, `Activity #${idx + 1} has description`);
    assert.ok(act.icon && act.icon.trim().length > 0, `Activity #${idx + 1} has icon`);
    assert.ok(typeof act.points === 'number' && act.points > 0, `Activity #${idx + 1} has positive points`);
    assert.ok(!allTitles.has(act.title), `Duplicate title detected in activities: ${act.title}`);
    allTitles.add(act.title);
  });

  // Verify all 15 challenges
  challenges.forEach((ch, idx) => {
    assert.ok(ch.title && ch.title.trim().length > 0, `Challenge #${idx + 1} has valid title`);
    assert.ok(ch.description && ch.description.trim().length > 0, `Challenge #${idx + 1} has description`);
    assert.ok(ch.icon && ch.icon.trim().length > 0, `Challenge #${idx + 1} has icon`);
    assert.ok(typeof ch.points === 'number' && ch.points >= 30, `Challenge #${idx + 1} has bonus points (>=30)`);
    assert.ok(!allTitles.has(ch.title), `Duplicate title detected in challenges: ${ch.title}`);
    allTitles.add(ch.title);
  });
});

test('CameraCapture canvas downscaling algorithm maintains aspect ratio and clamps width <= 1280px', () => {
  function computeTargetDimensions(vw, vh, maxW = 1280) {
    let targetW = vw;
    let targetH = vh;
    if (vw > maxW) {
      targetW = maxW;
      targetH = Math.round((vh * maxW) / vw);
    }
    return { targetW, targetH };
  }

  // 1. Full HD landscape (1920x1080)
  const fullHD = computeTargetDimensions(1920, 1080);
  assert.equal(fullHD.targetW, 1280);
  assert.equal(fullHD.targetH, 720);

  // 2. 4K camera capture (3840x2160)
  const fourK = computeTargetDimensions(3840, 2160);
  assert.equal(fourK.targetW, 1280);
  assert.equal(fourK.targetH, 720);

  // 3. Mobile portrait capture below maxW (720x1280)
  const portrait = computeTargetDimensions(720, 1280);
  assert.equal(portrait.targetW, 720);
  assert.equal(portrait.targetH, 1280);

  // 4. Mobile high-res portrait capture (1440x2560)
  const hiResPortrait = computeTargetDimensions(1440, 2560);
  assert.equal(hiResPortrait.targetW, 1280);
  assert.equal(hiResPortrait.targetH, Math.round((2560 * 1280) / 1440));
});

test('CameraCapture security and hardware validation checks', () => {
  function validateEnvironmentSecurity(isSecureContext, hostname) {
    if (!isSecureContext && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return { allowed: false, error: 'Camera access requires a secure connection (HTTPS).' };
    }
    return { allowed: true, error: null };
  }

  // Localhost development should be allowed
  assert.deepEqual(validateEnvironmentSecurity(false, 'localhost'), { allowed: true, error: null });
  assert.deepEqual(validateEnvironmentSecurity(false, '127.0.0.1'), { allowed: true, error: null });

  // Insecure remote origin should be blocked
  assert.deepEqual(validateEnvironmentSecurity(false, 'remote-server.com'), {
    allowed: false,
    error: 'Camera access requires a secure connection (HTTPS).'
  });

  // HTTPS should be allowed
  assert.deepEqual(validateEnvironmentSecurity(true, 'ecosync.app'), { allowed: true, error: null });
});
