import express from "express";
import mysql from "mysql2";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = mysql.createConnection({
  host: "YOUR_HOST",
  user: "YOUR_USER",
  password: "YOUR_PASSWORD",
  database: "YOUR_DATABASE"
});

// Example route replacing index.php
app.get("/api/best-sellers", (req, res) => {
  const sql = `
      SELECT m.id, m.name, m.image,
             COALESCE(SUM(oi.quantity), 0) AS total_ordered
      FROM menu m
      LEFT JOIN order_items oi ON oi.menu_id = m.id
      LEFT JOIN orders o ON oi.order_id = o.id
      WHERE o.status = 'Completed'
      GROUP BY m.id
      ORDER BY total_ordered DESC
      LIMIT 3
  `;

  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    res.json(rows);
  });
});

app.listen(3000, () => console.log("Server running"));
