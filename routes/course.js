import express from "express";
import formidable from "express-formidable";

// middleware
import {
    requireSignin,
    isInstructor
} from "../middlewares/index.js";

// controllers
import {
    uploadImage,
    removeImage,
    create,
    update,
    read,
    uploadVideo,
    removeVideo,
    addLesson
} from "../controllers/course.js";

const router = express.Router();

// image
router.post("/course/upload-image", requireSignin, uploadImage);
router.post("/course/remove-image", requireSignin, removeImage);
// course
router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);
router.get("/course/:slug", read);
router.post("/course/video-upload/:instructorId", requireSignin, formidable(), uploadVideo);
router.post("/course/video-remove/:instructorId", requireSignin, removeVideo);
router.post("/course/lesson/:slug/:instructorId", requireSignin, addLesson);

export default router;