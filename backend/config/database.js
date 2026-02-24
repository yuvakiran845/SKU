const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            // Keep the TCP socket alive so the connection never goes idle/cold
            serverSelectionTimeoutMS: 10000,   // fail fast if Atlas is unreachable
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
            maxPoolSize: 10,                   // maintain up to 10 pooled connections
            minPoolSize: 2,                    // always keep 2 ready — eliminates cold-start
            heartbeatFrequencyMS: 10000,       // ping Atlas every 10 s to keep connections warm
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
        console.log(`📊 Database: ${conn.connection.name}`);

        // ── Warmup ping ──────────────────────────────────────────────────────────
        // Execute a lightweight command right after connecting so that Mongoose's
        // internal connection pool and Atlas's connection are fully negotiated
        // BEFORE the first real user request arrives.  This is what eliminates the
        // 1–2 minute first-login delay: the slow handshake happens once at startup,
        // not on the user's first sign-in.
        try {
            await conn.connection.db.admin().ping();
            console.log('🏓 DB warmup ping succeeded — pool is hot and ready!');
        } catch (pingErr) {
            // Non-fatal — server is still up, just log it
            console.warn('⚠️  DB warmup ping failed (non-fatal):', pingErr.message);
        }

    } catch (error) {
        console.error(`❌ Error connecting to MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
