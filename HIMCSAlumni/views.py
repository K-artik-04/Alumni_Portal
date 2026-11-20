from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login
from .models import register, Connection, Notification, ChatMessage, Job, Event
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_POST
from django.db.models import Q
import json
import random
from django.core.mail import send_mail
from django.conf import settings

# Create your views here.
def index(request):
    return render(request,"index.html")

def about(request):
    return render(request, "about.html")

def dashboard(request):
    if 'user_id' not in request.session:
        return redirect('login')
        
    try:
        user = register.objects.get(id=request.session['user_id'])
    except register.DoesNotExist:
        return redirect('login')
        
    full_name = user.name
    email = user.email
    
    # Extract first name
    first_name = full_name.split(' ')[0] if full_name else 'Alumni'
    
    # Fetch all registered alumni except the current user
    alumni_list = list(register.objects.exclude(id=user.id).values('id', 'name', 'course', 'Batch', 'email', 'alumni_assistance', 'profile_pic', 'location', 'position', 'company'))
    
    # Process profile_pic paths to URLs
    for alumni in alumni_list:
        if alumni.get('profile_pic'):
            alumni['profile_pic_url'] = settings.MEDIA_URL + alumni['profile_pic']
        else:
            alumni['profile_pic_url'] = ''
    
    # Calculate total alumni
    total_alumni = register.objects.count()
    
    # Calculate total jobs and events for dynamic stats
    total_jobs = Job.objects.count()
    total_events = Event.objects.count()

    # Get unread notification count
    unread_notifications = Notification.objects.filter(user=user, is_read=False).count()
    
    context = {
        'user': user,
        'name': full_name,
        'first_name': first_name,
        'email': email,
        'alumni_list': alumni_list,
        'total_alumni': total_alumni,
        'total_jobs': total_jobs,
        'total_events': total_events,
        'unread_notifications': unread_notifications,
    }
    return render(request, "dashboard.html", context)

def gallery(request):
    return render(request, "gallery.html")

def directory(request):
    return render(request, "directory.html")

def Register(request):
    if request.method == 'POST':
        fname = request.POST.get('fname')
        lname = request.POST.get('lname')
        email = request.POST.get('email')
        batch = request.POST.get('batch')
        course = request.POST.get('course')
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')

        if password != confirm_password:
            return render(request, "register.html", {'error': 'Passwords do not match'})

        full_name = f"{fname} {lname}".strip()

        if register.objects.filter(email=email).exists():
            return render(request, "register.html", {'error': 'Email already exists'})

        try:
            # Simple validation for batch to be an integer
            batch_int = int(batch)
        except ValueError:
             return render(request, "register.html", {'error': 'Invalid Batch Year'})

        register.objects.create(name=full_name, email=email, Batch=batch_int, course=course, password=password)
        messages.success(request, "Registration successful! Please login.")
        return redirect('login')
    
    return render(request, "register.html")

