import User from "../models/user.js";
import { hashPassword, comparePassword } from "../utils/auth.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import AWS from "aws-sdk";

dotenv.config(); // Load environment variables

const awsConfig = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
    apiVersion: process.env.AWS_API_VERSION
}

const SES = new AWS.SES(awsConfig);

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        // validation
        if(!name) return res.status(400).send("Name is required");
        if(!password || password.length < 6) {
            return res
                .status(600)
                .send("Password is required and should be min 6 characters long");     
        }
        let userExist = await User.findOne({ email }).exec();
        if(userExist) return res.status(400).send("Email is taken");

        // hash password
        const hashedPassword = await hashPassword(password);

        // register
        const user = new User({
            name,
            email,
            password: hashedPassword,
        });
        await user.save();
        // console.log("saved user", user);
        return res.json({ ok: true });
    } catch (err) {
        console.log(err);
        return res.status(400).send("Error. Try again.");
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if our DB has a user with that email
        const user = await User.findOne({ email }).exec();
        if (!user) return res.status(400).send("No user found with this email.");

        // Check password
        const match = await comparePassword(password, user.password);
        if (!match) {
            return res.status(400).send("Incorrect password. Please try again.");
        }

        // Create signed JWT
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Exclude hashed password from the response
        user.password = undefined;

        // Send token in a cookie
        res.cookie("token", token, {
            httpOnly: true,
            // secure: true, // Uncomment for HTTPS in production
        });

        // Send user as JSON response
        res.json(user);
    } catch (err) {
        console.error(err);
        return res.status(500).send("An unexpected error occurred. Please try again.");
    }
};

export const logout = async (req, res) => {
    try {
        res.clearCookie("token");
        return res.json({ message: "Signout success" });
    } catch (err) {
        console.log(err);
    }
};

export const currentUser = async (req, res) => {
    try {
        console.log("User from middleware:", req.auth);

        // Fetch the user from the database
        const user = await User.findById(req.auth._id).select("-password").exec();
        console.log("CURRENT_USER", user);

        if (!user) {
            return res.status(404).json({ error: "User not found." });
        }

        return res.json({ ok: true });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: "An unexpected error occurred." });
    }
};

export const sendTestEmail = async (req, res) => {
    // console.log("send email using SES");
    // res.json({ ok: true });
    const params = {
        Source: process.env.EMAIL_FROM,
        Destination: {
            ToAddresses: ["samanzmerchant@gmail.com"]
        },
        ReplyToAddresses: [process.env.EMAIL_FROM],
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: `
                        <html>
                            <h1>Reset password link</h1>
                            <p>Please use the following link to reset your password.<p>
                        </html>
                    `,
                },
            },
            Subject: {
                Charset: "UTF-8",
                Data: "Password Reset Link"
            }
        }
    }

    const emailSent = SES.sendEmail(params).promise();

    emailSent.then((data) => {
        console.log(data);
        res.json({ ok: true });
    });
};