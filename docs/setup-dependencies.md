# Setting up the Development Environment: External Dependencies

This project relies on a few external APIs. This section walksthrough how to set up projects and get the API keys for:

- Firebase
- reCAPTCHA
- Agora (OPTIONAL)
- ipqs (OPTIONAL)

## Firebase

Use the same values for both the backend and frontend. Required API keys:

```
# backend
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_MESSAGING_SENDER_ID=
FIREBASE_APP_ID=
FIREBASE_MEASUREMENT_ID=
FIREBASE_JSON_FILE=firebase.json

# frontend
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
REACT_APP_FIREBASE_MEASUREMENT_ID=
```

1. Go to [firebase](https://console.firebase.google.com) and create a project. Enable google analytics.

2. Go to the project settings to get the project ID.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/5323d435-acfb-4b1a-8685-9bbba305f332" alt="project id" width="700"/>

3. Scroll down to Project Settings > Apps and create a new web app.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/1569714c-2704-4ddd-b9de-79b8159442f5" alt="create new app" width="700"/>

4. Get the values from the demo code.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/1eb14af5-43b6-4c07-9f59-932b4be40f1d" alt="create new app part 2" width="700"/>

5. Go to Service Account to get the private key.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/15bd9f48-9536-4ed1-a67e-5fe05d5e0abc" alt="service account" width="700"/>

6. Copy the contents of the downloaded file into `ultimafia/firebase.json`. You can drag and drop the file in VSCode, then rename it.

7. Enable email authentication in Firebase. Console > Authentication > Get Started > Native providers/Email/Password > Enable Email/Password.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/610e811a-5e26-4915-92c2-32d11f0ae731" alt="authentication" width="700"/>

## reCAPTCHA

Required API keys:

```
# frontend
REACT_APP_RECAPTCHA_KEY=
```

1. Go to [reCAPTCHA](https://www.google.com/recaptcha/admin/create) and register an application with reCAPTCHA v3.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/1a5c3b19-ce10-4b83-98a9-6374cde87e94" alt="recaptcha-register" width="700"/>

2. Use the client-side key (upper one).

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/bd6efc22-1b1f-41b5-af8a-80f0f00930dd" alt="recaptcha-get" width="700"/>

The server side key can also be used in the backend under the env `RECAPTCHA_KEY`, but it's only required for production mode.

## Agora (OPTIONAL)

> Setting up Agora is not required to get the site running locally.

Use the same values for both the backend and frontend. Required API keys:

```
# backend
AGORA_ID=
AGORA_CERT=

# frontend
REACT_APP_AGORA_ID=
```

1. Go to [agora](https://console.agora.io) and create a project.

2. Go to the Dashboard > Config.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/6802ab45-f86f-4484-ac94-b0a73825e7df" alt="agora dashboard" width="400"/>

3. Get the App ID and certificate.

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/186292d4-95bc-46ca-9283-68b4c7ba7b78" alt="agora" width="400"/>

## ipqs (OPTIONAL)

> Setting up ipqs is not required to get the site running locally.

Required API keys:

```
# backend
IP_API_KEY=
```

1. Go to [ip quality score](https://www.ipqualityscore.com/) and "Get a Free API Key".

2. Go to "View API Docs".

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/23e9a875-3201-4c43-b38b-1bdac350e219" alt="ipqs" width="700"/>

3. Go to "Proxy & VPN Detection" > "Getting Started". The API key can be seen in the code sample on the right panel, or if you scroll further down to "Private Key".

<img src="https://github.com/UltiMafia/Ultimafia/assets/24848927/da1da3bc-52de-4cd8-b467-f3aa6fb8045a" alt="ipqs part 2" width="700"/>
