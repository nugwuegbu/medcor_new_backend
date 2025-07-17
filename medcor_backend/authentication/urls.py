from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.LoginView.as_view(), name='login'),
    path('signup/', views.SignupView.as_view(), name='signup'),
    path('me/', views.UserProfileView.as_view(), name='user-profile'),
    path('face-login/', views.FaceLoginView.as_view(), name='face-login'),
    path('register-face/', views.RegisterFaceView.as_view(), name='register-face'),
    path('update-phone/', views.UpdatePhoneView.as_view(), name='update-phone'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
]