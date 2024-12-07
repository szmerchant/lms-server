import express from "express";

// middleware
import { requireSignin } from "../middlewares/index.js";

// controllers
import {
    makeInstructor,
    getAccountStatus,
    currentInstructor,
    instructorCourses
} from "../controllers/instructor.js";

const router = express.Router();

router.post("/make-instructor", requireSignin, makeInstructor);
router.post("/get-account-status", requireSignin, getAccountStatus);
router.get("/current-instructor", requireSignin, currentInstructor);

router.get("/instructor-courses", requireSignin, instructorCourses);

export default router;