// CONFIGURATION INITIALE
const ADMIN_ID = "ce.0227235a@campus-rosaparks.fr";
const PRONOTE_URL = "https://pronote.campus-rosaparks.fr/";

let services = JSON.parse(localStorage.getItem('rp_srv')) || [
    { name: 'PRONOTE', emoji: '💎', link: PRONOTE_URL },
    { name: 'GMAIL', emoji: '📧', link: 'https://mail.google.com' }
];

let logs = JSON.parse(localStorage.getItem('rp_logs')) || [];
let casStore = JSON.parse(localStorage.getItem('rp_cas')) || {}; // Stocke les CAS par mail

// AUTHENTIFICATION
function onAuth(response) {
    const user = JSON.parse(atob(response.credential.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    
    if (!user.email.endsWith("@campus-rosaparks.fr")) {
        alert("DOMAINE REFUSÉ");
        return;
    }

    // Sauvegarde du log
    logs.unshift({ user: user.email, date: new Date().toLocaleTimeString() });
    localStorage.setItem('rp_logs', JSON.stringify(logs));

    showApp(user);
}

function showApp(user) {
    document.getElementById('loginView').style.display = 'none';
    document.getElementById('mainView').style.display = 'block';
    document.getElementById('welcomeTitle').innerText = user.given_name.toUpperCase();

    if (user.email === ADMIN_ID) {
        document.getElementById('adminArea').style.display = 'block';
        document.getElementById('badgeAdmin').innerHTML = '<span style="color:var(--admin-red); border:1px solid; padding:5px 15px; border-radius:50px; font-size:0.8rem;">ADMIN ROOT</span>';
        renderLogs();
    }

    renderServices(user.email);
}

// GESTION CAS PRONOTE
function generateCAS() {
    const targetMail = document.getElementById('casUserMail').value;
    if (!targetMail) return;

    // Création d'un ticket unique pour ce mail
    const ticket = "CAS-PR-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    
    // On enregistre le CAS pour ce mail
    casStore[targetMail] = ticket;
    localStorage.setItem('rp_cas', JSON.stringify(casStore));

    // Copie dans le presse-papier pour l'admin
    navigator.clipboard.writeText(ticket);
    
    document.getElementById('casStatus').style.display = 'block';
    setTimeout(() => { document.getElementById('casStatus').style.display = 'none'; }, 3000);
}

// AFFICHAGE SERVICES
function renderServices(userEmail) {
    const container = document.getElementById('gridServices');
    container.innerHTML = '';

    services.forEach(s => {
        const card = document.createElement('a');
        card.className = 'service-link';
        
        // Logique de connexion automatique
        if (s.name === 'PRONOTE') {
            const myCAS = casStore[userEmail];
            if (myCAS) {
                // Si un CAS existe pour cet élève, on l'injecte dans l'URL
                card.href = s.link + "?ticket=" + myCAS + "&user=" + btoa(userEmail);
            } else {
                card.href = s.link;
            }
        } else {
            card.href = s.link;
        }

        card.target = "_blank";
        card.innerHTML = `<span style="font-size:2.5rem">${s.emoji}</span><b>${s.name}</b>`;
        container.appendChild(card);
    });
}

// ADMIN FUNCTIONS
function addNewService() {
    const name = document.getElementById('newSrvName').value.toUpperCase();
    const emoji = document.getElementById('newSrvEmoji').value;
    const link = document.getElementById('newSrvLink').value;

    if (name && link) {
        services.push({ name, emoji, link });
        localStorage.setItem('rp_srv', JSON.stringify(services));
        renderServices(ADMIN_ID);
    }
}

function renderLogs() {
    const display = document.getElementById('logDisplay');
    display.innerHTML = logs.slice(0, 8).map(l => `
        <tr>
            <td><span class="user">${l.user}</span> a accédé au Nexus</td>
            <td style="text-align:right">${l.date}</td>
        </tr>
    `).join('');
}
