#!/bin/bash

# How to run this script:
# bash push-to-prod.sh

# Load default settings and token.  from .env file
# REPO
# GH_TOKEN
source .env.production

# If Repo is not set, exit.
if [ -z "$REPO" ]; then
  echo "REPO is not set. Exiting."
  exit 1
fi

# If GH_TOKEN is not set, exit.
if [ -z "$GH_TOKEN" ]; then
  echo "GH_TOKEN is not set. Exiting."
  exit 1
fi

# Configure remote
REMOTE_NAME=origin
URL="https://$GH_TOKEN@github.com/$REPO.git"
git remote | grep $REMOTE_NAME || git remote add $REMOTE_NAME $URL
git remote set-url $REMOTE_NAME $URL

# Push to remote
git push -u $REMOTE_NAME main

# Publish to github pages
npm run deploy

# Remote the remote since the token is hardcoded in the URL
git remote remove $REMOTE_NAME
