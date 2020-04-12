cd "$(dirname "$0")"
openssl req -x509 -nodes -new -sha256 -days 1024 -newkey rsa:2048 -keyout key.pem -out cert.pem -subj '/CN=localhost'
