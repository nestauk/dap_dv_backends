#!/bin/bash
AWS_USERNAME=$1
AWS_REGION=$2

# Create a new access key
output=$(aws iam create-access-key --user-name $AWS_USERNAME)

# Parse the output using jq
access_key_id=$(echo "$output" | jq -r '.AccessKey.AccessKeyId')
secret_access_key=$(echo "$output" | jq -r '.AccessKey.SecretAccessKey')

# Use aws configure to set the new credentials
aws configure set aws_access_key_id "$access_key_id"
aws configure set aws_secret_access_key "$secret_access_key"

# Optionally, set default region and output format
aws configure set default.region $AWS_REGION
