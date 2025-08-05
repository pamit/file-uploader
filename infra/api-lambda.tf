data "archive_file" "lambda_presign_url_package" {
  type        = "zip"
  source_dir = "${path.module}/../api-lambda"
  output_path = "${path.module}/../api-lambda.zip"
}

resource "aws_lambda_function" "presign_url_lambda" {
  function_name = "presign-url-lambda"
  role          = aws_iam_role.lambda_presign_url_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.lambda_presign_url_package.output_path
  timeout       = 10
  source_code_hash = data.archive_file.lambda_presign_url_package.output_base64sha256

  environment {
    variables = {
      BUCKET_NAME  = data.aws_s3_bucket.upload_bucket.bucket
      AUTH0_DOMAIN = var.auth0_domain
      API_AUDIENCE = var.auth0_audience
    }
  }
}

resource "aws_cloudwatch_log_group" "presign_url_lambda_logs" {
  name              = "/aws/lambda/presign-url-lambda"
  retention_in_days = 1
}
