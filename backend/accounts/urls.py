from django.urls import path
from . import password_reset, session_views, views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("me/", session_views.me),
    path("forgot-password/", password_reset.forgot_password),
    path("reset-password/", password_reset.reset_password),
]