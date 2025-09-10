const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');

const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();
app.use(express.json());

// ✅ Session setup for customers
app.use("/customer", session({
    secret: "fingerprint_customer",
    resave: true,
    saveUninitialized: true
}));

// ✅ Authentication middleware for protected routes
app.use("/customer/auth/*", function auth(req, res, next) {
    const token = req.session.authorization?.accessToken;
    if (!token) {
        return res.status(401).json({ message: "User not logged in or token missing" });
    }

    jwt.verify(token, "access", (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: "Invalid or expired token" });
        }
        req.user = decoded.username; // store username in request object
        next();
    });
});

// ✅ Routes
app.use("/customer", customer_routes);  // Customer routes (register, login, etc.)
app.use("/", genl_routes);              // Public routes (books)

// ✅ Root endpoint
app.get("/", (req, res) => {
    res.send("Welcome to the Book Review API 🚀");
});

// ✅ Start server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
