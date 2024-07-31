import logging
import requests
import json

from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from twilio.rest import Client

logger = logging.getLogger(__name__)

class User(AbstractUser):
    USER_TYPE_CHOICES = (
        (1, 'regular'),
        (2, 'admin'),
    )
    
    email = models.EmailField(unique=True)
    is_verified = models.BooleanField(default=False)
    otp = models.CharField(max_length=6, blank=True, null=True)
    otp_expiration = models.DateTimeField(blank=True, null=True)
    registration_date = models.DateTimeField(default=timezone.now)
    user_type = models.PositiveSmallIntegerField(choices=USER_TYPE_CHOICES, default=1)

    def is_admin_user(self):
        return self.user_type == 2 or self.is_staff or self.is_superuser

class TruckAssessment(models.Model):
    URGENCY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    ]

    truck_id = models.CharField(max_length=50)
    assessment_date = models.DateTimeField(auto_now_add=True)
    damage_description = models.TextField()
    image_url = models.TextField()
    damages = models.JSONField(default=list)
    severity_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True
    )
    estimated_repair_cost = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True
    )
    urgency_level = models.CharField(
        max_length=10,
        choices=URGENCY_CHOICES,
        null=True,
        blank=True
    )
    priority_score = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        null=True,
        blank=True
    )
    priority_explanation = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"Assessment for Truck {self.truck_id} on {self.assessment_date}"

    class Meta:
        ordering = ['-priority_score', '-assessment_date']
        indexes = [
            models.Index(fields=['truck_id']),
            models.Index(fields=['-priority_score']),
        ]

@receiver(post_save, sender=TruckAssessment)
def notify_priority_assessment(sender, instance, created, **kwargs):
    if created and instance.urgency_level in ['high']:
        urgency_phrase = "Immediate action required" if instance.urgency_level == "high" else "Prompt attention needed"
        
        damages_list = ", ".join([f"{damage['area']} ({damage['confidence']})" for damage in instance.get_damages()])
        
        sms_message = f"""
URGENT: Truck {instance.truck_id} Assessment
Priority Score: {instance.priority_score:.2f}/10
Severity: {instance.severity_score}/10
Est. Cost: ₱{instance.estimated_repair_cost:.2f}
Urgency: {instance.urgency_level.capitalize()}
Damages: {damages_list}
{urgency_phrase}
Review ASAP for timely repairs.
"""

        sendista_payload = {
            "secret": settings.SENDISTA_API_SECRET,
            "mode": "devices",
            "device": settings.SENDISTA_DEVICE_ID,
            "sim": 1,
            "priority": 1,
            "phone": settings.ADMIN_PHONE_NUMBER,
            "message": sms_message.strip()
        }

        try:
            response = requests.post(settings.SENDISTA_API_URL, params=sendista_payload)
            result = response.json()
            
            if result['status'] == 200:
                logger.info(f"SMS notification sent for Truck {instance.truck_id}")
            else:
                logger.error(f"Failed to send SMS notification for Truck {instance.truck_id}: {result['message']}")
        except Exception as e:
            logger.error(f"Error occurred while sending SMS notification for Truck {instance.truck_id}: {str(e)}")