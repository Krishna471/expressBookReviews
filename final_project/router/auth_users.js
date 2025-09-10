const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");

let users = []; // In-memory user store

const isValid = (username) => {
    return users.some(user => user.username === username);
};

const authenticated = express.Router();

// ✅ Register new user
authenticated.post("/register", (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
    }

    if (isValid(username)) {
        return res.status(400).json({ message: "Username already exists" });
    }

    users.push({ username, password });
    return res.status(200).json({ message: "User registered successfully" });
});

// ✅ Login (generates JWT token and stores in session)
authenticated.post("/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        return res.status(401).json({ message: "Invalid username or password" });
    }

    let accessToken = jwt.sign({ username }, "access", { expiresIn: '1h' });
    req.session.authorization = { accessToken, username };

    return res.status(200).json({ message: "Login successful", token: accessToken });
});

// ✅ Add/Modify a book review
authenticated.put("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const review = req.query.review;
    const username = req.session.authorization?.username;

    if (!username) {
        return res.status(401).json({ message: "User not logged in" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (!review) {
        return res.status(400).json({ message: "Review is required" });
    }

    if (!books[isbn].reviews) {
        books[isbn].reviews = {};
    }

    // Add or update review
    books[isbn].reviews[username] = review;

    return res.status(200).json({
        message: "Review added/modified successfully",
        reviews: books[isbn].reviews
    });
});

// ✅ Delete a book review
authenticated.delete("/auth/review/:isbn", (req, res) => {
    const isbn = req.params.isbn;
    const username = req.session.authorization?.username;

    if (!username) {
        return res.status(401).json({ message: "User not logged in" });
    }

    if (!books[isbn]) {
        return res.status(404).json({ message: "Book not found" });
    }

    if (books[isbn].reviews && books[isbn].reviews[username]) {
        delete books[isbn].reviews[username];
        return res.status(200).json({
            message: "Review deleted successfully",
            reviews: books[isbn].reviews
        });
    } else {
        return res.status(404).json({ message: "No review found for this user" });
    }
});

module.exports.authenticated = authenticated;
