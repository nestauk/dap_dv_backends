# allow for restarting services without user input (since Ubuntu 22)
sudo sed -i 's/#$nrconf{restart} = '"'"'i'"'"';/$nrconf{restart} = '"'"'a'"'"';/g' /etc/needrestart/needrestart.conf

curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -

sudo apt-get update
sudo apt-get upgrade -y

sudo apt-get install -y nginx nodejs unzip jq
sudo apt-get install -y npm

sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ~/aws/install
