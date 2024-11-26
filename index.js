const express = require("express");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcryptjs");

const app = express();
const port = 3000;

// Use EJS as the view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // Ensure views directory is correctly set

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve static files (like CSS) from the public folder
app.use(express.static(path.join(__dirname, "public")));

// Session middleware
app.use(session({
    secret: "your_secret_key", // Change this to a random secret
    resave: false,
    saveUninitialized: true
}));

// Dummy user data (for demo purposes)
let users = [
    // Admin user for testing
    { username: "admin", email: "admin@example.com", password: "adminpassword", role: "admin" }
];

// Middleware to pass `user` session data to views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;  // Add user to locals for all views
    next();
});

// Middleware to check if the user is an admin
function isAdmin(req, res, next) {
    if (req.session.user && req.session.user.role === 'admin') {
        return next();  // If user is an admin, proceed
    } else {
        res.redirect("/");  // Redirect to homepage if not an admin
    }
}

// Routes
app.get("/", (req, res) => {
    res.render("index"); // Renders index.ejs
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Check if the email and password are "admin@admin.com" and "admin"
  if (email === "admin@admin.com" && password === "admin") {
      // Create a user object with admin role
      const adminUser = { email: "admin@admin.com", username: "Admin", role: "admin" };
      req.session.user = adminUser;  // Set the admin user in session
      return res.redirect("/admin"); // Redirect to the admin page after logging in
  }

  // Otherwise, check for the regular user
  const user = users.find(u => u.email === email);

  if (!user) {
      return res.render("login", { errorMessage: "Account not found." });
  }

  bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
          return res.render("login", { errorMessage: "Invalid credentials." });
      }
      req.session.user = user; // Set the logged-in user in session
      res.redirect("/");  // Redirect to the homepage after successful login
  });
});


app.get("/login", (req, res) => {
  res.render("login", { errorMessage: null }); // This should render the login page
});

app.get("/signup", (req, res) => {
    res.render("signup", { errorMessage: null }); // Pass null if no error
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

      // Set role as 'user' by default
      const newUser = { username, email, password: hashedPassword, role: "user" };
      users.push(newUser);  // In a real app, save to a database
      req.session.user = newUser;
      res.redirect("/");  // Redirect to homepage after successful signup
  });
});

// Admin page route
app.get("/admin", (req, res) => {
  if (req.session.user && req.session.user.role === "admin") {
      // If the user is logged in and is an admin, pass the 'users' array
      res.render("admin", { users: users });  // Pass the users array to the view
  } else {
      // If the user is not an admin, redirect to the homepage
      res.redirect("/");
  }
});

app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/");  // Redirect to home page after logout
    });
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
