import django, os
from datetime import date, time

os.environ['DJANGO_SETTINGS_MODULE'] = 'test1.settings'
django.setup()

from HIMCSAlumni.models import Event, register

user = register.objects.first()
print(f"Using user: {user.name} (id={user.id})")

# Clear existing events
Event.objects.all().delete()

events = [
    {
        "title": "Global Alumni Meet 2026",
        "event_type": "Reunion",
        "description": "The biggest gathering of HIMCS alumni from across the globe. Join us for a night of nostalgia, networking, and celebration of our shared heritage.",
        "date": date(2026, 6, 15),
        "time": time(18, 0),
        "location": "HIMCS Campus Auditorium, Agra",
    },
    {
        "title": "AI & Future of Work Workshop",
        "event_type": "Workshop",
        "description": "A hands-on workshop on how AI is reshaping industries. Learn from experts and prepare for the future. Limited seats available.",
        "date": date(2026, 5, 20),
        "time": time(10, 30),
        "location": "Online (Zoom Link will be shared)",
    },
    {
        "title": "Startup Founders Networking",
        "event_type": "Networking",
        "description": "Are you an entrepreneur? Connect with other founders from HIMCS, share experiences, and find potential collaborators or investors.",
        "date": date(2026, 5, 25),
        "time": time(17, 0),
        "location": "Starbucks, Connaught Place, New Delhi",
    },
    {
        "title": "Career Mentorship Webinar",
        "event_type": "Webinar",
        "description": "Class of 2010 seniors sharing tips on cracking interviews at MAANG companies. Essential for freshers and mid-career professionals.",
        "date": date(2026, 6, 2),
        "time": time(19, 0),
        "location": "Google Meet",
    },
    {
        "title": "Annual Tech Symposium",
        "event_type": "Seminar",
        "description": "A full-day seminar featuring keynote speakers from top tech firms discussing the next decade of software engineering.",
        "date": date(2026, 7, 10),
        "time": time(9, 0),
        "location": "Hotel Clark Shiraz, Agra",
    }
]

for e in events:
    Event.objects.create(organizer=user, **e)
    print(f"Created: {e['title']}")

print(f"Total events: {Event.objects.count()}")
