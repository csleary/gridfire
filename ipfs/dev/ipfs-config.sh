#!/bin/sh
set -ex
echo "Applying custom IPFS configuration…"
ipfs config profile apply server
ipfs config Reprovider.Strategy roots
ipfs config Datastore.StorageMax 3GB
ipfs config Routing.Type none # Dev only