# Generated manually for charge model refactoring

from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


def migrate_charge_data_forward(apps, schema_editor):
    """
    Migrate existing charge data to the new structure.
    """
    Charge = apps.get_model('tutoring_sessions', 'Charge')
    
    for charge in Charge.objects.all():
        # Set user to the client of the student from the rate
        charge.user = charge.rate.student.client
        
        # Set amount to the student_charge_amount
        charge.amount = charge.student_charge_amount
        
        # Set credits_applied to 0 (default)
        charge.credits_applied = 0
        
        # Set final_amount to the same as amount (no credits applied)
        charge.final_amount = charge.student_charge_amount
        
        # Set currency to default
        charge.currency = 'usd'
        
        # Map old status to new status
        status_mapping = {
            'draft': 'pending',
            'pending': 'pending',
            'paid_by_student': 'paid',
            'paid_to_tutor': 'paid',
            'completed': 'paid',
        }
        charge.status = status_mapping.get(charge.status, 'pending')
        
        charge.save()


def migrate_charge_data_reverse(apps, schema_editor):
    """
    Reverse migration - not implemented as it would lose data.
    """
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('tutoring_sessions', '0007_alter_hours_student_alter_rate_student'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        # Add new fields with temporary nullable constraints
        migrations.AddField(
            model_name='charge',
            name='user',
            field=models.ForeignKey(
                help_text='The user (client) being charged',
                null=True,  # Temporary
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AddField(
            model_name='charge',
            name='stripe_checkout_id',
            field=models.CharField(
                blank=True,
                help_text='Stripe checkout session ID',
                max_length=255,
                null=True,
                unique=True
            ),
        ),
        migrations.AddField(
            model_name='charge',
            name='amount',
            field=models.DecimalField(
                decimal_places=2,
                help_text='Total sessions amount before credits',
                max_digits=8,
                null=True  # Temporary
            ),
        ),
        migrations.AddField(
            model_name='charge',
            name='credits_applied',
            field=models.DecimalField(
                decimal_places=2,
                default=0,
                help_text='Credits applied to reduce the charge',
                max_digits=8
            ),
        ),
        migrations.AddField(
            model_name='charge',
            name='final_amount',
            field=models.DecimalField(
                decimal_places=2,
                help_text='Final amount after credits (amount - credits_applied)',
                max_digits=8,
                null=True  # Temporary
            ),
        ),
        migrations.AddField(
            model_name='charge',
            name='currency',
            field=models.CharField(
                default='usd',
                help_text="Currency code (e.g., 'usd')",
                max_length=10
            ),
        ),
        
        # Migrate data
        migrations.RunPython(migrate_charge_data_forward, migrate_charge_data_reverse),
        
        # Make the new fields non-nullable
        migrations.AlterField(
            model_name='charge',
            name='user',
            field=models.ForeignKey(
                help_text='The user (client) being charged',
                on_delete=django.db.models.deletion.CASCADE,
                to=settings.AUTH_USER_MODEL
            ),
        ),
        migrations.AlterField(
            model_name='charge',
            name='amount',
            field=models.DecimalField(
                decimal_places=2,
                help_text='Total sessions amount before credits',
                max_digits=8
            ),
        ),
        migrations.AlterField(
            model_name='charge',
            name='final_amount',
            field=models.DecimalField(
                decimal_places=2,
                help_text='Final amount after credits (amount - credits_applied)',
                max_digits=8
            ),
        ),
        
        # Update status field choices and default
        migrations.AlterField(
            model_name='charge',
            name='status',
            field=models.CharField(
                default='pending',
                help_text='Payment status (pending, completed, failed, etc.)',
                max_length=20
            ),
        ),
        
        # Remove old fields
        migrations.RemoveField(
            model_name='charge',
            name='rate',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='total_hours',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='student_charge_amount',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='tutor_payment_amount',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='charge_period_start',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='charge_period_end',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='updated_at',
        ),
        migrations.RemoveField(
            model_name='charge',
            name='charged_at',
        ),
    ]