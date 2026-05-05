const API = "http://127.0.0.1:5000";

let editId = null;

// ================= INIT =================
document.addEventListener("DOMContentLoaded", () => {
    initCaptcha();
    attachAuthEvents();
});

// ================= CAPTCHA =================
const captchas = { login: "", signup: "", forgot: "" };

function generateCaptcha(type) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    captchas[type] = code;

    const el = document.getElementById(type + "CaptchaText");
    if (el) el.textContent = code;
}

function initCaptcha() {
    generateCaptcha("login");
    generateCaptcha("signup");
    generateCaptcha("forgot");
}

// ================= HELPERS =================
function showToast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    document.getElementById("toastMsg").textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ================= AUTH =================
function attachAuthEvents() {

    // LOGIN
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const email = document.getElementById("loginEmail").value.trim();
            const password = document.getElementById("loginPassword").value.trim();
            const captchaInput = document.getElementById("loginCaptchaInput").value.trim();

            if (!email || !password || !captchaInput) {
                showToast("Fill all fields");
                return;
            }

            if (captchaInput !== captchas.login) {
                showToast("Wrong captcha");
                generateCaptcha("login");
                return;
            }

            try {
                const res = await fetch(`${API}/login`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.status === 200) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("email", email);
                    showDashboard(email);
                } else {
                    showToast("Invalid email or password");
                }

            } catch {
                showToast("Server error");
            }
        });
    }

    // SIGNUP
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = document.getElementById("signupName").value.trim();
            const email = document.getElementById("signupEmail").value.trim();
            const password = document.getElementById("signupPassword").value.trim();
            const confirm = document.getElementById("signupConfirmPassword").value.trim();
            const captchaInput = document.getElementById("signupCaptchaInput").value.trim();

            if (!name || !email || !password || !confirm) {
                showToast("Fill all fields");
                return;
            }

            if (!isValidEmail(email)) {
                showToast("Invalid email");
                return;
            }

            if (password.length < 8) {
                showToast("Password must be 8+ chars");
                return;
            }

            if (password !== confirm) {
                showToast("Passwords do not match");
                return;
            }

            if (captchaInput !== captchas.signup) {
                showToast("Wrong captcha");
                generateCaptcha("signup");
                return;
            }

            try {
                const res = await fetch(`${API}/signup`, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({
                        full_name: name,
                        email,
                        password
                    })
                });

                const data = await res.json();

                if (res.status === 201) {
                    showToast("Signup successful");
                    showPage("loginPage");
                } else {
                    showToast(data.error || "Signup failed");
                }

            } catch {
                showToast("Server error");
            }
        });
    }
}

// ================= DASHBOARD =================
function showDashboard(email) {
    document.getElementById('authWrapper').style.display = 'none';
    document.getElementById('dashboardWrapper').classList.add('active');

    document.getElementById('dashName').textContent = email.split('@')[0];

    setTimeout(() => {
        initDashboardEvents();
        attachOpportunityEvents();
        initOpportunityUI();
        loadOpportunities();
    }, 200);
}

function handleLogout() {
    localStorage.clear();
    location.reload();
}

// ================= NAV =================
function initDashboardEvents() {
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
        item.addEventListener('click', function () {
            const page = this.getAttribute('data-page');

            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            this.classList.add('active');

            document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));

            if (page === 'dashboard')
                document.getElementById('dashboardSection').classList.add('active');

            if (page === 'opportunity')
                document.getElementById('opportunitySection').classList.add('active');
        });
    });
}

// ================= OPPORTUNITY =================
function attachOpportunityEvents() {

    const form = document.getElementById("opportunityForm");

    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");

        const body = {
            name: document.getElementById('oppName').value,
            duration: document.getElementById('oppDuration').value,
            start_date: document.getElementById('oppStartDate').value,
            description: document.getElementById('oppDescription').value,
            skills: document.getElementById('oppSkills').value,
            category: document.getElementById('oppCategory').value,
            future_opportunities: document.getElementById('oppFuture').value,
            max_applicants: document.getElementById('oppMaxApplicants').value
        };

        let url = `${API}/opportunities`;
        let method = "POST";

        if (editId) {
            url = `${API}/opportunities/${editId}`;
            method = "PUT";
        }

        const res = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify(body)
        });

        if (res.status === 201 || res.status === 200) {
            showToast(editId ? "Updated!" : "Added!");
            form.reset();
            editId = null;
            document.getElementById("opportunityModal").classList.remove("active");
            loadOpportunities();
        } else {
            showToast("Error saving");
        }
    });
}

// LOAD
async function loadOpportunities() {
    const res = await fetch(`${API}/opportunities`);
    const data = await res.json();

    const grid = document.querySelector('.opportunities-grid');
    grid.innerHTML = "";

    if (!data.length) {
        grid.innerHTML = "<p>No opportunities found</p>";
        return;
    }

    data.forEach(o => {
        const card = document.createElement("div");
        card.className = "opportunity-card";

        card.innerHTML = `
            <h4>${o.name}</h4>
            <p>${o.description}</p>
            <p>${o.duration} | ${o.start_date}</p>
            <button onclick="editOpportunity(${o.id})">Edit</button>
            <button onclick="deleteOpportunity(${o.id})">Delete</button>
        `;

        grid.appendChild(card);
    });
}

// EDIT
async function editOpportunity(id) {

    const res = await fetch(`${API}/opportunities`);
    const data = await res.json();

    const opp = data.find(o => o.id === id);
    if (!opp) return;

    editId = id;

    document.getElementById('oppName').value = opp.name;
    document.getElementById('oppDuration').value = opp.duration;
    document.getElementById('oppStartDate').value = opp.start_date;
    document.getElementById('oppDescription').value = opp.description;

    document.getElementById("opportunityModal").classList.add("active");
}

// DELETE
async function deleteOpportunity(id) {
    if (!confirm("Delete?")) return;

    const res = await fetch(`${API}/opportunities/${id}`, {
        method: "DELETE"
    });

    if (res.status === 200) {
        showToast("Deleted");
        loadOpportunities();
    } else {
        showToast("Error deleting");
    }
}

// ================= MODAL =================
function initOpportunityUI() {

    const openBtn = document.querySelector('.add-opportunity-btn');
    if (openBtn) {
        openBtn.addEventListener("click", () => {
            editId = null;
            document.getElementById("opportunityForm").reset();
            document.getElementById("opportunityModal").classList.add("active");
        });
    }

    const modal = document.getElementById("opportunityModal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.classList.remove("active");
            }
        });
    }
}

// ================= PAGE SWITCH =================
function showPage(pageId) {
    document.querySelectorAll('.form-page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}