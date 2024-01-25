if [ -z "$CERTBOT_EMAIL" ]; then
    echo "CERTBOT_EMAIL is not set or is empty."
    exit 1
fi
if [ -z "$1" ]; then
    echo "Please provide one of these ANNOTATION, API, AUTHENTICATION, PROVISION as a parameter."
    exit 1
fi

echo "******************************************************"
echo "./src/bin/services/install-system.sh"
echo "******************************************************"
$(pwd)/src/bin/services/install-system.sh

if [ "$1" = "AUTHENTICATION" ]; then
    echo "******************************************************"
    echo "./src/bin/services/install-docker.sh"
    echo "******************************************************"
    $(pwd)/src/bin/services/install-docker.sh
fi

if [ "$1" = "PROVISION" ]; then
    echo "******************************************************"
    echo "./src/bin/services/install-terraform.sh"
    echo "******************************************************"
    $(pwd)/src/bin/services/install-terraform.sh
fi

echo "******************************************************"
echo "./src/bin/services/setup-nginx.sh $1"
echo "******************************************************"
$(pwd)/src/bin/services/setup-nginx.sh $1
