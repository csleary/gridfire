#!/bin/sh
set -ex
echo "Applying custom IPFS configuration…"
ipfs config profile apply server
ipfs config Reprovider.Strategy roots

