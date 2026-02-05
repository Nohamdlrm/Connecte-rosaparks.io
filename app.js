const ADMIN_EMAIL = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_BASE = "https://pronote.campus-rosaparks.fr/";

let state = {
    services: JSON.parse(localStorage.getItem('RP_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_BASE },
        { ico: '✉️', name: 'Mail', url: 'https://mail.google.com' },
        { ico: '☁️', name: 'Cloud', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_LOGS')) || [],
    cas: JSON.parse(localStorage.getItem('RP_CAS')) || {}
};

function handleAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("ACCÈS REFUSÉ : Utilisez votre compte @campus-rosaparks.fr");
        return;
    }

    logAction(user.email, "LOGIN");
    initApp(user);
}

function initApp(user) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-tag').innerText = user.email.toUpperCase();
    document.getElementById('welcome-msg').innerText = "Bonjour, " + user.given_name;

    if (user.email === ADMIN_EMAIL) {
        document.getElementById('admin-area').style.display = 'block';
        renderLogs();
    }
    renderServices(user.email);
}

function renderServices(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    state.services.forEach((s, index) => {
        const card = document.createElement('div');
        card.className = 'card';
        
        // --- LOGIQUE CAS PRONOTE ---
        let finalUrl = s.url;
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = state.cas[userEmail.toLowerCase()];
            if (ticket) {
                // Le lien CAS standard que Pronote attend
                finalUrl = `${s.url}/cas?ticket=${ticket}&user=${btoa(userEmail)}`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_EMAIL ? `<button class="delete-btn" onclick="deleteService(${index})">×</button>` : ''}
            <a href="${finalUrl}" target="_blank" style="text-decoration:none; color:white;">
                <span class="ico">${s.ico}</span>
                <span style="font-weight:700; font-size:14px;">${s.name.toUpperCase()}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// --- FONCTIONS ADMIN ---
function addService() {
    const ico = document.getElementById('srv-ico').value || '🔹';
    const name = document.getElementById('srv-name').value;
    const url = document.getElementById('srv-url').value;

    if (name && url) {
        state.services.push({ ico, name, url });
        save();
        renderServices(ADMIN_EMAIL);
    }
}

function deleteService(index) {
    if(confirm("Supprimer ce service pour tout le monde ?")) {
        state.services.splice(index, 1);
        save();
        renderServices(ADMIN_EMAIL);
    }
}

function bindCAS() {
    const email = document.getElementById('cas-mail').value.trim().toLowerCase();
    if (!email.endsWith("@campus-rosaparks.fr")) return alert("Email invalide");

    // Génération d'un vrai Service Ticket (ST) unique
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10).toUpperCase();
    state.cas[email] = ticket;
    
    save();
    document.getElementById('cas-info').innerHTML = `<span style="color:var(--glow)">TICKET LIÉ : ${ticket}</span>`;
    logAction(ADMIN_EMAIL, `BIND_CAS_${email}`);
}

function logout() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}

function save() {
    localStorage.setItem('RP_SRV', JSON.stringify(state.services));
    localStorage.setItem('RP_LOGS', JSON.stringify(state.logs));
    localStorage.setItem('RP_CAS', JSON.stringify(state.cas));
}

function logAction(user, action) {
    state.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    save();
}

function renderLogs() {
    const table = document.getElementById('log-table');
    table.innerHTML = state.logs.slice(0, 5).map(l => `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`).join('');
}
