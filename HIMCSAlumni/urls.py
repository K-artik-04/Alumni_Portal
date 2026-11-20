from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("about/", views.about, name="about"), 
    path("gallery/", views.gallery, name="gallery"),
    path("directory/", views.directory, name="directory"),
    path("register/", views.Register, name="register"),
    path("login/", views.Login, name="login"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("logout/", views.Logout, name="logout"),
    path("contact/", views.contact, name="contact"),
    
    # Password Reset Flow
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("verify-otp/", views.verify_otp, name="verify_otp"),
    path("reset-password/", views.reset_password, name="reset_password"),
    path("update-profile/", views.update_profile, name="update_profile"),
    path("api/change-password/", views.change_password_api, name="change_password_api"),

    # Connection API
    path("api/send-connection-request/", views.send_connection_request, name="send_connection_request"),
    path("api/accept-connection/", views.accept_connection, name="accept_connection"),
    path("api/reject-connection/", views.reject_connection, name="reject_connection"),
    path("api/get-connection-statuses/", views.get_connection_statuses, name="get_connection_statuses"),
    path("api/get-connections/", views.get_connections, name="get_connections"),

    # Notification API
    path("api/get-notifications/", views.get_notifications, name="get_notifications"),
    path("api/mark-notification-read/", views.mark_notification_read, name="mark_notification_read"),
    path("api/delete-notification/", views.delete_notification, name="delete_notification"),

    # Chat API
    path("api/send-message/", views.send_message, name="send_message"),
    path("api/get-messages/<int:user_id>/", views.get_messages, name="get_messages"),

    # Job Portal API
    path("api/get-jobs/", views.get_jobs, name="get_jobs"),
    path("api/post-job/", views.post_job, name="post_job"),

    # Event Portal API
    path("api/get-events/", views.get_events, name="get_events"),
    path("api/post-event/", views.post_event, name="post_event"),
]