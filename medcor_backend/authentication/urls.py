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
    path('verify-token/', views.VerifyTokenView.as_view(), name='verify-token'),
    
    # OAuth endpoints
    path('google/', views.GoogleOAuthView.as_view(), name='google-oauth'),
    path('apple/', views.AppleOAuthView.as_view(), name='apple-oauth'),
    path('microsoft/', views.MicrosoftOAuthView.as_view(), name='microsoft-oauth'),
    path('oauth-callback/', views.OAuthCallbackView.as_view(), name='oauth-callback'),
]