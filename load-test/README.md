# Load Tester for SSI Auth Middleware

## Getting Started

**Prerequisites**

- k6 installed
- cloned this repository and installed via `pnpm i`

### Start the test client

Assuming you run the middleware in the provided `docker compose` configuration locally, you can run the following to register a new client:

```shell
chmod +x start.sh
./start.sh
```

### Run the load test

To stress test the middleware, run the following:

```shell
pnpm test:load
```

## References and Acknowledgments

- Building on prior work done at <https://github.com/flhps/node-passport-ssi-oidc-template>
