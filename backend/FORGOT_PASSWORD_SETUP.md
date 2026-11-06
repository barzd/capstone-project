## Forgot Password Setup

The project includes a Forgot Password feature that allows users to reset their passwords through email.

### How it works
1. The user clicks **Forgot Password?** on the login page.
2. They enter their registered email address.
3. The system sends a password reset email.
4. The user opens the reset link and enters a new password.
5. After successfully changing the password, they are redirected to the login page.

### Email Configuration

The backend uses Gmail SMTP to send password reset emails.

Add the following variables to your backend `.env` file:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-gmail-app-password
FRONTEND_URL=your-backend-url
FRONTEND_RESET_PATH=/reset-password/
SITE_NAME=Lost and Found
```

**Important:**
- Use a Gmail App Password, not your normal Gmail password.
- Each developer must configure their own email credentials in their local `.env` file.
- Never commit the `.env` file or share email passwords through GitHub.