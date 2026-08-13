// =====================================================
// JWT TOKEN BLACKLIST
// =====================================================

// Stores revoked tokens in memory
const blacklistedTokens = new Map();

// Add token to blacklist
export const blacklistToken = (token, expiresAt) => {
    blacklistedTokens.set(token, expiresAt);
};

// Check whether token has been blacklisted
export const isTokenBlacklisted = (token) => {
    const expiresAt = blacklistedTokens.get(token);

    if (!expiresAt) {
        return false;
    }

    // Token blacklist entry has expired
    if (Date.now() >= expiresAt) {
        blacklistedTokens.delete(token);
        return false;
    }

    return true;
};

// Remove expired blacklist entries
export const cleanupBlacklist = () => {
    const now = Date.now();

    for (const [token, expiresAt] of blacklistedTokens.entries()) {
        if (now >= expiresAt) {
            blacklistedTokens.delete(token);
        }
    }
};