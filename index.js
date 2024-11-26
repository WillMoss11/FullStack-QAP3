const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.use(session({
    secret: "your_secret_key", 
    resave: false,
    saveUninitialized: true
}));

let users = []; // In a real app, use a database

app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// Middleware to check for admin role
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    } else {
        return res.redirect("/");
    }
}

// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/login", (req, res) => {
    res.render("login", { errorMessage: null });
});

app.post("/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
        return res.render("login", { errorMessage: "Account not found." });
    }

    bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
            return res.render("login", { errorMessage: "Invalid credentials." });
        }
        req.session.user = user;
        res.redirect("/");
    });
});

app.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null });
});

app.post("/signup", (req, res) => {
    const { username, email, password } = req.body;
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
        return res.render("signup", { errorMessage: "Email is already registered." });
    }

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) {
            return res.render("signup", { errorMessage: "Error hashing password." });
        }

        const newUser = { username, email, password: hashedPassword, role: 'user' }; // Default role
        users.push(newUser);
        req.session.user = newUser;
        res.redirect("/");
    });
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");
    });
});

// Admin route (only accessible by admins)
app.get("/admin", isAdmin, (req, res) => {
    res.render("admin", { users });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
