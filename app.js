// INITIALISATION DU STOCKAGE
let services = JSON.parse(localStorage.getItem('rp_services')) || [
    { emoji: '🦋', title: 'Pronote', link: 'https://index.pronote.net' },
    { emoji: '✉️', title: 'Webmail', link: 'https://mail.google.com' }
];

let logs = JSON.parse(localStorage.getItem('rp_logs')) || [];

const ADMIN_EMAIL = "ce.0227235a@campus-rosaparks.fr";

// GESTION DE LA CONNEXION GOOGLE
function handleCredentialResponse(response) {
    const data = parseJwt(response.credential);
    const email = data.email;

    // Restriction Domaine
    if (!email.endsWith("@campus-rosaparks.fr")) {
        alert("Accès Refusé : Domaine @campus-rosaparks.fr requis.");
        return;
    }

    // Enregistrement du Log
    saveLog(email);

    // Affichage Dashboard
    showDashboard(data);
}

function parseJwt(token) {
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
}

function saveLog(email) {
    const newLog = {
        user: email,
        time: new Date().toLocaleString(),
        status: "Connecté"
    };
    logs.unshift(newLog); // Ajoute au début
    localStorage.setItem('rp_logs', JSON.stringify(logs));
}

function showDashboard(user) {
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('welcome-msg').innerText = "Bienvenue, " + user.given_name;
    document.getElementById('user-email').innerText = user.email;

    // Mode ADMIN
    if (user.email === ADMIN_EMAIL) {
        document.getElementById('admin-panel').style.display = 'block';
        document.getElementById('admin-tag').innerHTML = '<span class="admin-badge">Admin Root</span>';
        renderLogs();
    }

    renderServices(user.email);
}

// GESTION DES SERVICES
function renderServices(userEmail) {
    const grid = document.getElementById('servicesGrid');
    grid.innerHTML = '';

    services.forEach(srv => {
        const a = document.createElement('a');
        a.className = 'service-item';
        
        // LOGIQUE CAS POUR PRONOTE
        if (srv.title.toLowerCase() === 'pronote') {
            // On simule la création d'un ticket CAS basé sur le mail
            const casTicket = btoa(userEmail + "_ST_AUTH");
            a.href = srv.link + "?cas_ticket=" + casTicket;
        } else {
            a.href = srv.link;
        }
        
        a.target = "_blank";
        a.innerHTML = `<span class="emoji">${srv.emoji}</span><span>${srv.title}</span>`;
        grid.appendChild(a);
    });
}

function addService() {
    const emoji = document.getElementById('srvEmoji').value;
    const title = document.getElementById('srvTitle').value;
    const link = document.getElementById('srvLink').value;

    if (emoji && title && link) {
        services.push({ emoji, title, link });
        localStorage.setItem('rp_services', JSON.stringify(services));
        renderServices(ADMIN_EMAIL);
        alert("Service ajouté avec succès !");
    }
}

function renderLogs() {
    const body = document.getElementById('logBody');
    body.innerHTML = '';
    logs.slice(0, 10).forEach(log => {
        body.innerHTML += `<tr><td>${log.user}</td><td>${log.time}</td><td>${log.status}</td></tr>`;
    });
}
