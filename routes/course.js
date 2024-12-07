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
    read,
    uploadVideo
} from "../controllers/course.js";

const router = express.Router();

// image
router.post("/course/upload-image", requireSignin, uploadImage);
router.post("/course/remove-image", requireSignin, removeImage);
// course
router.post("/course", requireSignin, isInstructor, create);
router.get("/course/:slug", read);
router.post("/course/video-upload", requireSignin, formidable(), uploadVideo);

export default router;