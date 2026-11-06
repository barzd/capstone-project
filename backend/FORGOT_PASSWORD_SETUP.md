## Forgot Password Setup

The project includes a Forgot Password feature that allows users to reset their passwords through email.

### How it works
1. The user clicks **Forgot Password?** on the login page.
2. They enter their registered email address.
3. The system sends a password reset email.
4. The user opens the reset link and enters a new password.
5. After successfully changing the password, they are redirected to the login page.

### Testing without email (default)

If `EMAIL_HOST` is not set, no email is sent. Instead, the reset link is printed
in the terminal running `python manage.py runserver`, under
`[Testing mode - no email sent]`. Copy it into your browser to finish the reset. **IT IS THE FIRST LINK, NOT THE SECOND ONE. THIS ONLY APPEARS FOR TESTING PURPOSES**

### Email Configuration (optional)

To send real emails through Gmail SMTP, add these variables to your backend
`.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
SITE_NAME=Lost and Found
```

Optional: set `FRONTEND_URL` to the address of the React app (default
`http://127.0.0.1:5173`). Users are sent there after resetting their password.

**Important:**
- Use a Gmail App Password, not your normal Gmail password.
- Each developer must configure their own email credentials in their local `.env` file.
- Never commit the `.env` file or share email passwords through GitHub.