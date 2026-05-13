const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;
const SUBMISSIONS_FILE = path.join(__dirname, "submissions.json");
const ANALYTICS_FILE = path.join(__dirname, "analytics.json");
const COMMENTS_FILE = path.join(__dirname, "comments.json");
const ENV_FILE = path.join(__dirname, ".env");

loadEnv();

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";

    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function readSubmissions() {
  return readJsonFile(SUBMISSIONS_FILE, []);
}

function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readAnalytics() {
  return readJsonFile(ANALYTICS_FILE, {
    totalViews: 0,
    lastViewedAt: null,
    dailyViews: {},
  });
}

function readComments() {
  return readJsonFile(COMMENTS_FILE, []);
}

function incrementViews() {
  const analytics = readAnalytics();
  const today = new Date().toISOString().slice(0, 10);

  analytics.totalViews += 1;
  analytics.lastViewedAt = new Date().toISOString();
  analytics.dailyViews[today] = (analytics.dailyViews[today] || 0) + 1;

  writeJsonFile(ANALYTICS_FILE, analytics);
  return analytics;
}

function saveComment(comment) {
  const comments = readComments();
  comments.push(comment);
  writeJsonFile(COMMENTS_FILE, comments);
}

function getDashboardData() {
  const submissions = readSubmissions();
  const comments = readComments();
  const analytics = readAnalytics();

  return {
    ok: true,
    analytics,
    counts: {
      views: analytics.totalViews,
      contacts: submissions.length,
      comments: comments.length,
    },
    recentContacts: submissions.slice(-8).reverse(),
    recentComments: comments.slice(-12).reverse(),
  };
}

function saveSubmission(submission) {
  const submissions = readSubmissions();
  submissions.push(submission);
  writeJsonFile(SUBMISSIONS_FILE, submissions);
}

function cleanText(value, maxLength = 500) {
  return String(value || "").trim().slice(0, maxLength);
}

async function handleView(request, response) {
  incrementViews();
  return sendJson(response, 201, { ok: true });
}

async function handleComment(request, response) {
  try {
    const body = await readBody(request);
    const data = JSON.parse(body || "{}");
    const comment = {
      id: Date.now(),
      name: cleanText(data.name, 120),
      message: cleanText(data.message, 800),
      createdAt: new Date().toISOString(),
    };

    if (!comment.name || !comment.message) {
      return sendJson(response, 400, { ok: false, message: "Please add your name and comment." });
    }

    saveComment(comment);
    return sendJson(response, 201, { ok: true, message: "Comment saved successfully." });
  } catch {
    return sendJson(response, 500, { ok: false, message: "Server failed to save comment." });
  }
}

function handleDashboard(response) {
  return sendJson(response, 200, getDashboardData());
}

function loadEnv() {
  if (!fs.existsSync(ENV_FILE)) return;

  const lines = fs.readFileSync(ENV_FILE, "utf8").split(/\r?\n/);
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;

    const separator = trimmed.indexOf("=");
    if (separator === -1) return;

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

function emailIsConfigured() {
  return Boolean(
    process.env.EMAIL_USER &&
      process.env.EMAIL_APP_PASSWORD &&
      process.env.EMAIL_APP_PASSWORD !== "your_gmail_app_password_here" &&
      process.env.EMAIL_TO
  );
}

async function sendSubmissionEmail(submission) {
  if (!emailIsConfigured()) {
    return false;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: `"KeyJunior Website" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_TO,
    replyTo: submission.email,
    subject: `New ${submission.service} request from ${submission.name}`,
    text: [
      "New contact form message from KeyJunior Solution website.",
      "",
      `Name: ${submission.name}`,
      `Email: ${submission.email}`,
      `Service: ${submission.service}`,
      `Date: ${submission.createdAt}`,
      "",
      "Message:",
      submission.message,
    ].join("\n"),
  });

  return true;
}

async function handleContact(request, response) {
  try {
    const body = await readBody(request);
    const data = JSON.parse(body || "{}");

    const submission = {
      id: Date.now(),
      name: cleanText(data.name, 120),
      email: cleanText(data.email, 160),
      service: cleanText(data.service, 120),
      message: cleanText(data.message, 1200),
      createdAt: new Date().toISOString(),
    };

    if (!submission.name || !submission.email || !submission.service || !submission.message) {
      return sendJson(response, 400, { ok: false, message: "Please fill in all fields." });
    }

    saveSubmission(submission);

    let emailSent = false;
    try {
      emailSent = await sendSubmissionEmail(submission);
    } catch {
      emailSent = false;
    }

    return sendJson(response, 201, {
      ok: true,
      emailSent,
      message: emailSent
        ? "Message sent successfully. KeyJunior Solution will respond soon."
        : "Message saved successfully. Email sending is not configured yet or failed.",
    });
  } catch (error) {
    return sendJson(response, 500, {
      ok: false,
      message: "Server failed to save or send your message.",
    });
  }
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const safePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      response.end("<h1>404 - Page not found</h1>");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": contentTypes[extension] || "application/octet-stream",
    });
    response.end(content);
  });
}

const server = http.createServer((request, response) => {
  if (request.method === "POST" && request.url === "/api/contact") {
    handleContact(request, response);
    return;
  }

  if (request.method === "POST" && request.url === "/api/view") {
    handleView(request, response);
    return;
  }

  if (request.method === "POST" && request.url === "/api/comments") {
    handleComment(request, response);
    return;
  }

  if (request.method === "GET" && request.url === "/api/dashboard") {
    handleDashboard(response);
    return;
  }

  if (request.method === "GET") {
    serveStatic(request, response);
    return;
  }

  sendJson(response, 405, { ok: false, message: "Method not allowed" });
});

server.listen(PORT, () => {
  console.log(`KeyJunior backend running at http://localhost:${PORT}`);
});
