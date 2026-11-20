document.addEventListener("DOMContentLoaded", () => {

    // Helper to generate avatar URL
    const getAvatarUrl = (name) => {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=f59e0b&color=fff`;
    };

    /* ================= Profile Dropdown Toggle ================= */
    const profilePicBtn = document.getElementById('profilePicBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profilePicBtn && profileDropdown) {
        profilePicBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            // Also close notif dropdown when profile opens
            const notifDropdown = document.getElementById('notifDropdown');
            if (notifDropdown) notifDropdown.classList.remove('show');
        });

        // Close profile dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profilePicBtn.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // Profile menu: Edit Profile navigates to profile settings section
    const menuEditProfile = document.getElementById('menu-edit-profile');
    if (menuEditProfile) {
        menuEditProfile.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.remove('show');
            // Switch to profile settings section
            const profileNav = document.querySelector('[data-section="profile-settings"]');
            if (profileNav) profileNav.click();
        });
    }

    // Profile menu: Change Password
    const menuChangePassword = document.getElementById('menu-change-password');
    if (menuChangePassword) {
        menuChangePassword.addEventListener('click', (e) => {
            e.preventDefault();
            profileDropdown.classList.remove('show');
            
            // Remove active from nav items
            const navItems = document.querySelectorAll(".nav-item");
            navItems.forEach(nav => nav.classList.remove("active"));
            
            // Hide all sections
            const sections = document.querySelectorAll(".section");
            sections.forEach(section => {
                section.classList.remove("active");
                section.style.display = "none";
            });
            
            // Show change password section
            const targetSection = document.getElementById('change-password-section');
            if (targetSection) {
                targetSection.style.display = "block";
                setTimeout(() => targetSection.classList.add("active"), 10);
            }
        });
    }

    // Initialize avatar fallback
    const bannerAvatarImg = document.querySelector('.topbar-profile-btn img');
    const bannerNameEl = document.querySelector('.pd-info h4');
    if (bannerAvatarImg && bannerNameEl) {
        const currentSrc = bannerAvatarImg.src;
        if (currentSrc.includes('name=&') || currentSrc.includes('name=')) {
            bannerAvatarImg.src = getAvatarUrl(bannerNameEl.textContent.trim());
        }
    }

    /* ================= Navigation Logic ================= */
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".section");
    const sidebar = document.getElementById("sidebar");
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");

    // Handle Section Switching
    navItems.forEach(item => {
        item.addEventListener("click", () => {
            // Remove active class from all nav items
            navItems.forEach(nav => nav.classList.remove("active"));
            // Add active class to clicked item
            item.classList.add("active");

            const sectionId = item.dataset.section;

            // Hide all sections
            sections.forEach(section => {
                section.classList.remove("active");
                section.style.display = "none"; // Ensure display none for animation reset
            });

            // Show target section
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.style.display = "block";
                // Small delay to allow display:block to apply before adding opacity class
                setTimeout(() => {
                    targetSection.classList.add("active");
                }, 10);
            }

            // Auto-load jobs when navigating to Job Portal
            if (sectionId === 'jobs' && typeof loadJobs === 'function') {
                loadJobs();
            }

            // Auto-load events when navigating to Events
            if (sectionId === 'events' && typeof loadEvents === 'function') {
                loadEvents();
            }

            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove("open");
            }
        });
    });

    // Mobile Menu Toggle
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener("click", () => {
            sidebar.classList.toggle("open");
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener("click", (e) => {
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !mobileMenuBtn.contains(e.target) &&
            sidebar.classList.contains("open")) {
            sidebar.classList.remove("open");
        }
    });

    /* ================= Mock Data Population ================= */

    // Networking Data
    let networkingData = [];
    if (window.djangoAlumniData && window.djangoAlumniData.length > 0) {
        networkingData = window.djangoAlumniData.map(person => {
            // Check if person is current user (could skip this if we want to show current user too)
            return {
                name: person.name,
                role: person.position || "Alumni",
                company: person.company || "HIMCS",
                batch: person.Batch ? person.Batch.toString() : "N/A",
                location: person.location || "Not specified",
                alumni_assistance: person.alumni_assistance || "none of these",
                img: person.profile_pic_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || "A")}&background=random&color=fff`
            };
        });
    } else {
        networkingData = [
            { name: "Kartik", role: "Product Manager", company: "Microsoft", batch: "2024", location: "Banglore, India", alumni_assistance: "Job opportunity", img: "https://ui-avatars.com/api/?name=Kartik&background=0D8ABC&color=fff" },
            { name: "Gaurav Yadav", role: "Senior Developer", company: "Amazon", batch: "2022", location: "Noida, India", alumni_assistance: "Guest lecture", img: "https://ui-avatars.com/api/?name=Gaurav+Yadav&background=random&color=fff" },
            { name: "Chandraveer Baghel", role: "UX Designer", company: "Adobe", batch: "2023", location: "Noida, India", alumni_assistance: "none of these", img: "https://ui-avatars.com/api/?name=Chandraveer+Baghel&background=random&color=fff" },
            { name: "Charitra Jain", role: "Data Scientist", company: "Netflix", batch: "2022", location: "Delhi, India", alumni_assistance: "college funding", img: "https://ui-avatars.com/api/?name=Charitra+Jain&background=random&color=fff" }
        ];
    }

    const networkingGrid = document.getElementById("networking-grid");
    const alumniSearch = document.getElementById("alumni-search");
    const searchClear = document.getElementById("search-clear");
    const noResults = document.getElementById("no-results");

    // Function to render alumni cards
    function renderAlumni(data) {
        networkingGrid.innerHTML = ""; // Clear existing cards

        if (data.length === 0) {
            networkingGrid.style.display = "none";
            noResults.style.display = "block";
            return;
        }

        networkingGrid.style.display = "grid";
        noResults.style.display = "none";

        data.forEach(person => {
            const card = document.createElement("div");
            card.className = "card";
            card.style.textAlign = "center";

            let assistanceBadge = "";
            if (person.alumni_assistance && person.alumni_assistance !== "none of these" && person.alumni_assistance !== "") {
                assistanceBadge = `<span class="badge" style="background-color: #e0f2fe; color: #0284c7; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; display: inline-block; margin-bottom: 8px;">Assist through: ${person.alumni_assistance}</span>`;
            }

            card.innerHTML = `
                <img src="${person.img}" alt="${person.name}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 16px; object-fit: cover; align-self: center;">
                <h3 style="font-size: 1.1rem; margin-bottom: 4px;">${person.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px;">${person.role} at ${person.company}</p>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 8px;"><i class='bx bx-map'></i> ${person.location}</p>
                <p style="font-size: 0.85rem; color: var(--primary); font-weight: 500; margin-bottom: 8px;">Class of ${person.batch}</p>
                ${assistanceBadge}
                <button class="btn btn-primary" style="width: 100%; padding: 8px; margin-top: auto;">Connect</button>
            `;
            card.style.display = "flex";
            card.style.flexDirection = "column";
            networkingGrid.appendChild(card);
        });
    }

    // Initial render
    if (networkingGrid) {
        renderAlumni(networkingData);
    }

    const alumniAssistanceFilter = document.getElementById("alumni-assistance-filter");

    function filterAlumni() {
        const searchTerm = (alumniSearch ? alumniSearch.value : "").toLowerCase().trim();
        const assistanceTerm = (alumniAssistanceFilter ? alumniAssistanceFilter.value : "");

        // Show/hide clear button
        if (searchTerm && searchClear) {
            searchClear.style.display = "flex";
        } else if (searchClear) {
            searchClear.style.display = "none";
        }

        // Filter alumni
        const filteredData = networkingData.filter(person => {
            const matchesSearch = (person.name || "").toLowerCase().includes(searchTerm) ||
                (person.role || "").toLowerCase().includes(searchTerm) ||
                (person.company || "").toLowerCase().includes(searchTerm) ||
                (person.location || "").toLowerCase().includes(searchTerm) ||
                (person.batch || "").toString().toLowerCase().includes(searchTerm);

            const personAssistance = (person.alumni_assistance || "none of these").toLowerCase();
            const matchesAssistance = assistanceTerm === "" || personAssistance === assistanceTerm.toLowerCase();

            return matchesSearch && matchesAssistance;
        });

        renderAlumni(filteredData);
    }

    // Search functionality with location filtering
    if (alumniSearch) {
        alumniSearch.addEventListener("input", filterAlumni);
    }

    if (alumniAssistanceFilter) {
        alumniAssistanceFilter.addEventListener("change", filterAlumni);
    }

    // Clear button functionality
    if (searchClear) {
        searchClear.addEventListener("click", () => {
            alumniSearch.value = "";
            searchClear.style.display = "none";
            filterAlumni();
            alumniSearch.focus();
        });
    }

    // Events Data
    const eventsData = [
        { title: "Annual Alumni Gala", date: "Nov 15, 2025", time: "6:00 PM", location: "Grand Hotel Ballroom" },
        { title: "Tech Talk: AI Future", date: "Dec 02, 2025", time: "2:00 PM", location: "College Auditorium" }
    ];

    const eventsGrid = document.getElementById("events-grid");
    if (eventsGrid) {
        eventsData.forEach(event => {
            const card = document.createElement("div");
            card.className = "card";
            card.innerHTML = `
                <div style="display: flex; gap: 16px;">
                    <div style="background: var(--bg-body); padding: 12px; border-radius: 12px; text-align: center; min-width: 70px; height: fit-content;">
                        <div style="font-weight: 700; color: var(--primary); font-size: 1.2rem;">${event.date.split(" ")[1].replace(",", "")}</div>
                        <div style="font-size: 0.9rem; text-transform: uppercase;">${event.date.split(" ")[0]}</div>
                    </div>
                    <div>
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">${event.title}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px;"><i class='bx bx-time'></i> ${event.time}</p>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;"><i class='bx bx-map'></i> ${event.location}</p>
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">Register</button>
                    </div>
                </div>
            `;
            eventsGrid.appendChild(card);
        });
    }

    /* ================= Profile Image Preview ================= */
    const profileInput = document.getElementById("profileInput");
    const profilePreview = document.getElementById("profilePreview");

    if (profileInput && profilePreview) {
        profileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    profilePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    /* ================= Profile Update Logic ================= */
    const dashboardEditBtn = document.getElementById("edit-profile-btn");
    const bannerEditBtn = document.getElementById("banner-edit-profile");

    function navigateToProfile() {
        // Find and activate the Profile Settings nav item
        const profileNavItem = Array.from(navItems).find(item => item.dataset.section === "profile-settings");

        // Remove active class from all nav items
        navItems.forEach(nav => nav.classList.remove("active"));

        // Add active class to Profile Settings nav item
        if (profileNavItem) {
            profileNavItem.classList.add("active");
        }

        // Hide all sections
        sections.forEach(section => {
            section.classList.remove("active");
            section.style.display = "none";
        });

        // Show profile settings
        const profileSection = document.getElementById("profile-settings");
        if (profileSection) {
            profileSection.style.display = "block";
            setTimeout(() => {
                profileSection.classList.add("active");
            }, 10);
        }

        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            sidebar.classList.remove("open");
        }
    }

    if (dashboardEditBtn) {
        dashboardEditBtn.addEventListener("click", navigateToProfile);
    }

    if (bannerEditBtn) {
        bannerEditBtn.addEventListener("click", navigateToProfile);
    }

    const profileForm = document.getElementById("profile-form");
    const cancelProfileBtn = document.getElementById("cancel-profile-btn");
    const settingsProfileInput = document.getElementById("settingsProfileInput");
    const settingsProfilePreview = document.getElementById("settingsProfilePreview");
    const dashboardProfilePreview = document.getElementById("profilePreview");

    // Handle Profile Picture Preview
    if (settingsProfileInput && settingsProfilePreview) {
        settingsProfileInput.addEventListener("change", function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    settingsProfilePreview.src = e.target.result;
                }
                reader.readAsDataURL(file);
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener("submit", (e) => {
            // Native form submission will happen
            // Removed e.preventDefault() to allow backend update
            const btn = profileForm.querySelector("button[type='submit']");
            if (btn) {
                btn.textContent = "Saving...";
                btn.disabled = true;
            }
        });
    }
    // Profile form submission is now handled by Django (native POST request)

    if (cancelProfileBtn) {
        cancelProfileBtn.addEventListener("click", () => {
            // Go back to dashboard
            document.querySelector('[data-section="dashboard"]').click();
        });
    }

    /* ================= Post Creation Logic ================= */

    // Global functions to be accessible from HTML onclick
    window.openPostModal = function () {
        const modal = document.getElementById("postModal");
        if (modal) modal.style.display = "block";
    };

    window.closePostModal = function () {
        const modal = document.getElementById("postModal");
        if (modal) modal.style.display = "none";
    };

    window.toggleEventFields = function () {
        const type = document.getElementById("postType").value;
        const eventFields = document.getElementById("eventFields");
        const orgLabel = document.getElementById("orgLabel");

        if (type === "webinar" || type === "alumni-meet") {
            eventFields.style.display = "block";
            orgLabel.textContent = "Organizer / Host";
        } else {
            eventFields.style.display = "none";
            orgLabel.textContent = "Company Name";
        }
    };

    // Close modal if clicked outside
    window.onclick = function (event) {
        const modal = document.getElementById("postModal");
        if (event.target == modal) {
            modal.style.display = "none";
        }
    };

    const createPostForm = document.getElementById("createPostForm");

    // Initialize LocalStorage Data if empty
    if (!localStorage.getItem("dashboardJobs")) {
        localStorage.setItem("dashboardJobs", JSON.stringify(jobData));
    }
    if (!localStorage.getItem("dashboardEvents")) {
        localStorage.setItem("dashboardEvents", JSON.stringify(eventsData));
    }
    // Seed initial activity if empty
    if (!localStorage.getItem("dashboardActivity")) {
        const initialActivity = [
            { icon: "bx-calendar", title: "Registered for Annual Meet", subtitle: "You confirmed your attendance", time: "2h ago" },
            { icon: "bx-briefcase", title: "New Job Posted", subtitle: "Senior Developer at TechCorp", time: "5h ago" },
            { icon: "bx-user-plus", title: "New Connection Request", subtitle: "Rahul Sharma sent a request", time: "1d ago" }
        ];
        localStorage.setItem("dashboardActivity", JSON.stringify(initialActivity));
    }

    // Function to add new Activity
    function addActivity(icon, title, subtitle) {
        const activities = JSON.parse(localStorage.getItem("dashboardActivity")) || [];
        activities.unshift({
            icon: icon,
            title: title,
            subtitle: subtitle,
            time: "Just now"
        });
        localStorage.setItem("dashboardActivity", JSON.stringify(activities));
        renderRecentActivity();
    }

    // Render Recent Activity
    function renderRecentActivity() {
        const activityList = document.querySelector(".activity-list");
        if (!activityList) return;

        const activities = JSON.parse(localStorage.getItem("dashboardActivity")) || [];
        activityList.innerHTML = "";

        activities.slice(0, 5).forEach(item => {
            const div = document.createElement("div");
            div.className = "list-item";
            div.innerHTML = `
                <div class="item-icon">
                  <i class='bx ${item.icon}'></i>
                </div>
                <div class="item-content">
                  <div class="item-title">${item.title}</div>
                  <div class="item-subtitle">${item.subtitle}</div>
                </div>
                <div class="item-meta">${item.time}</div>
            `;
            activityList.appendChild(div);
        });
    }

    // Override existing render functions to use LocalStorage
    function loadAndRenderJobs() {
        const storedJobs = JSON.parse(localStorage.getItem("dashboardJobs")) || [];
        renderJobs(storedJobs);
    }

    function loadAndRenderEvents() {
        const storedEvents = JSON.parse(localStorage.getItem("dashboardEvents")) || [];
        const eventsGrid = document.getElementById("events-grid");
        if (!eventsGrid) return;

        eventsGrid.innerHTML = "";
        storedEvents.forEach(event => {
            const card = document.createElement("div");
            card.className = "card";
            // Check if it's an Alumni Meet to add a badge or distinct style
            const badge = event.type === 'alumni-meet' ? '<span style="background: #e0e7ff; color: #4f46e5; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem; margin-bottom: 4px; display: inline-block;">Alumni Meet</span>' : '';

            card.innerHTML = `
                <div style="display: flex; gap: 16px;">
                    <div style="background: var(--bg-body); padding: 12px; border-radius: 12px; text-align: center; min-width: 70px; height: fit-content;">
                        <div style="font-weight: 700; color: var(--primary); font-size: 1.2rem;">${event.date.split(" ")[1].replace(",", "")}</div>
                        <div style="font-size: 0.9rem; text-transform: uppercase;">${event.date.split(" ")[0]}</div>
                    </div>
                    <div>
                        ${badge}
                        <h3 style="font-size: 1.1rem; margin-bottom: 8px;">${event.title}</h3>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 4px;"><i class='bx bx-time'></i> ${event.time}</p>
                        <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 16px;"><i class='bx bx-map'></i> ${event.location}</p>
                        <button class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem;">Register</button>
                    </div>
                </div>
            `;
            eventsGrid.appendChild(card);
        });
    }

    // Handle Post Submission
    if (createPostForm) {
        createPostForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const type = document.getElementById("postType").value;
            const title = document.getElementById("postTitle").value;
            const org = document.getElementById("postOrg").value;
            const desc = document.getElementById("postDescription").value;

            if (type === "job") {
                const newJob = {
                    title: title,
                    company: org,
                    location: "Remote", // Defaulting for simplicity
                    type: "Full-time",
                    posted: "Just now"
                };

                const jobs = JSON.parse(localStorage.getItem("dashboardJobs")) || [];
                jobs.unshift(newJob);
                localStorage.setItem("dashboardJobs", JSON.stringify(jobs));

                addActivity("bx-briefcase", "New Job Posted", `${title} at ${org}`);
                loadAndRenderJobs();

            } else {
                // Event or Alumni Meet
                const dateVal = document.getElementById("eventDate").value; // yyyy-mm-dd
                const timeVal = document.getElementById("eventTime").value;
                const locVal = document.getElementById("eventLocation").value;

                // Format date roughly
                let dateStr = "TBD";
                if (dateVal) {
                    const d = new Date(dateVal);
                    dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                }

                const newEvent = {
                    title: title,
                    date: dateStr,
                    time: timeVal || "TBD",
                    location: locVal || "Online",
                    type: type // 'webinar' or 'alumni-meet'
                };

                const events = JSON.parse(localStorage.getItem("dashboardEvents")) || [];
                events.unshift(newEvent);
                localStorage.setItem("dashboardEvents", JSON.stringify(events));

                const activityTitle = type === "alumni-meet" ? "Alumni Meet Organized" : "Webinar Scheduled";
                addActivity("bx-calendar-event", activityTitle, `${title} by ${org}`);
                loadAndRenderEvents();
            }

            closePostModal();
            createPostForm.reset();
            alert("Post created successfully!");
        });
    }

    // Initial Load
    renderRecentActivity();
    loadAndRenderJobs(); // Re-run to catch localStorage data
    loadAndRenderEvents(); // Re-run to catch localStorage data


    /* ================= Feedback Logic ================= */
    const feedbackForm = document.getElementById("feedback-form");
    const feedbackHistoryContainer = document.getElementById("feedback-history-container");
    const feedbackCount = document.getElementById("feedback-count");

    // Helper to get logic for badge class
    const getBadgeClass = (type) => {
        switch (type) {
            case 'bug': return 'bug';
            case 'feature': return 'feature';
            case 'praise': return 'praise';
            default: return 'other';
        }
    };

    const getIconForType = (type) => {
        switch (type) {
            case 'bug': return '<i class="bx bx-bug"></i>';
            case 'feature': return '<i class="bx bx-bulb"></i>';
            case 'praise': return '<i class="bx bx-heart"></i>';
            default: return '<i class="bx bx-dots-horizontal-rounded"></i>';
        }
    };

    function renderFeedbackHistory() {
        if (!feedbackHistoryContainer) return;

        const allFeedback = JSON.parse(localStorage.getItem("dashboardFeedback")) || [];

        if (feedbackCount) {
            feedbackCount.textContent = `${allFeedback.length} submissions`;
        }

        if (allFeedback.length === 0) {
            feedbackHistoryContainer.innerHTML = `
                <div class="empty-state">
                  <i class='bx bx-message-square-edit' style="font-size: 3rem; color: var(--border-color);"></i>
                  <p style="color: var(--text-muted); margin-top: 10px;">You haven't submitted any feedback yet.</p>
                </div>
            `;
            return;
        }

        feedbackHistoryContainer.innerHTML = "";

        allFeedback.forEach(item => {
            const div = document.createElement("div");
            div.className = "feedback-item";

            // Generate Stars
            let starsHtml = "";
            for (let i = 1; i <= 5; i++) {
                if (i <= item.rating) starsHtml += "★";
                else starsHtml += "☆";
            }

            div.innerHTML = `
                <div class="f-item-header">
                    <span class="f-type-badge ${getBadgeClass(item.type)}">
                        ${getIconForType(item.type)} ${item.type}
                    </span>
                    <span class="f-rating" title="${item.rating}/5 Stars">${starsHtml}</span>
                </div>
                <div class="f-subject">${item.subject}</div>
                <div class="f-message">${item.message}</div>
                <div class="f-meta">
                    <span>${item.date}</span>
                    <span class="f-status">Pending Review</span>
                </div>
            `;
            feedbackHistoryContainer.appendChild(div);
        });
    }

    if (feedbackForm) {
        feedbackForm.addEventListener("submit", (e) => {
            e.preventDefault();

            // validation for rating
            const ratingEl = document.querySelector('input[name="rating"]:checked');
            if (!ratingEl) {
                alert("Please select a star rating!");
                return;
            }

            const type = document.querySelector('input[name="feedbackType"]:checked').value;
            const rating = ratingEl.value;
            const subject = document.getElementById("feedbackSubject").value.trim();
            const message = document.getElementById("feedbackMessage").value.trim();

            const newFeedback = {
                id: Date.now(),
                type,
                rating,
                subject,
                message,
                date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };

            // Save to LocalStorage
            const allFeedback = JSON.parse(localStorage.getItem("dashboardFeedback")) || [];
            allFeedback.unshift(newFeedback);
            localStorage.setItem("dashboardFeedback", JSON.stringify(allFeedback));

            // Reset form
            feedbackForm.reset();
            // Reset star rating visual check if needed (radio buttons handle this naturally usually)

            // Show Success
            alert("Thank you for your feedback! We've received it.");
        });
    }

    // Initial load for jobs and events to update dashboard counts
    if (window.loadJobs) window.loadJobs();
    if (window.loadEvents) window.loadEvents();

});
