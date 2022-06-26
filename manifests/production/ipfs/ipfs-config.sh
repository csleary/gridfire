#!/bin/sh
set -ex
echo "Applying custom IPFS configuration…"
ipfs config profile apply server
ipfs config Reprovider.Strategy roots
ipfs config Datastore.StorageMax 100GB
ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Origin '["https://gridfire.app"]'
ipfs config --json Gateway.HTTPHeaders.Access-Control-Allow-Methods '["GET"]'
