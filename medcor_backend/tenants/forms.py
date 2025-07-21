from django import forms
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from .models import User


class UserAdminForm(forms.ModelForm):
    class Meta:
        model = User
        fields = '__all__'

    def clean_password(self):
        password = self.cleaned_data.get("password")

        # Run the password validators
        try:
            validate_password(password=password, user=self.instance)
        except ValidationError as e:
            raise forms.ValidationError(e.messages)

        # Hash the password only if it isn't hashed yet
        if password and not password.startswith("pbkdf2_"):
            return make_password(password)

        return password