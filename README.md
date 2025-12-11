# 💰 Personal Expense Tracker

A **modern, scalable, multicurrency personal expense tracker** built with the **MERN stack**, featuring **Redis caching**, **BullMQ queues**, and a beautiful **React + Tailwind UI**.
It lets users track expenses, analyze spending, manage budgets, convert currencies, and receive smart budget alerts — all optimized for performance and scalability.

---

## 🧩 Features

* **Transactions:** Add/view/filter/paginate expenses
* **Analytics:** Pie chart visualization by time range
* **Budget:** Donut chart with over/under budget insights + FAQs
* **Currency Converter:** 200+ currencies with live rates
* **Profile & Preferences:** Update base currency, budget, notifications, reset cycle
* **Responsive UI:** Tailwind CSS only, fully mobile-ready

---

## 🏗 Tech Stack

* **Frontend:** 
React (Vite) • Tailwind CSS • Recharts • Redux
* **Backend:** Node.js • Express.js • MongoDB (Mongoose)
* **Performance:** Redis (caching) • BullMQ (email queue)
* **Other:** Nodemailer • JWT Auth • Valkey monitoring

---

## 🚀 Key Optimizations

### ⚡ 1. Performance (Redis Caching)

* Intelligent caching for totals per user/period
* Incremental updates on expense add
* Smart TTL + DB fallback
  ✅ **75% faster responses**, **66% fewer DB queries**

### 📬 2. Scalable Email System (BullMQ)

* Async queue-based email sending
* Rate limit: 10 emails/user/day
* Queue monitoring dashboard
  ✅ **Non-blocking API performance**

### 🔔 3. Smart Budget Alerts

* Multi-threshold alerts (50%, 100%, configurable)
* Tracks last alert threshold to prevent duplicates
* Responsive HTML email templates
  ✅ **Timely, personalized notifications**

### 🧠 4. Monitoring & Health

* `/admin/queues` dashboard
* Health check endpoints
* Cache statistics and retry management

## Demo Video

https://github.com/user-attachments/assets/56fa073a-c6e9-43f5-b677-90232f19936b


## ⚙️ Setup & Installation

### 1️⃣ Clone Repo

```bash
git clone https://github.com/your-username/Expense-tracker.git
cd Expense-tracker
```

### 2️⃣ Environment Variables

#### Backend `.env`

```env
PORT=5000
MONGODB_URL="mongodb+srv://<your-url>/expenseTracker"
JWT_SECRET="your_secret_key"
MAIL_HOST="smtp.yourprovider.com"
MAIL_USER="your_email"
MAIL_PASS="your_password"
FRONTEND_URL="http://localhost:5173"
VALKEY_URL="redis://localhost:6379"
ADMIN_EMAIL="your_admin_email"
```

#### Frontend `.env`

```env
VITE_API_URL="http://localhost:5000/api/v1"
```

### 3️⃣ Install Dependencies

Run for both frontend and backend:

```bash
npm install
```

### 4️⃣ Start Development

```bash
npm run dev
```

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend: [http://localhost:5000](http://localhost:5000)


---

## 📊 Monitoring

* **Queue Dashboard:** `/admin/queues`
* **Health Checks:** `/api/v1/health`
* **Cache Stats:** `/api/v1/cache/status`

---

## 🧭 Future Scope

* Recurring expenses
*  CSV import/export
*  Auto-categorization rules 
*  Household budgets
*  Detailed cashflow reports

---

## 📜 License

This project is open for **personal and educational use**.
