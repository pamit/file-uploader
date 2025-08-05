data "archive_file" "lambda_authoriser_package" {
  type        = "zip"
  source_dir = "${path.module}/../authoriser-lambda"
  output_path = "${path.module}/../authoriser-lambda.zip"
}

resource "aws_lambda_function" "authoriser_lambda" {
  function_name = "authoriser-lambda"
  role          = aws_iam_role.authorizer_lambda_role.arn
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  filename      = data.archive_file.lambda_authoriser_package.output_path
  timeout       = 10
  source_code_hash = data.archive_file.lambda_authoriser_package.output_base64sha256

  environment {
    variables = {
      AUTH0_DOMAIN = var.auth0_domain
      API_AUDIENCE = var.auth0_audience
    }
  }
}

resource "aws_apigatewayv2_authorizer" "api_authoriser_lambda" {
  name               = "api-authorizer-lambda"
  api_id             = aws_apigatewayv2_api.http_api.id
  authorizer_type    = "REQUEST"
  authorizer_uri     = aws_lambda_function.authoriser_lambda.invoke_arn
  identity_sources   = ["$request.header.Authorization"]
  authorizer_payload_format_version = "2.0"
  enable_simple_responses = false
  authorizer_result_ttl_in_seconds = 300
}

resource "aws_cloudwatch_log_group" "authoriser_lambda_logs" {
  name              = "/aws/lambda/authoriser-lambda"
  retention_in_days = 1
}
