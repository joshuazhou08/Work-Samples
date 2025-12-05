from django.db import migrations, models


def populate_payment_flags(apps, schema_editor):
    Hours = apps.get_model("tutoring_sessions", "Hours")
    Hours.objects.filter(payment_status__in=["charged", "paid", "tutor_paid"]).update(
        student_charged=True
    )
    Hours.objects.filter(payment_status="tutor_paid").update(tutor_paid=True)


class Migration(migrations.Migration):

    dependencies = [
        ("tutoring_sessions", "0011_hours_payment_status"),
    ]

    operations = [
        migrations.AddField(
            model_name="hours",
            name="student_charged",
            field=models.BooleanField(
                default=False,
                help_text="Indicates if the student has been charged for this session.",
            ),
        ),
        migrations.AddField(
            model_name="hours",
            name="tutor_paid",
            field=models.BooleanField(
                default=False,
                help_text="Indicates if the tutor has been paid for this session.",
            ),
        ),
        migrations.RunPython(populate_payment_flags, migrations.RunPython.noop),
        migrations.RemoveField(
            model_name="hours",
            name="payment_status",
        ),
    ]
