import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";

// Types matching the C structs
interface Doctor {
  id: number;
  name: string;
  dept: string;
  max_num: number;
  current_num: number;
}

interface Appointment {
  id: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  dept: string;
  sequenceNum: number;
  appointmentTime: string;
  status: number; // 0: valid, 1: cancelled
}

const DB_FILE = "hospital_data.json";
const RECORD_FILE = "appointment_records.json";

// Initial data if files don't exist
const initialDoctors: Doctor[] = [
  { id: 101, name: "张仲景", dept: "中医内科", max_num: 20, current_num: 0 },
  { id: 102, name: "华佗", dept: "外科手术", max_num: 15, current_num: 0 },
  { id: 103, name: "孙思邈", dept: "全科门诊", max_num: 30, current_num: 0 },
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to load/save data
  const loadData = <T>(file: string, defaultValue: T): T => {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    }
    return defaultValue;
  };

  const saveData = (file: string, data: any) => {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
  };

  let doctors = loadData<Doctor[]>(DB_FILE, initialDoctors);
  let appointments = loadData<Appointment[]>(RECORD_FILE, []);
  let nextRecordId = appointments.length > 0 ? Math.max(...appointments.map(a => a.id)) + 1 : 1;

  // API Routes
  app.get("/api/doctors", (req, res) => {
    res.json(doctors);
  });

  app.post("/api/doctors", (req, res) => {
    const newDoctor: Doctor = { ...req.body, current_num: 0 };
    doctors.push(newDoctor);
    saveData(DB_FILE, doctors);
    res.json(newDoctor);
  });

  app.delete("/api/doctors/:id", (req, res) => {
    const id = parseInt(req.params.id);
    doctors = doctors.filter(d => d.id !== id);
    saveData(DB_FILE, doctors);
    res.json({ success: true });
  });

  app.post("/api/doctors/reset", (req, res) => {
    doctors = doctors.map(d => ({ ...d, current_num: 0 }));
    saveData(DB_FILE, doctors);
    res.json({ success: true });
  });

  app.get("/api/appointments", (req, res) => {
    res.json(appointments);
  });

  app.post("/api/appointments", (req, res) => {
    const { patientName, doctorId } = req.body;
    const doctorIndex = doctors.findIndex(d => d.id === doctorId);

    if (doctorIndex === -1) return res.status(404).json({ error: "Doctor not found" });
    if (doctors[doctorIndex].current_num >= doctors[doctorIndex].max_num) {
      return res.status(400).json({ error: "Doctor is fully booked" });
    }

    doctors[doctorIndex].current_num++;
    const newAppointment: Appointment = {
      id: nextRecordId++,
      patientName,
      doctorId,
      doctorName: doctors[doctorIndex].name,
      dept: doctors[doctorIndex].dept,
      sequenceNum: doctors[doctorIndex].current_num,
      appointmentTime: new Date().toLocaleString(),
      status: 0
    };

    appointments.push(newAppointment);
    saveData(DB_FILE, doctors);
    saveData(RECORD_FILE, appointments);
    res.json(newAppointment);
  });

  app.post("/api/appointments/cancel/:id", (req, res) => {
    const id = parseInt(req.params.id);
    const index = appointments.findIndex(a => a.id === id);
    if (index !== -1) {
      appointments[index].status = 1;
      saveData(RECORD_FILE, appointments);
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Appointment not found" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
