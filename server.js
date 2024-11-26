import express from "express";
import cors from "cors";
import { readdirSync } from "fs";
import morgan from "morgan";
import dotenv from "dotenv";

dotenv.config();

// create express app
const app = express();

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