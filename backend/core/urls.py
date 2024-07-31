from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from . import views
from .views import AdminDashboardView, user_profile, get_user_data, assess_damage
from django.views.decorators.csrf import csrf_exempt

api_patterns = [
    path('login/', views.UserLoginView.as_view(), name='api-login'),
    path('register/', views.UserRegistrationView.as_view(), name='api-user-registration'),
    path('verify-otp/', views.verify_otp, name='api-verify-otp'),
    path('user/', views.UserView.as_view(), name='api-user'),
    path('chatbot/', views.chatbot, name='chatbot'),
    path('user-profile/', views.user_profile, name='user_profile'),
]

urlpatterns = [
    path('admin/', admin.site.urls),
    path('custom-admin-dashboard/', views.AdminDashboardView.as_view(), name='custom_admin_dashboard'),
    path('', views.home, name='home'),
    path('register/', views.UserRegistrationView.as_view(), name='user-registration'),
    path('assess_damage/', csrf_exempt(assess_damage), name='assess_damage'),
    path('api/', include((api_patterns, 'api'))),
    path('api/user-profile/', user_profile, name='user_profile'),
    path('api/user/', get_user_data, name='get_user_data'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)