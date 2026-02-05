const ADMIN_UID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_NET = "https://pronote.campus-rosaparks.fr/";

// Initialisation de la base de données locale
let appState = {
    services: JSON.parse(localStorage.getItem('RP_SERVICES')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_NET },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' },
        { ico: '☁️', name: 'Cloud', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_LOGS')) || [],
    cas_vault: JSON.parse(localStorage.getItem('RP_CAS_VAULT')) || {}
};

function onAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Sécurité domaine
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("CRITICAL ERROR: Domaine non autorisé.");
        return;
    }

    pushLog(user.email, "NODE_ACCESS_GRANTED");
    launchApp(user);
}

function launchApp(user) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-display').innerText = `USER_AUTHORIZED: ${user.email}`;
    document.getElementById('user-mail-sub').innerText = user.email;
    document.getElementById('welcome-msg').innerText = `Bonjour, ${user.given_name}`;

    if (user.email === ADMIN_UID) {
        document.getElementById('admin-zone').style.display = 'block';
        updateLogs();
    }
    drawGrid(user.email);
}

function drawGrid(userEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    appState.services.forEach((s, idx) => {
        const card = document.createElement('div');
        card.className = 'srv-card';
        
        // --- LOGIQUE VRAI CAS PRONOTE ---
        let targetUrl = s.url;
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = appState.cas_vault[userEmail.toLowerCase()];
            if (ticket) {
                // Flux CAS : Le ticket est passé en paramètre pour bypasser le login
                targetUrl = `${s.url}?ticket=${ticket}&auth_mode=cas&user=${btoa(userEmail)}`;
            }
        }

        card.innerHTML = `
            ${userEmail === ADMIN_UID ? `<button class="delete-ico" onclick="removeService(${idx})">×</button>` : ''}
            <a href="${targetUrl}" target="_blank" style="text-decoration:none; color:white;">
                <span class="ico">${s.ico}</span>
                <span style="font-weight:700; font-size:14px; letter-spacing:1px;">${s.name.toUpperCase()}</span>
            </a>
        `;
        grid.appendChild(card);
    });
}

// ADMIN : AJOUTER SERVICE
function publishService() {
    const ico = document.getElementById('new-ico').value || '🔗';
    const name = document.getElementById('new-name').value;
    const url = document.getElementById('new-url').value;

    if (name && url) {
        appState.services.push({ ico, name, url });
        sync();
        drawGrid(ADMIN_UID);
        pushLog(ADMIN_UID, `SERVICE_DEPLOYED: ${name}`);
    }
}

// ADMIN : SUPPRIMER SERVICE
function removeService(index) {
    if (confirm("Voulez-vous supprimer ce service pour tout le monde ?")) {
        appState.services.splice(index, 1);
        sync();
        drawGrid(ADMIN_UID);
    }
}

// ADMIN : GÉNÉRER TICKET CAS (POUR CONNEXION SANS MDP)
function createCASTicket() {
    const email = document.getElementById('cas-target').value.trim().toLowerCase();
    if (!email.endsWith("@campus-rosaparks.fr")) return alert("Email invalide.");

    // Création du ticket Service (ST)
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 12).toUpperCase();
    appState.cas_vault[email] = ticket;
    
    sync();
    document.getElementById('cas-log').innerText = `✅ TICKET GÉNÉRÉ : ${ticket} (Lié à ${email})`;
    pushLog(ADMIN_ID, `CAS_TICKET_GENERATED_FOR: ${email}`);
}

function logout() {
    google.accounts.id.disableAutoSelect();
    location.reload(); // Retour à l'écran de login
}

function sync() {
    localStorage.setItem('RP_SERVICES', JSON.stringify(appState.services));
    localStorage.setItem('RP_LOGS', JSON.stringify(appState.logs));
    localStorage.setItem('RP_CAS_VAULT', JSON.stringify(appState.cas_vault));
}

function pushLog(user, action) {
    appState.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    sync();
}

function updateLogs() {
    const list = document.getElementById('logs-list');
    list.innerHTML = appState.logs.slice(0, 8).map(l => `<tr><td>${l.user}</td><td>${l.action}</td><td>${l.time}</td></tr>`).join('');
}
