"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from config.views import csrf_token, inventory_return
from items.views import InventoryViewSet, LostItemViewSet

router = DefaultRouter()
router.register("lost-items", LostItemViewSet, basename="lost-items")
router.register("inventory", InventoryViewSet, basename="inventory")

urlpatterns = [
    path("inventory-return/", inventory_return, name="inventory-return"),
    path("admin/", admin.site.urls),
    path("accounts/", include("allauth.urls")),
    path("api/auth/csrf/", csrf_token, name="csrf-token"),
    path("api/", include(router.urls)),
    path("api/auth/", include("dj_rest_auth.urls")),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),
]
