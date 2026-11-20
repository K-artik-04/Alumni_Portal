import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'test1.settings'
django.setup()

from HIMCSAlumni.models import Job, register

user = register.objects.first()
print("Using user:", user.name, "id=", user.id)

jobs = [
    {
        "title": "Senior Software Engineer",
        "company": "Google",
        "location": "Bangalore, India",
        "employment_type": "Full-time",
        "salary_package": "25-35 LPA",
        "description": "We are looking for a Senior Software Engineer to join our Cloud team. You will design and build scalable distributed systems. Requirements: 4+ years experience in Python/Java/Go, strong DSA skills, experience with cloud platforms.",
        "apply_link": "https://careers.google.com",
    },
    {
        "title": "Product Manager",
        "company": "Microsoft",
        "location": "Hyderabad, India",
        "employment_type": "Full-time",
        "salary_package": "20-30 LPA",
        "description": "Join Microsoft as a Product Manager for Azure DevOps. Drive product strategy, work with engineering teams, and deliver features used by millions of developers worldwide. MBA preferred.",
        "apply_link": "https://careers.microsoft.com",
    },
    {
        "title": "Data Science Intern",
        "company": "Amazon",
        "location": "Gurgaon, India",
        "employment_type": "Internship",
        "salary_package": "50K/month",
        "description": "Amazon is hiring Data Science interns for the summer program. Work on real-world ML problems at scale. Must be pursuing B.Tech/M.Tech in CS or related field with knowledge of Python, SQL, and statistics.",
        "apply_link": "https://amazon.jobs",
    },
    {
        "title": "Frontend Developer",
        "company": "Flipkart",
        "location": "Bangalore, India",
        "employment_type": "Full-time",
        "salary_package": "15-22 LPA",
        "description": "Build world-class e-commerce experiences at Flipkart. Looking for developers with expertise in React.js, TypeScript, and modern CSS. 2+ years of frontend development experience required.",
        "apply_link": "https://www.flipkartcareers.com",
    },
    {
        "title": "DevOps Engineer",
        "company": "Infosys",
        "location": "Pune, India",
        "employment_type": "Full-time",
        "salary_package": "10-16 LPA",
        "description": "Infosys Digital is looking for DevOps Engineers to manage CI/CD pipelines, Kubernetes clusters, and cloud infrastructure. Experience with AWS, Docker, and Terraform is a must.",
        "apply_link": "https://careers.infosys.com",
    },
    {
        "title": "UI/UX Designer",
        "company": "Swiggy",
        "location": "Remote",
        "employment_type": "Contract",
        "salary_package": "12-18 LPA",
        "description": "Design intuitive mobile and web experiences for millions of users. Proficiency in Figma, user research, prototyping, and design systems required.",
        "apply_link": "",
    },
    {
        "title": "Backend Developer (Part-time)",
        "company": "Zerodha",
        "location": "Bangalore, India",
        "employment_type": "Part-time",
        "salary_package": "8-12 LPA (pro-rata)",
        "description": "Zerodha is looking for a part-time backend developer to work on trading platform APIs. Strong knowledge of Go/Python, PostgreSQL, and RESTful API design required.",
        "apply_link": "https://zerodha.com/careers",
    },
    {
        "title": "Machine Learning Engineer",
        "company": "Razorpay",
        "location": "Bangalore, India",
        "employment_type": "Full-time",
        "salary_package": "18-28 LPA",
        "description": "Build ML models for fraud detection and payment risk assessment at scale. Requirements: M.Tech/PhD in ML/AI, experience with TensorFlow/PyTorch, and strong Python skills.",
        "apply_link": "https://razorpay.com/jobs",
    },
]

for j in jobs:
    Job.objects.create(posted_by=user, **j)
    print("Created:", j["title"], "at", j["company"])

print("Total jobs:", Job.objects.count())
