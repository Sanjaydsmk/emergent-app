# Department Inventory Management System

A full-stack web application for managing departmental assets, supplies, and budgets with role-based authentication, real-time analytics, and dark mode support.

## 🚀 Tech Stack

- **Frontend**: React.js with Tailwind CSS, React Router, Chart.js
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt password hashing

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based secure authentication
- Role-based access control (Admin & Staff)
- Password change functionality
- Protected routes

### 📊 Dashboard
- Real-time inventory statistics
- Budget vs spending overview
- Low stock alerts (quantity < 10)
- System summary cards

### 🏢 Department Management
- Create, read, update, delete departments
- Track department budgets and heads
- View department-wise spending

### 📦 Inventory Management
- Manage items with categories
- Track stock quantities
- Low stock indicators
- Department-wise item organization

### 👥 Supplier Management
- Maintain supplier records
- Contact information tracking
- Supplier transaction history

### 🛒 Purchase Management
- Record purchase transactions
- Automatic stock updates
- Cost calculation
- Purchase history tracking

### 📈 Reports & Analytics
- **Department Budget vs Spending** - Bar chart comparing budgets and actual spending
- **Monthly Purchase Trends** - Line chart showing spending over time
- **Budget Overview** - Doughnut chart visualizing budget utilization
- **Low Stock Alerts** - Real-time alerts for items below threshold

### ⚙️ Settings
- User profile management
- Password change
- Dark/Light mode toggle with persistence

## 🔑 Default Credentials

```
Username: admin
Password: admin123
Role: Admin
```

## 📋 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/me` - Get current user

### Departments
- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department (Admin only)
- `PUT /api/departments/{dept_id}` - Update department (Admin only)
- `DELETE /api/departments/{dept_id}` - Delete department (Admin only)

### Items
- `GET /api/items` - List all items
- `POST /api/items` - Create item (Admin only)
- `PUT /api/items/{item_id}` - Update item (Admin only)
- `DELETE /api/items/{item_id}` - Delete item (Admin only)

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `POST /api/suppliers` - Create supplier (Admin only)
- `PUT /api/suppliers/{supplier_id}` - Update supplier (Admin only)
- `DELETE /api/suppliers/{supplier_id}` - Delete supplier (Admin only)

### Purchases
- `GET /api/purchases` - List all purchases
- `POST /api/purchases` - Create purchase (Admin only, auto-updates stock)

### Reports
- `GET /api/reports/dashboard` - Dashboard statistics
- `GET /api/reports/department-spending` - Department-wise spending analysis
- `GET /api/reports/monthly-purchases` - Monthly purchase trends

## 🎨 Design Features

- **Dark Mode**: Professional dark theme with emerald accent colors
- **Responsive Design**: Works seamlessly across all device sizes
- **Modern UI**: Clean, professional interface with smooth animations
- **Data Visualization**: Interactive charts using Chart.js

## 🚦 Application URL

https://dept-inventory-1.preview.emergentagent.com

---

**Made with Emergent** 🚀
