# Google OAuth Setup

This guide configures Google sign-in for the local FSC Lost & Found app. Django handles the OAuth redirect and callback; Google credentials stay on the backend, and Django stores the resulting account/session in the configured MongoDB database.

## Prerequisites

- A working backend `.env` containing `MONGODB_URI`.
- Python dependencies installed from `backend/requirements.txt`.
- Node.js and npm installed, with frontend dependencies available.
- Access to Google Cloud Console.

## 1. Create a Google OAuth client

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select or create a project.
2. Configure the OAuth consent screen in **Google Auth Platform**. Enter the app details and, while the app is in testing mode, add each Google account that should be able to test sign-in.
3. Create an OAuth client ID with application type **Web application**.
4. Add this exact authorized redirect URI:

   ```text
   http://127.0.0.1:8000/accounts/google/login/callback/
   ```

Use `127.0.0.1` consistently. `localhost` is a different callback URI and will cause a `redirect_uri_mismatch` error. This server-side OAuth flow does not put the client secret in the frontend.

## 2. Configure backend credentials

Create or update `backend/.env` with the values from the OAuth client. Keep your existing MongoDB URI:

```text
MONGODB_URI=your-development-mongodb-uri
GOOGLE_OAUTH_CLIENT_ID=your-google-client-id
GOOGLE_OAUTH_CLIENT_SECRET=your-google-client-secret
```

Do not add quotes unless required by the value, and do not commit `.env` or share the client secret. Both Google variables must be present for Django to use the configured Google client.

## 3. Install dependencies, apply migrations, and start Django

In PowerShell, from the project folder, activate the backend environment and install requirements into that same environment:

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

Leave the backend running. If `ModuleNotFoundError: No module named 'allauth'` appears, check that this backend environment is active before installing requirements. If you change `.env`, restart Django so it reloads the credentials.

## 4. Start the frontend

Open a second PowerShell terminal:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173>.

## 5. Test sign-in and sign-out

1. Select **Continue with Google** on the sign-in screen.
2. Choose an allowed Google account and approve the requested profile/email access.
3. After Google redirects back to the app, Django verifies the session through `/api/auth/user/`. A first-time successful Google sign-in creates a Django account in the configured MongoDB database.
4. Use **Log out** to end the Django session, then sign in again to verify the flow.

Google OAuth registration creates accounts for Google users; it does not yet enforce a campus email domain. In testing mode, the Google consent screen's test-user list controls who can sign in. Do not treat that as a permanent campus-domain policy for a production deployment.

## Troubleshooting

| Problem | Check |
|---|---|
| `redirect_uri_mismatch` | The Google client's authorized redirect URI must exactly match `http://127.0.0.1:8000/accounts/google/login/callback/`, including the trailing slash. |
| Google client or provider configuration error | Confirm both `GOOGLE_OAUTH_CLIENT_ID` and `GOOGLE_OAUTH_CLIENT_SECRET` are set in `backend/.env`, then restart Django. |
| `KeyError: 'MONGODB_URI'` | Confirm `backend/.env` exists and defines `MONGODB_URI`; restart Django after changing it. |
| Google account is blocked in testing | Add that account as a test user in the Google Auth Platform consent-screen settings. |
| Redirect returns to sign-in | Keep using `127.0.0.1` for the frontend and backend, verify the OAuth callback URI, and check the Django terminal for callback errors. |
| Django cannot connect to MongoDB | Check the development URI and confirm the database allows your current network/IP. |

## Security notes

- Never put `GOOGLE_OAUTH_CLIENT_SECRET` in a `VITE_` variable or frontend source.
- Use development/test accounts and a development MongoDB database while testing.
- Before production, configure HTTPS, production callback URLs, consent-screen publishing, and an explicit campus-account policy if only students should be allowed.
