import { useState, useEffect } from "react";
import axios from "axios";

export default function Home() {
  const [formData, setFormData] = useState({
    date: "",
    time: "",
    guests: "",
    name: "",
    contact: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [fullyBookedDates, setFullyBookedDates] = useState([]);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState(null);
  const [glowing, setGlowing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showDeleteSuccessModal, setShowDeleteSuccessModal] = useState(false);

  //comment

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "date") {
      setFormData({
        date: value,
        time: "",
        guests: "",
        name: "",
        contact: "",
      });
      setBooking(null);
      fetchAvailableSlots(value);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const fetchAvailableSlots = async (selectedDate) => {
    try {
      const response = await axios.get(
        `http://localhost:4000/api/availability?date=${selectedDate}`
      );
      const { bookedSlots: booked, availableSlots } = response.data;

      setAvailableSlots(availableSlots);
      setBookedSlots(booked);

      const isFullyBooked = availableSlots.length === 0;
      if (isFullyBooked) {
        setFullyBookedDates((prev) => [...prev, selectedDate]);
      } else {
        setFullyBookedDates((prev) => prev.filter((date) => date !== selectedDate));
      }

      setError(null);
    } catch (err) {
      console.error("Error fetching available slots:", err);
      setError("Failed to fetch available slots. Please try again.");
      setAvailableSlots([]);
      setBookedSlots([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.guests || !formData.name || !formData.contact) {
      alert("Please fill in all fields!");
      return;
    }

    if (bookedSlots.includes(formData.time)) {
      alert("The selected time slot is already booked. Please choose another.");
      return;
    }

    try {
      const response = await axios.post("http://localhost:4000/api/bookings", formData);
      setBooking(response.data.booking);
      setError(null);
      setGlowing(true);
      fetchAvailableSlots(formData.date);

      setShowModal(true);
    } catch (err) {
      console.error("Error submitting booking:", err);
      setError("Booking failed, please try again.");
      setBooking(null);
      setGlowing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      date: "",
      time: "",
      guests: "",
      name: "",
      contact: "",
    });
    setBooking(null);
    setGlowing(false);
    setError(null);
    setFullyBookedDates([]);
  };

  const handleCloseModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleCloseSuccessModal = () => {
    resetForm(); 
    setShowDeleteSuccessModal(false);  
  };

  const getMaxDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 15);
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMinDate = () => {
    const currentTime = new Date().getHours() * 60 + new Date().getMinutes();
    const cutoffTime = 19 * 60;
    const todayDate = getTodayDate();

    if (currentTime >= cutoffTime) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dd = String(tomorrow.getDate()).padStart(2, "0");
      const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
      const yyyy = tomorrow.getFullYear();
      return `${yyyy}-${mm}-${dd}`;
    }

    return todayDate;
  };

  const isDateFullyBooked = (date) => {
    return fullyBookedDates.includes(date);
  };

  const handleTimeSelection = (slot) => {
    if (!bookedSlots.includes(slot)) {
      setSelectedTime(slot);
      setFormData({ ...formData, time: slot });
    }
  };

  const handleDeleteBooking = async () => {
    try {
      await axios.delete(`http://localhost:4000/api/bookings/${booking.id}`);
      setBooking(null);
      setShowDeleteConfirmation(false); 
      setShowDeleteSuccessModal(true);  
    } catch (err) {
      console.error("Error deleting booking:", err);
      alert("Failed to delete booking. Please try again.");
    }
  };

  const handleShowDeleteConfirmation = () => {
    setShowDeleteConfirmation(true);
  };

  const handleHideDeleteConfirmation = () => {
    setShowDeleteConfirmation(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatTime = (time) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const suffix = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12;

    return `${formattedHour}:${minutes} ${suffix}`;
  };

  return (
    <div style={{ padding: "20px", maxWidth: "500px", margin: "0 auto", backgroundColor: "#222", color: "#fff" }}>
      <h1 style={{ textAlign: "center" }}>Restaurant Booking</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <label>
          Date:
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            style={{ width: "100%", padding: "8px" }}
            min={getMinDate()}
            max={getMaxDate()}
          />
        </label>
        {isDateFullyBooked(formData.date) && (
          <p style={{ color: "red", marginTop: "5px" }}>
            All slots are booked for this date. Please choose another date.
          </p>
        )}
        {formData.date && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              {["10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM"].map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTimeSelection(slot)}
                  style={{
                    padding: "10px",
                    backgroundColor: bookedSlots.includes(slot)
                      ? "#f44336"
                      : selectedTime === slot
                      ? "#3e8e41"
                      : availableSlots.includes(slot)
                      ? "#4caf50"
                      : "#ddd",
                    color: "#fff",
                    cursor: bookedSlots.includes(slot) ? "not-allowed" : "pointer",
                    opacity: bookedSlots.includes(slot) ? 0.5 : 1,
                    border: "none",
                    flex: "1",
                  }}
                  disabled={bookedSlots.includes(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>            
            <div style={{ display: "flex", flexDirection: "row", gap: "10px" }}>
              {["3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"].map((slot, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTimeSelection(slot)}
                  style={{
                    padding: "10px",
                    backgroundColor: bookedSlots.includes(slot)
                      ? "#f44336"
                      : selectedTime === slot
                      ? "#3e8e41"
                      : availableSlots.includes(slot)
                      ? "#4caf50"
                      : "#ddd",
                    color: "#fff",
                    cursor: bookedSlots.includes(slot) ? "not-allowed" : "pointer",
                    opacity: bookedSlots.includes(slot) ? 0.5 : 1,
                    border: "none",
                    flex: "1",
                  }}
                  disabled={bookedSlots.includes(slot)}
                >
                  {slot}
                </button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: "10px" }}>
          <label style={{ flex: 1 }}>
            Selected Time:
            <input
              type="text"
              name="time"
              value={formData.time || (isDateFullyBooked(formData.date) ? "--no slots available--" : "")}
              readOnly
              style={{ width: "100%", padding: "8px", fontFamily: isDateFullyBooked(formData.date) ? "monospace" : "inherit", cursor: isDateFullyBooked(formData.date) ? "not-allowed" : "pointer", textAlign: "center" }}
            />
          </label>
          <label style={{ flex: 1 }}>
            Number of Guests:
            <input
              type="number"
              name="guests"
              value={formData.guests}
              onChange={handleChange}
              required
              disabled={isDateFullyBooked(formData.date)}
              style={{ width: "100%", padding: "8px", cursor: isDateFullyBooked(formData.date) ? "not-allowed" : "text" }}
            />
          </label>
        </div>

        <label>
          Name:
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            disabled={isDateFullyBooked(formData.date)}
            style={{ width: "100%", padding: "8px", cursor: isDateFullyBooked(formData.date) ? "not-allowed" : "text" }}
          />
        </label>

        <label>
          Contact Details:
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            required
            disabled={isDateFullyBooked(formData.date)}
            style={{ width: "100%", padding: "8px", cursor: isDateFullyBooked(formData.date) ? "not-allowed" : "text" }}
          />
        </label>

        <button
          type="submit"
          style={{ backgroundColor: "#0070f3", color: "white", padding: "10px", border: "none", cursor: isDateFullyBooked(formData.date) ? "not-allowed" : "pointer" }}
        >
          Confirm Booking
        </button>
      </form>     
      {showModal && !showDeleteConfirmation && !showDeleteSuccessModal && booking && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              backgroundColor: "#222",
              padding: "20px",
              borderRadius: "8px",
              color: "#fff",
              width: "300px",
              textAlign: "center",
              position: "relative",  
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              onClick={handleCloseModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                fontSize: "18px",
                color: "#fff",
              }}
            >
              X
            </span>
            <h3>Booking Confirmed!</h3>
            <p><strong>Date:</strong> {formatDate(booking.date)}</p>
            <p><strong>Time:</strong> {formatTime(booking.time)}</p>
            <p><strong>Guests:</strong> {booking.guests}</p>
            <p><strong>Name:</strong> {booking.name}</p>
            <p><strong>Contact:</strong> {booking.contact}</p>

            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleShowDeleteConfirmation}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f44336",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Delete Booking
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteConfirmation && !showDeleteSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={handleHideDeleteConfirmation}
        >
          <div
            style={{
              backgroundColor: "#222",
              padding: "20px",
              borderRadius: "8px",
              color: "#fff",
              width: "300px",
              textAlign: "center",
              position: "relative",  
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              onClick={handleHideDeleteConfirmation}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                fontSize: "18px",
                color: "#fff",
              }}
            >
              X
            </span>
            <h3>Are you sure?</h3>
            <p>Do you really want to delete your booking?</p>
            <div style={{ marginTop: "10px" }}>
              <button
                onClick={handleDeleteBooking}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "#f44336",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}
      {showDeleteSuccessModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
          onClick={handleCloseSuccessModal}
        >
          <div
            style={{
              backgroundColor: "#222",
              padding: "20px",
              borderRadius: "8px",
              color: "#fff",
              width: "300px",
              textAlign: "center",
              position: "relative",  
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <span
              onClick={handleCloseSuccessModal}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                cursor: "pointer",
                fontSize: "18px",
                color: "#fff",
              }}
            >
              X
            </span>
            <h3>Booking Deleted!</h3>
            <p>Your booking has been successfully deleted.</p>
          </div>
        </div>
      )}
    </div>
  );
}