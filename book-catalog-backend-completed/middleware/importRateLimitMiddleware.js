// =====================================================
// IMPORT API RATE LIMIT
// =====================================================

const requests = new Map();

const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5;      // 5 import requests per minute

export const importRateLimit = (req, res, next) => {
    const key = req.user?.id
        ? `admin:${req.user.id}`
        : req.ip;

    const now = Date.now();

    let record = requests.get(key);

    // Start a new window
    if (
        !record ||
        now - record.startTime >= WINDOW_MS
    ) {
        record = {
            startTime: now,
            count: 0
        };
    }

    record.count++;

    requests.set(key, record);

    // Too many requests
    if (record.count > MAX_REQUESTS) {
        const retryAfter = Math.ceil(
            (WINDOW_MS - (now - record.startTime)) / 1000
        );

        res.setHeader(
            "Retry-After",
            String(retryAfter)
        );

        return res.status(429).json({
            success: false,
            message:
                "Too many import requests. Please try again later.",
            retryAfter
        });
    }

    next();
};