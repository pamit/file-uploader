resource "aws_apigatewayv2_api" "http_api" {
  name          = "s3-lambda-upload-api"
  protocol_type = "HTTP"

  # Set CORS configuration to allow specific origins and methods,
  # e.g. for a frontend app: https://myapp.com
  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "OPTIONS"]
    allow_headers = ["*"]
  }
}

resource "aws_lambda_permission" "api_gateway_invoke_lambda" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.presign_url_lambda.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_lambda_permission" "api_gateway_invoke_authorizer" {
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.authoriser_lambda.arn
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http_api.execution_arn}/*/*"
}

resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id                 = aws_apigatewayv2_api.http_api.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.presign_url_lambda.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "presign_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "POST /presign-url"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"

  # Lambda authorizer
  authorizer_id      = aws_apigatewayv2_authorizer.api_authoriser_lambda.id
  authorization_type = "CUSTOM"
}

resource "aws_cloudwatch_log_group" "api_gw_logs" {
  name              = "/aws/apigateway/file-upload-api"
  retention_in_days = 1
}

resource "aws_apigatewayv2_stage" "default_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "$default"
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw_logs.arn
    format = jsonencode({
      requestId       = "$context.requestId"
      sourceIp        = "$context.identity.sourceIp"
      requestTime     = "$context.requestTime"
      httpMethod      = "$context.httpMethod"
      path            = "$context.path"
      status          = "$context.status"
      integrationErrorMessage = "$context.integration.error"
      integrationStatus       = "$context.integration.status"
    })
  }
}

