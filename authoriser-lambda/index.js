const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

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

exports.handler = async (event, context, callback) => {
	try {
    const authHeader = event?.headers?.Authorization || event?.headers?.authorization;
    const token = authHeader?.split(" ")[1];

		if (!token) {
			console.error("Unauthorized: Missing token");
			return callback("Unauthorized: missing token");
		}

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
          // console.info("Lambda authoriser verified the token. Sub: ", decoded.sub);
          resolve(decoded);
        }
      });
    });

    // For HTTP API (v2), use routeArn if methodArn is not available
    const resourceArn = event.methodArn || event.routeArn;
    if (!resourceArn) {
      console.error("No resource ARN available in event");
      return callback("Unauthorized: no resource ARN");
    }

    const policy = generatePolicy(decoded.sub, "Allow", resourceArn);
    console.info("Generated policy:", JSON.stringify(policy, null, 2));

    return policy;
  } catch (err) {
		console.error("Exception during authorization:", err);
		return callback("Unauthorized: exception during authorization");
  }
};

function generatePolicy(principalId, effect, resource) {
  return {
    principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          Resource: resource,
        },
      ],
    },
  };
}
