DOMAIN_NAME=$1

# Use AWS Instance Metadata Service (IMDS) at 169.254.169.254
# to retrieve IP address for the current instance
INSTANCE_IP=`curl http://169.254.169.254/latest/meta-data/public-ipv4`

while true; do
	DNS_RESOLVED_IP=$(dig +short $DOMAIN_NAME)
	if [[ "$DNS_RESOLVED_IP" == "$INSTANCE_IP" ]]; then
		echo "DNS has propagated with IP $INSTANCE_IP"
		break
	else
		echo "Waiting for DNS to propagate..."
		sleep 30
	fi
done
