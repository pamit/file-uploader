# Lambda File Upload with Auth0 Authentication and AWS S3

This project allows users to upload files to an AWS S3 bucket using a Lambda function, with authentication provided by Auth0.

## Prerequisites

Create an Auth0 account and set up an application. You will need the following details:
- Auth0 Domain
- Auth0 Audience

## Development Setup

```shell
export AWS_PROFILE=YOUR_AWS_PROFILE
copy .env.sample .env
# Fill in the .env file with your AWS S3 bucket name, Auth0 domain, and API audience

npm install
npm start
```

Visit `http://localhost:3000/client.html` to access the client interface.

## Deployment

The infrastructure is managed using Terraform. These resources include a Lambda function and an API Gateway to handle file uploads, as well as the necessary IAM roles and policies. To deploy the resources, follow these steps:

```shell
cd infra
copy dev.tfvars.sample dev.tfvars
# Fill in the dev.tfvars file with your Auth0 domain, audience, AWS region, and S3 bucket name
terraform init
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

Replace `presignUrlEndpoint` in `client.html` with the actual API Gateway endpoint provided after deployment in the outout (`api_endpoint`).
