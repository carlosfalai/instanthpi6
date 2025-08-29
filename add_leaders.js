// Script to add leadership team members to the database
import axios from "axios";

async function addLeader() {
  try {
    const response = await axios.post("http://localhost:5000/api/patients", {
      name: "Dr. Carlos Faviel Font",
      gender: "Male",
      dateOfBirth: "1975-06-15",
      email: "drfont@instanthpi.com",
      phone: "555-111-2222",
      healthCardNumber: "FONT12345678",
      language: "english",
      status: "active",
    });

    console.log("Added Dr. Carlos Faviel Font:", response.data);

    // Add Dr. Sonia Font del Pino
    const response2 = await axios.post("http://localhost:5000/api/patients", {
      name: "Dr. Sonia Font del Pino",
      gender: "Female",
      dateOfBirth: "1978-03-22",
      email: "drfontdelpino@instanthpi.com",
      phone: "555-111-3333",
      healthCardNumber: "FONT98765432",
      language: "english",
      status: "active",
    });

    console.log("Added Dr. Sonia Font del Pino:", response2.data);

    // Add Mme Sonia Truchon
    const response3 = await axios.post("http://localhost:5000/api/patients", {
      name: "Mme Sonia Truchon",
      gender: "Female",
      dateOfBirth: "1980-11-10",
      email: "struchon@instanthpi.com",
      phone: "555-111-4444",
      language: "french",
      status: "active",
    });

    console.log("Added Mme Sonia Truchon:", response3.data);
  } catch (error) {
    console.error("Error adding leaders:", error.response ? error.response.data : error.message);
  }
}

addLeader();
