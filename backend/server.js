require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Import routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const facultyRoutes = require('./routes/facultyRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Initialize express app
const app = express();

// ── Database connection ───────────────────────────────────────────────────────
connectDB().then(() => {
    require('./migrations/cleanupTimetable')();
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// ── Health / Ping endpoint (used by UptimeRobot + self-ping) ─────────────────
// Responds instantly with 200 — no DB call, so Render never has to cold-start
// before answering this request.
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        message: 'SKUCET Backend is alive 🟢'
    });
});

// Alias — some monitors use /ping
app.get('/ping', (req, res) => res.status(200).send('pong'));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'SK University CSE Department - Backend API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            student: '/api/student',
            faculty: '/api/faculty',
            admin: '/api/admin',
            health: '/health'
        }
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 SK University Backend Server Started!');
    console.log('='.repeat(60));
    console.log(`📍 Server running on port: ${PORT}`);
    console.log(`🌐 API URL: http://localhost:${PORT}`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(60) + '\n');
    console.log('✅ Ready to accept requests!\n');

    // ── Self-keep-alive ping ──────────────────────────────────────────────────
    // Render's free tier spins the server down after 15 min of inactivity.
    // This pings our own /health endpoint every 4 minutes so the server NEVER
    // sleeps, making every login (including the very first) respond in < 2 sec.
    //
    // Only runs in production (on Render) where RENDER_EXTERNAL_URL is set.
    // Does NOT run locally to avoid unnecessary noise.
    const selfPingUrl = process.env.RENDER_EXTERNAL_URL
        ? `${process.env.RENDER_EXTERNAL_URL}/health`
        : null;

    if (selfPingUrl) {
        console.log(`🏓 Self-keep-alive enabled → pinging ${selfPingUrl} every 4 min\n`);

        // Use Node's built-in https/http — no extra dependency needed
        const httpModule = selfPingUrl.startsWith('https') ? require('https') : require('http');

        const selfPing = () => {
            httpModule.get(selfPingUrl, (res) => {
                console.log(`🟢 Self-ping OK [${new Date().toISOString()}] status=${res.statusCode}`);
            }).on('error', (err) => {
                console.warn(`🟡 Self-ping failed (non-fatal): ${err.message}`);
            });
        };

        // First ping 30 seconds after startup so the server is fully ready
        setTimeout(selfPing, 30_000);

        // Then every 4 minutes (240 000 ms) — well under Render's 15-min idle timeout
        setInterval(selfPing, 4 * 60 * 1000);
    } else {
        console.log('ℹ️  Self-keep-alive skipped (local dev environment)\n');
    }
});

// ── Server error handling ─────────────────────────────────────────────────────
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error('\n' + '!'.repeat(60));
        console.error(`❌ Port ${PORT} is already in use!`);
        console.error('👉 Please close any other terminals running the backend server.');
        console.error('!'.repeat(60) + '\n');
        process.exit(1);
    } else {
        throw error;
    }
});

process.on('unhandledRejection', (err) => {
    console.error('❌ Unhandled Promise Rejection:', err);
    server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    server.close(() => console.log('✅ Process terminated!'));
});

module.exports = app;
