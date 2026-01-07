import http from "k6/http";
import { check } from "k6";
import encoding from "k6/encoding";
import { Trend } from "k6/metrics";

const flowDurationTrend = new Trend("flow_duration");

const ldpVpEmail = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  id: "urn:uuid:89581491-c9d6-47d2-bd4b-e606fe6acd70",
  type: ["VerifiablePresentation"],
  verifiableCredential: {
    "@context": [
      "https://www.w3.org/2018/credentials/v1",
      {
        EmailPass: {
          "@context": {
            "@protected": true,
            "@version": 1.1,
            email: "schema:email",
            id: "@id",
            issuedBy: {
              "@context": {
                "@protected": true,
                "@version": 1.1,
                logo: {
                  "@id": "schema:image",
                  "@type": "@id",
                },
                name: "schema:name",
              },
              "@id": "schema:issuedBy",
            },
            schema: "https://schema.org/",
            type: "@type",
          },
          "@id": "https://github.com/TalaoDAO/context#emailpass",
        },
      },
    ],
    id: "urn:uuid:c2ceaca0-8e9b-11ee-9aa4-0a5bad1dad00",
    type: ["VerifiableCredential", "EmailPass"],
    credentialSubject: {
      id: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
      email: "felix.hoops@tum.de",
      type: "EmailPass",
      issuedBy: {
        name: "Altme",
      },
    },
    issuer: "did:web:app.altme.io:issuer",
    issuanceDate: "2023-11-29T09:43:33Z",
    proof: {
      type: "Ed25519Signature2018",
      proofPurpose: "assertionMethod",
      verificationMethod: "did:web:app.altme.io:issuer#key-1",
      created: "2023-11-29T09:43:33.482Z",
      jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..wl9s4OXCG5vV_sDvxn0E8DmHqQ482e2BlKy-sRsIN9WSwO0ZTU3O75wnEl0PtAcwIFPz_3VIlpz9hjJcRUqABA",
    },
    expirationDate: "2024-11-28T09:43:33.446349Z",
  },
  proof: {
    type: "Ed25519Signature2018",
    proofPurpose: "authentication",
    challenge: "test",
    verificationMethod:
      "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd#z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
    created: "2023-11-29T14:12:48.142Z",
    domain: "https://ec80-2003-ee-af45-6c00-e0d1-7850-acea-8745.ngrok-free.app",
    jws: "eyJhbGciOiJFZERTQSIsImNyaXQiOlsiYjY0Il0sImI2NCI6ZmFsc2V9..cUfNpVhLFOmBIebiJO345ImTzKN0_G9Al2k8dJx7wcYvXCfyfWnxFdCGCi13c2tNj6bA-RbzFmo6qrEaQTxtAw",
  },
  holder: "did:key:z6MkkdC46uhBGjMYS2ZDLUwCrTWdaqZdTD3596sN4397oRNd",
};
const ldpVpEmailString = JSON.stringify(ldpVpEmail);

const scenarioMatrix = (rates: Array<number>, functions: Array<string>) => {
  const scenarios = {};
  const duration = 120;
  const gap = 5;
  let start = 0;
  for (let exec of functions) {
    for (let rate of rates) {
      scenarios[exec + "_" + rate] = {
        executor: "constant-arrival-rate",
        exec, // executed function
        startTime: start + "s",
        duration: duration + "s",
        preAllocatedVUs: Math.max(rate * 4, 10),

        rate, // number of constant iterations given `timeUnit`
        timeUnit: "1s",
      };
      start = start + duration + gap;
    }
  }
  return scenarios;
};

export const options = {
  scenarios: scenarioMatrix(
    [1, 10, 20, 30, 40],
    ["metadata", "generateChallenge", "auth"],
  ),
};

export function metadata() {
  const res = http.get(
    "http://localhost:5002/metadata/d2ce9d26741d2b580e4e8d1e66b13dabe53dd267b45cbbd00346569c3589714c",
  );

  const success = check(res, {
    "Get status is 200": (r) => res.status === 200,
    "Get Content-Type header": (r) =>
      res.headers["Content-Type"].startsWith("application/json"),
    "Get supported formats": (r) =>
      res.status === 200 && Object.hasOwn(res.json(), "vp_formats"),
  });

  //log total duration for parity with other tests
  flowDurationTrend.add(res.timings.duration, { success });
}

// opens the sign-in page of hydra, which generates a challenge
export function generateChallenge() {
  let flowDuration = 0;
  let success = true;

  // get dummy client app page in order to get sign-in link
  let res = http.get("http://localhost:3000");
  flowDuration += res.timings.duration;
  success =
    success &&
    check(res, {
      "Get client page status is 200": (r) => res.status === 200,
    });

  res = res.clickLink({ selector: "body > a" });
  flowDuration += res.timings.duration;
  success =
    success &&
    check(res, {
      "Get auth page status is 200": (r) => res.status === 200,
    });

  //log total duration of all request
  flowDurationTrend.add(flowDuration, { success });
}

// complete auth process
export function auth() {
  let flowDuration = 0;
  let success = true;

  // get dummy client app page in order to get sign-in link
  let res = http.get("http://localhost:3000");
  flowDuration += res.timings.duration;
  success =
    success &&
    check(res, {
      "Get client page status is 200": (r) => res.status === 200,
    });

  res = res.clickLink({ selector: "body > a" });
  flowDuration += res.timings.duration;
  success =
    success &&
    check(res, {
      "Get auth page status is 200": (r) => res.status === 200,
    });

  const doc = res.html();
  const qrText = doc.find("a.qr-link").first().text();
  const qrUrlEncoded = qrText.split("&")[1].slice(12);
  const qrUrlDecoded = decodeURIComponent(qrUrlEncoded);

  // get presentation request jwt
  let resWallet = http.get(qrUrlDecoded);
  flowDuration += resWallet.timings.duration;
  success =
    success &&
    check(resWallet, {
      "Get presentation request status is 200": (r) => resWallet.status === 200,
    });

  const token = resWallet.body;
  const parts = token.split(".");
  let payload = JSON.parse(encoding.b64decode(parts[1], "rawurl", "s"));

  // get metadata because a real client would
  resWallet = http.get(payload.client_metadata_uri);
  flowDuration += resWallet.timings.duration;
  success =
    success &&
    check(resWallet, {
      "Get metadata status is 200": (r) => resWallet.status === 200,
    });

  // always present the same email vc
  resWallet = http.post(
    qrUrlDecoded,
    JSON.stringify({
      vp_token: ldpVpEmailString,
    }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );
  flowDuration += resWallet.timings.duration;
  success =
    success &&
    check(resWallet, {
      "Post presentation status is 200": (r) => resWallet.status === 200,
    });

  res = res.clickLink({ selector: "body > div > a.continue-button" });
  flowDuration += res.timings.duration;
  success =
    success &&
    check(res, {
      "Get continue link status is 200": (r) => res.status === 200,
    });

  //log total duration of all request
  flowDurationTrend.add(flowDuration, { success });
}