def Login(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        password = request.POST.get('password')

        try:
            user = register.objects.get(email=email)
            if user.password == password:
                # Manual session management
                request.session['user_id'] = user.id
                request.session['user_name'] = user.name
                request.session['user_email'] = user.email
                return redirect('dashboard')
            else:   
                return render(request, "login.html", {'error': 'Incorrect password'})
        except register.DoesNotExist:
            return render(request, "login.html", {'error': 'User does not exist'})

    return render(request, "login.html")

def Logout(request):
    request.session.flush()
    return redirect('login')

def contact(request):
    return render(request, "contact.html")

def forgot_password(request):
    if request.method == 'POST':
        email = request.POST.get('email')
        
        if not register.objects.filter(email=email).exists():
            return render(request, "forgot_password.html", {'error': 'Email is not registered with us'})
        
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Store in session
        request.session['reset_otp'] = otp
        request.session['reset_email'] = email
        
        # Send Email
        subject = 'Password Reset OTP - HIMCS Alumni Portal'
        message = f'Your verification code for password reset is: {otp}\n\nPlease do not share this code with anyone.'
        email_from = settings.EMAIL_HOST_USER if hasattr(settings, 'EMAIL_HOST_USER') else 'noreply@himcsalumni.com'
        try:
            send_mail(subject, message, email_from, [email])
            messages.success(request, f"OTP has been sent to {email}")
            return redirect('verify_otp')
        except Exception as e:
            return render(request, "forgot_password.html", {'error': f'Failed to send email: {str(e)}'})
            
    return render(request, "forgot_password.html")

def verify_otp(request):
    if 'reset_email' not in request.session or 'reset_otp' not in request.session:
        messages.error(request, "Session expired. Please try again.")
        return redirect('forgot_password')
        
    if request.method == 'POST':
        entered_otp = request.POST.get('otp')
        session_otp = request.session.get('reset_otp')
        
        if entered_otp == session_otp:
            # Mark OTP as verified
            request.session['otp_verified'] = True
            messages.success(request, "OTP verified successfully. You can now reset your password.")
            return redirect('reset_password')
        else:
            return render(request, "verify_otp.html", {'error': 'Invalid OTP. Please try again.'})
            
    return render(request, "verify_otp.html")

def reset_password(request):
    if not request.session.get('otp_verified'):
        messages.error(request, "Please verify your OTP first.")
        return redirect('forgot_password')
        
    if request.method == 'POST':
        password = request.POST.get('password')
        confirm_password = request.POST.get('confirm_password')
        
        if password != confirm_password:
            return render(request, "reset_password.html", {'error': 'Passwords do not match'})
            
        email = request.session.get('reset_email')
        try:
            user = register.objects.get(email=email)
            user.password = password
            user.save()
            
            # Clear session variables
            del request.session['reset_otp']
            del request.session['reset_email']
            del request.session['otp_verified']
            
            messages.success(request, "Password successfuly reset! Please login with your new password.")
            return redirect('login')
        except register.DoesNotExist:
            return render(request, "reset_password.html", {'error': 'User not found.'})
            
    return render(request, "reset_password.html")

def update_profile(request):
    if request.method == 'POST':
        if 'user_id' not in request.session:
            return redirect('login')
            
        user_id = request.session['user_id']
        name = request.POST.get('name')
        email = request.POST.get('email')
        batch = request.POST.get('batch')
        course = request.POST.get('course')
        alumni_assistance = request.POST.get('alumni_assistance')
        location = request.POST.get('location')
        position = request.POST.get('position')
        company = request.POST.get('company')
        
        try:
            user = register.objects.get(id=user_id)
            if name:
                name = name.strip()
                if name:
                    user.name = name
                    request.session['user_name'] = name
            if email:
                user.email = email
                request.session['user_email'] = email
            if batch:
                try:
                    user.Batch = int(batch)
                except ValueError:
                    pass
            if course:
                user.course = course
            if alumni_assistance:
                user.alumni_assistance = alumni_assistance
            if location:
                user.location = location
            if position:
                user.position = position
            if company:
                user.company = company
            
            profile_pic = request.FILES.get('profile_pic')
            if profile_pic:
                user.profile_pic = profile_pic
                
            user.save()
        except register.DoesNotExist:
            messages.error(request, "User not found.")
            
    return redirect('dashboard')

def change_password_api(request):
    """Handle password change from the dashboard."""
    if request.method == 'POST':
        if 'user_id' not in request.session:
            return redirect('login')
            
        user_id = request.session['user_id']
        current_password = request.POST.get('current_password')
        new_password = request.POST.get('new_password')
        confirm_new_password = request.POST.get('confirm_new_password')
        
        try:
            user = register.objects.get(id=user_id)
            if user.password != current_password:
                messages.error(request, "Current password is incorrect.")
            elif new_password != confirm_new_password:
                messages.error(request, "New passwords do not match.")
            else:
                user.password = new_password
                user.save()
                messages.success(request, "Password successfully updated.")
                
        except register.DoesNotExist:
            messages.error(request, "User not found.")
            
    return redirect('dashboard')


# ==================== Connection Request API ====================

def send_connection_request(request):
    """Send a connection request to another user."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        to_user_id = data.get('to_user_id')
    except (json.JSONDecodeError, AttributeError):
        to_user_id = request.POST.get('to_user_id')
    
    if not to_user_id:
        return JsonResponse({'error': 'to_user_id is required'}, status=400)
    
    from_user = register.objects.get(id=request.session['user_id'])
    
    try:
        to_user = register.objects.get(id=to_user_id)
    except register.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    if from_user.id == to_user.id:
        return JsonResponse({'error': 'Cannot connect with yourself'}, status=400)
    
    # Check if connection already exists (in either direction)
    existing = Connection.objects.filter(
        Q(from_user=from_user, to_user=to_user) | 
        Q(from_user=to_user, to_user=from_user)
    ).first()
    
    if existing:
        if existing.status == 'pending':
            return JsonResponse({'error': 'Connection request already pending'}, status=400)
        elif existing.status == 'accepted':
            return JsonResponse({'error': 'Already connected'}, status=400)
        elif existing.status == 'rejected':
            # Allow re-sending after rejection
            existing.from_user = from_user
            existing.to_user = to_user
            existing.status = 'pending'
            existing.save()
        else:
            return JsonResponse({'error': 'Unknown connection state'}, status=400)
    else:
        Connection.objects.create(from_user=from_user, to_user=to_user, status='pending')
    
    # Create notification for sender (request sent)
    Notification.objects.create(
        user=from_user,
        message=f"You sent a connection request to {to_user.name}",
        notification_type='request_sent',
        related_user=to_user
    )
    
    # Create notification for receiver (request received)
    Notification.objects.create(
        user=to_user,
        message=f"{from_user.name} sent you a connection request",
        notification_type='request_received',
        related_user=from_user
    )
    
    return JsonResponse({'success': True, 'message': 'Connection request sent!'})


def accept_connection(request):
    """Accept a pending connection request."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        from_user_id = data.get('from_user_id')
    except (json.JSONDecodeError, AttributeError):
        from_user_id = request.POST.get('from_user_id')
    
    if not from_user_id:
        return JsonResponse({'error': 'from_user_id is required'}, status=400)
    
    current_user = register.objects.get(id=request.session['user_id'])
    
    try:
        connection = Connection.objects.get(
            from_user_id=from_user_id, 
            to_user=current_user, 
            status='pending'
        )
    except Connection.DoesNotExist:
        return JsonResponse({'error': 'No pending request found'}, status=404)
    
    connection.status = 'accepted'
    connection.save()
    
    from_user = connection.from_user
    
    # Mark the original request_received notification as read so buttons disappear
    notif = Notification.objects.filter(
        user=current_user, 
        notification_type='request_received', 
        related_user=from_user,
        is_read=False
    ).first()
    if notif:
        notif.is_read = True
        notif.save()
    
    # Notify the original sender that request was accepted
    Notification.objects.create(
        user=from_user,
        message=f"{current_user.name} accepted your connection request!",
        notification_type='request_accepted',
        related_user=current_user
    )
    
    # Notify current user too
    Notification.objects.create(
        user=current_user,
        message=f"You are now connected with {from_user.name}",
        notification_type='request_accepted',
        related_user=from_user
    )
    
    return JsonResponse({'success': True, 'message': f'You are now connected with {from_user.name}!'})


def reject_connection(request):
    """Reject a pending connection request."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        from_user_id = data.get('from_user_id')
    except (json.JSONDecodeError, AttributeError):
        from_user_id = request.POST.get('from_user_id')
    
    if not from_user_id:
        return JsonResponse({'error': 'from_user_id is required'}, status=400)
    
    current_user = register.objects.get(id=request.session['user_id'])
    
    try:
        connection = Connection.objects.get(
            from_user_id=from_user_id, 
            to_user=current_user, 
            status='pending'
        )
    except Connection.DoesNotExist:
        return JsonResponse({'error': 'No pending request found'}, status=404)
    
    connection.status = 'rejected'
    connection.save()
    
    from_user = connection.from_user
    
    # Mark the original request_received notification as read so buttons disappear
    notif = Notification.objects.filter(
        user=current_user, 
        notification_type='request_received', 
        related_user=from_user,
        is_read=False
    ).first()
    if notif:
        notif.is_read = True
        notif.save()
    
    return JsonResponse({'success': True, 'message': 'Connection request rejected.'})


# ==================== Notification API ====================

def get_notifications(request):
    """Get all notifications for the current user."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    user = register.objects.get(id=request.session['user_id'])
    notifications = Notification.objects.filter(user=user).order_by('-created_at')[:20]
    
    notif_list = []
    for n in notifications:
        related_pic = ''
        if n.related_user:
            if n.related_user.profile_pic:
                related_pic = settings.MEDIA_URL + str(n.related_user.profile_pic)
        
        notif_list.append({
            'id': n.id,
            'message': n.message,
            'type': n.notification_type,
            'related_user_id': n.related_user.id if n.related_user else None,
            'related_user_name': n.related_user.name if n.related_user else '',
            'related_user_pic': related_pic,
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%b %d, %Y %I:%M %p'),
        })
    
    unread_count = Notification.objects.filter(user=user, is_read=False).count()
    
    return JsonResponse({'notifications': notif_list, 'unread_count': unread_count})


def mark_notification_read(request):
    """Mark a notification as read."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        notif_id = data.get('notification_id')
    except (json.JSONDecodeError, AttributeError):
        notif_id = request.POST.get('notification_id')
    
    user = register.objects.get(id=request.session['user_id'])
    
    if notif_id == 'all':
        Notification.objects.filter(user=user, is_read=False).update(is_read=True)
    else:
        Notification.objects.filter(id=notif_id, user=user).update(is_read=True)
    
    return JsonResponse({'success': True})


def delete_notification(request):
    """Delete a specific notification."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        notif_id = data.get('notification_id')
    except (json.JSONDecodeError, AttributeError):
        notif_id = request.POST.get('notification_id')
    
    user = register.objects.get(id=request.session['user_id'])
    
    Notification.objects.filter(id=notif_id, user=user).delete()
    
    return JsonResponse({'success': True})


# ==================== Connections API ====================

def get_connections(request):
    """Get all accepted connections for the current user."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    user = register.objects.get(id=request.session['user_id'])
    
    # Find all accepted connections where user is either sender or receiver
    connections = Connection.objects.filter(
        Q(from_user=user, status='accepted') | 
        Q(to_user=user, status='accepted')
    )
    
    connected_users = []
    for conn in connections:
        other_user = conn.to_user if conn.from_user == user else conn.from_user
        pic_url = ''
        if other_user.profile_pic:
            pic_url = settings.MEDIA_URL + str(other_user.profile_pic)
        
        connected_users.append({
            'id': other_user.id,
            'name': other_user.name,
            'email': other_user.email,
            'course': other_user.course,
            'batch': other_user.Batch,
            'position': other_user.position or 'Alumni',
            'company': other_user.company or 'HIMCS',
            'location': other_user.location or 'Not specified',
            'profile_pic_url': pic_url,
            'connected_since': conn.created_at.strftime('%b %d, %Y'),
        })
    
    return JsonResponse({'connections': connected_users})


def get_connection_statuses(request):
    """Get connection statuses for all alumni relative to current user."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    user = register.objects.get(id=request.session['user_id'])
    
    connections = Connection.objects.filter(
        Q(from_user=user) | Q(to_user=user)
    ).exclude(status='rejected')
    
    statuses = {}
    for conn in connections:
        other_id = conn.to_user.id if conn.from_user == user else conn.from_user.id
        statuses[str(other_id)] = conn.status
    
    return JsonResponse({'statuses': statuses})


# ==================== Chat API ====================

def send_message(request):
    """Send a chat message to a connected user."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
    
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    try:
        data = json.loads(request.body)
        receiver_id = data.get('receiver_id')
        message_text = data.get('message', '').strip()
    except (json.JSONDecodeError, AttributeError):
        receiver_id = request.POST.get('receiver_id')
        message_text = request.POST.get('message', '').strip()
    
    if not receiver_id or not message_text:
        return JsonResponse({'error': 'receiver_id and message are required'}, status=400)
    
    sender = register.objects.get(id=request.session['user_id'])
    
    try:
        receiver = register.objects.get(id=receiver_id)
    except register.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    # Verify they are connected
    is_connected = Connection.objects.filter(
        (Q(from_user=sender, to_user=receiver) | Q(from_user=receiver, to_user=sender)),
        status='accepted'
    ).exists()
    
    if not is_connected:
        return JsonResponse({'error': 'You must be connected to chat'}, status=403)
    
    msg = ChatMessage.objects.create(
        sender=sender,
        receiver=receiver,
        message=message_text
    )
    
    return JsonResponse({
        'success': True,
        'message': {
            'id': msg.id,
            'sender_id': sender.id,
            'sender_name': sender.name,
            'receiver_id': receiver.id,
            'message': msg.message,
            'timestamp': msg.timestamp.strftime('%I:%M %p'),
            'is_read': msg.is_read,
        }
    })


def get_messages(request, user_id):
    """Get chat history with a specific user."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
    
    current_user = register.objects.get(id=request.session['user_id'])
    
    try:
        other_user = register.objects.get(id=user_id)
    except register.DoesNotExist:
        return JsonResponse({'error': 'User not found'}, status=404)
    
    chat_messages = ChatMessage.objects.filter(
        (Q(sender=current_user, receiver=other_user) | 
         Q(sender=other_user, receiver=current_user))
    ).order_by('timestamp')
    
    # Mark received messages as read
    ChatMessage.objects.filter(
        sender=other_user, receiver=current_user, is_read=False
    ).update(is_read=True)
    
    messages_list = []
    for m in chat_messages:
        messages_list.append({
            'id': m.id,
            'sender_id': m.sender.id,
            'sender_name': m.sender.name,
            'receiver_id': m.receiver.id,
            'message': m.message,
            'timestamp': m.timestamp.strftime('%I:%M %p'),
            'date': m.timestamp.strftime('%b %d, %Y'),
            'is_mine': m.sender.id == current_user.id,
        })
    
    # Get other user info
    pic_url = ''
    if other_user.profile_pic:
        pic_url = settings.MEDIA_URL + str(other_user.profile_pic)
    
    return JsonResponse({
        'messages': messages_list,
        'other_user': {
            'id': other_user.id,
            'name': other_user.name,
            'profile_pic_url': pic_url,
        }
    })


# ==================== Job Portal API ====================

def get_jobs(request):
    """Fetch all job postings."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
        
    jobs = Job.objects.all().order_by('-created_at')
    jobs_list = []
    
    for job in jobs:
        pic_url = ''
        if job.posted_by.profile_pic:
            pic_url = settings.MEDIA_URL + str(job.posted_by.profile_pic)
            
        jobs_list.append({
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'employment_type': job.employment_type,
            'salary_package': job.salary_package or 'Not disclosed',
            'description': job.description,
            'apply_link': job.apply_link or '',
            'posted_by_name': job.posted_by.name,
            'posted_by_pic': pic_url,
            'created_at': job.created_at.strftime('%b %d, %Y'),
        })
        
    return JsonResponse({'jobs': jobs_list})


def post_job(request):
    """Create a new job posting."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
        
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
        
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON data'}, status=400)
        
    user = register.objects.get(id=request.session['user_id'])
    
    required_fields = ['title', 'company', 'location', 'description', 'employment_type']
    for field in required_fields:
        if not data.get(field):
            return JsonResponse({'error': f'{field} is required'}, status=400)
            
    Job.objects.create(
        title=data.get('title'),
        company=data.get('company'),
        location=data.get('location'),
        employment_type=data.get('employment_type'),
        salary_package=data.get('salary_package'),
        description=data.get('description'),
        apply_link=data.get('apply_link'),
        posted_by=user
    )
    
    return JsonResponse({'success': True, 'message': 'Job successfully posted!'})


# ==================== Event Portal API ====================

def get_events(request):
    """Fetch all event postings."""
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
        
    events = Event.objects.all().order_by('date', 'time')
    events_list = []
    
    for event in events:
        image_url = ''
        if event.image:
            image_url = settings.MEDIA_URL + str(event.image)
            
        events_list.append({
            'id': event.id,
            'title': event.title,
            'event_type': event.event_type,
            'description': event.description,
            'date': event.date.strftime('%b %d, %Y'),
            'time': event.time.strftime('%I:%M %p'),
            'location': event.location,
            'image_url': image_url,
            'organizer_name': event.organizer.name,
            'created_at': event.created_at.strftime('%b %d, %Y')
        })
        
    return JsonResponse({'events': events_list})

def post_event(request):
    """Create a new event posting."""
    if request.method != 'POST':
        return JsonResponse({'error': 'POST required'}, status=405)
        
    if 'user_id' not in request.session:
        return JsonResponse({'error': 'Not logged in'}, status=401)
        
    try:
        # Check if it's a multipart form (for image) or JSON
        if request.content_type == 'application/json':
            data = json.loads(request.body)
        else:
            data = request.POST
            
        user = register.objects.get(id=request.session['user_id'])
        
        required_fields = ['title', 'event_type', 'description', 'date', 'time', 'location']
        for field in required_fields:
            if not data.get(field):
                return JsonResponse({'error': f'{field} is required'}, status=400)
                
        event = Event.objects.create(
            title=data.get('title'),
            event_type=data.get('event_type'),
            description=data.get('description'),
            date=data.get('date'),
            time=data.get('time'),
            location=data.get('location'),
            organizer=user
        )
        
        if request.FILES.get('image'):
            event.image = request.FILES.get('image')
            event.save()
            
        return JsonResponse({'success': True, 'message': 'Event successfully posted!'})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
