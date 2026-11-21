-- ============================================================================
-- EcoSync College Data Engineering Submission: Sample / Demo Dataset
-- Target Tables: users, profiles, coupons, user_coupons, tasks, submissions,
--                user_apps, co2_logs, "Reward", "Redemption"
-- ============================================================================

-- Clean out tables in reverse dependency order before population
TRUNCATE TABLE "Redemption", "Reward", "co2_logs", "user_apps",
               "submissions", "user_coupons", "coupons", "tasks",
               "profiles", "users" CASCADE;

-- 1. USERS (Authentication table)
-- 4 users: 1 Admin, 3 regular users
INSERT INTO "users" ("id", "email", "passwordHash", "role") VALUES
('00000000-0000-4000-8000-000000000001', 'admin@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'ADMIN'),
('00000000-0000-4000-8000-000000000002', 'sample1@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'USER'),
('00000000-0000-4000-8000-000000000003', 'sample2@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'USER'),
('00000000-0000-4000-8000-000000000004', 'sample3@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'USER');

-- 2. PROFILES (Domain user profiles linked 1:1 with users.id)
INSERT INTO "profiles" ("id", "email", "passwordHash", "displayName", "role", "currentStreak", "lastStreakDate", "createdAt", "updatedAt") VALUES
('00000000-0000-4000-8000-000000000001', 'admin@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'EcoSync Admin', 'admin', 0, NULL, '2026-11-01 00:00:00+05:30', '2026-11-01 00:00:00+05:30'),
('00000000-0000-4000-8000-000000000002', 'sample1@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'Sample User One', 'user', 7, '2026-11-20 00:00:00+05:30', '2026-11-01 00:00:00+05:30', '2026-11-20 18:00:00+05:30'),
('00000000-0000-4000-8000-000000000003', 'sample2@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'Sample User Two', 'user', 3, '2026-11-19 00:00:00+05:30', '2026-11-02 00:00:00+05:30', '2026-11-19 12:00:00+05:30'),
('00000000-0000-4000-8000-000000000004', 'sample3@ecosync.example', '$2a$10$abcdefghijklmnopqrstuv', 'Sample User Three', 'user', 0, NULL, '2026-11-03 00:00:00+05:30', '2026-11-03 00:00:00+05:30');

-- 3. TASKS (Activities and Daily Challenges)
-- Reused from backend/src/data/activities.json and challenges.json
INSERT INTO "tasks" ("id", "title", "description", "type", "points", "challengeDate", "createdAt") VALUES
('11111111-0000-4000-8000-000000000001', 'Bicycle Commute', 'Cycle to work, school, or errands instead of taking a motorized vehicle.', 'activity', 20, NULL, '2026-11-01 00:00:00+05:30'),
('11111111-0000-4000-8000-000000000002', 'Public Transit Ride', 'Take the public bus, metro, or local train for your daily travel.', 'activity', 15, NULL, '2026-11-01 00:00:00+05:30'),
('11111111-0000-4000-8000-000000000003', 'Proper Garbage Disposal', 'Segregate dry, wet, and recyclable waste and dispose of them responsibly.', 'activity', 10, NULL, '2026-11-01 00:00:00+05:30'),
('11111111-0000-4000-8000-000000000004', 'Zero Single-Use Plastic Day', 'Go the whole day without accepting or using any single-use plastic cups, straws, or bags.', 'challenge', 50, '2026-11-20 00:00:00+05:30', '2026-11-01 00:00:00+05:30');

-- 4. SUBMISSIONS (Photo proofs across pending, approved, rejected with November 2026 reviewedAt dates)
INSERT INTO "submissions" ("id", "userId", "taskId", "photoUrl", "status", "reviewedAt", "reviewedBy", "rejectionReason", "createdAt", "updatedAt") VALUES
('22222222-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000001', 'uploads/sub1.jpg', 'approved', '2026-11-14 10:30:00+05:30', '00000000-0000-4000-8000-000000000001', NULL, '2026-11-14 09:00:00+05:30', '2026-11-14 10:30:00+05:30'),
('22222222-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000002', 'uploads/sub2.jpg', 'approved', '2026-11-18 11:15:00+05:30', '00000000-0000-4000-8000-000000000001', NULL, '2026-11-18 10:00:00+05:30', '2026-11-18 11:15:00+05:30'),
('22222222-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000001', 'uploads/sub3.jpg', 'approved', '2026-11-19 14:00:00+05:30', '00000000-0000-4000-8000-000000000001', NULL, '2026-11-19 12:30:00+05:30', '2026-11-19 14:00:00+05:30'),
('22222222-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000002', '11111111-0000-4000-8000-000000000004', 'uploads/sub4.jpg', 'approved', '2026-11-20 16:45:00+05:30', '00000000-0000-4000-8000-000000000001', NULL, '2026-11-20 15:00:00+05:30', '2026-11-20 16:45:00+05:30'),
('22222222-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', '11111111-0000-4000-8000-000000000004', 'uploads/sub5.jpg', 'pending', NULL, NULL, NULL, '2026-11-20 17:00:00+05:30', '2026-11-20 17:00:00+05:30'),
('22222222-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000004', '11111111-0000-4000-8000-000000000003', 'uploads/sub6.jpg', 'rejected', '2026-11-15 13:00:00+05:30', '00000000-0000-4000-8000-000000000001', 'Photo was too blurry to verify garbage segregation', '2026-11-15 11:00:00+05:30', '2026-11-15 13:00:00+05:30');

-- 5. USER_APPS (Configured launcher shortcuts)
INSERT INTO "user_apps" ("id", "userId", "name", "category", "icon", "url", "createdAt") VALUES
('33333333-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'Blinkit', 'grocery', '🛒', 'https://blinkit.com', '2026-11-05 10:00:00+05:30'),
('33333333-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'Uber Green', 'travel', '🚲', 'https://uber.com', '2026-11-05 10:05:00+05:30'),
('33333333-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000003', 'Swiggy Instamart', 'grocery', '🛍️', 'https://swiggy.com', '2026-11-06 14:00:00+05:30');

-- 6. CO2_LOGS (Emissions and eco-savings tracker across travel, food, grocery)
INSERT INTO "co2_logs" ("id", "userId", "type", "status", "co2Kg", "savedKg", "pointsEarned", "chosenVehicle", "distanceKm", "details", "createdAt", "loggedAt") VALUES
('44444444-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'travel', 'logged', 0.45, 1.20, 2.4, 'bus', 6.5, '{"origin": "College Gate", "destination": "Salt Lake", "vehicle": "bus", "baselineKg": 1.65}', '2026-11-14 08:30:00+05:30', '2026-11-14 08:30:00+05:30'),
('44444444-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'food', 'logged', 0.85, 0.70, 0.7, NULL, NULL, '{"items": 3, "isVeg": true, "nudges": ["no_plastic_cutlery", "opt_for_paper_bag"]}', '2026-11-14 13:00:00+05:30', '2026-11-14 13:10:00+05:30'),
('44444444-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000002', 'grocery', 'logged', 1.10, 0.00, 0.0, NULL, NULL, '{"basketSize": "medium", "productType": "organic", "animalProducts": false, "bagType": "cloth", "approximate": true}', '2026-11-15 17:30:00+05:30', '2026-11-15 17:30:00+05:30'),
('44444444-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000003', 'travel', 'logged', 0.00, 2.10, 4.2, 'bicycle', 8.0, '{"origin": "Hostel", "destination": "City Center", "vehicle": "bicycle", "baselineKg": 2.10}', '2026-11-19 09:00:00+05:30', '2026-11-19 09:00:00+05:30'),
('44444444-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000003', 'food', 'pending_log', 0.00, 0.00, 0.0, NULL, NULL, '{"items": 2, "isVeg": false}', '2026-11-20 12:00:00+05:30', NULL);

-- 7. COUPONS (Milestone templates)
INSERT INTO "coupons" ("id", "title", "description", "discount", "milestoneDays", "isRecurring", "createdAt") VALUES
('55555555-0000-4000-8000-000000000001', '7-Day Streak Reward', 'An EcoSync demo reward for your 7-day streak milestone.', '₹50 Off Demo Coupon', 7, false, '2026-11-01 00:00:00+05:30'),
('55555555-0000-4000-8000-000000000002', '15-Day Streak Reward', 'An EcoSync demo reward for your 15-day streak milestone.', '₹120 Off Demo Coupon', 15, false, '2026-11-01 00:00:00+05:30');

-- 8. USER_COUPONS (Awarded milestone codes)
INSERT INTO "user_coupons" ("id", "userId", "couponId", "milestoneDay", "code", "awardedAt", "isRedeemed") VALUES
('66666666-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '55555555-0000-4000-8000-000000000001', 7, 'ECO-A4F1D9B2C3E57810', '2026-11-20 18:00:00+05:30', false);

-- 9. REWARDS (Store catalog items verbatim from backend/prisma/seed.rewards.js)
INSERT INTO "Reward" ("id", "brand", "title", "description", "kind", "cost", "stock", "validDays", "terms", "icon", "isActive") VALUES
('77777777-0000-4000-8000-000000000001', 'Campus Cafe', '₹50 off', 'A demo campus cafe voucher (demo)', 'voucher', 10.0, 19, 30, 'Valid at the demo Campus Cafe.', '☕', true),
('77777777-0000-4000-8000-000000000002', 'Reel Cinema', '₹100 off', 'A demo cinema voucher (demo)', 'voucher', 20.0, 14, 30, 'Valid at the demo Reel Cinema.', '🎬', true),
('77777777-0000-4000-8000-000000000003', 'Eco Tote Co.', 'Jute bag', 'A demo reusable physical reward (demo)', 'physical', 30.0, 5, 30, 'Collect from the demo Eco Tote Co. desk.', '👜', true),
('77777777-0000-4000-8000-000000000004', 'Green Roots', 'Sponsor a tree', 'A demo tree donation (demo)', 'donation', 50.0, 10, 30, 'Donation is a demo impact record.', '🌳', true);

-- 10. REDEMPTIONS (Redeemed vouchers using earned points)
INSERT INTO "Redemption" ("id", "userId", "rewardId", "cost", "code", "status", "expiresAt", "createdAt") VALUES
('88888888-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', '77777777-0000-4000-8000-000000000001', 10.0, 'ECO-CAFE-9A12', 'active', '2026-12-20 18:30:00+05:30', '2026-11-20 18:30:00+05:30'),
('88888888-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', '77777777-0000-4000-8000-000000000002', 20.0, 'ECO-REEL-4B33', 'used', '2026-12-19 12:00:00+05:30', '2026-11-19 12:00:00+05:30');
