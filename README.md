# 🌍 ECOSYNC

### Small actions. Greener habits. A better planet. 🌱

**Make sustainability a habit, not just a choice.**

EcoSync is a mobile-first web app (PWA) that encourages people to adopt eco-friendly habits through daily activities, photo proof, carbon-footprint awareness, streaks, rewards, and friendly competition.

<p align="center">
  <img src="https://img.shields.io/badge/Project-EcoSync%20%20-16a34a?style=for-the-badge" alt="EcoSync"/>
  <img src="https://img.shields.io/badge/Platform-PWA-15803d?style=for-the-badge" alt="Progressive Web App"/>
  <img src="https://img.shields.io/badge/Focus-Sustainability-166534?style=for-the-badge" alt="Sustainability"/>
</p>

---

## 🌿 About the Project

EcoSync makes sustainable living more engaging by turning everyday eco-friendly actions into measurable progress.

Users can complete daily activities and challenges, submit live camera photos as proof, estimate the carbon footprint of their rides and orders, maintain daily streaks, unlock milestone coupons, and compete to become the **EcoSync of the Month**.

### 🎯 Our Goals

- Encourage consistent, eco-friendly habits.
- Make everyday environmental choices more visible.
- Reward users for maintaining sustainable routines.
- Build a community around environmental awareness.

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🌱 Daily Activities</h3>
      Complete repeatable eco-friendly tasks such as cycling, taking the bus, disposing of garbage properly, feeding stray animals, and more.
    </td>
    <td width="50%">
      <h3>🎯 Daily Challenges</h3>
      Take on a fresh challenge each day and earn bonus points by submitting photo proof.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>📸 Camera-Only Proof</h3>
      Capture photos directly through the app. Gallery uploads are not offered, and submissions are reviewed within 24 hours.
    </td>
    <td width="50%">
      <h3>🚗 App Launcher + CO₂ Calculator</h3>
      Add shortcuts to apps such as Uber, Zepto, and Zomato. Answer a few questions to estimate emissions before opening the selected service.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🔥 Daily Streaks</h3>
      Maintain consecutive days of approved eco-friendly activities and build consistency over time.
    </td>
    <td width="50%">
      <h3>🎁 Streak Coupons</h3>
      Unlock mock coupons at predefined streak milestones and track earned rewards in your profile.
    </td>
  </tr>
  <tr>
    <td width="50%">
      <h3>🏆 Monthly Leaderboard</h3>
      Compete with other users based on points earned during the current month.
    </td>
    <td width="50%">
      <h3>📊 Personal Profile</h3>
      Track earned points, current streak, coupons unlocked, and estimated CO₂ emissions.
    </td>
  </tr>
</table>

## 🔄 How It Works

1. **Sign up** and create your profile.
2. **Choose an activity** or complete the daily challenge.
3. **Capture photo proof** using the in-app camera.
4. **Wait for review** by an admin.
5. **Earn points** when your submission is approved.
6. **Build your streak** and unlock milestone coupons.
7. **Climb the leaderboard** and compete for the monthly title.

