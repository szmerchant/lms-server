import express from "express";
import cors from "cors";
import { readdirSync } from "fs";
import mongoose from "mongoose";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

// create express app
const app = express();

mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("DB connected"))
  .catch((err) => console.log("DB Error => ", err));

// apply middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// route
readdirSync("./routes").map(async (r) => {
    const route = await import(`./routes/${r}`);
    app.use("/api", route.default);
});

// port
const port = process.env.PORT || 8000;

app.listen(port, () => console.log(`Server is running on port ${port}`));