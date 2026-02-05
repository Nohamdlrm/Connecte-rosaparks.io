const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

// Base de données "Cloud" simulée
let infraData = {
    services: JSON.parse(localStorage.getItem('RP_INFRA_SRV')) || [
        { ico: '🦋', name: 'Pronote', url: PRONOTE_URL },
        { ico: '✉️', name: 'Webmail', url: 'https://mail.google.com' },
        { ico: '📂', name: 'Drive', url: 'https://drive.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('RP_INFRA_LOGS')) || [],
    cas_vault: JSON.parse(localStorage.getItem('RP_INFRA_CAS')) || {}
};

function handleAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    // Blocage domaine
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("CRITICAL ERROR: ACCESS DENIED. ACCOUNT_NOT_IN_DOMAIN");
        return;
    }

    pushLog(user.email, "NODE_CONNECTED");
    renderApp(user);
}

function renderApp(user) {
    document.getElementById('view-login').style.display = 'none';
    document.getElementById('view-dash').classList.add('active');
    document.getElementById('status-display').innerText = "SYSTEM_ENCRYPTED // " + user.email;
    document.getElementById('user-mail').innerText = user.email;
    document.getElementById('welcome-txt').innerText = "Content de vous revoir, " + user.given_name;

    if (user.email === ADMIN_ID) {
        document.getElementById('admin-panel').style.display = 'block';
        refreshLogs();
    }

    drawServices(user.email);
}

function drawServices(email) {
    const container = document.getElementById('srv-grid');
    container.innerHTML = '';

    infraData.services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'cyber-card';
        
        // Logique de Bypass Pronote
        if (s.name.toLowerCase() === 'pronote') {
            const ticket = infraData.cas_vault[email.toLowerCase()];
            if (ticket) {
                // On injecte le ticket pour bypasser le login
                card.href = `${s.url}?ticket=${ticket}&sso=true&user=${btoa(email)}`;
            } else {
                card.href = s.link;
            }
        } else {
            card.href = s.url;
        }

        card.target = "_blank";
        card.innerHTML = `<span class="ico">${s.ico}</span><span style="font-weight:700; letter-spacing:1px; font-size:14px;">${s.name.toUpperCase()}</span>`;
        container.appendChild(card);
    });
}

// ADMIN : AJOUTER UN SERVICE POUR TOUT LE MONDE
function addGlobalService() {
    const ico = document.getElementById('new-ico').value || '💠';
    const name = document.getElementById('new-name').value;
    const url = document.getElementById('new-url').value;

    if (name && url) {
        infraData.services.push({ ico, name, url });
        localStorage.setItem('RP_INFRA_SRV', JSON.stringify(infraData.services));
        drawServices(ADMIN_ID);
        pushLog(ADMIN_ID, `DEPLOYED_SERVICE_${name}`);
        alert("Service synchronisé sur tous les comptes du campus.");
    }
}

// ADMIN : CRÉER UN TICKET CAS (AUTO-LOGIN)
function createCAS() {
    const email = document.getElementById('cas-target').value.trim().toLowerCase();
    if (!email.endsWith("@campus-rosaparks.fr")) return alert("DOMAINE_INVALID");

    // Génération d'un ticket format standard CAS
    const ticket = "ST-" + Math.random().toString(36).substring(2, 12).toUpperCase() + "-" + Date.now();
    infraData.cas_vault[email] = ticket;
    
    localStorage.setItem('RP_INFRA_CAS', JSON.stringify(infraData.cas_vault));
    document.getElementById('cas-msg').innerHTML = `<span style="color:var(--glow)">TICKET_ST_ACTIVE_FOR: ${email}</span>`;
    
    pushLog(ADMIN_ID, `BYPASS_AUTH_GENERATED: ${email}`);
}

function pushLog(user, action) {
    infraData.logs.unshift({ user, action, time: new Date().toLocaleTimeString() });
    localStorage.setItem('RP_INFRA_LOGS', JSON.stringify(infraData.logs));
    if (user === ADMIN_ID) refreshLogs();
}

function refreshLogs() {
    const table = document.getElementById('log-table');
    table.innerHTML = infraData.logs.slice(0, 10).map(l => `
        <tr>
            <td style="color:var(--glow)">${l.user}</td>
            <td>${l.time}</td>
            <td>${l.action}</td>
        </tr>
    `).join('');
}
