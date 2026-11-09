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

EcoSync uses a deliberately simple JavaScript stack with familiar, well-known tools.

| Layer | Technology | Used for |
|---|---|---|
| Frontend | React (Vite) | User interface |
| Routing | React Router | Page navigation |
| Styling | Tailwind CSS | Mobile-first design |
| Backend | Node.js + Express | REST API |
| Authentication | JWT + bcrypt | Login, sessions, password hashing |
| Database | PostgreSQL | Data storage |
| ORM | Prisma | Database models and migrations |
| File uploads | Multer | Photo proof storage |
| Hosting | Vercel (frontend), local or Node host (backend) | Demo and deployment |

The frontend and backend are separate applications. The React frontend communicates with the Express backend through REST API endpoints. The backend handles authentication, application logic, database operations through Prisma, and photo uploads through Multer.

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or later
- npm
- PostgreSQL

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd ecosync
```

### 2. Install dependencies

Install frontend and backend dependencies separately:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
npm install
```

> If your repository uses different directory names, replace `frontend` and `backend` with the actual folder names.

### 3. Configure environment variables

Create a `.env` file in the backend directory:

```env
PORT=5000
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE_NAME"
JWT_SECRET="your-long-random-secret"
```

If the frontend needs to call the backend, create `frontend/.env` and add:

```env
VITE_API_URL=http://localhost:5000
```

Keep `JWT_SECRET` and database credentials on the backend. Never expose these secrets through frontend environment variables or commit real `.env` files to version control.

### 4. Set up the database

Make sure your PostgreSQL server is running and the `DATABASE_URL` in `backend/.env` points to your database.

From the backend directory, generate the Prisma Client:

```bash
npx prisma generate
```

Apply the database migrations:

```bash
npx prisma migrate dev
```

If you are creating the first migration for the project, use:

```bash
npx prisma migrate dev --name init
```

The Prisma schema is maintained in:

```text
backend/prisma/schema.prisma
```

### 5. Start the development servers

Start the backend from the backend directory:

```bash
npm run dev
```

In a separate terminal, start the frontend:

```bash
cd frontend
npm run dev
```

The exact scripts depend on the `package.json` files in each application. Use the script names defined in your project if they differ.

To test on a phone, make the frontend and backend reachable from the device, configure the frontend API URL accordingly, grant camera permission, and use an HTTPS deployment for camera access where required. Deploy the frontend to Vercel and host the Express backend locally for development or on a Node.js-compatible hosting provider.

## 📁 Project Structure

The code is organized by feature on the frontend, while the backend separates routes, controllers, middleware, and database access.

```text
ecosync/
├── frontend/
│   ├── public/                      # Public and PWA assets
│   └── src/
│       ├── features/
│       │   ├── auth/                 # Login, signup, session handling
│       │   ├── home/                 # Home screen and bottom navigation
│       │   ├── profile/              # Profile page
│       │   ├── streak/               # Streak logic and UI
│       │   ├── coupons/              # Milestone logic and My Coupons page
│       │   ├── leaderboard/          # Monthly leaderboard
│       │   ├── activities/           # Daily activities
│       │   ├── challenges/           # Daily challenges
│       │   ├── proof/                # Camera and submission UI
│       │   └── apps/                 # App launcher and CO₂ calculator
│       ├── data/
│       │   ├── emissionFactors.json  # Emission factors and sources
│       │   ├── activities.json       # Activity definitions
│       │   └── challenges.json       # Challenge definitions
│       ├── lib/                      # Shared API client and utilities
│       ├── App.jsx
│       └── main.jsx
├── backend/
│   ├── prisma/
│   │   └── schema.prisma             # Database models and relations
│   ├── src/
│   │   ├── middleware/               # JWT authentication and authorization
│   │   ├── routes/                   # Express API routes
│   │   ├── controllers/              # Request handlers
│   │   ├── services/                 # Application and business logic
│   │   ├── uploads/                  # Uploaded photos (if stored locally)
│   │   └── index.js                  # Express server entry point
│   └── .env
└── README.md
```

## 🗄️ Database Overview

The following tables describe the intended application data. Their exact fields and relations should be defined in `backend/prisma/schema.prisma`.

| Table | Purpose |
|---|---|
| `profiles` | User ID, display name, role (`user` or `admin`), current streak, and last streak date |
| `tasks` | Activity and challenge definitions, type, points, and challenge date |
| `submissions` | User, task, photo path/URL, review status, and timestamps |
| `user_apps` | User-added app shortcuts, categories, icons, and links |
| `co2_logs` | Estimated CO₂ results for rides and orders |
| `coupons` | Fixed coupon milestones and recurring milestone configuration |
| `user_coupons` | Earned coupons, milestone day, generated code, and award date |
| `rewards` | Fictional demo marketplace offers and stock |
| `redemptions` | User-scoped reward purchases, codes, statuses, and expiry |
| `leaderboard_monthly` | View or query of approved points earned by each user during the current month |

