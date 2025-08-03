terraform {
  backend "s3" {
    bucket = "pamit-bucket"
    key    = "terraform-state/file-uploader/terraform.tfstate"
    region = "ap-southeast-2"
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.region
}

data "aws_s3_bucket" "upload_bucket" {
  bucket = var.bucket_name
}
