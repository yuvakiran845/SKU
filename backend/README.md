# SK University - Backend API

Complete production-ready backend for SK University CSE Department Academic Management System.

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── studentController.js # Student operations
│   ├── facultyController.js # Faculty operations
│   └── adminController.js   # Admin operations
├── middleware/
│   └── auth.js             # JWT & authorization
├── models/
│   ├── User.js             # User schema (Student/Faculty/Admin)
│   ├── Subject.js          # Subject schema
│   ├── Attendance.js       # Attendance schema
│   ├── Marks.js            # Marks schema
│   ├── Announcement.js     # Announcement schema
│   └── Timetable.js        # Timetable schema
├── routes/
│   ├── authRoutes.js       # Auth endpoints
│   ├── studentRoutes.js    # Student endpoints
│   ├── facultyRoutes.js    # Faculty endpoints
│   └── adminRoutes.js      # Admin endpoints
├── scripts/
│   └── seedDatabase.js     # Database seeder
├── .env                    # Environment variables
├── .env.example            # Environment template
├── .gitignore             # Git ignore rules
├── package.json           # Dependencies
└── server.js              # Main entry point
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `MONGODB_URI` - MongoDB connection string
- `JWT_ACCESS_SECRET` - Secret for access tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

### 3. Start MongoDB

Make sure MongoDB is running:

```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or use MongoDB Compass / MongoDB Atlas
```

### 4. Seed Database (Optional)

Populate database with sample data:

```bash
npm run seed
```

This creates:
- 1 Admin
- 3 Faculty members
- 50 Students
- 5 Subjects
- Timetable
- Announcements

### 5. Start Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

Server will start on `http://localhost:5000`

## 📋 Default Credentials (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | sku@admin.edu | admin123 |
| Faculty | sku@faculty.edu | faculty123 |
| Student | 2310101@sku.edu | 2310101 |

## 📡 API Endpoints

### Authentication (`/api/auth`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/login` | Login user | Public |
| POST | `/refresh` | Refresh access token | Public |
| POST | `/change-password` | Change password | Private |
| GET | `/me` | Get current user | Private |

### Student (`/api/student`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/profile` | Get student profile | Student |
| GET | `/attendance` | Get attendance records | Student |
| GET | `/marks` | Get marks | Student |
| GET | `/timetable` | Get timetable | Student |
| GET | `/announcements` | Get announcements | Student |

### Faculty (`/api/faculty`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/profile` | Get faculty profile | Faculty |
| GET | `/subjects` | Get assigned subjects | Faculty |
| GET | `/students/:subjectId` | Get students by subject | Faculty |
| POST | `/attendance` | Mark attendance | Faculty |
| GET | `/attendance/:subjectId` | Get attendance by subject | Faculty |
| POST | `/marks` | Enter marks | Faculty |
| GET | `/marks/:subjectId` | Get marks by subject | Faculty |
| POST | `/announcements` | Post announcement | Faculty |
| GET | `/announcements` | Get announcements | Faculty |

### Admin (`/api/admin`)

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/students` | Create student | Admin |
| GET | `/students` | Get all students | Admin |
| GET | `/students/:id` | Get single student | Admin |
| PUT | `/students/:id` | Update student | Admin |
| DELETE | `/students/:id` | Delete student | Admin |
| POST | `/students/bulk` | Bulk create students | Admin |
| POST | `/faculty` | Create faculty | Admin |
| GET | `/faculty` | Get all faculty | Admin |
| DELETE | `/faculty/:id` | Delete faculty | Admin |
| POST | `/subjects` | Create subject | Admin |
| GET | `/subjects` | Get all subjects | Admin |
| POST | `/subjects/assign` | Assign subject to faculty | Admin |
| GET | `/stats` | Get system statistics | Admin |

## 🔒 Authentication Flow

1. User sends email and password to `/api/auth/login`
2. Server validates credentials
3. Server generates JWT access token (1h) and refresh token (7d)
4. Client stores both tokens
5. Client includes access token in Authorization header for protected routes
6. When access token expires, client uses refresh token to get new access token

## 🗄️ Database Models

### User
- Supports Student, Faculty, and Admin roles
- Password hashing with bcrypt
- Role-specific fields (rollNumber for students, employeeId for faculty)

### Subject
- Subject code, name, credits
- Linked to faculty member
- Semester and branch

### Attendance
- Date and period-wise tracking
- Linked to subject and faculty
- Array of student attendance records (P/A)

### Marks
- Student marks for exams (mid1, mid2, final)
- Linked to student and subject
- Tracks who entered the marks

### Announcement
- Targeted announcements (by role, semester, branch, subject)
- Priority levels (low, medium, high)
- Created by admin or faculty

### Timetable
- Semester and branch-wise
- Day-period wise slots
- Linked to subjects and faculty

## 🔐 Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ Token refresh mechanism
- ✅ Role-based access control (RBAC)
- ✅ Protected routes middleware
- ✅ Input validation
- ✅ CORS configuration
- ✅ Environment variable protection

## 🧪 Testing the API

### Using Postman/Thunder Client

1. **Login:**
```
POST http://localhost:5000/api/auth/login
Body (JSON):
{
  "email": "sku@admin.edu",
  "password": "admin123"
}
```

2. **Get Student Attendance:**
```
GET http://localhost:5000/api/student/attendance
Headers:
Authorization: Bearer <your_access_token>
```

3. **Mark Attendance (Faculty):**
```
POST http://localhost:5000/api/faculty/attendance
Headers:
Authorization: Bearer <faculty_access_token>
Body (JSON):
{
  "subjectId": "...",
  "date": "2026-02-05",
  "period": 1,
  "records": [
    { "student": "studentId1", "status": "P" },
    { "student": "studentId2", "status": "A" }
  ]
}
```

## 🚀 Connecting to Frontend

1. Make sure backend is running on `http://localhost:5000`
2. In frontend `/src/services/api.js`, set:
```javascript
const USE_MOCK_API = false;  // Use real backend
```
3. Ensure `.env` in frontend has:
```
VITE_API_URL=http://localhost:5000/api
```

## 📊 Production Deployment

### Environment Variables for Production

Update these in production `.env`:
```
NODE_ENV=production
MONGODB_URI=<your_mongodb_atlas_uri>
JWT_ACCESS_SECRET=<strong_random_secret>
JWT_REFRESH_SECRET=<different_strong_random_secret>
FRONTEND_URL=<your_frontend_url>
```

### Deployment Platforms

- **Railway** - Easiest for Node.js + MongoDB
- **Render** - Free tier available
- **Heroku** - Classic option
- **DigitalOcean** - More control

## 🐛 Common Issues

### MongoDB Connection Failed
- Ensure MongoDB is running
- Check `MONGODB_URI` in `.env`
- For MongoDB Atlas, whitelist your IP

### JWT Token Errors
- Check if secrets are set in `.env`
- Verify token is being sent in Authorization header
- Check token expiration

### CORS Errors  
- Update `FRONTEND_URL` in `.env`
- Check CORS middleware in `server.js`

## 📝 License

MIT

---

**Built with ❤️ for SK University CSE Department**
