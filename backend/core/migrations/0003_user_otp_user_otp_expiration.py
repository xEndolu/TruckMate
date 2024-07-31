# Generated by Django 5.0.6 on 2024-06-19 19:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_user_is_verified_alter_user_groups_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='otp',
            field=models.CharField(blank=True, max_length=6, null=True),
        ),
        migrations.AddField(
            model_name='user',
            name='otp_expiration',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
