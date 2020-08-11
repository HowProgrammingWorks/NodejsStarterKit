#!/bin/sh

cd "$(dirname "$0")"

KEY_FILE=key.pem
if [ -f "$KEY_FILE" ]; then
  read -e -p "Are you sure you want to replace existing key? [y/N] " YES_NO
  if [ "$YES_NO" != "y" ] && [ "$YES_NO" != "Y" ]; then
    exit 0
  fi
fi

if [ "$1" == "secure" ]; then
  echo "Generating private ed25519 key"
  openssl genpkey -algorithm ed25519 -out $KEY_FILE
else
  echo "Generating private RSA3072 key"
  openssl genrsa -out key.pem 3072
fi

set -e

echo "Generating certificate signing request"
openssl req -new -out self.pem -key $KEY_FILE -subj '/CN=localhost'

openssl req -text -noout -in self.pem

echo "Generating certificate"
openssl x509 -req -days 1024 -in self.pem -signkey $KEY_FILE -out cert.pem -extfile generate.ext
