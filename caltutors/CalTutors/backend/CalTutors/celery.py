import os

from celery import Celery

# Default Django settings module for Celery
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "CalTutors.settings")

app = Celery("CalTutors")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    return f"Request: {self.request!r}"
