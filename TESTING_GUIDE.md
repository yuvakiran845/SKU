# 🧪 TESTING GUIDE - SKUCET Attendance Management System

## Quick Start Testing

### 1. Access the Application

**Frontend**: http://localhost:5174 (or port shown in terminal)
**Backend**: http://localhost:5000

---

## 🔐 Test Credentials

### Student Login
```
Email: 2310101@sku.edu
Password: 2310101
Role: Student
```

### Faculty Login
```
Email: sku@faculty.edu
Password: faculty123
Role: Faculty
```

### Admin Login
```
Email: sku@admin.edu
Password: admin123
Role: Admin
```

---

## 📋 Testing Scenarios

### Scenario 1: Login Page Testing

#### Steps:
1. Navigate to http://localhost:5174
2. **Test Role Selector**:
   - Click "Student" - verify button turns purple/active
   - Click "Faculty" - verify button turns purple/active
   - Click "Admin" - verify button turns green/active
3. **Test Show/Hide Password**:
   - Enter any password
   - Click eye icon - password should become visible
   - Click again - password should be hidden
4. **Test Quick Login**:
   - Click "Student" quick login button
   - Verify email/password auto-fill
   - Click "Sign In"
5. **Verify Design Elements**:
   - [ ] SKUCET logo visible in header
   - [ ] Glass morphism card effect
   - [ ] Animated gradient background orbs
   - [ ] Smooth transitions on hover
   - [ ] Responsive on mobile

**Expected Result**: ✅ Login successful, redirect to respective dashboard

---

### Scenario 2: Student Dashboard Testing

#### Steps:
1. Login as student (2310101@sku.edu / 2310101)
2. **Check Overview Tab**:
   - [ ] 4 stat cards visible (Attendance, Mid-1, Mid-2, Classes)
   - [ ] Stats show correct data or 0%
   - [ ] Today's schedule displayed
   - [ ] Recent announcements visible
3. **Check Attendance Tab**:
   - Click "Attendance" tab
   - [ ] Subject-wise attendance cards displayed
   - [ ] Each card shows Present/Absent/Total
   - [ ] Percentage calculated correctly
   - [ ] Color coding:
     - Green: ≥75%
     - Blue: ≥65%
     - Orange: ≥50%
     - Red: <50%
4. **Check Marks Tab**:
   - Click "Marks" tab
   - [ ] Table shows subjects with Mid-1, Mid-2, Assignment marks
5. **Check Announcements Tab**:
   - Click "Announcements" tab
   - [ ] All announcements listed

**Expected Result**: ✅ All data displays correctly, no errors

---

### Scenario 3: Faculty Dashboard Testing

#### Steps:
1. Login as faculty (sku@faculty.edu / faculty123)
2. **Check Overview**:
   - [ ] Subjects list displayed in grid
   - [ ] Can select a subject (card highlights)
3. **Test Attendance Marking**:
   - Click "Attendance" tab
   - Select a subject (if not auto-selected)
   - **Step 1: Set Details**
     - Select today's date
     - Choose period (1-6)
   - **Step 2: Mark Attendance**
     - [ ] Roll chips grid displayed
     - [ ] Legend shows "Click = Present, Unmarked = Absent"
     - Click on a few roll numbers (e.g., 2310101, 2310102)
     - [ ] Clicked chips turn green
     - [ ] Tick icon appears on green chips
     - [ ] Summary updates (Present/Absent/Total)
   - **Step 3: Mark All Present (Optional)**
     - Click "Mark All as Present"
     - [ ] All chips turn green
   - **Step 4: Finalize**
     - Click "Finalize Attendance"
     - [ ] Success message appears
     - [ ] Summary shows final counts

**Expected Result**: ✅ Attendance saved successfully

---

### Scenario 4: Attendance Sync Testing (CRITICAL)

