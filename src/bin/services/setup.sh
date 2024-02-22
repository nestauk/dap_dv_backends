if [ -z "$REPO_DIR_PATH" ]; then
	echo "REPO_DIR_PATH is not set or is empty."
	exit 1
fi
if [ -z "$CERTBOT_EMAIL" ]; then
	echo "CERTBOT_EMAIL is not set or is empty."
	exit 1
fi
if [ -z "$AWS_USERNAME" ]; then
	echo "AWS_USERNAME is not set or is empty."
	exit 1
fi
if [ -z "$AWS_REGION" ]; then
	echo "AWS_REGION is not set or is empty."
	exit 1
fi
if [ -z "$1" ]; then
	echo "Please provide one of these ANNOTATION, API, AUTHENTICATION, PROVISION as a parameter."
	exit 1
fi

echo "******************************************************"
echo "SYSTEM setup"
echo "******************************************************"
${REPO_DIR_PATH}/src/bin/services/install-system.sh

cd ${REPO_DIR_PATH}
npm i

echo "******************************************************"
echo "NGINX setup for $1"
echo "******************************************************"
./src/bin/services/setup-nginx.sh $1

if [ "$1" = "AUTHENTICATION" ]; then
	echo "******************************************************"
	echo "AUTHENTICATION setup"
	echo "******************************************************"

	./src/bin/services/install-docker.sh
	sudo docker compose -f src/services/authentication/docker-compose.yml up -d
fi

if [ "$1" = "PROVISION" ]; then
	echo "******************************************************"
	echo "PROVISION setup"
	echo "******************************************************"

	aws s3 cp s3://dap-dv-backends/spotlight.pem ~/.ssh/spotlight.pem
	chmod 600 ~/.ssh/spotlight.pem

	./src/bin/services/install-terraform.sh

	./src/bin/utils/create-iam-keys.sh $AWS_USERNAME $AWS_REGION
fi
