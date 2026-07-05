const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = (req, res, next) => {
    try {
        // Optional debug logging controlled by env var
        if (process.env.DEBUG_AUTH === 'true') {
            console.log('Auth check - Authorization header:', req.header('Authorization'));
            console.log('Auth check - cookies:', req.headers.cookie);
        }
        // Check for Authorization header
            // Check for Authorization header
            let authHeader = req.header('Authorization');

            // If header missing, try to read token from cookies (fallback for tracking-prevention cases)
            if (!authHeader && req.headers && req.headers.cookie) {
                const m = req.headers.cookie.match(/(?:^|;\s*)(?:token|authToken)=([^;]+)/);
                if (m && m[1]) {
                    const cookieToken = decodeURIComponent(m[1]);
                    authHeader = `Bearer ${cookieToken}`;
                    if (process.env.DEBUG_AUTH === 'true') console.log('Auth token extracted from cookie fallback');
                }
            }

            if (!authHeader) {
                return res.status(401).json({ 
                    success: false,
                    message: 'Please login to access this resource' 
                });
            }

            // Extract token
            const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ 
                success: false,
                message: 'Invalid authorization token format' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user to request
        req.user = decoded;
        next();
    } catch (error) {
        // Handle different JWT errors specifically
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                message: 'Session expired. Please login again' 
            });
        }
        return res.status(401).json({ 
            success: false,
            message: 'Invalid or malformed token' 
        });
    }
};

exports.authorizeRoles = (...roles) => {
    return (req, res, next) => {
        try {
            if (!roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    success: false,
                    message: `Role (${req.user.role}) is not allowed to access this resource` 
                });
            }
            next();
        } catch (error) {
            return res.status(500).json({ 
                success: false,
                message: 'Internal server error during authorization' 
            });
        }
    };
};