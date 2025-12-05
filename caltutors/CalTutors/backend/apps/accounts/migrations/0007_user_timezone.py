from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0006_remove_student_date_of_birth"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="timezone",
            field=models.CharField(
                default="America/Los_Angeles",
                help_text="Preferred timezone in IANA format (e.g., 'America/Los_Angeles').",
                max_length=50,
            ),
        ),
    ]
