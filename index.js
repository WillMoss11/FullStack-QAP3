const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

// In-memory user storage (could later be replaced by a database)
let USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS), // Pre-hashed for demo purposes
        role: "admin", // Admin role
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user", // Regular user
    },
];

// Middleware for parsing data and serving static files
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

// Set view engine to EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Helper function to find user by email
const findUserByEmail = (email) => {
    return USERS.find((user) => user.email === email);
};

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login");
});

// POST /login - Handle user login
app.post("/login", (request, response) => {
    const { email, password } = request.body;

    // Find user by email
    const user = findUserByEmail(email);

    if (!user) {
        return response.status(400).send("Invalid credentials!");
    }

    // Compare passwords
    bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err || !isMatch) {
            return response.status(400).send("Invalid credentials!");
        }

        // Store user session data
        request.session.user = user;
        response.redirect("/landing");
    });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    response.render("signup");
});

// POST /signup - Handle user signup
app.post("/signup", (request, response) => {
    const { username, email, password } = request.body;

    // Check if the user already exists
    const existingUser = findUserByEmail(email);
    if (existingUser) {
        return response.status(400).send("User already exists!");
    }

    // Hash the password before storing it
    bcrypt.hash(password, SALT_ROUNDS, (err, hashedPassword) => {
        if (err) {
            return response.status(500).send("Error hashing password.");
        }

        // Create a new user and add it to the USERS array
        const newUser = {
            id: USERS.length + 1,  // Simple ID generation (for now)
            username,
            email,
            password: hashedPassword,
            role: "user",  // Regular user role
        };

        USERS.push(newUser);
        response.redirect("/login");
    });
});

// GET / - Home page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index");
});

// GET /landing - User landing page (dashboard)
app.get("/landing", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/login");
    }

    const user = request.session.user;
    if (user.role === "admin") {
        // Admin view: list all users
        return response.render("landing", { users: USERS });
    } else {
        // Regular user view: show username and basic dashboard
        return response.render("landing", { user });
    }
});

// GET /logout - Log the user out
app.get("/logout", (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            return response.status(500).send("Error logging out.");
        }
        response.redirect("/");
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
