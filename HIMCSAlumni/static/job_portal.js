/**
 * Job Portal Logic for HIMCS Alumni Portal
 * Isolated from main dashboard.js to prevent conflicts
 */

(function() {
    console.log("Job Portal JS Loaded");

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

    function getTypeBadgeClass(type) {
        if (!type) return 'full-time';
        return type.toLowerCase().replace(/[- ]/g, '-');
    }

    let allJobs = [];

    function renderJobs(jobs) {
        console.log("Rendering jobs:", jobs);
        const container = document.getElementById("jobCardsList");
        const emptyState = document.getElementById("jobsEmptyState");
        
        if (!container) {
            console.error("Job container not found!");
            return;
        }

        if (!jobs || jobs.length === 0) {
            container.innerHTML = "";
            if (emptyState) emptyState.style.display = "block";
            return;
        }

        if (emptyState) emptyState.style.display = "none";
        container.innerHTML = "";

        jobs.forEach(job => {
            const companyName = job.company || 'Unknown Company';
            const logoLetter = companyName.charAt(0).toUpperCase();
            const type = job.employment_type || 'Full-time';
            const typeBadgeClass = getTypeBadgeClass(type);
            const postedByPic = job.posted_by_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(job.posted_by_name || 'Alumni')}&background=random&size=22`;
            const applyHtml = job.apply_link
                ? `<a href="${job.apply_link}" target="_blank" class="btn-apply"><i class='bx bx-link-external'></i> Apply</a>`
                : `<span class="btn-apply" style="opacity:0.5; cursor:default;">No Link</span>`;

            const card = document.createElement("div");
            card.className = "job-card";
            card.innerHTML = `
                <div class="job-card-logo">${logoLetter}</div>
                <div class="job-card-body">
                    <div class="job-card-title">${job.title || 'Untitled Role'}</div>
                    <div class="job-card-company">${companyName}</div>
                    <div class="job-card-meta">
                        <span class="job-card-meta-item"><i class='bx bx-map'></i> ${job.location || 'Remote'}</span>
                        <span class="job-card-meta-item"><i class='bx bx-money'></i> ${job.salary_package || 'Not disclosed'}</span>
                        <span class="job-type-badge ${typeBadgeClass}">${type}</span>
                    </div>
                    <div class="job-card-desc">${job.description || ''}</div>
                    <div class="job-card-footer">
                        <div class="job-card-posted">
                            <img src="${postedByPic}" alt="">
                            <span>Posted by ${job.posted_by_name || 'Alumni'} · ${job.created_at || 'Recently'}</span>
                        </div>
                        <div class="job-card-actions">
                            ${applyHtml}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function loadJobs() {
        console.log("Loading jobs from API...");
        fetch('/api/get-jobs/')
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    console.error("API Error:", data.error);
                    return;
                }
                allJobs = data.jobs || [];
                renderJobs(allJobs);
                
                // Update dashboard stat count
                const dashJobCount = document.getElementById("stat-jobs-count");
                if (dashJobCount) dashJobCount.textContent = allJobs.length;
            })
            .catch(err => {
                console.error("Fetch error:", err);
            });
    }

    function initJobPortal() {
        console.log("Initializing Job Portal...");
        
        // Tabs logic
        const jobTabs = document.querySelectorAll(".job-tab");
        const jobTabContents = document.querySelectorAll(".job-tab-content");

        jobTabs.forEach(tab => {
            tab.addEventListener("click", () => {
                console.log("Tab clicked:", tab.dataset.jobTab);
                jobTabs.forEach(t => t.classList.remove("active"));
                jobTabContents.forEach(c => c.classList.remove("active"));
                tab.classList.add("active");
                const target = document.getElementById(`tab-${tab.dataset.jobTab}`);
                if (target) target.classList.add("active");

                if (tab.dataset.jobTab === 'browse-jobs') loadJobs();
            });
        });

        // Search & Filter
        const jobSearchInput = document.getElementById("jobSearchInput");
        const jobFilterType = document.getElementById("jobFilterType");

        function filterJobs() {
            const query = (jobSearchInput ? jobSearchInput.value : "").toLowerCase();
            const typeFilter = jobFilterType ? jobFilterType.value : "";

            const filtered = allJobs.filter(job => {
                const matchSearch = (job.title || '').toLowerCase().includes(query)
                    || (job.company || '').toLowerCase().includes(query)
                    || (job.location || '').toLowerCase().includes(query);
                const matchType = !typeFilter || job.employment_type === typeFilter;
                return matchSearch && matchType;
            });

            renderJobs(filtered);
        }

        if (jobSearchInput) jobSearchInput.addEventListener("input", filterJobs);
        if (jobFilterType) jobFilterType.addEventListener("change", filterJobs);

        // Post Job Form
        const postJobForm = document.getElementById("postJobForm");
        if (postJobForm) {
            postJobForm.addEventListener("submit", (e) => {
                e.preventDefault();
                console.log("Submitting job form...");

                const jobData = {
                    title: document.getElementById("jobTitle").value.trim(),
                    company: document.getElementById("jobCompany").value.trim(),
                    location: document.getElementById("jobLocation").value.trim(),
                    employment_type: document.getElementById("jobType").value,
                    salary_package: document.getElementById("jobSalary").value.trim(),
                    description: document.getElementById("jobDescription").value.trim(),
                    apply_link: document.getElementById("jobApplyLink").value.trim(),
                };

                fetch('/api/post-job/', {
                    method: 'POST',
                    headers: { 
                        'X-CSRFToken': getCSRF(), 
                        'Content-Type': 'application/json' 
                    },
                    body: JSON.stringify(jobData)
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert("Job posted successfully!");
                        postJobForm.reset();
                        // Switch to browse tab
                        const browseTab = document.querySelector('[data-job-tab="browse-jobs"]');
                        if (browseTab) browseTab.click();
                    } else {
                        alert(data.error || "Failed to post job.");
                    }
                })
                .catch(err => {
                    console.error("Post error:", err);
                    alert("An error occurred while posting the job.");
                });
            });
        }

        // Initial load if section is active or when navigating
        // We'll also expose loadJobs globally for dashboard.js to call
        window.loadJobs = loadJobs;

        // Check if jobs section is already active
        const jobsSection = document.getElementById('jobs');
        if (jobsSection && jobsSection.classList.contains('active')) {
            loadJobs();
        }
    }

    // Initialize on DOMContentLoaded
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initJobPortal);
    } else {
        initJobPortal();
    }
})();
