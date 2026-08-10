/*
=====================================================
ROLE AUTHORIZATION MIDDLEWARE
=====================================================
*/

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        /*
        ---------------------------------------------
        Check Authentication
        ---------------------------------------------
        */

        if (!req.admin) {
            return res.status(401).json({
                success: false,
                message:
                    "Authentication required"
            });
        }

        /*
        ---------------------------------------------
        Check Role
        ---------------------------------------------
        */

        if (
            !allowedRoles.includes(
                req.admin.role
            )
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "You do not have permission to access this resource"
            });
        }

        next();
    };
};