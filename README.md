# EventPilot AI Frontend

Next.js dashboard for CamRSVP event operations.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Open `http://localhost:3000`.

The app uses the backend OTP flow. In development, the backend returns the mock OTP in the login response.
