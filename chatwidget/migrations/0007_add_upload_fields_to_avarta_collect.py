from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("chatwidget", "0005_alter_avartavideos_options_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="avartacollect",
            name="talking_video_url",
            field=models.FileField(upload_to="chatwidget/avatars/talking/", null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="avartacollect",
            name="waiting_video_url",
            field=models.FileField(upload_to="chatwidget/avatars/waiting/", null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="avartacollect",
            name="opening_video_url",
            field=models.FileField(upload_to="chatwidget/avatars/opening/", null=True, blank=True),
        ),
        migrations.AlterField(
            model_name="avartacollect",
            name="thumbnail",
            field=models.FileField(upload_to="chatwidget/avatars/thumbnails/", null=True, blank=True),
        ),
    ]


