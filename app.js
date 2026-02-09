const API = "https://planair.onrender.com/api";
let state = {
  token: localStorage.getItem("token") || null,
  user: JSON.parse(localStorage.getItem("user")) || null,
  tasks: [],
  currentPage: "dashboard",
  loading: false,
  authMode: "login",
  editingTaskId: null,
};

// ====== INITIALIZATION ======
document.addEventListener("DOMContentLoaded", () => {
  if (state.token) {
    render();
    setTimeout(loadRoutine, 300);
  } else {
    renderLoginPage();
  }
});

// ====== ROUTING ======
function navigate(page) {
  state.currentPage = page;
  render();
  window.scrollTo(0, 0);
}

// ====== RENDER FUNCTIONS ======
function render() {
  const root = document.getElementById("root");

  if (!state.token) {
    renderLoginPage();
    return;
  }

  root.innerHTML = `
    ${createNavbar().outerHTML}
    ${createContent().outerHTML}
  `;

  attachGlobalEventListeners();

  if (state.currentPage === "dashboard") {
    fetchTasks();

    // WAIT UNTIL DOM REALLY EXISTS
    setTimeout(() => {
      loadRoutine();
    }, 350);
  }


  if (state.currentPage === "day-view") {
    renderTimeline();
  }

  if (state.currentPage === "upcoming") {
    fetchFullPlan();
  }
}


