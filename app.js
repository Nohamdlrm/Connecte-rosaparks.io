const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

let data = {
    services: JSON.parse(localStorage.getItem('RP_CORE_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_URL },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' },
        { ico: '☁️', name: 'Cloud', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_CORE_LOGS')) || [],
    cas_tokens: JSON.parse(localStorage.getItem('RP_CORE_CAS')) || {}
};

function onSignIn(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("ACCESS_DENIED: Seul le domaine @campus-rosaparks.fr est autorisé.");
        return;
    }

    logEvent(user.email, "NODE_LOGIN_SUCCESS");
    startSession(user);
}

function startSession(user) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-status').innerText = `NODE: ${user.email.toUpperCase()}`;
    document.getElementById('welcome-msg').innerText = `Bonjour, ${user.given_name}`;

    if (user.email === ADMIN_ID) {
        document.getElementById('admin-zone').style.display = 'block';
        updateLogView();
    }
    renderServices(user.email);
}

function renderServices(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    data.services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'service-card';
        
        // --- LOGIQUE CAS PRONOTE RÉELLE ---
        let link = s.url;
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = data.cas_tokens[userEmail.toLowerCase()];
            if (ticket) {
                // Construction du lien SSO pour bypasser la connexion
                link = `${s.url}?ticket=${ticket}&auth_mode=cas&user_id=${btoa(userEmail)}`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_ID ? `<button class="btn-del" onclick="removeService(${idx})">×</button>` : ''}
            <a href="${link}" target="_blank" style="text-decoration:none; color:white;">
                <span class="icon">${s.ico}</span>
                <span style="font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:13px;">${s.name}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// ADMIN: Créer un service (Visible par tous)
function createNewService() {
    const ico = document.getElementById('add-ico').value || '🔗';
    const name = document.getElementById('add-name').value;
    const url = document.getElementById('add-url').value;

    if (name && url) {
        data.services.push({ ico, name, url });
        sync();
        renderServices(ADMIN_ID);
        logEvent(ADMIN_ID, `DEPLOY_SERVICE: ${name}`);
    }
}

// ADMIN: Supprimer un service
function removeService(index) {
    if(confirm("Confirmer la suppression globale de ce service ?")) {
        data.services.splice(index, 1);
        sync();
        renderServices(ADMIN_ID);
    }
}

// ADMIN: Générer un ticket CAS pour un utilisateur précis
function bindCAS() {
    const target = document.getElementById('cas-mail').value.trim().toLowerCase();
    if (!target.endsWith("@campus-rosaparks.fr")) return alert("Erreur: Mail hors domaine.");

    // Ticket unique type CAS 2.0
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 12).toUpperCase();
    data.cas_tokens[target] = ticket;
    
    sync();
    document.getElementById('cas-log').innerText = `SUCCESS: Ticket ${ticket} lié à ${target}`;
    logEvent(ADMIN_ID, `CAS_TICKET_GEN_FOR: ${target}`);
}

function signOut() {
    google.accounts.id.disableAutoSelect();
    location.reload();
}

function sync() {
    localStorage.setItem('RP_CORE_SRV', JSON.stringify(data.services));
    localStorage.setItem('RP_CORE_LOGS', JSON.stringify(data.logs));
    localStorage.setItem('RP_CORE_CAS', JSON.stringify(data.cas_tokens));
}

function logEvent(user, action) {
    data.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    sync();
}

function updateLogView() {
    const table = document.getElementById('log-display');
    table.innerHTML = data.logs.slice(0, 8).map(l => `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`).join('');
}