Users can also open the App Launcher, enter the details required for a ride or order, view an estimated CO₂ result, and proceed to the selected app or website.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, React Router
- **PWA:** `vite-plugin-pwa`
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Row Level Security)
- **Hosting:** Vercel (frontend) and Supabase (backend)

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- A free [Supabase](https://supabase.com/) project

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd pro-planet-person
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create your environment file:

```bash
cp .env.example .env
```

Add your Supabase project credentials:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Never expose a Supabase service-role key through a frontend environment variable.

### 4. Set up the database

Open the Supabase SQL Editor and run the SQL script located at:

`supabase/schema.sql`

### 5. Start the development server

```bash
npm run dev
```

To test on a phone, deploy to Vercel, open the HTTPS URL, grant camera permission, and select **Add to Home Screen** where supported.

## 📁 Project Structure

The code is organized by feature. Each feature folder contains its relevant pages, components, and logic.

```text
pro-planet-person/
├── public/                      # PWA icons and manifest assets
├── supabase/
│   └── schema.sql                # Tables, policies, leaderboard view
├── src/
│   ├── features/
│   │   ├── auth/                 # Login, signup, session handling
│   │   ├── home/                 # Home screen and bottom navigation
│   │   ├── profile/              # Profile page
│   │   ├── streak/               # Streak logic and UI
│   │   ├── coupons/              # Milestone logic and My Coupons page
│   │   ├── leaderboard/          # Monthly leaderboard
│   │   ├── activities/            # Daily activities
│   │   ├── challenges/            # Daily challenges
│   │   ├── proof/                 # Camera, uploads, admin review
│   │   └── apps/                  # App launcher and CO₂ calculator
│   ├── lib/
│   │   └── supabase.js            # Shared Supabase client
│   ├── data/
│   │   ├── emissionFactors.json   # Emission factors and sources
│   │   ├── activities.json        # Activity definitions
│   │   └── challenges.json        # Challenge definitions
│   ├── App.jsx
│   └── main.jsx
└── README.md
```

## 🗄️ Database Overview

| Table | Purpose |
|---|---|
| `profiles` | User ID, display name, role (`user` or `admin`), current streak, and last streak date |
| `tasks` | Activity and challenge definitions, type, points, and challenge date |
| `submissions` | User, task, photo URL, review status, and timestamps |
| `user_apps` | User-added app shortcuts, categories, icons, and links |
| `co2_logs` | Estimated CO₂ results for rides and orders |
| `coupons` | Fixed coupon milestones and recurring milestone configuration |
| `user_coupons` | Earned coupons, milestone day, generated code, and award date |
| `leaderboard_monthly` | View of approved points earned by each user during the current month |

## 📐 How It Works

### 📸 Photo Proof

- The camera component opens the live camera and captures an image.
- Gallery uploads are not offered in the interface.
- The submission is stored with a `pending` status.
- An admin reviews the submission and approves or rejects it.
- Points are awarded only after approval.
- The target review time is within 24 hours.

### ⭐ Points

- Regular activities award their configured points.
- Daily challenges award bonus points.
- Pending and rejected submissions do not earn points.
- Approved points contribute to the monthly leaderboard.

### 🔥 Daily Streaks

- A day counts when the user has at least one approved submission for that day.
- Multiple approved activities on the same day count as one streak day.
- Missing a calendar day resets the current streak to zero.
- Streak progress is used to determine coupon eligibility.

### 🎁 Streak Coupons

Coupons unlock at the following milestones:

| Streak Milestone | Reward |
|---:|---|
| 7 days | Coupon |
| 15 days | Coupon |
| 30 days | Coupon |
| 60 days | Coupon |
| 120 days | Coupon |
| 180 days | Coupon |
| 240 days | Coupon |
| ... | Every additional 60 days |

**Exact rule:** The first three milestones are 7, 15, and 30 days. After that, rewards unlock at every multiple of 60 days: 60, 120, 180, 240, 300, and so on.

- Each milestone is awarded only once per user.
- If a streak update crosses multiple milestones, every eligible milestone is checked.
- The demo uses clearly labeled mock coupons with generated codes; these are not real partner discounts.

### 🌍 AI-Powered CO₂ Estimates

The App Launcher estimates carbon emissions using AI-assisted calculations based on average emission factors and the information provided by users.

**🚗 Travel Apps — Before Opening**
- Users enter pickup and drop locations.
- The app estimates the travel distance and calculates CO₂ emissions for available vehicle options using average emission factors.
- Users can compare estimated emissions before opening their selected travel app.

**🍔 Food & Grocery Apps — Before and After Ordering**

**Before opening the app:**
- Show one-tap sustainability nudges, such as *"Skip disposable cutlery?"* or *"Combine your order with others?"*
- Open the selected food or grocery app without requiring order details upfront.

**After ordering:**
- Offer an optional quick log when the user returns.
- Ask relevant questions about the order, such as vegetarian or non-vegetarian food, number of items, delivery distance, and packaging.
- Estimate CO₂ emissions using average emission factors and the information provided.
- Save the result for the user's impact history.

**📊 CO₂ Tracking**
- `co2_logs` stores each estimate with its `type` (`travel` or `food`) and `status` (`pending_log` or `logged`).
- Travel estimates are calculated before opening the travel app.
- Food and grocery logs are created after the user optionally records their order details.
- Users can track their estimated emissions over time.

> **Note:** Estimates are based on average emissions and simplified assumptions. They are intended to encourage environmental awareness, not provide exact measurements. Food-order estimates are optional and depend on the information users provide.
### 🏆 Monthly Leaderboard

- Users are ranked by points earned during the current calendar month.
- Only approved submissions contribute to the ranking.
- The top-ranked user earns the title **Pro Planet Person of the Month**.
- The leaderboard displays user-selected display names or nicknames.

## 👥 Team and Feature Ownership

The project is divided into three independent modules so each member can develop and test their features separately. All members will follow the shared database schema and agreed interfaces to ensure smooth integration.

### The Team
### Member 1: Shubham Tale
### Member 2: Yug Dhamecha
### Member 3: Sambuddha Banerjee



### Member 1: Accounts and Rewards
**Owns:** `auth`, `home`, `profile`, `streak`, `coupons`, `leaderboard`

- Implement signup, login, and session handling.
- Build the home page, navigation, and user profile.
- Track daily streaks using approved activity records.
- Implement coupon milestones at 7, 15, 30 days, and every 60 days afterward.
- Build the monthly leaderboard using approved points.
- Create the My Coupons page.

**Independent testing:** Use sample users and pre-seeded activity records to test streaks, rewards, and leaderboard rankings without depending on Member 2's implementation.

### Member 2: Activities and Photo Proof
**Owns:** `activities`, `challenges`, `proof`

- Build the daily activities list and completion interface.
- Implement daily challenges with bonus points.
- Add camera-only photo capture and upload to Supabase Storage.
- Store submissions and their review status in the database.
- Build an admin review page to approve or reject submissions.
- Award activity points only after approval.

**Independent testing:** Use sample activities, mock submissions, and test images to verify the complete submission and review flow.

### Member 3: App Launcher and CO₂ Calculator
**Owns:** `apps`, `data/emissionFactors.json`

- Build an app launcher for shortcuts such as Uber, Ola, Rapido, Zomato, Zepto, and Swiggy.
- For travel apps, collect pickup and drop locations and estimate CO₂ emissions before opening the app.
- For food and grocery apps, show sustainability reminders before opening the app.
- Allow users to optionally log order details after returning to the website.
- Calculate estimated CO₂ emissions using average emission factors and the information provided.
- Save and display the user's CO₂ logs.

**Independent testing:** Use sample locations, predefined emission factors, and mock order details without depending on the activities or rewards modules.

### 🔗 Integration Rules

- All members will agree on the database schema, table names, and shared interfaces before development begins.
- Each member will develop and test their module independently using mock data or seeded database records.
- Modules will communicate through the shared database rather than directly depending on another member's functions.
- Member 1 will calculate streaks and rewards from approved submissions stored in the database.
- Member 2 will manage submissions, reviews, and point awards according to the agreed schema.
- Member 3 will manage CO₂ calculations and logs independently.
- Each member will maintain their own feature folders and integrate through the common app shell.

**Team rule:** Define shared database contracts first, then develop modules independently and integrate them near the end.

## 🔒 Privacy

- The app never monitors activity inside other apps. Users choose when to calculate a ride or order.
- Photos are stored privately and visible only to the submitting user and authorized reviewers.
- The leaderboard shows display names only, and users can choose a nickname.
- Users can delete their account and associated data.
- The demo clearly distinguishes estimated emissions and mock coupons from real-world measurements and rewards.

---

<p align="center">
  🌱 <b>Small actions. Lasting impact.</b><br/>
  <i>Become a Pro Planet Person.</i> 🌍
</p>
