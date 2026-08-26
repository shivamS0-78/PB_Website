import connectDB from "@/lib/db/connection";
import RecruitmentModel, { TempRecruitmentUserModel } from "@/models/Recruitment";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";

const transporter = createTransport({
  host: process.env.MAIL_SMTP,
  port: parseInt((process.env.MAIL_SMTP_PORT || "465") as string),
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

/**
 * @swagger
 * /api/registration/recruitment:
 *   get:
 *     summary: Check if an email or phone is registered
 *     description: This endpoint checks if the provided email or phone is already registered for recruitment.
 *     tags:
 *      - Recruitment
 *     parameters:
 *       - in: query
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *           description: The email or phone number to check.
 *     responses:
 *       200:
 *         description: The identifier is already registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "email already exists"
 *                 isUnique:
 *                   type: boolean
 *                   example: false
 *       403:
 *         description: The identifier is not registered.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "email not registered"
 *                 isUnique:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred"
 */
export async function GET(request: Request) {
  await connectDB();

  // Wait for connection with timeout
  const connectionTimeout = 10000;
  const startTime = Date.now();

  while (mongoose.connection.readyState !== 1) {
    if (Date.now() - startTime > connectionTimeout) {
      throw new Error("Database connection timeout");
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  try {
    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get("identifier");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (identifier && emailRegex.test(identifier)) {
      const existing = await Promise.race([
        RecruitmentModel.findOne({
          email: identifier,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Email check timeout")), 5000)
        ),
      ]);
      if (existing) {
        return NextResponse.json(
          { message: "email already exists", isUnique: false },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { message: "email not registered", isUnique: true },
        { status: 403 }
      );
    } else {
      const existing = await Promise.race([
        RecruitmentModel.findOne({
          whatsapp_number: identifier,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Phone check timeout")), 5000)
        ),
      ]);
      if (existing) {
        return NextResponse.json(
          { message: "phone already exists", isUnique: false },
          { status: 200 }
        );
      }
      return NextResponse.json(
        { message: "phone not registered", isUnique: true },
        { status: 403 }
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "An error occurred", details: error.message },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred" },
        { status: 500 }
      );
    }
  }
}

/**
 * @swagger
 * /api/registration/recruitment:
 *   post:
 *     summary: Handle recruitment actions
 *     description: This endpoint handles different recruitment actions like reCAPTCHA validation or adding a registration.
 *     tags:
 *      - Recruitment
 *     parameters:
 *       - in: query
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           description: Action to perform (validateRecaptcha, addRegistration)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               recaptcha_token:
 *                 type: string
 *                 description: The reCAPTCHA token for validation.
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               whatsapp_number:
 *                 type: string
 *               college_id:
 *                 type: string
 *               year_of_study:
 *                 type: string
 *               branch:
 *                 type: string
 *               about:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful operation based on action.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Operation successful!"
 *       400:
 *         description: Invalid action specified or missing data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid action specified"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "An error occurred"
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required" },
        { status: 400 }
      );
    }

    if (action === "validateRecaptcha") {
      return validateRecaptcha(request);
    } else if (action === "addRegistration") {
      return addRegistration(request);
    } else if (action === "sendOTP") {
      return sendOTP(request);
    } else if (action === "verifyOTP") {
      return verifyOTP(request);
    } else if (action === "checkDuplicates") {
      return checkDuplicates(request);
    } else {
      return NextResponse.json(
        { error: "Invalid action specified" },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: "An error occurred",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

async function validateRecaptcha(request: Request) {
  const formData = await request.json();
  const { recaptcha_token } = formData;

  const recaptchaToken = recaptcha_token;

  const details = {
    event: {
      token: recaptchaToken,
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    },
  };

  if (!recaptchaToken) {
    return NextResponse.json(
      {
        message: "reCAPTCHA token not found! Try again",
        error: "reCAPTCHA token not found!",
      },
      {
        status: 500,
      }
    );
  }

  const recaptchaResponse = await fetch(
    `https://recaptchaenterprise.googleapis.com/v1/projects/${process.env.RECAPTCHA_PROJECT}/assessments?key=${process.env.RECAPTCHA_API_KEY}`,
    {
      method: "POST",
      body: JSON.stringify(details),
    }
  );

  const recaptchaResult = await recaptchaResponse.json();
  if (recaptchaResult.riskAnalysis.score < 0.7) {
    return NextResponse.json({
      message: "reCAPTCHA validation failed",
      error: recaptchaResult["error-codes"],
    });
  }

  return NextResponse.json({ message: "Recaptcha validated!" });
}

async function checkDuplicates(request: Request) {
  try {
    await connectDB();

    const { email, whatsapp_number, college_id } = await request.json();
    const normalizedEmail = email?.toLowerCase().trim();
    const normalizedCollegeId = college_id?.toUpperCase().trim();

    const [existingEmail, existingPhone, existingCollegeId] = await Promise.all([
      normalizedEmail
        ? RecruitmentModel.findOne({ email: normalizedEmail }).select("email").lean()
        : null,
      whatsapp_number
        ? RecruitmentModel.findOne({ whatsapp_number }).select("whatsapp_number").lean()
        : null,
      normalizedCollegeId
        ? RecruitmentModel.findOne({ college_id: normalizedCollegeId }).select("college_id").lean()
        : null,
    ]);

    const duplicates: string[] = [];
    if (existingEmail) duplicates.push("email");
    if (existingPhone) duplicates.push("phone");
    if (existingCollegeId) duplicates.push("college_id");

    if (duplicates.length > 0) {
      return NextResponse.json(
        { error: "Already registered", duplicates },
        { status: 409 }
      );
    }

    return NextResponse.json({ message: "No duplicates found" });
  } catch {
    return NextResponse.json(
      { error: "Failed to check duplicates" },
      { status: 500 }
    );
  }
}

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(request: Request) {
  try {
    await connectDB();

    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const normalizedEmail = email.toLowerCase().trim();

    await TempRecruitmentUserModel.deleteMany({ email: normalizedEmail });
    await TempRecruitmentUserModel.create({
      email: normalizedEmail,
      otp,
      otpExpiresAt,
    });

    // Send OTP via Nodemailer
    await transporter.sendMail({
      from: `Point Blank <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Point Blank Recruitment - OTP Verification",
      html: `
        <p>Hello,</p>
        <p>Your OTP for recruitment registration is:</p>
        <h2 style="letter-spacing:8px;font-family:monospace;color:#22c55e;">${otp}</h2>
        <p>This OTP is valid for <strong>10 minutes</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
        <p>Best regards,<br/>Team Point Blank</p>
      `,
    });

    return NextResponse.json({ message: "OTP sent successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

async function verifyOTP(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = String(otp).trim();

    const tempUser = await TempRecruitmentUserModel.findOne({ email: normalizedEmail });
    if (!tempUser) {
      return NextResponse.json({ error: "OTP not found. Please request a new one." }, { status: 400 });
    }

    if (new Date() > new Date(tempUser.otpExpiresAt)) {
      await TempRecruitmentUserModel.deleteOne({ email: normalizedEmail });
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 });
    }

    if (String(tempUser.otp).trim() !== cleanOtp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    await TempRecruitmentUserModel.deleteOne({ email: normalizedEmail });
    return NextResponse.json({ message: "OTP verified successfully" });
  } catch {
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

async function addRegistration(request: Request) {
  try {
    await connectDB();

    // Wait for connection with timeout
    const connectionTimeout = 10000;
    const startTime = Date.now();

    while (mongoose.connection.readyState !== 1) {
      if (Date.now() - startTime > connectionTimeout) {
        throw new Error("Database connection timeout");
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "name",
      "email",
      "whatsapp_number",
      "college_id",
      "year_of_study",
      "branch",
      "about",
    ];
    const missingFields = requiredFields.filter((field) => !data[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          missingFields: missingFields,
          received: Object.keys(data),
        },
        { status: 400 }
      );
    }

    // Validate name is not just whitespace
    if (!data.name || data.name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(data.whatsapp_number)) {
      return NextResponse.json(
        {
          error:
            "Invalid phone number format. Must be 10 digits starting with 6-9",
        },
        { status: 400 }
      );
    }

    // Validate college_id based on year
    if (data.year_of_study === "1st year") {
      const admissionNumberRegex = /^[1-9][0-9][A-Z]{4}[0-9]{4}$/;
      if (!admissionNumberRegex.test(data.college_id)) {
        return NextResponse.json(
          {
            error:
              "Invalid Admission Number format for 1st year. Expected format: 19ABCD1234",
          },
          { status: 400 }
        );
      }
    } else {
      const usnRegex = /^[1][D][S][1-3][0-9][A-Z]{2}[0-9]{3}$/;
      if (!usnRegex.test(data.college_id)) {
        return NextResponse.json(
          {
            error:
              "Invalid USN format for 2nd/3rd/4th year. Expected format: 1DS21CS123",
          },
          { status: 400 }
        );
      }
    }

    // Check if email, phone, or college_id already exists
    const [existingEmail, existingPhone, existingCollegeId] = await Promise.all(
      [
        Promise.race([
          RecruitmentModel.findOne({ email: data.email }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Email check timeout")), 5000)
          ),
        ]),
        Promise.race([
          RecruitmentModel.findOne({ whatsapp_number: data.whatsapp_number }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Phone check timeout")), 5000)
          ),
        ]),
        Promise.race([
          RecruitmentModel.findOne({ college_id: data.college_id }),
          new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("College ID check timeout")),
              5000
            )
          ),
        ]),
      ]
    );

    if (existingEmail) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    if (existingPhone) {
      return NextResponse.json(
        { error: "Phone number already registered" },
        { status: 400 }
      );
    }

    if (existingCollegeId) {
      return NextResponse.json(
        { error: "College ID already registered" },
        { status: 400 }
      );
    }

    const newDoc = new RecruitmentModel(data);

    await Promise.race([
      newDoc.save(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Save operation timeout")), 10000)
      ),
    ]);

    return NextResponse.json({ message: "Registration successful!" });
  } catch (error) {
    if (error instanceof Error) {
      // Handle Mongoose validation errors
      if (error.name === "ValidationError") {
        const validationErrors = Object.values(error).map(
          (err: unknown) => (err as { message: string }).message
        );
        return NextResponse.json(
          {
            error: "Validation failed",
            details: validationErrors,
            type: "validation_error",
          },
          { status: 400 }
        );
      }

      // Handle duplicate key errors
      if (
        error.name === "MongoServerError" &&
        error.message.includes("duplicate key")
      ) {
        return NextResponse.json(
          {
            error: "Duplicate entry detected",
            details: error.message,
            type: "duplicate_error",
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: "Failed to add registration",
        details: error instanceof Error ? error.message : String(error),
        type: "server_error",
      },
      { status: 500 }
    );
  }
}
