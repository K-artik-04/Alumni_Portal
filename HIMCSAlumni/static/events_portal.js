/**
 * Events Portal Logic for HIMCS Alumni Portal
 */

(function() {
    console.log("Events Portal JS Loaded");

    // Helper to get CSRF token
    function getCSRF() {
        let val = null;
        if (document.cookie) {
            document.cookie.split(';').forEach(c => {
                c = c.trim();
                if (c.startsWith('csrftoken=')) val = decodeURIComponent(c.substring(10));
            });
        }
        return val;
    }

    function getEventTypeClass(type) {
        if (!type) return 'networking';
        return type.toLowerCase();
    }

    let allEvents = [];

    function renderEvents(events) {
        console.log("Rendering events:", events);
        const container = document.getElementById("eventsList");
        const emptyState = document.getElementById("eventsEmptyState");
        
        if (!container) return;

        if (!events || events.length === 0) {
            container.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";
        container.innerHTML = "";

        events.forEach(event => {
            const typeClass = getEventTypeClass(event.event_type);
            const organizerPic = `https://ui-avatars.com/api/?name=${encodeURIComponent(event.organizer_name)}&background=random&size=24`;
            
            // Format date components
            // event.date format is "May 01, 2026"
            const dateParts = event.date.split(' ');
            const month = dateParts[0];
            const day = dateParts[1].replace(',', '');

            const bannerImg = event.image_url || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;

            const card = document.createElement("div");
            card.className = "event-card";
            card.innerHTML = `
                <div class="event-banner-container">
                    <img src="${bannerImg}" class="event-banner" alt="${event.title}">
                    <div class="event-date-badge">
                        <span class="event-date-day">${day}</span>
                        <span class="event-date-month">${month}</span>
                    </div>
                </div>
                <div class="event-card-content">
                    <span class="event-type-pill event-type-${typeClass}">${event.event_type}</span>
                    <h3 class="event-title">${event.title}</h3>
                    <div class="event-info-list">
                        <div class="event-info-item"><i class='bx bx-time'></i> ${event.time}</div>
                        <div class="event-info-item"><i class='bx bx-map'></i> ${event.location}</div>
                    </div>
                    <p class="event-description">${event.description}</p>
                    <div class="event-footer">
                        <div class="event-organizer">
                            <img src="${organizerPic}" alt="">
                            <span>By ${event.organizer_name}</span>
                        </div>
                        <a href="#" class="btn-event-register" onclick="event.preventDefault(); alert('Registration successful! Check your email for details.')">Register</a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function loadEvents() {
        console.log("Loading events from API...");
        fetch('/api/get-events/')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error("API Error:", data.error);
                    return;
                }
                allEvents = data.events || [];
                renderEvents(allEvents);
                
                // Update dashboard stat count
                const dashEventCount = document.getElementById("stat-events-count");
                if (dashEventCount) dashEventCount.textContent = allEvents.length;
            })
            .catch(err => {
                console.error("Fetch error:", err);
            });
    }

    function initEventsPortal() {
        console.log("Initializing Events Portal...");
        
        // Tabs logic
        const eventTabs = document.querySelectorAll('[data-event-tab]');
        
        eventTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                console.log("Event tab clicked:", tab.dataset.eventTab);
                
                // Active tab class
                const tabGroup = tab.parentElement.querySelectorAll('.job-tab');
                tabGroup.forEach(t => t.classList.remove("active"));
                tab.classList.add("active");
                
                // Show content
                const browseContent = document.getElementById('tab-browse-events');
                const organizeContent = document.getElementById('tab-organize-event');
                
                if (tab.dataset.eventTab === 'browse-events') {
                    if (browseContent) browseContent.classList.add('active');
                    if (organizeContent) organizeContent.classList.remove('active');
                    loadEvents();
                } else {
                    if (browseContent) browseContent.classList.remove('active');
                    if (organizeContent) organizeContent.classList.add('active');
                }
            });
        });

        // Search & Filter
        const eventSearchInput = document.getElementById("eventSearchInput");
        const eventFilterType = document.getElementById("eventFilterType");
        const eventSearchClear = document.getElementById("eventSearchClear");

        function filterEvents() {
            const query = (eventSearchInput ? eventSearchInput.value : "").toLowerCase();
            const typeFilter = eventFilterType ? eventFilterType.value : "";

            // Show/hide clear button
            if (eventSearchClear) {
                eventSearchClear.style.display = query ? "flex" : "none";
            }

            const filtered = allEvents.filter(event => {
                const matchSearch = (event.title || '').toLowerCase().includes(query)
                    || (event.location || '').toLowerCase().includes(query);
                const matchType = !typeFilter || event.event_type === typeFilter;
                return matchSearch && matchType;
            });

            renderEvents(filtered);
        }

        if (eventSearchInput) eventSearchInput.addEventListener("input", filterEvents);
        if (eventFilterType) eventFilterType.addEventListener("change", filterEvents);
        
        if (eventSearchClear) {
            eventSearchClear.addEventListener("click", () => {
                eventSearchInput.value = "";
                filterEvents();
                eventSearchInput.focus();
            });
        }

        // Post Event Form
        const postEventForm = document.getElementById("postEventForm");
        if (postEventForm) {
            postEventForm.addEventListener("submit", (e) => {
                e.preventDefault();
                console.log("Submitting event form...");
                
                const formData = new FormData();
                formData.append('title', document.getElementById("eventTitle").value.trim());
                formData.append('event_type', document.getElementById("eventType").value);
                formData.append('date', document.getElementById("eventDate").value);
                formData.append('time', document.getElementById("eventTime").value);
                formData.append('location', document.getElementById("eventLocation").value.trim());
                formData.append('description', document.getElementById("eventDescription").value.trim());
                
                const imageFile = document.getElementById("eventImage").files[0];
                if (imageFile) {
                    formData.append('image', imageFile);
                }

                fetch('/api/post-event/', {
                    method: 'POST',
                    headers: { 'X-CSRFToken': getCSRF() },
                    body: formData
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Event created successfully!");
                        postEventForm.reset();
                        // Switch to browse tab
                        const browseTab = document.querySelector('[data-event-tab="browse-events"]');
                        if (browseTab) browseTab.click();
                    } else {
                        alert(data.error || "Failed to create event.");
                    }
                })
                .catch(err => {
                    console.error("Post error:", err);
                    alert("An error occurred while creating the event.");
                });
            });
        }

        window.loadEvents = loadEvents;
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initEventsPortal);
    } else {
        initEventsPortal();
    }
})();
