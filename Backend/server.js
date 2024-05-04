const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

const app = express();
const port = 4000;
app.use(cors());

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
});

connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL: " + err.stack);
    return;
  }
  console.log("Connected to MySQL as ID: " + connection.threadId);
});

app.use(bodyParser.json());

app.post("/api/register", (req, res) => {
  const { username, password, email, mobileNumber, role } = req.body;
  const sql =
    "INSERT INTO users (username, password, email, mobileNumber, role) VALUES (?, ?, ?, ?, ?)";
  connection.query(
    sql,
    [username, password, email, mobileNumber, role],
    (err, result) => {
      if (err) {
        console.error("Error registering user: " + err.message);
        res.status(500).send("Registration failed");
        return;
      }
      console.log("User registered:", result);
      res.status(200).send("User registered successfully");
    }
  );
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const sql =
    "SELECT id, username, role FROM users WHERE username =? AND password =?";
  connection.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error("Error logging in user: " + err.message);
      res.status(500).send("Login failed");
      return;
    }
    if (result.length > 0) {
      const user = result[0];
      // Include the user role in the response
      res
        .status(200)
        .json({ userId: user.id, username: user.username, role: user.role });
      console.log("User logged in:", user);
    } else {
      res.status(401).send("Invalid username or password");
    }
  });
});

app.post("/api/logout", (req, res) => {
  res.status(200).send("Logout successful");
});

app.post("/api/posts", (req, res) => {
  const { userId, text } = req.body;
  const sql = "INSERT INTO feed (user_id, text) VALUES (?, ?)";
  connection.query(sql, [userId, text], (err, result) => {
    if (err) {
      console.error("Error creating post: " + err.message);
      res.status(500).send("Post creation failed");
      return;
    }
    console.log("New post created:", result);
    res.status(200).send("Post created successfully");
  });
});

app.get("/api/posts/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = "SELECT * FROM feed WHERE user_id = ?";
  connection.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching posts: " + err.message);
      res.status(500).send("Error fetching posts");
      return;
    }
    console.log("Posts fetched successfully:", results);
    res.status(200).json(results);
  });
});

app.delete("/api/posts/:postId", (req, res) => {
  const postId = req.params.postId;

  const sql = "DELETE FROM feed WHERE id =?";

  connection.query(sql, [postId], (err, result) => {
    if (err) {
      console.error("Error deleting post: " + err.message);
      res.status(500).send("Failed to delete post");
      return;
    }

    if (result.affectedRows === 0) {
      res.status(404).send("Post not found");
      return;
    }

    res.status(200).send("Post deleted successfully");
  });
});
app.get("/api/posts", (req, res) => {
  const { userId, role } = req.query;

  if (!userId || !role) {
    res.status(400).send("User ID and role are required");
    return;
  }

  if (role !== "admin") {
    res.status(403).send("Unauthorized access");
    return;
  }

  const sql = "SELECT * FROM feed";
  connection.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching all posts: " + err.message);
      res.status(500).send("Error fetching posts");
      return;
    }
    console.log("All posts fetched successfully:", results);
    res.status(200).json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
