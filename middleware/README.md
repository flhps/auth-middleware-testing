# SSI Auth Middleware

This is a minimal implementation of an OIDC authorization server that bridges to W3C Verifiable Credentials for claim data.
It is intended for developing and testing an updated policy language, as well as benchmarking.

## State

- Works with Altme, but does not accept the new credentials issued by Talao, due to issues with the way they now specify contexts.
- Built with incremental auth in mind, but that is not implemented for this testing version.

## Getting Started

**Prerequisites**

- cloned this repository and installed via `pnpm i`

## Run for Load Testing

Steps:

1. Copy `.env.template` to `.env`.
2. Start the system via docker compose.

### Resource Limit

This only works on Linux with the docker engine using cgroup driver.

Verify the cgroup driver:

```bash
docker info | grep -i cgroup
```

Create a slice named compose-limit.slice:

```bash
sudo systemctl edit compose-limit.slice
```

Add the following configuration:

```bash
[Slice]
MemoryMax=1G
CPUQuota=100%
```

Save and exit.

This creates an override file at:

```bash
/etc/systemd/system/compose-limit.slice.d/override.conf
```

Apply the new slice configuration:

```bash
sudo systemctl daemon-reexec
sudo systemctl daemon-reload
```

## References and Acknowledgments

- Building on prior work done at <https://github.com/GAIA-X4PLC-AAD/ssi-to-oidc-bridge>
