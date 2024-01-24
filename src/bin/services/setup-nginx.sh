# CERTBOT_EMAIL must be set in the environment for this command to run succesfully
# This email will be used to register with Let's Encrypt

sudo rm /etc/nginx/sites-enabled/default
sudo rm /etc/nginx/sites-enabled/AUTHENTICATION.conf
sudo rm /etc/nginx/sites-enabled/ANNOTATE.conf
sudo rm /etc/nginx/sites-enabled/API.conf
sudo service nginx restart
# sudo ln -sf nginx/nginx.http.redirect.conf /etc/nginx/sites-enabled/redirect.conf

for server in "$@"
do
	serverdomain=$(node src/bin/utils/getDomain.mjs $server)
	sudo certbot certonly -n --nginx --agree-tos --email $CERTBOT_EMAIL --domains $serverdomain

	if [ $server = "PROVISION" ]; then
		node src/bin/utils/fillTemplate.mjs \
			--copy-var ACTIVE_DOMAIN="${server}_DOMAIN" \
			--copy-var ACTIVE_PORT="${server}_PORT" \
			--output src/services/provision/nginx.conf \
			--template nginx/nginx.provision.template.conf \
			--varspath ../../../src/services/config.mjs
		sudo mv /etc/nginx/nginx.conf /etc/nginx/nginx.conf.bak
		sudo ln -sf $(pwd)/src/services/provision/nginx.conf /etc/nginx/nginx.conf
	else
		if [ $server = "API" ]; then
			template="nginx/nginx.proxy.template.conf"
		else
			template="nginx/nginx.https.template.conf"
		fi
		sudo node src/bin/utils/fillTemplate.mjs \
			--copy-var ACTIVE_DOMAIN="${server}_DOMAIN" \
			--copy-var ACTIVE_PORT="${server}_PORT" \
			--output /etc/nginx/sites-enabled/$server.conf \
			--template $template \
			--varspath ../../../src/services/config.mjs
	fi

	sudo service nginx restart
done
