const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");
const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const API_AUDIENCE = process.env.API_AUDIENCE;

const jwks = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`,
});

function getKey(header, callback) {
  jwks.getSigningKey(header.kid, function (err, key) {
    if (err) {
      console.error("Error fetching signing key:", err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

exports.handler = async (event) => {
	console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    const authHeader = event.headers.Authorization || event.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      console.warn("Missing Authorization token");
      throw new Error("Missing token");
    }

		console.log("Verifying token...");

    const decoded = await new Promise((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: API_AUDIENCE,
        issuer: `https://${AUTH0_DOMAIN}/`,
        algorithms: ["RS256"],
      }, (err, decoded) => {
				if (err) {
					console.error("Token verification failed:", err);
					reject(err);
				} else {
					console.log("Token verified successfully:", decoded);
					resolve(decoded);
				}
      });
    });

    const body = JSON.parse(event.body);
    const { filename, type } = body;
    if (!filename || !type) {
      console.warn("Invalid request body:", body);
      throw new Error("Missing filename or type");
    }

    const key = `uploads/${Date.now()}_${filename}`;
    const url = s3.getSignedUrl("putObject", {
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: type,
      Expires: 60, // URL expiration time in seconds
    });
		console.log("Signed URL generated successfully");

    return {
      statusCode: 200,
      body: JSON.stringify({ url }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  } catch (err) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: err.message }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
};
