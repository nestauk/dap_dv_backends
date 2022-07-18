if [ $# -ne 1 ]
  then
    echo "Please supply argument for the number of containers needed"
    exit 1
fi
echo $1

portstring=""
for (( i=0; i<$1; i++ ))
do
    let port=2221+$i
    portstring="${portstring}\tserver localhost:${port};\n"
    docker run -tid --restart unless-stopped \
        --name spotlight_$i \
        --mount source=spotlight-model,target=/opt/spotlight -p $port:80 \
        dbpedia/dbpedia-spotlight spotlight.sh en 2>/dev/null
done
config="
events {}
http {
    upstream spotlight {
${portstring}
    }
    server {
        listen 2220;
        location / {
            proxy_pass http://spotlight;
        }
    }
}"

echo -e "$config" > src/bin/spotlight/nginx.conf
sudo ln -sf ~/dap_dv_backends/src/bin/spotlight/nginx.conf /etc/nginx/nginx.conf
sudo nginx -s reload