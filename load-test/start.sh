#!/bin/bash
client=$(docker run --rm -it \
  --network ory-hydra-net \
  oryd/hydra:v2.2.0 \
  create client \
  --skip-tls-verify \
  --name benchmark-client \
  --secret benchmark-secret \
  --redirect-uri http://localhost:3000/authorization-code/callback \
  --token-endpoint-auth-method client_secret_post \
  -e http://hydra:4445 \
  --format json)

echo "$client"

client_id=$(echo "$client" | jq -r ".client_id")

CLIENT_ID=$client_id pnpm start
