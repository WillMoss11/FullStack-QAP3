const express = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const PORT = 3000;
const SALT_ROUNDS = 10;

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
    session({
        secret: "replace_this_with_a_secure_key",
        resave: false,
        saveUninitialized: true,
    })
);

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// In-memory store of users (no database)
const USERS = [
    {
        id: 1,
        username: "AdminUser",
        email: "admin@example.com",
        password: bcrypt.hashSync("admin123", SALT_ROUNDS),
        role: "admin",
    },
    {
        id: 2,
        username: "RegularUser",
        email: "user@example.com",
        password: bcrypt.hashSync("user123", SALT_ROUNDS),
        role: "user",
    },
];

// GET /login - Render login form
app.get("/login", (request, response) => {
    response.render("login", { user: request.session.user || null });
});

// POST /login - Allows a user to login
app.post("/login", (request, response) => {
    const { email, password } = request.body;
    const user = USERS.find((user) => user.email === email);

    if (user && bcrypt.compareSync(password, user.password)) {
        // Save user to session
        request.session.user = user;
        return response.redirect("/landing");
    }

    response.render("login", { error: "Invalid email or password", user: request.session.user || null });
});

// GET /signup - Render signup form
app.get("/signup", (request, response) => {
    // Pass `error` if any and also pass `user` to handle it in the header
    response.render("signup", { user: request.session.user || null, error: null });
});

// POST /signup - Allows a user to signup
app.post("/signup", (request, response) => {
    const { email, username, password } = request.body;

    // Check if email already exists
    if (USERS.some((user) => user.email === email)) {
        return response.render("signup", { 
            error: "Email already exists", 
            user: request.session.user || null 
        });
    }

    const hashedPassword = bcrypt.hashSync(password, SALT_ROUNDS);
    const newUser = {
        id: USERS.length + 1,
        username,
        email,
        password: hashedPassword,
        role: "user", // default to regular user
    };

    USERS.push(newUser);

    // Log the user in after registration
    request.session.user = newUser;
    response.redirect("/landing");
});

// GET / - Render index page or redirect to landing if logged in
app.get("/", (request, response) => {
    if (request.session.user) {
        return response.redirect("/landing");
    }
    response.render("index", { user: request.session.user || null });
});

// GET /landing - Shows a welcome page for users, shows the names of all users if an admin
app.get("/landing", (request, response) => {
    if (!request.session.user) {
        return response.redirect("/login");
    }

    const currentUser = request.session.user;
    if (currentUser.role === "admin") {
        return response.render("landing", { user: currentUser, users: USERS });
    }

    response.render("landing", { user: currentUser });
});

// GET /logout - Logs the user out
app.get("/logout", (request, response) => {
    request.session.destroy((err) => {
        if (err) {
            return response.status(500).send("Could not log out");
        }
        response.redirect("/");
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
