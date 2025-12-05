from django.db import migrations, models


def populate_session_rates(apps, schema_editor):
    Hours = apps.get_model("tutoring_sessions", "Hours")
    Rate = apps.get_model("tutoring_sessions", "Rate")

    charged_sessions = Hours.objects.filter(student_charged=True)

    for session in charged_sessions.select_related("student", "tutor"):
        update_fields = []
        try:
            rate = Rate.objects.get(student=session.student, tutor=session.tutor)
        except Rate.DoesNotExist:
            continue

        if session.student_rate is None:
            session.student_rate = rate.student_rate
            update_fields.append("student_rate")

        if session.tutor_rate is None:
            session.tutor_rate = rate.tutor_pay_rate
            update_fields.append("tutor_rate")

        if update_fields:
            session.save(update_fields=update_fields)


class Migration(migrations.Migration):

    dependencies = [
        ("tutoring_sessions", "0012_replace_payment_status_with_flags"),
    ]

    operations = [
        migrations.AddField(
            model_name="hours",
            name="student_rate",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Final hourly rate charged to the student for this session.",
                max_digits=8,
                null=True,
            ),
        ),
        migrations.AddField(
            model_name="hours",
            name="tutor_rate",
            field=models.DecimalField(
                blank=True,
                decimal_places=2,
                help_text="Final hourly rate paid to the tutor for this session.",
                max_digits=8,
                null=True,
            ),
        ),
        migrations.RunPython(populate_session_rates, migrations.RunPython.noop),
    ]
