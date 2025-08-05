const AWS = require("aws-sdk");

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.BUCKET_NAME;

exports.handler = async (event) => {
  try {
    // Generate a signed URL for S3 upload
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
    console.error("Error generating signed URL:", err);

    return {
      statusCode: 401,
      body: JSON.stringify({ error: err.message }),
      headers: { "Access-Control-Allow-Origin": "*" },
    };
  }
};
