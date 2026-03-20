# Remote state configuration
# Uncomment and configure for your GCS bucket

# terraform {
#   backend "gcs" {
#     bucket = "vct-platform-terraform-state"
#     prefix = "terraform/state"
#   }
# }

# For AWS S3 backend:
# terraform {
#   backend "s3" {
#     bucket         = "vct-platform-terraform-state"
#     key            = "terraform/state"
#     region         = "ap-southeast-1"
#     dynamodb_table = "vct-terraform-locks"
#     encrypt        = true
#   }
# }
