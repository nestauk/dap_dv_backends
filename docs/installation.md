# Installation

This document outlines the steps to deploy a cloud infrastructure using a provided Node.js script.
The script automates the creation of an AWS CloudFormation stack for deploying the annotation services.

This setup has been tested and is confirmed to work with Ubuntu 22.

## Prerequisites

- Node.js installed on your machine.
- An AWS account and familiarity with AWS CloudFormation.
- Appropriate AWS access permissions configured on your machine.
- **Set up Configuration**: Modify \`src/services/config.mjs\` to include your specific configuration such as AWS region, domain names, and any other parameters required by your infrastructure.
- `spotlight.pem` should be available

## Deployment

We provide an automated installation script. This script automates the configuration and deployment of all necessary services, security groups, and other dependencies.

To deploy the infrastructure, follow these steps:

1. **Navigate to Your Project Directory**: Open a terminal and change to the directory containing your project.

2. **Run the Deployment Script**: Execute the deployment process by running:

   ```bash
   npm run deployInfra
   ```

   This command triggers the \`main\` function within the script, which performs the following actions:

   - Prompts you for configuration details such as AWS username, Certbot email, repository branch, and stack name. These values are cached for future runs.
   - Reads the CloudFormation template file.
   - Initiates the stack creation process on AWS CloudFormation.
   - Monitors the stack creation process and logs the status of resources being created.

3. **Monitor the Deployment**: The script will provide output in the terminal indicating the progress of the deployment. It will log each resource creation event and notify you upon completion or if any errors occur.

4. **Verify Deployment**: Once the script indicates that the infrastructure deployment is successful, you may verify the creation of the resources through the AWS Management Console under the CloudFormation section.

## Troubleshooting

- If the deployment fails, review the error messages provided by the script for guidance. Common issues include:
  - insufficient permissions
  - missing AWS resources
  - errors in the CloudFormation template
  - networking issues (e.g. DNS not propagating, failed downloads, etc)
  - needing to delete an access key for provided user as the script tries to create a new one. (current limit is 2 per user)
- If you experience issues with a particular service, you can enter its terminal via AWS Management Console to inspect the `~/output.txt` file.

## Post-Deployment

After successful deployment, your infrastructure is ready to use. Remember to monitor your AWS resources for usage and incurred costs to ensure your deployment aligns with your expectations and budget.
