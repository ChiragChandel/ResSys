const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg"); 
const moment = require("moment"); 

const app = express();
const PORT = 4000;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "restaurant_booking",
  password: "chirag12", 
  port: 5432, 
});

app.use(bodyParser.json());
app.use(cors());

app.get("/api/bookings", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM bookings ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to fetch bookings." });
  }
});

app.post("/api/bookings", async (req, res) => {
  const { date, time, guests, name, contact } = req.body;

  if (!date || !time || !guests || !name || !contact) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const result = await pool.query(
      `INSERT INTO bookings (date, time, guests, name, contact) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [date, time, guests, name, contact]
    );

    res.status(201).json({ message: "Booking created successfully!", booking: result.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to create booking." });
  }
});

app.get("/api/availability", async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ message: "Date is required." });
  }  
  const allSlots = [
    "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
  ];
  try {   
    const bookings = await pool.query(
      "SELECT time FROM bookings WHERE date = $1",
      [date]
    );    
    const bookedSlots = bookings.rows.map((row) =>
      moment(row.time, "HH:mm:ss").format("h:mm A")
    );    
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));    
    const isFullyBooked = availableSlots.length === 0;
    res.json({
      bookedSlots,        
      availableSlots,    
      isFullyBooked      
    });
  } catch (err) {
    console.error("Error fetching availability:", err.message);
    res.status(500).json({ message: "Internal Server Error." });
  }
});

app.delete("/api/bookings/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM bookings WHERE id = $1 RETURNING *", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Booking not found." });
    }
    res.json({ message: "Booking deleted successfully." });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: "Failed to delete booking." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server is running at http://localhost:${PORT}`);
});
