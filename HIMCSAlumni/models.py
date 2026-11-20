from django.db import models

# Create your models here.
class register(models.Model):
    name=models.CharField(max_length=100)
    email=models.EmailField(unique=True)
    Batch= models.IntegerField(default=0)
    course=models.CharField(max_length=100)
    password=models.CharField(max_length=128)
    alumni_assistance=models.CharField(max_length=50, default='none of these')
    profile_pic = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    location = models.CharField(max_length=150, null=True, blank=True)
    position = models.CharField(max_length=150, null=True, blank=True)
    company = models.CharField(max_length=150, null=True, blank=True)

class Connection(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
    ]
    from_user = models.ForeignKey(register, on_delete=models.CASCADE, related_name='sent_connections')
    to_user = models.ForeignKey(register, on_delete=models.CASCADE, related_name='received_connections')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('from_user', 'to_user')

    def __str__(self):
        return f"{self.from_user.name} -> {self.to_user.name} ({self.status})"

class Notification(models.Model):
    TYPE_CHOICES = [
        ('request_sent', 'Request Sent'),
        ('request_received', 'Request Received'),
        ('request_accepted', 'Request Accepted'),
    ]
    user = models.ForeignKey(register, on_delete=models.CASCADE, related_name='notifications')
    message = models.CharField(max_length=255)
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    related_user = models.ForeignKey(register, on_delete=models.CASCADE, related_name='triggered_notifications', null=True, blank=True)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.notification_type}] {self.message} (for {self.user.name})"

class ChatMessage(models.Model):
    sender = models.ForeignKey(register, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(register, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"{self.sender.name} -> {self.receiver.name}: {self.message[:30]}"

class Job(models.Model):
    EMPLOYMENT_CHOICES = [
        ('Full-time', 'Full-time'),
        ('Part-time', 'Part-time'),
        ('Internship', 'Internship'),
        ('Contract', 'Contract'),
    ]
    title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200)
    employment_type = models.CharField(max_length=50, choices=EMPLOYMENT_CHOICES, default='Full-time')
    salary_package = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField()
    apply_link = models.URLField(blank=True, null=True)
    posted_by = models.ForeignKey(register, on_delete=models.CASCADE, related_name='posted_jobs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company}"

class Event(models.Model):
    EVENT_TYPES = [
        ('Reunion', 'Reunion'),
        ('Workshop', 'Workshop'),
        ('Seminar', 'Seminar'),
        ('Webinar', 'Webinar'),
        ('Networking', 'Networking'),
        ('Meetup', 'Meetup'),
    ]
    title = models.CharField(max_length=200)
    event_type = models.CharField(max_length=50, choices=EVENT_TYPES, default='Networking')
    description = models.TextField()
    date = models.DateField()
    time = models.TimeField()
    location = models.CharField(max_length=255)
    image = models.ImageField(upload_to='event_images/', null=True, blank=True)
    organizer = models.ForeignKey(register, on_delete=models.CASCADE, related_name='organized_events')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.title} on {self.date}"
