from django.db import models
from core.models import TimeStampedModel
from tenants.models import User


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
