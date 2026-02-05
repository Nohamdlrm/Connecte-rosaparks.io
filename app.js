const MASTER_UID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_BASE = "https://pronote.campus-rosaparks.fr/";

// Récupération des données partagées (simulation base de données)
let db = {
    services: JSON.parse(localStorage.getItem('RP_SERVICES')) || [
        { emoji: '🦋', name: 'Pronote', url: PRONOTE_BASE },
        { emoji: '✉️', name: 'Webmail', url: 'https://mail.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_LOGS')) || [],
    cas: JSON.parse(localStorage.getItem('RP_CAS_VAULT')) || {} 
};

function onAuth(response) {
    const payload = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // SÉCURITÉ DOMAINE : STOPE TOUT SI PAS CAMPUS
    if (!payload.email.endsWith("@campus-rosaparks.fr")) {
        alert("CRITICAL ERROR: ACCESS_DENIED. Seul le domaine @campus-rosaparks.fr est autorisé.");
        return;
    }

    pushLog(payload.email, "LOGIN_AUTHORIZED");
    loadInterface(payload);
}

function loadInterface(user) {
    document.getElementById('view-login').classList.remove('active');
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('user-info').innerText = `CONNECTED AS: ${user.email.toUpperCase()}`;

    // AFFICHAGE ADMIN
    if (user.email === MASTER_UID) {
        document.getElementById('admin-zone').style.display = 'block';
        updateLogTable();
    }
    
    refreshServiceGrid(user.email);
}

// RENDU DYNAMIQUE DES SERVICES
function refreshServiceGrid(currentEmail) {
    const grid = document.getElementById('srv-grid');
    grid.innerHTML = '';

    db.services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'card';
        
        // LOGIQUE DU BYPASS PRONOTE (CAS VIRTUEL)
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = db.cas[currentEmail.toLowerCase()];
            if (ticket) {
                // Si l'admin a généré un ticket, on bypass le login
                card.href = `${s.url}?ticket=${ticket}&sso=true&user=${btoa(currentEmail)}`;
            } else {
                card.href = s.url;
            }
        } else {
            card.href = s.url;
        }

        card.target = "_blank";
        card.innerHTML = `<span class="emoji">${s.emoji}</span><span style="letter-spacing:1px; font-weight:500;">${s.name}</span>`;
        grid.appendChild(card);
    });
}

// FONCTION ADMIN : PUBLIER POUR TOUT LE MONDE
function pushService() {
    const emoji = document.getElementById('add-emoji').value || '🔗';
    const name = document.getElementById('add-name').value;
    const url = document.getElementById('add-url').value;

    if (name && url) {
        db.services.push({ emoji, name, url });
        localStorage.setItem('RP_SERVICES', JSON.stringify(db.services));
        refreshServiceGrid(MASTER_UID);
        pushLog(MASTER_UID, `NEW_SERVICE_DEPLOYED: ${name}`);
        alert("Service publié pour tous les comptes du campus !");
    }
}

// FONCTION ADMIN : GÉNÉRER CAS (AUTO-LOGIN)
function generateCAS() {
    const email = document.getElementById('cas-mail').value.trim().toLowerCase();
    if (!email.endsWith("@campus-rosaparks.fr")) return alert("Mail invalide");

    // Génération d'un ticket unique pour bypasser le mdp Pronote
    const ticket = "ST-" + Date.now() + "-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    db.cas[email] = ticket;
    
    localStorage.setItem('RP_CAS_VAULT', JSON.stringify(db.cas));
    document.getElementById('cas-status').innerHTML = `<span style="color:var(--accent)">SUCCESS: Ticket linked to ${email}</span>`;
    
    pushLog(MASTER_UID, `BYPASS_TICKET_CREATED: ${email}`);
}

function pushLog(user, action) {
    db.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    localStorage.setItem('RP_LOGS', JSON.stringify(db.logs));
    if (user === MASTER_UID) updateLogTable();
}

function updateLogTable() {
    const list = document.getElementById('log-list');
    list.innerHTML = db.logs.slice(0, 8).map(l => 
        `<tr><td>${l.user}</td><td>${l.time}</td><td style="color:#666">${l.action}</td></tr>`
    ).join('');
}
