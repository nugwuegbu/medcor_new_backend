from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import TimeStampedModel
from tenants.models import User
from treatment.models import Treatment


class Slot(TimeStampedModel):
    DAYS_OF_WEEK = [
        (1, "Monday"),
        (2, "Tuesday"),
        (3, "Wednesday"),
        (4, "Thursday"),
        (5, "Friday"),
        (6, "Saturday"),
        (7, "Sunday"),
    ]

    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="doctor_slots",
        related_query_name="doctor_slot",
    )
    start_time = models.TimeField()
    end_time = models.TimeField()
    day_of_week = models.PositiveSmallIntegerField(choices=DAYS_OF_WEEK)

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} - {self.start_time} - {self.end_time}"

    def get_day_of_week_display(self):
        return dict(self.DAYS_OF_WEEK).get(self.day_of_week, "Unknown")


class SlotExclusion(TimeStampedModel):

    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="slot_exclusions",
        related_query_name="slot_exclusion",
    )
    exclusion_start_date = models.DateField()
    exclusion_end_date = models.DateField()
    
    class Meta(TimeStampedModel.Meta):
        unique_together = (
            "doctor",
            "exclusion_start_date",
            "exclusion_end_date",
        )


class Appointment(TimeStampedModel):

    class AppointmentStatus(models.TextChoices):
        PENDING = "Pending", _("Pending")
        APPROVED = "Approved", _("Approved")
        COMPLETED = "Completed", _("Completed")
        CANCELLED = "Cancelled", _("Cancelled")
    
    patient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="patients",
        related_query_name="patient",
    )
    doctor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="appointment_doctors",
        related_query_name="appointment_doctor",
    )
    slot = models.ForeignKey(
        Slot,
        on_delete=models.CASCADE,
        related_name="slots",
        related_query_name="slot",
    )
    treatment = models.ForeignKey(
        Treatment,
        on_delete=models.CASCADE,
        related_name="treatments",
        related_query_name="treatment",
    )
    appointment_slot_date = models.DateField(null=True, blank=True)
    appointment_slot_start_time = models.TimeField()
    appointment_slot_end_time = models.TimeField()
    appointment_status = models.CharField(
        max_length=20, choices=AppointmentStatus.choices, null=True
    )

    medical_record = models.FileField(
        upload_to='medical_records/',
        null=True,
        blank=True,
        help_text=_("Upload medical documents related to this appointment."),
        verbose_name=_("Medical Record")
    )

    def __str__(self):
        return f"{self.patient} - {self.doctor} on {self.appointment_slot_date} {self.appointment_slot_start_time}"
