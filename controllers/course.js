import AWS from "aws-sdk";
import { nanoid } from "nanoid";
import Course from "../models/course.js";
import slugify from "slugify";
import { readFileSync } from "fs";
import User from "../models/user.js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET);

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION
}

const S3 = new AWS.S3(awsConfig);

export const uploadImage = async (req, res) => {
    // console.log(req.body);
    try {
        const { image } = req.body;
        if (!image) return res.status(400).send("No image");

        // prepare the image
        const base64Data = new Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), "base64");

        const type = image.split(";")[0].split("/")[1];

        // image params
        const params = {
            Bucket: "lms-base-bucket",
            Key: `${nanoid()}.${type}`,
            Body: base64Data,
            ACL: "public-read",
            ContentEncoding: "base64",
            ContentType: `image/${type}`
        };

        // upload to s3
        S3.upload(params, (err, data) => {
            if(err) {
                console.log(err);
                return res.sendStatus(400);
            }
            console.log(data);
            res.send(data);
        })
    } catch (err) {
        console.log(err);
    }
};

export const removeImage = async (req, res) => {
    try {
        const { image } = req.body;
        // image params
        const params = {
            Bucket: image.Bucket,
            Key: image.Key
        };

        // send remove request to s3
        S3.deleteObject(params, (err, data) => {
            if(err) {
                console.log(err);
                res.sendStatus(400);
            }
            res.send({ ok: true });
        });
    } catch (err) {
        console.log(err);
    }
};

export const create = async (req, res) => {
    // console.log("CREATE COURSE");
    try {
        const alreadyExist = await Course.findOne({
            slug: slugify(req.body.name.toLowerCase())
        });
        if(alreadyExist) return res.status(400).send("Title is taken");

        const course = await new Course({
            slug: slugify(req.body.name),
            instructor: req.auth._id,
            ...req.body
        }).save();

        res.json(course);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Course create failed. Try again");
    }
};

export const read = async (req, res) => {
    try {
        const course = await Course.findOne({slug: req.params.slug}).populate(
            "instructor", "_id name"
        ).exec();
        res.json(course);
    } catch (err) {
        
    }
};

export const uploadVideo = async (req, res) => {
    try {
        if(req.auth._id != req.params.instructorId) {
            return res.status(400).send("Unauthorized");
        }

        const { video } = req.files;
        if(!video) return res.status(400).send("No video");

        // video params
        const params = {
            Bucket: "lms-base-bucket",
            Key: `${nanoid()}.${video.type.split("/")[1]}`, // video/mp4
            Body: readFileSync(video.path),
            ACL: "public-read",
            ContentType: video.type
        };

        // upload to s3
        S3.upload(params, (err, data) => {
            if (err) {
                console.log(err);
                res.sendStatus(400);
            }
            console.log(data);
            res.send(data);
        });

    } catch (err) {
        console.log(err);
    }
};

export const removeVideo = async (req, res) => {
    try {
        if(req.auth._id != req.params.instructorId) {
            return res.status(400).send("Unauthorized");
        }

        const { Bucket, Key } = req.body;

        // TODO: error if required params not sent

        // video params
        const params = {
            Bucket,
            Key
        };

        // upload to s3
        S3.deleteObject(params, (err, data) => {
            if (err) {
                console.log(err);
                res.sendStatus(400);
            }
            console.log(data);
            res.send({ ok: true });
        });

    } catch (err) {
        console.log(err);
    }
};

export const addLesson = async (req, res) => {
    try {
        const { slug, instructorId } = req.params;
        const { title, content, video } = req.body;

        if(req.auth._id != instructorId) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findOneAndUpdate(
            { slug },
            {
                $push: { lessons: { title, content, video, slug: slugify(title) } },
            },
            { new: true }
        )
        .populate("instructor", "_id name")
        .exec();
        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Add lesson failed");
    }
};

export const update = async (req, res) => {
    try {
        const { slug } = req.params;
        const course = await Course.findOne({ slug }).exec();
        if(req.auth._id != course.instructor) {
            return res.status(400).send("Unauthorized");
        }
    
        const updated = await Course.findOneAndUpdate({slug}, req.body, {
            new: true
        }).exec();
        
        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send(err.message);
    }
};

export const removeLesson = async (req, res) => {
    try {
        const { slug, lessonId } = req.params;
        const course = await Course.findOne({ slug }).exec();
        if(req.auth._id != course.instructor) {
            return res.status(400).send("Unauthorized");
        }
        
        const updatedCourse = await Course.findByIdAndUpdate(course._id, {
            $pull: { lessons: { _id: lessonId }}
        }).exec();
    
        res.json({ ok: true});
    } catch (err) {
        console.log(err);
        return res.status(400).send(err.message);
    }
};

