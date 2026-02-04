const ADMIN_MAIL = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_BASE = "https://pronote.campus-rosaparks.fr/";

// Initialisation des données
let db = {
    services: JSON.parse(localStorage.getItem('rp_srv')) || [
        { emoji: '🦋', title: 'PRONOTE', link: PRONOTE_BASE },
        { emoji: '✉️', title: 'GMAIL', link: 'https://mail.google.com' }
    ],
    logs: JSON.parse(localStorage.getItem('rp_logs')) || [],
    cas_links: JSON.parse(localStorage.getItem('rp_cas')) || {} // { email: cas_id }
};

// Logique UI
const ui = {
    addLog: (msg) => {
        const time = new Date().toLocaleTimeString();
        db.logs.unshift(`[${time}] ${msg}`);
        localStorage.setItem('rp_logs', JSON.stringify(db.logs));
        ui.renderLogs();
    },

    renderLogs: () => {
        const display = document.getElementById('log-display');
        if(display) display.innerHTML = db.logs.map(l => `<div>${l}</div>`).join('');
    },

    renderServices: (userEmail) => {
        const grid = document.getElementById('services-grid');
        grid.innerHTML = db.services.map(s => {
            let finalLink = s.link;
            // Si c'est Pronote et qu'un CAS est lié à cet utilisateur
            if(s.title === "PRONOTE" && db.cas_links[userEmail]) {
                finalLink += `?cas_ticket=${db.cas_links[userEmail]}`;
            }
            return `
                <a href="${finalLink}" target="_blank" class="card">
                    <div style="font-size: 40px;">${s.emoji}</div>
                    <h3>${s.title}</h3>
                </a>
            `;
        }).join('');
    },

    addService: () => {
        const emoji = document.getElementById('new-emoji').value;
        const title = document.getElementById('new-title').value.toUpperCase();
        const link = document.getElementById('new-link').value;
        if(emoji && title && link) {
            db.services.push({emoji, title, link});
            localStorage.setItem('rp_srv', JSON.stringify(db.services));
            ui.renderServices(ADMIN_MAIL);
            ui.addLog(`NOUVEAU SERVICE : ${title}`);
        }
    },

    linkCAS: () => {
        const casId = document.getElementById('cas-id').value;
        const targetMail = document.getElementById('user-selector').value;
        if(casId && targetMail) {
            db.cas_links[targetMail] = casId;
            localStorage.setItem('rp_cas', JSON.stringify(db.cas_links));
            ui.addLog(`CAS ${casId} LIE A ${targetMail}`);
            alert(`CAS ACTIVÉ POUR ${targetMail}`);
        }
    }
};

// Gestion de la connexion
function onConnect(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1]));
    
    if(!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("ACCESS DENIED : CAMPUS ACCOUNT REQUIRED");
        return;
    }

    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('user-display').innerText = `SESSION: ${user.email}`;
    
    ui.addLog(`CONNECTION SUCCESS: ${user.email}`);

    if(user.email === ADMIN_MAIL) {
        document.getElementById('admin-zone').style.display = 'block';
        // Remplir le selecteur d'utilisateurs avec les mails des logs
        const users = [...new Set(db.logs.map(l => l.split('SUCCESS: ')[1]).filter(u => u))];
        const selector = document.getElementById('user-selector');
        selector.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join('');
    }

    ui.renderServices(user.email);
    ui.renderLogs();
}
