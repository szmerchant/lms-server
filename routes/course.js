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
    addLesson,
    updateLesson,
    removeLesson,
    publish,
    unpublish,
    courses,
    checkEnrollment
} from "../controllers/course.js";

const router = express.Router();

router.get("/courses", courses);

// image
router.post("/course/upload-image", requireSignin, uploadImage);
router.post("/course/remove-image", requireSignin, removeImage);

router.post("/course", requireSignin, isInstructor, create);
router.put("/course/:slug", requireSignin, update);
router.get("/course/:slug", read);
router.post("/course/video-upload/:instructorId", requireSignin, formidable(), uploadVideo);
router.post("/course/video-remove/:instructorId", requireSignin, removeVideo);

// publish/unpublish
router.put("/course/publish/:courseId", requireSignin, publish);
router.put("/course/unpublish/:courseId", requireSignin, unpublish);

router.post("/course/lesson/:slug/:instructorId", requireSignin, addLesson);
router.put("/course/lesson/:slug/:instructorId", requireSignin, updateLesson);
router.put("/course/:slug/:lessonId", requireSignin, removeLesson);

router.get("/check-enrollment/:courseId", requireSignin, checkEnrollment);

export default router;