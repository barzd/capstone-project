from django.urls import path
from . import password_reset, views

urlpatterns = [
    path("register/", views.register),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("forgot-password/", password_reset.forgot_password),
    path("reset-password/", password_reset.reset_password),
]