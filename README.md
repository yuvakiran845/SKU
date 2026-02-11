# SK University - CSE Department Academic Management System

A production-grade college management system built with React + Vite frontend and Node.js + Express backend.

## 🎯 Project Overview

This system provides a complete academic management solution for SK University's CSE Department with three distinct user roles:

- **Students**: View attendance, marks, timetable, and announcements
- **Faculty**: Manage attendance, enter marks, post announcements
- **Admin**: Complete system administration and user management

## 🚀 Tech Stack

### Frontend
- **React 18** with Vite
- **React Router DOM** for routing
- **Axios** for API calls
- **JWT Decode** for token management
- **Custom Design System** with CSS variables

### Backend (To be integrated)
- Node.js + Express.js
- MongoDB Atlas
- JWT Authentication
- bcrypt for password hashing

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/      # Reusable components
│   ├── context/         # React Context (Auth)
│   ├── pages/           # Page components
│   │   ├── Login.jsx
│   │   ├── ChangePassword.jsx
│   │   └── StudentDashboard.jsx
│   ├── services/        # API services
│   │   └── api.js
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Main app with routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles & design system
├── .env                 # Environment variables
└── package.json
```

## 🎨 Design System

The application uses a comprehensive design system with:

- **Premium Color Palette**: Primary (Blue), Accent (Purple), Success, Warning, Error
- **Typography**: Inter font family with responsive sizes
- **Spacing System**: Consistent spacing tokens (xs to 3xl)
- **Component Library**: Cards, buttons, inputs, badges with premium styling
- **Animations**: Smooth transitions and micro-interactions
- **Responsive Design**: Mobile-first approach

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

1. **Student Role**
   - Login: `{rollNumber}@sku.edu` / Password: `{rollNumber}` (first time)
   - Access: Read-only view of personal data
   - Features: Attendance, Marks, Timetable, Announcements

2. **Faculty Role**
   - Login: `sku@faculty.edu` / Password: `faculty123`
   - Access: Manage students, attendance, marks
   - Features: Attendance marking, Marks entry, Announcements posting

3. **Admin Role**
   - Login: `sku@admin.edu` / Password: `admin123`
   - Access: Full system control
   - Features: User management, System configuration

### Security Features

- JWT-based authentication with access + refresh tokens
- Automatic token refresh on expiration
- Protected routes with role validation
- First-time password change enforcement
- Password strength requirements:
  - Minimum 8 characters
  - 1 uppercase, 1 lowercase letter
  - 1 number, 1 special character
- Account lock after multiple failed attempts (backend)

## 🎯 Key Features

### Student Portal
- **Dashboard Overview**: Key stats at a glance
- **Subject-wise Attendance**: Percentage tracking with visual indicators
- **Internal Marks**: Mid-1, Mid-2 scores
- **Daily Timetable**: Today's schedule + weekly view
- **Announcements**: General + subject-specific notifications

### Faculty Portal (Coming Soon)
- Attendance management per subject/period/date
- Marks entry and updates
- Analytics dashboard
- Announcement posting

### Admin Portal (Coming Soon)
- Student & faculty management
- Subject assignment
- System logs and analytics
- Bulk operations

## 💻 Development Setup

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (for backend)

### Installation

1. **Clone the repository**
```bash
cd c:\Users\Yuvakiran\OneDrive\Desktop\SKU
```

2. **Install frontend dependencies**
```bash
cd frontend
npm install
```

3. **Configure environment**
```bash
# Copy .env.example to .env
# Update VITE_API_URL when backend is ready
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Quick Login (Development)

Use these credentials to test different roles:

- **Student**: `2310101@sku.edu` / `2310101`
- **Faculty**: `sku@faculty.edu` / `faculty123`
- **Admin**: `sku@admin.edu` / `admin123`

## 📋 API Integration

The frontend is ready for backend integration. API endpoints are defined in `src/services/api.js`:

### Auth API
- POST `/auth/login` - User login
- POST `/auth/change-password` - Change password
- POST `/auth/refresh` - Refresh access token

### Student API
- GET `/student/profile` - Get student profile
- GET `/student/attendance` - Get attendance data
- GET `/student/marks` - Get marks data
- GET `/student/timetable` - Get timetable
- GET `/student/announcements` - Get announcements

### Faculty API
- POST `/faculty/attendance` - Mark attendance
- PUT `/faculty/attendance/:id` - Update attendance
- POST `/faculty/marks` - Enter marks
- PUT `/faculty/marks/:id` - Update marks
- POST `/faculty/announcements` - Post announcement
- GET `/faculty/analytics/:subjectId` - Get analytics

### Admin API
- POST `/admin/students` - Create student
- PUT `/admin/students/:id` - Update student
- DELETE `/admin/students/:id` - Delete student
- POST `/admin/faculty` - Create faculty
- POST `/admin/subjects` - Create subject
- GET `/admin/logs` - Get system logs
- GET `/admin/stats` - Get system statistics

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` folder.

### Environment Variables

Update `.env` for production:

```env
VITE_API_URL=https://your-backend-api.com/api
```

## 📱 Responsive Design

The application is fully responsive and optimized for:

- Desktop (1280px+)
- Tablet (768px - 1279px)
- Mobile (320px - 767px)

## 🎨 UI/UX Highlights

- **Glassmorphism** cards with backdrop blur
- **Gradient Animations** on login/change password pages
- **Smooth Transitions** between states and routes
- **Visual Feedback** for user interactions
- **Color-coded Status** indicators (attendance, marks)
- **Loading States** with spinners
- **Error Handling** with user-friendly messages
- **Empty States** with helpful visuals
- **Premium Typography** with Inter font

## 🔜 Next Steps

1. **Backend Development**
   - Set up Express.js server
   - Configure MongoDB Atlas
   - Implement JWT authentication
   - Create REST API endpoints
   - Seed initial data

2. **Faculty Dashboard**
   - Attendance marking interface
   - Marks entry system
   - Analytics visualization

3. **Admin Dashboard**
   - User management CRUD
   - Bulk operations
   - System monitoring

4. **Additional Features**
   - Email notifications
   - Export to PDF/Excel
   - Mobile app (React Native)
   - Real-time updates (WebSocket)

## 📝 License

Proprietary - SK University CSE Department

## 👨‍💻 Development

Built with ❤️ for SK University

**Status**: Frontend Complete ✅ | Backend Integration Pending ⏳
