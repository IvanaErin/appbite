import mysql from "mysql2/promise";

export default async function handler(req, res) {

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    // --- CHECK LOGIN (Staff) ---
    const cookies = req.headers.cookie || "";
    const staffId = cookies.split("staff_id=")[1]?.split(";")[0];

    if (!staffId) {
        return res.status(401).json({ error: "Not logged in" });
    }

    const { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ error: "Invalid order ID" });
    }

    // --- CONNECT TO DATABASE ---
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME
    });

    try {
        // --- GET USER ID OF THAT ORDER ---
        const [rows] = await conn.execute(
            "SELECT user_id FROM orders WHERE id = ?",
            [order_id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Order not found" });
        }

        const user_id = rows[0].user_id;

        // --- UPDATE ORDER STATUS TO 'Preparing' ---
        await conn.execute(
            "UPDATE orders SET status = 'Preparing' WHERE id = ?",
            [order_id]
        );

        // --- SEND NOTIFICATION ---
        await conn.execute(
            `INSERT INTO notifications (receiver_id, receiver_role, sender_role, message, is_read) 
             VALUES (?, ?, ?, ?, 0)`,
            [user_id, "user", "staff", `Your order #${order_id} has been accepted and is now being prepared.`]
        );

        return res.status(200).json({ success: true, message: "Order accepted." });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "Server error" });
    } finally {
        await conn.end();
    }
}
