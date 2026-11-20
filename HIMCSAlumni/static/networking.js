document.addEventListener("DOMContentLoaded", () => {
    // Helper to get CSRF token
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');

    // UI Elements
    const notifBellBtn = document.getElementById("notifBellBtn");
    const notifDropdown = document.getElementById("notifDropdown");
    const notifBadge = document.getElementById("notifBadge");
    const notifList = document.getElementById("notifList");
    const notifMarkAll = document.getElementById("notifMarkAll");
    
    // Tab Elements
    const netTabs = document.querySelectorAll(".net-tab");
    const netTabContents = document.querySelectorAll(".net-tab-content");
    const connectionsGrid = document.getElementById("connections-grid");
    
    // Chat Elements
    const chatContacts = document.getElementById("chatContacts");
    const chatHeader = document.getElementById("chatHeader");
    const chatMessages = document.getElementById("chatMessages");
    const chatInputBar = document.getElementById("chatInputBar");
    const chatInput = document.getElementById("chatInput");
    const chatSendBtn = document.getElementById("chatSendBtn");
    const chatPlaceholder = document.querySelector(".chat-placeholder");

    let currentChatUserId = null;
    let chatPollInterval = null;

    // Toast helper
    function showToast(message, type="success") {
        const toastContainer = document.getElementById("toastContainer");
        if(!toastContainer) return;
        const toast = document.createElement("div");
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class='bx ${type === 'success' ? 'bx-check-circle' : 'bx-error-circle'}'></i> <span>${message}</span>`;
        toastContainer.appendChild(toast);
        setTimeout(() => toast.classList.add("show"), 10);
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ================== Tabs Logic ==================
    netTabs.forEach(tab => {
        tab.addEventListener("click", () => {
            netTabs.forEach(t => t.classList.remove("active"));
            netTabContents.forEach(c => c.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");

            if(tab.dataset.tab === 'my-connections') loadConnections();
            if(tab.dataset.tab === 'chat') loadChatContacts();
        });
    });

    // ================== Notifications Logic ==================
    if(notifBellBtn) {
        notifBellBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            notifDropdown.classList.toggle("show");
            if(notifDropdown.classList.contains("show")) {
                loadNotifications();
            }
        });

        document.addEventListener("click", (e) => {
            if(notifDropdown && !notifDropdown.contains(e.target) && !notifBellBtn.contains(e.target)) {
                notifDropdown.classList.remove("show");
            }
        });
    }

    function loadNotifications() {
        fetch('/api/get-notifications/')
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                
                updateNotifBadge(data.unread_count);
                
                if(data.notifications.length === 0) {
                    notifList.innerHTML = `<div class="notif-empty"><i class='bx bx-bell-off'></i><p>No notifications yet</p></div>`;
                    return;
                }

                notifList.innerHTML = "";
                data.notifications.forEach(n => {
                    const el = document.createElement("div");
                    el.className = `notif-item ${n.is_read ? '' : 'unread'}`;
                    
                    let actionsHtml = "";
                    if (n.type === 'request_received' && !n.is_read) {
                        actionsHtml = `
                            <div class="notif-actions">
                                <button class="btn btn-primary btn-sm btn-accept" data-id="${n.related_user_id}">Accept</button>
                                <button class="btn btn-outline btn-sm btn-reject" data-id="${n.related_user_id}">Reject</button>
                            </div>
                        `;
                    }

                    const pic = n.related_user_pic || `https://ui-avatars.com/api/?name=${n.related_user_name || 'A'}&background=random`;
                    
                    el.innerHTML = `
                        <img src="${pic}" class="notif-img">
                        <div class="notif-content">
                            <p>${n.message}</p>
                            <span class="notif-time">${n.created_at}</span>
                            ${actionsHtml}
                        </div>
                        <button class="notif-remove-btn" data-id="${n.id}" title="Remove notification"><i class='bx bx-x'></i></button>
                    `;
                    notifList.appendChild(el);
                });

                // Attach Action Listeners
                document.querySelectorAll(".btn-accept").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        handleConnectionAction('/api/accept-connection/', e.target.dataset.id);
                    });
                });
                document.querySelectorAll(".btn-reject").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        handleConnectionAction('/api/reject-connection/', e.target.dataset.id);
                    });
                });
                document.querySelectorAll(".notif-remove-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const notifId = e.currentTarget.dataset.id;
                        fetch('/api/delete-notification/', {
                            method: 'POST',
                            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ notification_id: notifId })
                        }).then(() => loadNotifications());
                    });
                });
            });
    }

    function updateNotifBadge(count) {
        if(count > 0) {
            notifBadge.textContent = count;
            notifBadge.style.display = "block";
        } else {
            notifBadge.style.display = "none";
        }
    }

    if(notifMarkAll) {
        notifMarkAll.addEventListener("click", () => {
            fetch('/api/mark-notification-read/', {
                method: 'POST',
                headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
                body: JSON.stringify({ notification_id: 'all' })
            }).then(() => loadNotifications());
        });
    }

    // Polling unread count every 30s
    setInterval(() => {
        fetch('/api/get-notifications/')
            .then(res => res.json())
            .then(data => { if(!data.error) updateNotifBadge(data.unread_count); });
    }, 30000);

    // ================== Connections Logic ==================
    function handleConnectionAction(url, fromUserId) {
        fetch(url, {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from_user_id: fromUserId })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast(data.message);
                loadNotifications();
                updateConnectionStatuses();
            } else {
                showToast(data.error, "error");
            }
        });
    }

    window.sendConnectionRequest = function(toUserId) {
        fetch('/api/send-connection-request/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ to_user_id: toUserId })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                showToast("Connection request sent!");
                loadNotifications();
                updateConnectionStatuses();
            } else {
                showToast(data.error, "error");
            }
        });
    };

    function updateConnectionStatuses() {
        // Fetch statuses for All Alumni tab
        fetch('/api/get-connection-statuses/')
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                const statuses = data.statuses;
                document.querySelectorAll(".connect-btn").forEach(btn => {
                    const id = btn.dataset.id;
                    if(statuses[id]) {
                        if(statuses[id] === 'pending') {
                            btn.textContent = "Pending";
                            btn.className = "btn btn-outline connect-btn";
                            btn.disabled = true;
                        } else if(statuses[id] === 'accepted') {
                            btn.textContent = "Connected";
                            btn.className = "btn btn-outline connect-btn";
                            btn.disabled = true;
                        }
                    } else {
                        btn.textContent = "Connect";
                        btn.className = "btn btn-primary connect-btn";
                        btn.disabled = false;
                    }
                });
            });
    }

    function loadConnections() {
        if(!connectionsGrid) return;
        fetch('/api/get-connections/')
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                connectionsGrid.innerHTML = "";
                if(data.connections.length === 0) {
                    connectionsGrid.style.display = "none";
                    document.getElementById("no-connections").style.display = "block";
                    return;
                }
                
                connectionsGrid.style.display = "grid";
                document.getElementById("no-connections").style.display = "none";

                data.connections.forEach(person => {
                    const card = document.createElement("div");
                    card.className = "card";
                    card.style.textAlign = "center";
                    const pic = person.profile_pic_url || `https://ui-avatars.com/api/?name=${person.name}&background=random`;
                    
                    card.innerHTML = `
                        <img src="${pic}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; object-fit: cover;">
                        <h3 style="font-size: 1.1rem;">${person.name}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">${person.position} at ${person.company}</p>
                        <p style="font-size: 0.85rem; color: var(--primary); margin-bottom: 8px;">Class of ${person.batch}</p>
                        <button class="btn btn-primary msg-btn" data-id="${person.id}" style="width: 100%; margin-top: auto;">Message</button>
                    `;
                    connectionsGrid.appendChild(card);
                });

                document.querySelectorAll(".msg-btn").forEach(btn => {
                    btn.addEventListener("click", (e) => {
                        const id = e.target.dataset.id;
                        document.querySelector('[data-tab="chat"]').click();
                        openChatWith(id);
                    });
                });
            });
    }

    // Intercept default rendering from dashboard.js to add dynamic Connect buttons
    // We just poll it once after a small delay to attach event listeners
    setTimeout(() => {
        const originalGrid = document.getElementById("networking-grid");
        if(originalGrid) {
            const buttons = originalGrid.querySelectorAll(".btn-primary");
            buttons.forEach((btn, index) => {
                // Find the user ID from the global data if possible
                // since dashboard.js doesn't attach IDs, we map by index
                // Note: The global djangoAlumniData doesn't include the current user,
                // but the index might match. A robust way is to re-render in our script, 
                // but we will just rely on the existing render and modify it.
                if(window.djangoAlumniData && window.djangoAlumniData[index]) {
                    const u = window.djangoAlumniData[index];
                    if(u.id !== window.currentUserId) {
                        btn.dataset.id = u.id;
                        btn.classList.add("connect-btn");
                        btn.addEventListener("click", () => sendConnectionRequest(u.id));
                    } else {
                        btn.style.display = "none"; // Hide self
                    }
                }
            });
            updateConnectionStatuses();
        }
    }, 500);


    // ================== Chat Logic ==================
    function loadChatContacts() {
        fetch('/api/get-connections/')
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                chatContacts.innerHTML = "";
                if(data.connections.length === 0) {
                    chatContacts.innerHTML = `<div class="chat-empty-contacts"><p>No connections yet</p></div>`;
                    return;
                }

                data.connections.forEach(person => {
                    const pic = person.profile_pic_url || `https://ui-avatars.com/api/?name=${person.name}&background=random`;
                    const el = document.createElement("div");
                    el.className = "chat-contact-item";
                    el.dataset.id = person.id;
                    el.innerHTML = `
                        <img src="${pic}">
                        <div>
                            <h4>${person.name}</h4>
                            <p>Class of ${person.batch}</p>
                        </div>
                    `;
                    el.addEventListener("click", () => openChatWith(person.id, el));
                    chatContacts.appendChild(el);
                });
            });
    }

    function openChatWith(userId, element = null) {
        currentChatUserId = userId;
        document.querySelectorAll(".chat-contact-item").forEach(el => el.classList.remove("active"));
        if(element) element.classList.add("active");
        else {
            const el = document.querySelector(`.chat-contact-item[data-id="${userId}"]`);
            if(el) el.classList.add("active");
        }

        chatPlaceholder.style.display = "none";
        chatHeader.style.display = "flex";
        chatMessages.style.display = "flex";
        chatInputBar.style.display = "flex";

        loadChatMessages();
        
        if(chatPollInterval) clearInterval(chatPollInterval);
        chatPollInterval = setInterval(loadChatMessages, 5000);
    }

    function loadChatMessages() {
        if(!currentChatUserId) return;
        fetch(`/api/get-messages/${currentChatUserId}/`)
            .then(res => res.json())
            .then(data => {
                if(data.error) return;
                
                chatHeader.innerHTML = `
                    <img src="${data.other_user.profile_pic_url || 'https://ui-avatars.com/api/?name='+data.other_user.name}">
                    <h4>${data.other_user.name}</h4>
                `;

                // Only append new or re-render
                // Simple re-render for now
                chatMessages.innerHTML = "";
                let currentDate = "";

                data.messages.forEach(msg => {
                    if (msg.date !== currentDate) {
                        chatMessages.innerHTML += `<div class="chat-date-divider"><span>${msg.date}</span></div>`;
                        currentDate = msg.date;
                    }
                    
                    const el = document.createElement("div");
                    el.className = `chat-msg ${msg.is_mine ? 'sent' : 'received'}`;
                    el.innerHTML = `
                        <div class="chat-bubble">${msg.message}</div>
                        <div class="chat-time">${msg.timestamp}</div>
                    `;
                    chatMessages.appendChild(el);
                });

                chatMessages.scrollTop = chatMessages.scrollHeight;
            });
    }

    function sendChatMessage() {
        if(!currentChatUserId) return;
        const text = chatInput.value.trim();
        if(!text) return;

        chatInput.value = "";
        
        fetch('/api/send-message/', {
            method: 'POST',
            headers: { 'X-CSRFToken': csrftoken, 'Content-Type': 'application/json' },
            body: JSON.stringify({ receiver_id: currentChatUserId, message: text })
        })
        .then(res => res.json())
        .then(data => {
            if(data.success) {
                loadChatMessages();
            } else {
                showToast(data.error, "error");
            }
        });
    }

    if(chatSendBtn) chatSendBtn.addEventListener("click", sendChatMessage);
    if(chatInput) chatInput.addEventListener("keypress", (e) => {
        if(e.key === "Enter") sendChatMessage();
    });

});
