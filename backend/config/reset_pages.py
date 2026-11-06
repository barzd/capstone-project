import json

from django.http import HttpResponse
from django.views.decorators.http import require_GET

from .password_reset import _frontend_url

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Password reset</title>
<style>
body{font-family:system-ui,sans-serif;background:#f4f6f5;display:flex;justify-content:center;padding:48px 16px;margin:0}
form{background:#fff;padding:28px;border-radius:10px;box-shadow:0 4px 18px rgba(0,0,0,.12);width:100%;max-width:380px}
h1{font-size:22px;margin:0 0 8px}
p.sub{color:#555;margin:0 0 18px;font-size:14px}
label{display:block;font-size:13px;font-weight:600;margin:12px 0 6px}
input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #aaa;border-radius:6px;font-size:15px}
button{margin-top:16px;width:100%;padding:11px;border:0;border-radius:6px;background:#0b6b4f;color:#fff;font-size:15px;cursor:pointer}
#msg{margin-top:14px;font-size:14px}
.err{color:#b00020}.ok{color:#0b6b4f}
</style>
</head>
<body>
"""

FORGOT_BODY = """<form id="f">
<h1>Forgot password</h1>
<p class="sub">Enter your account email and we'll send you a reset link.</p>
<label for="email">Email</label>
<input id="email" type="email" autocomplete="email" required>
<button type="submit">Send reset link</button>
<div id="msg"></div>
</form>
<script>
document.getElementById("f").addEventListener("submit", async function (e) {
  e.preventDefault();
  var msg = document.getElementById("msg");
  msg.className = "";
  msg.textContent = "Sending...";
  try {
    var r = await fetch("/api/forgot-password/", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email: document.getElementById("email").value})
    });
    var d = await r.json();
    msg.className = r.ok ? "ok" : "err";
    msg.textContent = d.message || d.error || "Done.";
  } catch (err) {
    msg.className = "err";
    msg.textContent = "Couldn't reach the server.";
  }
});
</script>
</body>
</html>
"""

RESET_BODY = """<form id="f">
<h1>Set a new password</h1>
<p class="sub">Choose a new password for your account.</p>
<label for="pw">New password</label>
<input id="pw" type="password" autocomplete="new-password" required>
<label for="pw2">Confirm password</label>
<input id="pw2" type="password" autocomplete="new-password" required>
<button type="submit">Set new password</button>
<div id="msg"></div>
</form>
<script>
document.getElementById("f").addEventListener("submit", async function (e) {
  e.preventDefault();
  var msg = document.getElementById("msg");
  var params = new URLSearchParams(window.location.search);
  var pw = document.getElementById("pw").value;
  if (pw !== document.getElementById("pw2").value) {
    msg.className = "err";
    msg.textContent = "The passwords don't match.";
    return;
  }
  msg.className = "";
  msg.textContent = "Saving...";
  try {
    var r = await fetch("/api/reset-password/", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        uid: params.get("uid") || "",
        token: params.get("token") || "",
        password: pw
      })
    });
    var d = await r.json();
    if (r.ok) {
  msg.className = "ok";
  msg.textContent = "Password updated! Redirecting to login...";

  setTimeout(function () {
    window.location.href = __LOGIN_URL__;
  }, 2000);
} else {
  msg.className = "err";
  msg.textContent = d.error || "Something went wrong.";
}
  } catch (err) {
    msg.className = "err";
    msg.textContent = "Couldn't reach the server.";
  }
});
</script>
</body>
</html>
"""


@require_GET
def forgot_page(request):
    return HttpResponse(HEAD + FORGOT_BODY, content_type="text/html")


@require_GET
def reset_page(request):
    # Send the user back to the app's login screen after a successful reset.
    login_url = json.dumps(_frontend_url() + "/").replace("</", "<\\/")
    body = RESET_BODY.replace("__LOGIN_URL__", login_url)
    return HttpResponse(HEAD + body, content_type="text/html")