export const updateLesson = async (req, res) => {
    const { slug } = req.params;
    const { _id, title, content, video, free_preview } = req.body;
    const course = await Course.findOne({ slug }).select("instructor").exec();

    if(course.instructor._id != req.auth._id) {
        return res.status(400).send("Unauthorized");
    }

    const updated = await Course.updateOne(
        { "lessons._id": _id },
        {
            $set: {
                "lessons.$.title": title,
                "lessons.$.content": content,
                "lessons.$.video": video,
                "lessons.$.free_preview": free_preview,
            }
        },
        { new: true }
    ).exec();
    res.json({ ok: true });
};

export const publish = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId).select("instructor").exec();

        if(course.instructor._id != req.auth._id) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findByIdAndUpdate(
            courseId,
            { published: true },
            { new: true }
        ).exec();
        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Publish course failed.")
    }
};

export const unpublish = async (req, res) => {
    try {
        const { courseId } = req.params;
        const course = await Course.findById(courseId).select("instructor").exec();

        if(course.instructor._id != req.auth._id) {
            return res.status(400).send("Unauthorized");
        }

        const updated = await Course.findByIdAndUpdate(
            courseId,
            { published: false },
            { new: true }
        ).exec();
        res.json(updated);
    } catch (err) {
        console.log(err);
        return res.status(400).send("Unpublish course failed.")
    }
};

export const courses = async (req, res) => {
    const all = await Course.find({ published: true })
        .populate("instructor", "_id name")
        .exec();
    res.json(all);
};

export const checkEnrollment = async (req, res) => {
    const { courseId } = req.params;
    // find courses of the currently logged in user
    const user = await User.findById(req.auth._id).exec();
    // check if course id is found in user courses array
    let ids = [];
    let length = user.courses && user.courses.length;
    for (let i = 0; i < length; i++) {
        ids.push(user.courses[i].toString());
    }
    res.json({
        status: ids.includes(courseId),
        course: await Course.findById(courseId).exec()
    });
};

export const freeEnrollment = async (req, res) => {
    try {
        const course = await Course.findById(req.params.courseId).exec();
        if(course.paid) return;

        const result = await User.findByIdAndUpdate(
            req.auth._id,
            {
                $addToSet: { courses: course._id },
            },
            { new: true }
        ).exec();
        console.log(result);
        res.json({
            message: "Congratulations! You have successfully enrolled",
            course
        });
    } catch (err) {
        console.log("Free enrollment error", err);
        return res.status(400).send("Enrollment create failed");
    }
};

export const paidEnrollment = async (req, res) => {
    try {
        // check if course is free or paid
        const course = await Course.findById(req.params.courseId)
        .populate("instructor")
        .exec();
        if(!course.paid) return;
        // application fee 30%
        const fee = (course.price * 30) / 100;
        // create stripe session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"], // Specify allowed payment methods
            mode: "payment", // Add mode for one-time payment
            // Purchase details
            line_items: [
                {
                    price_data: {
                        product_data: {
                            name: course.name
                        },
                        unit_amount: Math.round(course.price.toFixed(2) * 100),
                        currency: "usd",
                    },
                    quantity: 1
                }
            ],
            // Charge buyer and transfer remaining balance to seller (after fee)
            payment_intent_data: {
                application_fee_amount: Math.round(fee.toFixed(2) * 100),
                transfer_data: {
                    destination: course.instructor.stripe_account_id
                }
            },
            // Redirect URLs after payment
            success_url: `${process.env.STRIPE_SUCCESS_URL}/${course._id}`,
            cancel_url: process.env.STRIPE_CANCEL_URL
        });
        console.log("SESSION ID => ", session);

        await User.findByIdAndUpdate(req.auth._id, { stripeSession: session }).exec();
        res.send(session.id);
    } catch (err) {
        console.log("PAID ENROLLMENT ERROR", err);
        return res.status(400).send("Enrollment create failed");
    }
};

export const stripeSuccess = async (req, res) => {
    try {
        // find course
        const course = await Course.findById(req.params.courseId).exec();
        // get user from db to get stripe session id
        const user = await User.findById(req.auth._id).exec();
        // if no stripe session return
        if (!user.stripeSession.id) return res.sendStatus(400);
        // retrieve stripe session
        const session = await stripe.checkout.sessions.retrieve(user.stripeSession.id);
        console.log("STRIPE SUCCESS", session);
        // if session payment status is paid, push course to user's course array
        if(session.payment_status === "paid") {
            await User.findByIdAndUpdate(user._id, {
                $addToSet: { courses: course._id },
                $set: { stripeSession: {} }
            }).exec();
        }
        res.json({ success: true, course });
    } catch (err) {
        console.log("STRIPE SUCCESS ERROR", err);
        res.json({ success: false });
    }
};