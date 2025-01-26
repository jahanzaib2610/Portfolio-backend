const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
require("dotenv").config(); // For environment variables
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.json());
app.use(express.json()); // To parse JSON data from the request body

// MongoDB setup
mongoose
  .connect(
    process.env.MONGODB_URI,
    { useNewUrlParser: true, useUnifiedTopology: true }
  )
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define the schema for storing form data
const formSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  senderEmail: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

// Create the model for form data
const FormData = mongoose.model("portfolio-users", formSchema);

// Route to handle form submission
app.get('/', (req, resp) => {
    resp.send('Congratulations! Portfolio Server is running....................')
})
app.post("/send-email", async (req, res) => {
  console.log(req.body);
  const { senderName, senderEmail, subject, message } = req.body;

  // Store data in MongoDB
  const newFormData = new FormData({
    senderName,
    senderEmail,
    subject,
    message,
  });
  try {
    await newFormData.save(); // Save form data to MongoDB

    // Create the transporter for Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail", // You can change this to any email service provider
      auth: {
        user: process.env.RECEIVER_EMAIL, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password or app-specific password
      },
    });

    // Email options to send
    const mailOptions = {
      from: senderEmail, // Sender's email (from the form)
      to: process.env.RECEIVER_EMAIL, // The email to receive messages
      subject: `Message from: ${senderName} - ${subject}`, // Dynamic subject
      html: `
        <h3>Message from ${senderName} (${senderEmail})</h3>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
      `, // HTML content of the email
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Send a response back to the client
    res.status(200).json({ message: "Email sent and data saved!" });
  } catch (error) {
    // If there's an error, handle it
    console.error("Error occurred:", error);
    res
      .status(500)
      .json({
        message: "Failed to send email and save data.",
        error: error.message,
      });
  }
});

// Start the server
const PORT = process.env.PORT || 5500;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
