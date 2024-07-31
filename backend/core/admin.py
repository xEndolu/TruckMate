from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User
from django.db.models import Count
from django.utils.html import format_html
from .models import TruckAssessment

@admin.register(TruckAssessment)
class TruckAssessmentAdmin(admin.ModelAdmin):
    list_display = ('truck_id', 'assessment_date', 'severity_score', 'estimated_repair_cost', 'urgency_level', 'priority_score')
    list_filter = ('urgency_level', 'assessment_date')
    search_fields = ('truck_id', 'damage_description')
    date_hierarchy = 'assessment_date'

    def changelist_view(self, request, extra_context=None):
        # Get assessment counts by urgency level
        urgency_summary = TruckAssessment.objects.values('urgency_level').annotate(count=Count('id'))
        
        # Prepare data for a simple bar chart
        urgency_data = [
            {'urgency': item['urgency_level'], 'count': item['count']}
            for item in urgency_summary
        ]

        extra_context = extra_context or {}
        extra_context['urgency_data'] = urgency_data

        return super().changelist_view(request, extra_context=extra_context)

    def priority_distribution(self, obj):
        # Create a simple color-coded representation of priority
        color = 'green' if obj.priority_score < 3 else 'orange' if obj.priority_score < 7 else 'red'
        return format_html('<span style="color:{};">{:.2f}</span>', color, obj.priority_score)

    priority_distribution.short_description = 'Priority'


class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['username', 'email', 'is_verified', 'user_type', 'is_staff', 'is_active']
    list_filter = ['user_type', 'is_verified', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('Custom Fields', {'fields': ('is_verified', 'otp', 'otp_expiration', 'user_type')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Custom Fields', {'fields': ('email', 'is_verified', 'user_type')}),
    )

admin.site.register(User, CustomUserAdmin)