## 📐 How It Works

### 📸 Photo Proof

- The camera component opens the live camera and captures an image.
- Gallery uploads are not offered in the interface.
- The frontend sends the captured image to the Express API.
- Multer handles the incoming file upload, and the backend stores the photo and its associated submission details.
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

- Show one-tap sustainability nudges, such as *“Skip disposable cutlery?”* or *“Combine your order with others?”*
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

### CO₂ Points (Member 3)

The App Launcher uses a self-reported estimate model: **1 point = 1 kg CO₂e saved**. Travel compares the selected mode with a same-distance petrol-cab baseline. Only bus, metro, and electric cab selections earn travel points; walking and cycling have zero direct emissions, and other modes earn zero points. Food earns 0.3 points for a vegetarian order plus 0.2 points per accepted sustainability nudge. Self-reported travel and food points are capped at 5 points per user per Asia/Kolkata calendar day.

All factors are labelled estimates and include a `verify` source marker where the project still needs validation. Points are stored as `Float` values and rounded only for display. The CO₂ models are owned by Member 3 and cascade when the related profile is deleted.

The points dashboard exposes `/api/points/summary`, `/api/points/history`, and `/api/points/ledger`. The demo marketplace exposes `/api/rewards` and wallet endpoints; all offers are fictional, tagged `demo`, and use the same user-scoped points balance. Profile integrations can use the exported `TopBarPills`, `MonthBars`, and `FootprintTab` components from `frontend/src/features/apps/`.

The exact Prisma additions for the shared schema are:

```prisma
// Add inside model Co2Log:
  savedKg       Float   @default(0)
  pointsEarned  Float   @default(0)
  chosenVehicle String?

// Add as new schema blocks:
enum RewardKind {
  voucher
  physical
  donation
}

enum RedemptionStatus {
  active
  used
  expired
}
```

### 🏆 Monthly Leaderboard

- Users are ranked by points earned during the current calendar month.
- Only approved submissions contribute to the ranking.
- The top-ranked user earns the title **EcoSync of the Month**.
- The leaderboard displays user-selected display names or nicknames.

## 👥 Team and Feature Ownership

The project is divided into three independent modules so each member can develop and test their features separately. All members will follow the shared database schema and agreed API contracts to ensure smooth integration.

### The Team

- **Member 1:** Shubham Tale
- **Member 2:** Yug Dhamecha
- **Member 3:** Sambuddha Banerjee

### Roles

### Member 1: Accounts and Rewards

**Owns:** `auth`, `home`, `profile`, `streak`, `coupons`, `leaderboard`

- Implement signup, login, JWT-based authentication, and session handling.
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
- Add camera-only photo capture and send captured images to the backend.
- Use Multer in the Express backend to handle photo uploads.
- Store submissions and their review status in PostgreSQL through Prisma.
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
- Save and display the user's CO₂ logs through the backend API.

**Independent testing:** Use sample locations, predefined emission factors, and mock order details without depending on the activities or rewards modules.

### 🔗 Integration Rules

- All members will agree on the PostgreSQL schema, Prisma models, API routes, and request/response formats before development begins.
- Each member will develop and test their module independently using mock data or seeded database records.
- The frontend and backend will communicate through the Express REST API.
- Backend modules will access shared data through Prisma rather than directly depending on another member's functions.
- Member 1 will calculate streaks and rewards from approved submissions stored in the database.
- Member 2 will manage submissions, reviews, and point awards according to the agreed schema.
- Member 3 will manage CO₂ calculations and logs independently.
- Each member will maintain their own feature folders and integrate through the common app shell.

**Team rule:** Define shared database and API contracts first, then develop modules independently and integrate them near the end.

## 🔒 Privacy

- The app never monitors activity inside other apps. Users choose when to calculate a ride or order.
- Photos are stored by the backend and should be accessible only to the submitting user and authorized reviewers.
- The leaderboard shows display names only, and users can choose a nickname.
- Users can delete their account and associated data.
- Password hashes, JWT secrets, and database credentials must remain on the backend.
- The demo clearly distinguishes estimated emissions and mock coupons from real-world measurements and rewards.

---

<p align="center">
  🌱 <b>Small actions. Lasting impact.</b><br/>
  <i>Make sustainability a habit.</i> 🌍
</p>
