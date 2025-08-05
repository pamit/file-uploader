output "api_endpoint" {
  value = aws_apigatewayv2_api.http_api.api_endpoint
}

output "api_gw_logging_role_arn" {
  value = aws_iam_role.api_gw_logging_role.arn
}