function renderLoginPage() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1><img src="logo.png" alt="PlanAIr" style="height:36px;vertical-align:middle;margin-right:8px;"> PlanAIr</h1>
          <p>AI-Powered Task Planning</p>
        </div>

        ${state.authMode === "login" ? createLoginForm() : createSignupForm()}

        <div style="text-align: center; margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
          <p style="color: var(--text-light); margin-bottom: 0.75rem;">
            ${state.authMode === "login" ? "Don't have an account?" : "Already have an account?"}
          </p>
          <button class="btn btn-outline" onclick="toggleAuthMode()" style="width: 100%;">
            ${state.authMode === "login" ? "Create Account" : "Back to Login"}
          </button>
        </div>
      </div>
    </div>
  `;
}

function createLoginForm() {
  return `
    <form id="loginForm" onsubmit="handleLogin(event)">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input 
          type="email" 
          id="email" 
          class="form-input" 
          placeholder="you@example.com"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input 
          type="password" 
          id="password" 
          class="form-input" 
          placeholder="••••••••"
          required
        />
      </div>
      <button type="submit" class="btn btn-primary" id="loginBtn">
        <i class="fas fa-sign-in-alt"></i> Login
      </button>
    </form>
  `;
}

function createSignupForm() {
  return `
    <form id="signupForm" onsubmit="handleSignup(event)">
      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input 
          type="email" 
          id="signup-email" 
          class="form-input" 
          placeholder="you@example.com"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Password</label>
        <input 
          type="password" 
          id="signup-password" 
          class="form-input" 
          placeholder="••••••••"
          minlength="6"
          required
        />
        <small style="color: var(--text-light); display: block; margin-top: 0.25rem;">
          <i class="fas fa-info-circle"></i> At least 6 characters
        </small>
      </div>
      <div class="form-group">
        <label class="form-label">Confirm Password</label>
        <input 
          type="password" 
          id="signup-confirm" 
          class="form-input" 
          placeholder="••••••••"
          minlength="6"
          required
        />
      </div>
      <div class="form-group">
        <label class="form-label">Promo Code</label>
        <input 
          type="text" 
          id="signup-promo" 
          class="form-input" 
          placeholder="Enter promo code"
          required
        />
        <small style="color: var(--text-light); display: block; margin-top: 0.25rem;">
          <i class="fas fa-lock"></i> Required to create account
        </small>
      </div>
      <button type="submit" class="btn btn-secondary" id="signupBtn">
        <i class="fas fa-user-plus"></i> Create Account
      </button>
    </form>
  `;
}

function createNavbar() {
  const nav = document.createElement("nav");
  nav.className = "navbar";
  nav.innerHTML = `
    <div class="navbar-container">
      <div class="navbar-brand">
        <img src="logo.png" style="height:38px;vertical-align:middle;margin-right:10px;">
        <span>PlanAIr</span>
      </div>
      <ul class="navbar-nav">
        <li class="nav-item">
          <a class="nav-link ${state.currentPage === 'dashboard' ? 'active' : ''}" 
             onclick="navigate('dashboard'); return false;">
            <i class="fas fa-th-large"></i> Dashboard
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${state.currentPage === 'day-view' ? 'active' : ''}" 
             onclick="navigate('day-view'); return false;">
            <i class="fas fa-calendar-day"></i> Today's Plan
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link ${state.currentPage === 'upcoming' ? 'active' : ''}" 
            onclick="navigate('upcoming'); return false;">
            <i class="fas fa-calendar-week"></i> Upcoming
          </a>
        </li>
      </ul>
      <div class="nav-user">
        ${state.user ? `<span><i class="fas fa-user-circle"></i> ${state.user.email}</span>` : ""}
        <button class="logout-btn" onclick="handleLogout()">
          <i class="fas fa-sign-out-alt"></i> Logout
        </button>
      </div>
    </div>
  `;
  return nav;
}

function createContent() {
  const container = document.createElement("div");
  container.className = "main-container";

  if (state.currentPage === "dashboard") {
    container.innerHTML = createDashboardPage();
  } else if (state.currentPage === "day-view") {
    container.innerHTML = createDayViewPage();
  } else if (state.currentPage === "upcoming") {
    container.innerHTML = createUpcomingPage();
  }

  return container;
}

function createDashboardPage() {
  return `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1><i class="fas fa-chart-line"></i> Dashboard</h1>
        <p>Manage and schedule your tasks with AI assistance</p>
      </div>

      <div class="dashboard-controls">

        <div class="card" style="margin-bottom:25px; background: linear-gradient(135deg, var(--primary) 0%, rgba(255, 0, 0, 0.1) 100%); border: 1px solid var(--primary-light); padding: 24px; border-radius: 12px;">
          <h3 style="color: var(--bg-secondary); margin-bottom: 20px; display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-clock"></i> My Daily Routine
          </h3>

          <div style="margin-bottom: 20px; padding: 16px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #4CAF50;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              <i class="fas fa-moon" style="color: #4CAF50; margin-right: 8px;"></i>Sleep Schedule
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">Wake Up Time</label>
                <input type="time" id="wakeTime" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: white;">
              </div>
              <div>
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">Sleep Time</label>
                <input type="time" id="sleepTime" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: white;">
              </div>
            </div>
          </div>

          <div style="padding: 16px; background: rgba(255,255,255,0.7); border-radius: 8px; border-left: 4px solid #FF9800;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
              <i class="fas fa-briefcase" style="color: #FF9800; margin-right: 8px;"></i>Busy Hours
            </h4>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">From</label>
                <input type="time" id="busyStart" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: white;">
              </div>
              <div>
                <label style="display: block; font-size: 12px; color: #666; margin-bottom: 8px; font-weight: 600; text-transform: uppercase;">Until</label>
                <input type="time" id="busyEnd" style="width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: white;">
              </div>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <label style="display: block; font-size: 14px; color: #333; margin-bottom: 16px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
            <i class="fas fa-heart" style="color: #FF4081; margin-right: 8px; animation: pulse 2s infinite;"></i>How are you feeling today?
          </label>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px;">
            <button type="button" onclick="selectMood('normal', this)" style="padding: 18px 12px; border: 3px solid #81C784; border-radius: 12px; background: linear-gradient(135deg, #C8E6C9 0%, #81C784 100%); cursor: pointer; font-size: 14px; font-weight: 600; color: #2E7D32; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(129, 199, 132, 0.25); display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <span style="font-size: 32px;">😐</span>
              <span>Normal Day</span>
            </button>
            <button type="button" onclick="selectMood('productive', this)" style="padding: 18px 12px; border: 3px solid #42A5F5; border-radius: 12px; background: linear-gradient(135deg, #BBDEFB 0%, #42A5F5 100%); cursor: pointer; font-size: 14px; font-weight: 600; color: #1565C0; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(66, 165, 245, 0.25); display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <span style="font-size: 32px;">🚀</span>
              <span>Productive</span>
            </button>
            <button type="button" onclick="selectMood('focused', this)" style="padding: 18px 12px; border: 3px solid #AB47BC; border-radius: 12px; background: linear-gradient(135deg, #E1BEE7 0%, #AB47BC 100%); cursor: pointer; font-size: 14px; font-weight: 600; color: #6A1B9A; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(171, 71, 188, 0.25); display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <span style="font-size: 32px;">🧠</span>
              <span>Deep Focus</span>
            </button>
            <button type="button" onclick="selectMood('tired', this)" style="padding: 18px 12px; border: 3px solid #FFB74D; border-radius: 12px; background: linear-gradient(135deg, #FFE0B2 0%, #FFB74D 100%); cursor: pointer; font-size: 14px; font-weight: 600; color: #E65100; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(255, 183, 77, 0.25); display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <span style="font-size: 32px;">😴</span>
              <span>Low Energy</span>
            </button>
          </div>
          <select id="moodSelect" style="display: none;">
            <option value="normal">Normal Day</option>
            <option value="productive">Productive</option>
            <option value="focused">Deep Focus</option>
            <option value="tired">Low Energy</option>
          </select>
        </div>
        
        <style>
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          button[onclick*="selectMood"]:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2) !important;
          }
          button[onclick*="selectMood"].active {
            transform: scale(1.05);
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3) !important;
          }
        </style>

        <button class="btn btn-secondary" onclick="handleSchedule()">
            <i class="fas fa-magic"></i> Generate My Plan
        </button>

        <button id="addTaskBtn" class="btn btn-accent" onclick="handleAddTask()">
            <i class="fas fa-plus"></i> Add New Task
        </button>

      </div>


      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 35px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 12px; padding: 24px; color: white; box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;" id="total-tasks">0</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.95; display: flex; align-items: center; gap: 6px;"><i class="fas fa-tasks"></i> Total Tasks</div>
        </div>
        <div class="stat-card secondary" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border: none; border-radius: 12px; padding: 24px; color: white; box-shadow: 0 8px 16px rgba(245, 87, 108, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;" id="completed-tasks">0</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.95; display: flex; align-items: center; gap: 6px;"><i class="fas fa-check-circle"></i> Completed</div>
        </div>
        <div class="stat-card accent-1" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); border: none; border-radius: 12px; padding: 24px; color: white; box-shadow: 0 8px 16px rgba(79, 172, 254, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;" id="pending-tasks">0</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.95; display: flex; align-items: center; gap: 6px;"><i class="fas fa-hourglass-half"></i> Pending</div>
        </div>
        <div class="stat-card accent-2" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); border: none; border-radius: 12px; padding: 24px; color: white; box-shadow: 0 8px 16px rgba(250, 112, 154, 0.3); transition: transform 0.3s ease, box-shadow 0.3s ease; cursor: default;">
          <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px;" id="high-priority-tasks">0</div>
          <div style="font-size: 13px; font-weight: 500; opacity: 0.95; display: flex; align-items: center; gap: 6px;"><i class="fas fa-fire"></i> High Priority</div>
        </div>
      </div>

      <div class="tasks-container">
        <div class="tasks-header">
          <h2><i class="fas fa-list-check"></i> Your Tasks</h2>
          <select id="filterSelect" class="btn btn-outline" onchange="handleFilterChange(this.value)">
            <option value="all">All Tasks</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
        </div>
        <div id="tasksPanel"></div>
      </div>
    </div>
  `;
}

function createDayViewPage() {
  return `
    <div class="day-view">
      <div class="day-header">
        <h1><i class="fas fa-sun"></i> Today's Plan</h1>
        <p id="todayDate"></p>
      </div>
      <div class="timeline" id="timelinePanel"></div>
    </div>
  `;
}

function createUpcomingPage() {
  return `
    <div class="day-view">
      <div class="day-header">
        <h1><i class="fas fa-calendar-week"></i> Upcoming Plan</h1>
        <p>Your future schedule generated by PlanAIr</p>
      </div>
      <div id="upcomingPanel"></div>
    </div>
  `;
}

// ====== EVENT HANDLERS ======
function toggleAuthMode() {
  state.authMode = state.authMode === "login" ? "signup" : "login";
  renderLoginPage();
}

function selectMood(moodValue, buttonElement) {
  // Set the hidden select value
  document.getElementById("moodSelect").value = moodValue;
  
  // Remove active class from all mood buttons
  const allMoodButtons = document.querySelectorAll("button[onclick*='selectMood']");
  allMoodButtons.forEach(btn => btn.classList.remove("active"));
  
  // Add active class to clicked button
  buttonElement.classList.add("active");
}

let currentTaskCompletion = { taskId: null, totalHours: 0, workedHours: 0 };

function openPartialCompletionModal(taskId, durationMinutes, workedMinutes) {
  currentTaskCompletion = {
    taskId: taskId,
    totalHours: (durationMinutes / 60).toFixed(1),
    workedHours: (workedMinutes / 60).toFixed(1)
  };

  const modal = document.getElementById("completionModal");
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Set up the label and subtitle
  document.getElementById("hoursWorkedLabel").textContent = `Hours Worked (0 - ${currentTaskCompletion.totalHours}h)`;
  document.getElementById("taskProgressSubtitle").textContent = `Total duration: ${currentTaskCompletion.totalHours} hours`;
  
  // Set input value
  document.getElementById("hoursWorkedInput").value = currentTaskCompletion.workedHours;
  document.getElementById("hoursWorkedInput").max = currentTaskCompletion.totalHours;
  
  // Update preview
  updateCompletionPreview();
  
  // Add event listener for real-time preview
  document.getElementById("hoursWorkedInput").oninput = updateCompletionPreview;
}

function updateCompletionPreview() {
  const hoursInput = document.getElementById("hoursWorkedInput").value || 0;
  const totalHours = parseFloat(currentTaskCompletion.totalHours);
  const percentage = Math.min(100, Math.round((parseFloat(hoursInput) / totalHours) * 100));
  
  document.getElementById("progressPreview").textContent = `${hoursInput}h / ${totalHours}h (${percentage}%)`;
  document.getElementById("progressBar").style.width = percentage + "%";
}

function closeCompletionModal() {
  const modal = document.getElementById("completionModal");
  modal.classList.add("hidden");
  document.body.style.overflow = "auto";
  currentTaskCompletion = { taskId: null, totalHours: 0, workedHours: 0 };
}

function submitPartialCompletion() {
  const hoursWorked = parseFloat(document.getElementById("hoursWorkedInput").value);
  
  if (isNaN(hoursWorked) || hoursWorked < 0) {
    showAlert("Please enter a valid number of hours", "error");
    return;
  }
  
  const minutesWorked = Math.round(hoursWorked * 60);
  const totalMinutes = Math.round(parseFloat(currentTaskCompletion.totalHours) * 60);
  
  if (minutesWorked > totalMinutes) {
    showAlert(`Cannot exceed total duration of ${currentTaskCompletion.totalHours} hours`, "error");
    return;
  }

  setLoading(true);

  fetch(`${API}/tasks/${currentTaskCompletion.taskId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${state.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ worked_minutes: minutesWorked })
  })
    .then(res => res.json())
    .then(data => {
      closeCompletionModal();
      fetchTasks();
      const status = minutesWorked >= totalMinutes ? "completed" : "updated";
      showAlert(`Task progress ${status}!`, "success");
    })
    .catch(err => {
      showAlert("Error: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

function handleLogin(event) {
  event.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (!email || !password) {
    showAlert("Please fill in all fields", "error");
    return;
  }

  setLoading(true);

  fetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        state.token = data.access_token;
        state.user = data.user || { email };
        localStorage.setItem("token", state.token);
        localStorage.setItem("user", JSON.stringify(state.user));

        state.currentPage = "dashboard";
        state.authMode = "login";
        render();
        fetchTasks();
        loadRoutine();
        showAlert(`Welcome back, ${email}!`, "success");
      } else {
        showAlert(data.error || "Login failed", "error");
      }
    })
    .catch(err => {
      showAlert("Login error: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

function handleSignup(event) {
  event.preventDefault();

  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  const confirmPassword = document.getElementById("signup-confirm").value;
  const promoCode = document.getElementById("signup-promo").value.trim();

  // Validation
  if (!email || !password || !confirmPassword || !promoCode) {
    showAlert("Please fill in all fields", "error");
    return;
  }

  if (password.length < 6) {
    showAlert("Password must be at least 6 characters", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Passwords do not match", "error");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Please enter a valid email address", "error");
    return;
  }

  setLoading(true);

  fetch(`${API}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      confirm_password: confirmPassword,
      promo_code: promoCode
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.access_token) {
        state.token = data.access_token;
        state.user = data.user || { email };
        localStorage.setItem("token", state.token);
        localStorage.setItem("user", JSON.stringify(state.user));

        state.currentPage = "dashboard";
        state.authMode = "login";
        render();
        fetchTasks();
        showAlert(`🎉 Welcome to PlanAIr, ${email}!`, "success");
      } else {
        showAlert(data.error || "Signup failed", "error");
      }
    })
    .catch(err => {
      showAlert("Signup error: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

function handleLogout() {
  state.token = null;
  state.user = null;
  state.tasks = [];
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  render();
  showAlert("Logged out successfully", "success");
}

async function handleSchedule() {

  if (!state.token) {
    showAlert("You must be logged in", "error");
    return;
  }

  const mood = document.getElementById("moodSelect").value;
  const busyStart = document.getElementById("busyStart").value;
  const busyEnd = document.getElementById("busyEnd").value;
  const wakeTime = document.getElementById("wakeTime").value;
  const sleepTime = document.getElementById("sleepTime").value;

  if (!wakeTime || !sleepTime || !busyStart || !busyEnd) {
    showAlert("Please set your routine first", "error");
    return;
  }

  setLoading(true);

  try {

    // RUN SCHEDULER
    const res = await fetch(`${API}/ai/schedule`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${state.token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        mood,
        busy_start: busyStart,
        busy_end: busyEnd,
        wake_time: wakeTime,
        sleep_time: sleepTime
      })
    });

    const data = await res.json();

    if (data.scheduled_tasks === undefined) {
      setLoading(false);
      showAlert(data.error || "Scheduling failed", "error");
      return;
    }

    navigate("day-view");

    const tasksRes = await fetch(`${API}/tasks`, {
      headers: { "Authorization": `Bearer ${state.token}` }
    });

    state.tasks = await tasksRes.json();

    // wait for timeline DOM to exist
    setTimeout(() => {
      renderTimeline();
      setLoading(false);
      showAlert("✨ Your personalized day plan is ready!", "success");
    }, 200);

  } catch (err) {
    setLoading(false);
    showAlert("Scheduler error: " + err.message, "error");
  }
}


function handleAddTask() {
  const modal = document.getElementById("taskModal");
  modal.classList.remove("hidden");

  document.body.style.overflow = "hidden";

  // Set default 1 hour duration
  document.getElementById("taskDuration").value = 60;

  const btn = document.getElementById("addTaskBtn");
  if (btn) btn.classList.add("active-add-task");
}


function handleFilterChange(filter) {
  renderTasks(filter);
}

function handleToggleTask(taskId, completed) {
  setLoading(true);

  fetch(`${API}/tasks/${taskId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${state.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ completed: !completed })
  })
    .then(res => res.json())
    .then(data => {
      fetchTasks();
      showAlert("Task updated", "success");
    })
    .catch(err => {
      showAlert("Error: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

// ====== DATA FETCHING ======
function fetchTasks() {
  if (!state.token) return;

  fetch(`${API}/tasks`, {
    headers: { "Authorization": `Bearer ${state.token}` }
  })
    .then(res => res.json())
    .then(data => {
      state.tasks = Array.isArray(data) ? data : data.tasks || [];
      updateDashboard();
      renderTasks("all");
    })
    .catch(err => {
      console.error("Error fetching tasks:", err);
      showAlert("Failed to load tasks", "error");
    });
}

// ====== UI UPDATES ======

function updateDashboard() {
  const total = state.tasks.length;
  const completed = state.tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPriority = state.tasks.filter(t => t.priority === "high").length;

  const totalEl = document.getElementById("total-tasks");
  const completedEl = document.getElementById("completed-tasks");
  const pendingEl = document.getElementById("pending-tasks");
  const highPriorityEl = document.getElementById("high-priority-tasks");

  if (totalEl) totalEl.textContent = total;
  if (completedEl) completedEl.textContent = completed;
  if (pendingEl) pendingEl.textContent = pending;
  if (highPriorityEl) highPriorityEl.textContent = highPriority;
}

function renderTasks(filter = "all") {
  const tasksPanel = document.getElementById("tasksPanel");
  if (!tasksPanel) return;

  let filtered = state.tasks;

  if (filter === "pending") {
    filtered = state.tasks.filter(t => !t.completed);
  } else if (filter === "completed") {
    filtered = state.tasks.filter(t => t.completed);
  }

  if (filtered.length === 0) {
    tasksPanel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-inbox"></i></div>
        <h3>No tasks</h3>
        <p>Click "Add New Task" to get started!</p>
      </div>
    `;
    return;
  }

  tasksPanel.innerHTML = filtered.map(task => {
    const worked = task.worked_minutes || 0;
    const total = task.duration || 60;
    const percentage = Math.min(100, Math.round((worked / total) * 100));
    const hoursWorked = (worked / 60).toFixed(1);
    const totalHours = (total / 60).toFixed(1);

    return `
    <div class="task-item ${task.completed ? 'completed' : ''} ${task.priority ? 'priority-' + task.priority : ''}">
      <div class="task-content" style="flex: 1;">
        <div class="task-title">${escapeHtml(task.title)}</div>
        ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
        <div class="task-meta">
          ${task.due_date ? `<span><i class="fas fa-calendar"></i> ${task.due_date}</span>` : ''}
          ${task.priority ? `<span><i class="fas fa-flag"></i> ${task.priority}</span>` : ''}
        </div>
        <div style="margin-top: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-size: 12px; color: #666; font-weight: 500;">Progress: <strong>${hoursWorked}h / ${totalHours}h</strong></span>
            <span style="font-size: 11px; color: #999;">${percentage}%</span>
          </div>
          <div style="width: 100%; height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden;">
            <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.3s ease;"></div>
          </div>
        </div>
      </div>
      <div class="task-actions" style="display: flex; flex-direction: column; gap: 8px;">
        <button class="btn btn-sm btn-outline" onclick="openPartialCompletionModal(${task.id}, ${total}, ${worked})" title="Mark partial/full completion">
          <i class="fas fa-check"></i> ${task.completed ? 'Done' : 'Mark'}
        </button>
        <button class="btn btn-sm btn-outline" onclick="editTask(${task.id})">
          <i class="fas fa-edit"></i> Edit
        </button>
        <button class="btn btn-sm btn-outline" onclick="deleteTask(${task.id})">
          <i class="fas fa-trash"></i> Delete
        </button>
      </div>
    </div>
  `;
  }).join("");
}


function renderTimeline() {
  const todayDate = document.getElementById("todayDate");
  const timelinePanel = document.getElementById("timelinePanel");

  if (todayDate) {
    const today = new Date();
    todayDate.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  if (!timelinePanel) return;

  const now = new Date();
  const todayTasks = state.tasks.filter(t => {
    if (!t.scheduled_time) return false;
    if (t.completed) return false; // Skip completed tasks
    
    const taskDate = new Date(t.scheduled_time).toDateString();
    const today = now.toDateString();
    if (taskDate !== today) return false;
    
    // If task is scheduled in the past, only show if it has remaining work
    const scheduledTime = new Date(t.scheduled_time).getTime();
    const nowTime = now.getTime();
    if (scheduledTime < nowTime) {
      // Task started in the past; include if remaining work exists
      const remaining = t.remaining_minutes ?? t.duration ?? 0;
      return remaining > 0;
    }
    
    return true; // Future task, always include
  });

  if (todayTasks.length === 0) {
    timelinePanel.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon"><i class="fas fa-calendar-check"></i></div>
        <h3>No scheduled tasks today</h3>
        <p>Run the AI Scheduler to plan your day!</p>
      </div>
    `;
    return;
  }

  timelinePanel.innerHTML = todayTasks.sort((a, b) =>
    new Date(a.scheduled_time) - new Date(b.scheduled_time)
  ).map((task, index) => {
    const startDate = new Date(task.scheduled_time);
    const startTime = startDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    // Calculate end time based on remaining minutes (not total duration)
    const remainingMinutes = task.remaining_minutes || task.duration || 60;
    const endDate = new Date(startDate.getTime() + remainingMinutes * 60 * 1000);
    const endTime = endDate.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
    
    const workedHours = ((task.worked_minutes || 0) / 60).toFixed(1);
    const totalHours = (task.duration / 60).toFixed(1);
    const remainingHours = (remainingMinutes / 60).toFixed(1);

    return `
      <div class="timeline-item">
        <div class="timeline-marker">${String(index + 1).padStart(2, "0")}</div>
        <div class="timeline-content">
          <div class="timeline-time" style="display: flex; align-items: center; gap: 10px; font-weight: 600; color: var(--primary);">
            <i class="fas fa-play-circle" style="font-size: 12px;"></i>
            ${startTime}
            <span style="color: #999; font-weight: 400; margin: 0 8px;">→</span>
            <i class="fas fa-stop-circle" style="font-size: 12px;"></i>
            ${endTime}
          </div>
          <div class="timeline-title">${escapeHtml(task.title)}</div>
          <div style="font-size: 12px; color: #666; margin-top: 4px;">
            ${workedHours > 0 ? `Completed: <strong>${workedHours}h / ${totalHours}h</strong> | ` : ''}Remaining: <strong>${remainingHours}h</strong>
          </div>
          ${task.description ? `<div class="timeline-description">${escapeHtml(task.description)}</div>` : ''}
        </div>
      </div>
    `;
  }).join("");
}

function fetchFullPlan() {

  fetch(`${API}/calendar/plan`, {
    headers: {
      "Authorization": `Bearer ${state.token}`
    }
  })
    .then(res => res.json())
    .then(plan => renderUpcoming(plan));
}

function renderUpcoming(plan) {

  const panel = document.getElementById("upcomingPanel");
  if (!panel) return;

  const days = Object.keys(plan);

  if (days.length === 0) {
    panel.innerHTML = `
      <div class="empty-state">
        <h3>No scheduled tasks</h3>
        <p>Run "Generate My Plan"</p>
      </div>
    `;
    return;
  }

  panel.innerHTML = days.map(day => {

    const tasks = plan[day].map(t => {
      // Find the actual task in state.tasks to get progress data
      const fullTask = state.tasks.find(st => st.id === t.id);
      const worked = (fullTask?.worked_minutes) || 0;
      const remaining = fullTask?.remaining_minutes || fullTask?.duration || 60;
      const total = fullTask?.duration || 60;
      const percentage = Math.min(100, Math.round((worked / total) * 100));
      const workedHours = (worked / 60).toFixed(1);
      const remainingHours = (remaining / 60).toFixed(1);
      const totalHours = (total / 60).toFixed(1);

      return `
      <div class="task-item ${t.completed ? 'completed' : ''} ${t.priority ? 'priority-' + t.priority : ''}">
        <div class="task-content" style="flex: 1;">
          <div class="task-title" onclick="toggleReason(${t.id})" style="cursor: pointer;">
            ${t.title}
          </div>
          <div class="task-reason hidden" id="reason-${t.id}">
            ${t.reason && t.reason.length > 0 ? t.reason.map(r => `<div style="font-size: 12px; color: #666; margin: 4px 0;">• ${r}</div>`).join("") : '<div style="font-size: 12px; color: #999;">No reasons provided</div>'}
          </div>
          <div class="task-meta" style="margin-bottom: 8px;">
            <span><i class="fas fa-clock"></i> ${t.time}</span>
            <span><i class="fas fa-flag"></i> ${t.priority}</span>
          </div>
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <span style="font-size: 11px; color: #666; font-weight: 500;">
                ${worked > 0 ? `Completed: <strong>${workedHours}h / ${totalHours}h</strong> | ` : ''}Remaining: <strong>${remainingHours}h</strong>
              </span>
              <span style="font-size: 10px; color: #999;">${percentage}%</span>
            </div>
            <div style="width: 100%; height: 6px; background: #e0e0e0; border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${percentage}%; background: linear-gradient(90deg, #4CAF50, #81C784); transition: width 0.3s ease;"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    }).join("");

    return `
      <div class="card" style="margin-bottom:25px;">
        <h2 style="margin-bottom:15px;"><i class="fas fa-calendar-day"></i> ${new Date(day).toDateString()}</h2>
        ${tasks}
      </div>
    `;

  }).join("");
}

// ====== UTILITY FUNCTIONS ======
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function setLoading(loading) {
  state.loading = loading;

  // wait for DOM render if page changed
  setTimeout(() => {
    const buttons = document.querySelectorAll("button");

    buttons.forEach(btn => {
      btn.disabled = loading;
      btn.style.pointerEvents = loading ? "none" : "auto";
      btn.style.opacity = loading ? "0.6" : "1";
    });

  }, 60);
}


function updateLoadingUI() {
  const buttons = document.querySelectorAll(".btn");
  buttons.forEach(btn => {
    btn.disabled = state.loading;
  });
}

function showAlert(message, type = "info") {
  const container = document.createElement("div");
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
  `;

  const alert = document.createElement("div");
  alert.className = `alert alert-${type}`;
  alert.style.cssText = `min-width: 300px;`;

  const iconMap = {
    success: "check-circle",
    error: "exclamation-circle",
    info: "info-circle"
  };

  alert.innerHTML = `
    <i class="fas fa-${iconMap[type]}"></i>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(alert);
  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 4000);
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

function editTask(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  document.getElementById("taskTitle").value = task.title;
  document.getElementById("taskDuration").value = task.duration;
  document.getElementById("taskPriority").value = task.priority || "medium";
  document.getElementById("taskDeadline").value = task.due_date || "";

  document.getElementById("taskModal").classList.remove("hidden");

  // mark editing
  state.editingTaskId = taskId;
}

let taskToDelete = null;

function deleteTask(taskId) {
  taskToDelete = taskId;

  const modal = document.getElementById("deleteModal");
  modal.classList.remove("hidden");

  // prevent background scrolling
  document.body.style.overflow = "hidden";
}


// ====== PAGE-SPECIFIC RENDERING ======

// Auto-refresh tasks every 30 seconds
setInterval(() => {
  if (state.token && state.currentPage === "dashboard") {
    fetchTasks();
  }
}, 30000);

function loadRoutine() {
  if (!state.token) return;

  fetch(`${API}/routine`, {
    headers: { "Authorization": `Bearer ${state.token}` }
  })
    .then(res => res.json())
    .then(data => {
      if (!data.exists) {
        showRoutineModal();
        return;
      }

      let tries = 0;
      const waitForElements = setInterval(() => {
        const wakeField = document.getElementById("wakeTime");
        const sleepField = document.getElementById("sleepTime");
        const busyStartField = document.getElementById("busyStart");
        const busyEndField = document.getElementById("busyEnd");

        if (wakeField && sleepField && busyStartField && busyEndField) {
          wakeField.value = data.wake_time || "";
          sleepField.value = data.sleep_time || "";
          busyStartField.value = data.busy_start || "";
          busyEndField.value = data.busy_end || "";
          clearInterval(waitForElements);
          return;
        }

        tries++;
        if (tries > 50) {
          clearInterval(waitForElements);
        }
      }, 120);
    })
    .catch(() => {
      console.log("Routine not loaded yet");
    });
}

function showRoutineModal() {
  document.getElementById("routineModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeRoutineModal() {
  document.getElementById("routineModal").classList.add("hidden");
  document.body.style.overflow = "auto";
}


function saveRoutine() {

  const wake = document.getElementById("routineWake").value;
  const sleep = document.getElementById("routineSleep").value;
  const busyStart = document.getElementById("routineBusyStart").value;
  const busyEnd = document.getElementById("routineBusyEnd").value;

  // ---- Validation ----
  if (!wake || !sleep) {
    showAlert("Please select wake and sleep time", "error");
    return;
  }

  if (!busyStart || !busyEnd) {
    showAlert("Please select your busy hours", "error");
    return;
  }

  if (wake === sleep) {
    showAlert("Wake and sleep time cannot be the same", "error");
    return;
  }

  setLoading(true);

  fetch(`${API}/routine`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${state.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      wake_time: wake,
      sleep_time: sleep,
      busy_start: busyStart,
      busy_end: busyEnd
    })
  })
    .then(async res => {
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save routine");
      }

      return data;
    })
    .then(() => {

      // ---- Fill dashboard automatically ----
      const wakeField = document.getElementById("wakeTime");
      const sleepField = document.getElementById("sleepTime");
      const busyStartField = document.getElementById("busyStart");
      const busyEndField = document.getElementById("busyEnd");

      if (wakeField) wakeField.value = wake;
      if (sleepField) sleepField.value = sleep;
      if (busyStartField) busyStartField.value = busyStart;
      if (busyEndField) busyEndField.value = busyEnd;

      // ---- Close modal properly ----
      const modal = document.getElementById("routineModal");
      modal.classList.add("hidden");

      // restore scroll (VERY IMPORTANT)
      document.body.style.overflow = "auto";

      showAlert("Routine saved! PlanAIr will now schedule around your life.", "success");
    })
    .catch(err => {
      showAlert("Could not save routine: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

function closeTaskModal(event) {

  if (event && event.target.closest(".modal-content") && event.target.id !== "cancelTaskBtn") return;

  const modal = document.getElementById("taskModal");
  modal.classList.add("hidden");

  const btn = document.getElementById("addTaskBtn");
  if (btn) btn.classList.remove("active-add-task");

  // Reset duration to default
  document.getElementById("taskDuration").value = 60;

  document.body.style.overflow = "auto";
  state.editingTaskId = null;
}



function submitTask() {

  const title = document.getElementById("taskTitle").value.trim();
  const durationEl = document.getElementById("taskDuration");
  if (!durationEl) return;

  const duration = parseInt(durationEl.value);

  const priority = document.getElementById("taskPriority").value;
  const due_date = document.getElementById("taskDeadline").value;

  if (!title) {
    showAlert("Please enter a task title", "error");
    return;
  }

  if (!duration || duration <= 0) {
    showAlert("Please enter a valid duration", "error");
    return;
  }

  setLoading(true);

  // Decide Add vs Edit
  const url = state.editingTaskId
    ? `${API}/tasks/${state.editingTaskId}`
    : `${API}/tasks`;

  const method = state.editingTaskId ? "PUT" : "POST";

  fetch(url, {
    method: method,
    headers: {
      "Authorization": `Bearer ${state.token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      duration,
      priority,
      due_date
    })
  })
    .then(res => res.json())
    .then(data => {

      if (data.id || data.title) {

        closeTaskModal();

        // Reset form
        document.getElementById("taskTitle").value = "";
        document.getElementById("taskDuration").value = 60;
        document.getElementById("taskPriority").value = "medium";
        document.getElementById("taskDeadline").value = "";

        state.editingTaskId = null;

        fetchTasks();

        showAlert("Task saved successfully", "success");

      } else {
        showAlert(data.error || "Failed to save task", "error");
      }

    })
    .catch(err => {
      showAlert("Server error: " + err.message, "error");
    })
    .finally(() => setLoading(false));
}

function toggleReason(id) {
  const el = document.getElementById(`reason-${id}`);
  if (!el) return;

  el.classList.toggle("hidden");
}

function closeDeleteModal(event) {
  if (event && event.target.closest(".modal-content")) return;

  const modal = document.getElementById("deleteModal");
  modal.classList.add("hidden");

  taskToDelete = null;
  document.body.style.overflow = "auto";
}


function confirmDelete() {

  if (!taskToDelete) return;

  setLoading(true);

  fetch(`${API}/tasks/${taskToDelete}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${state.token}` }
  })
    .then(res => res.json())
    .then(() => {
      fetchTasks();
      showAlert("Task deleted successfully", "success");
    })
    .catch(err => {
      showAlert("Error: " + err.message, "error");
    })
    .finally(() => {
      setLoading(false);
      closeDeleteModal();
    });
}

function attachGlobalEventListeners() {

  // ===== TASK MODAL =====
  const saveTaskBtn = document.getElementById("saveTaskBtn");
  if (saveTaskBtn) {
    saveTaskBtn.onclick = submitTask;
  }

  const cancelTaskBtn = document.getElementById("cancelTaskBtn");
  if (cancelTaskBtn) {
    cancelTaskBtn.onclick = closeTaskModal;
  }

  const taskModal = document.getElementById("taskModal");
  if (taskModal) {
    taskModal.onclick = closeTaskModal;
  }

  // ===== DELETE MODAL =====
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  if (confirmDeleteBtn) {
    confirmDeleteBtn.onclick = confirmDelete;
  }

  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  if (cancelDeleteBtn) {
    cancelDeleteBtn.onclick = closeDeleteModal;
  }

  const deleteModal = document.getElementById("deleteModal");
  if (deleteModal) {
    deleteModal.onclick = closeDeleteModal;
  }

  // ===== ROUTINE MODAL =====
  const saveRoutineBtn = document.getElementById("saveRoutineBtn");
  if (saveRoutineBtn) {
    saveRoutineBtn.onclick = saveRoutine;
  }
}
