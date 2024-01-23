# allow for restarting services without user input (since Ubuntu 22)
sudo sed -i 's/#$nrconf{restart} = '"'"'i'"'"';/$nrconf{restart} = '"'"'a'"'"';/g' /etc/needrestart/needrestart.conf

sudo apt-get update
sudo apt-get upgrade -y

curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo apt-get install -y npm
sudo snap install --classic certbot

sudo ln -s /snap/bin/certbot /usr/bin/certbot

npm i
