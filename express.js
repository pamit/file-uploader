const express = require("express");
const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");
const AWS = require("aws-sdk");
const path = require("path");
const cors = require("cors");
const bodyParser = require('body-parser');
require('dotenv').config();

const BUCKET_NAME = process.env.BUCKET_NAME;
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const API_AUDIENCE = process.env.API_AUDIENCE;

const s3 = new AWS.S3({ region: "ap-southeast-2" });
const app = express();

app.use(cors({
  origin: "http://localhost:3001", // frontend origin
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Serve static files (client.html, etc.)
app.use(express.static(path.join(__dirname)));
// app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "client.html"));
});

// Auth middleware
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
		jwksRequestsPerMinute: 5,
    jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
  }),
  audience: API_AUDIENCE,
  issuer: `https://${AUTH0_DOMAIN}/`,
  algorithms: ["RS256"],
});

// Presigned URL endpoint
app.post("/presign-url", checkJwt, (req, res) => {
  const { filename, type } = req.body;
  const key = `uploads/${Date.now()}_${filename}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: 60, // URL expiration time in seconds
    ContentType: type,
  };

  const url = s3.getSignedUrl("putObject", params);
  res.json({ url });
});

app.listen(3000, () => console.log("Server running on port 3000"));