#### Steps:
1. **As Faculty**:
   - Mark attendance for "SOS Lab" (or any subject)
   - Date: Today
   - Period: 1
   - Mark 2310101 as Present
   - Mark 2310102 as Absent (don't click chip)
   - Finalize

2. **Logout from Faculty**

3. **Login as Student (2310101)**:
   - Go to Attendance tab
   - Find "SOS Lab" card
   - **Verify**:
     - [ ] Present count = 1 (for 2310101)
     - [ ] Total count increased by 1
     - [ ] Percentage updated correctly

4. **Login as Student (2310102)**:
   - Go to Attendance tab
   - Find "SOS Lab" card
   - **Verify**:
     - [ ] Absent count = 1 (for 2310102)
     - [ ] Total count increased by 1
     - [ ] Percentage updated correctly

**Expected Result**: ✅ Each student sees their OWN attendance correctly

---

### Scenario 5: Admin Dashboard Testing

#### Steps:
1. Login as admin (sku@admin.edu / admin123)
2. **Check Overview**:
   - [ ] 3 centered stat cards (Students, Faculty, Subjects)
   - [ ] Correct counts displayed
   - [ ] Hover effects work
3. **Test Student Management**:
   - Click "Students" tab
   - [ ] Table displays all students
   - [ ] Search bar works
   - Click "Add Student" button
   - **Fill Form**:
     - Name: Test Student
     - Email: test@sku.edu
     - Roll Number: 2310199
     - Password: test123
     - Branch: CSE
     - Semester: 2
   - Click "Create Student"
   - **Verify**:
     - [ ] Success message
     - [ ] Student appears in table
4. **Test Faculty Management**:
   - Click "Faculty" tab
   - [ ] Faculty list displayed
   - Click "Add Faculty"
   - Fill form and create
   - [ ] Faculty added successfully

**Expected Result**: ✅ Admin can manage users

---

## 🎨 Visual Quality Checks

### Design System Verification:

#### Login Page:
- [ ] Inter font family used
- [ ] SKUCET logo 80px × 80px, centered
- [ ] Glass card with backdrop blur
- [ ] Gradient animated background
- [ ] Role buttons have active state
- [ ] Show/hide password icon visible
- [ ] "Back to Home" button top-left
- [ ] Footer text centered

#### Admin Dashboard:
- [ ] Green accent color (#10b981)
- [ ] SKUCET logo 56px × 56px in navbar
- [ ] 3 stats centered on page
- [ ] Tabs have active green state
- [ ] Cards have hover lift effect
- [ ] Command-center professional feel
- [ ] Modal forms styled properly

#### Faculty Dashboard:
- [ ] Purple accent color (#7c3aed)
- [ ] White/clean background
- [ ] Subjects grid displays properly
- [ ] Roll chips grid responsive
- [ ] Green chips for present students
- [ ] Tick icon on present chips
- [ ] Summary boxes color-coded
- [ ] Forms and inputs clean

#### Student Dashboard:
- [ ] Blue/Purple accent (#635bff)
- [ ] 4 stat cards with progress bars
- [ ] Attendance cards color-coded
- [ ] Schedule timeline clean
- [ ] Announcements styled properly
- [ ] Tables readable and responsive

---

## 📱 Responsive Testing

### Desktop (1920×1080):
- [ ] All elements visible without scrolling (initially)
- [ ] Stats in 4-column grid
- [ ] Proper spacing and alignment

### Laptop (1366×768):
- [ ] Content readable
- [ ] Stats adapt (2 columns if needed)
- [ ] No horizontal scroll

### Tablet (768×1024):
- [ ] Tabs wrap properly
- [ ] Stats become 1-2 columns
- [ ] Forms adapt to single column
- [ ] Touch targets adequate (44px min)

### Mobile (375×667):
- [ ] Navbar collapses vertically
- [ ] Stats single column
- [ ] Roll chips grid adapts
- [ ] Tables scroll horizontally
- [ ] Touch-friendly buttons

---

## 🐛 Common Issues & Solutions

### Issue 1: "Network Error" on login
**Solution**: 
- Check backend is running (http://localhost:5000)
- Verify MongoDB connection
- Check `.env` file has correct values

### Issue 2: Attendance not showing for student
**Solution**:
- Verify faculty finalized attendance (not just marked)
- Check subject ID matches
- Confirm student is enrolled in the subject
- Check browser console for errors

### Issue 3: Logo not displaying
**Solution**:
- Verify `skucet-logo.png` exists in `/public` folder
- Check file path: `/skucet-logo.png` (with leading slash)
- Clear browser cache

### Issue 4: Styles not applying
**Solution**:
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check CSS file imported in component
- Verify no syntax errors in CSS
- Check browser DevTools for CSS conflicts

### Issue 5: "Attendance already exists" error
**Solution**:
- Attendance can only be marked once per subject/date/period
- Change date or period to mark again
- Or delete existing entry from database

---

## ✅ Success Indicators

### System is Working if:
1. ✅ All 3 roles can login successfully
2. ✅ SKUCET logo visible on all pages
3. ✅ Dashboards load without errors
4. ✅ Faculty can mark attendance
5. ✅ Students see their attendance correctly
6. ✅ Percentage calculations are accurate
7. ✅ Admin can create users
8. ✅ No console errors
9. ✅ Smooth animations and transitions
10. ✅ Responsive on mobile devices

---

## 📊 Performance Benchmarks

### Target Metrics:
- **Page Load**: < 2 seconds
- **Login Response**: < 1 second
- **Data Fetch**: < 500ms
- **UI Interactions**: Instant (< 100ms)
- **Animations**: 60fps

### How to Measure:
1. Open Chrome DevTools
2. Go to "Lighthouse" tab
3. Run audit
4. **Target Scores**:
   - Performance: > 90
   - Accessibility: > 95
   - Best Practices: > 90
   - SEO: > 90

---

## 🔐 Security Testing

### Basic Checks:
- [ ] Cannot access admin routes as student
- [ ] Cannot access faculty routes as student
- [ ] Logout clears session
- [ ] Protected routes redirect to login
- [ ] Password is hidden by default
- [ ] No sensitive data in console logs
- [ ] CORS configured properly

---

## 📝 Test Report Template

```markdown
## Test Session Report

**Date**: YYYY-MM-DD
**Tester**: [Name]
**Duration**: [Time taken]

### Tested Scenarios:
- [ ] Scenario 1: Login Page
- [ ] Scenario 2: Student Dashboard
- [ ] Scenario 3: Faculty Dashboard
- [ ] Scenario 4: Attendance Sync
- [ ] Scenario 5: Admin Dashboard

### Issues Found:
1. [Issue description]
   - **Severity**: Critical/High/Medium/Low
   - **Steps to Reproduce**: 
   - **Expected**: 
   - **Actual**: 
   - **Screenshot**: 

### Overall Assessment:
- **UI/UX**: [Rating /10]
- **Functionality**: [Rating /10]
- **Performance**: [Rating /10]
- **Responsiveness**: [Rating /10]

### Recommendations:
- [List of improvements]
```

---

## 🚀 Quick Commands

### Start Application:
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Clear Cache & Restart:
```bash
# Frontend
cd frontend
rm -rf node_modules/.vite
npm run dev

# Backend (if needed)
cd backend
npm run dev
```

### View Logs:
```bash
# Check for errors
# Frontend: Browser console (F12)
# Backend: Terminal output
```

---

**Happy Testing! 🎉**

For any issues, check the console logs first, then refer to the ENTERPRISE_IMPLEMENTATION.md document.
