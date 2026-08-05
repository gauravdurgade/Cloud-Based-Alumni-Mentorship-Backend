const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect routes
const protect = async (req, res, next) => {
    console.log("\n========== AUTH MIDDLEWARE ==========");

    let token;

    try {
        console.log("Authorization Header:");
        console.log(req.headers.authorization);

        if (
            req.headers.authorization &&
            req.headers.authorization.startsWith("Bearer ")
        ) {
            // Extract token
            token = req.headers.authorization.split(" ")[1];

            console.log("\nExtracted Token:");
            console.log(token);

            console.log("\nJWT_SECRET:");
            console.log(process.env.JWT_SECRET);

            // Verify JWT
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            console.log("\nDecoded Token:");
            console.log(decoded);

            // Find user
            req.user = await User.findById(decoded.id).select("-password");

            console.log("\nUser:");
            console.log(req.user);

            if (!req.user) {
                console.log("\nUser not found in database.");

                return res.status(401).json({
                    success: false,
                    message: "Not authorized, user not found"
                });
            }

            console.log("\nAuthentication Successful");
            console.log("=====================================\n");

            return next();
        }

        console.log("\nNo Bearer token received.");

        return res.status(401).json({
            success: false,
            message: "Not authorized, no token"
        });

    } catch (error) {

        console.log("\n========== JWT ERROR ==========");
        console.log("Name:", error.name);
        console.log("Message:", error.message);
        console.log(error.stack);
        console.log("===============================\n");

        return res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

// Grant access to specific roles
const authorize = (...roles) => {
    return (req, res, next) => {

        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated"
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized to access this route`
            });
        }

        next();
    };
};

module.exports = {
    protect,
    authorize
};