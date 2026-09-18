let adminUser = null;
let adminProfile = null;
let allReservations = [];
let allUsers = [];

const activities = [
    {
        name:"PS5",
        category:"Jeux",
        icon:"bi-controller",
        description:"2 séances de 30 minutespar mois"
    },{
        name:"Jeux de société",
        category : "Jeux",
        icon:"bi-dice-5",
        description:"Echecs, domino, katro et bien plus."
    },{
        name:"Coin lecture",
        category:"Lecture",
        icon:"bi-book",
        description:"Découvrez nos livres et choisissez votre lecture."
    },
    {
        name:"Coloriage",
        category:"Créatif",
        icon:"bi-palette",
        description:"Une activités  créative pour petitq et grands."
    },{
        name:"Espace numérique",
        category:"Numérique",
        icon:"bi-display",
        description:"Coworking, visio, réunion et impression."
    },{
        name:"Puzzle",
        category:"Créatif",
        icon:"bi-puzzle",
        description:"Une animation permanente accessible aux membres."
    }
];

function escapeHtml(value){
    return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;")
}

function formatDate(dateString){
    if(!dateString){
        return "";
    }
    const date = new Date(dateString + "T00:00:00");
    return  date.toLocaleDateString("fr-FR",{
        day:"2-digit",
        month:"2-digit",
        year:"numeric"
    });
}

/*VERIFICATION ADMIN*/

async function checkAdminAccess(){
    try{
        const {data,error} = await supabaseClient.auth.getUser();
        if(error || !data.user){
            window.location.href = "../index.html";
            return false;
        }
        adminUser = data.user;
        const {data:profil, error:profileError} = await supabaseClient.from("profiles")
        .select("id,name,phone,role")
        .eq("id",adminUser.id)
        .maybeSingle();
        if(profileError || !profile){
            console.error("Erreur profil:",profileError);
            alert("Votre profil est introuvable.");
            window.location.href = "../index.html";
            return false;
        }
        adminProfile = profil;

        /*Vérification rôle*/

        if(adminProfile.role !=="admin"){
            alert("Accès refusé. Cette page est réservée à l'administrateur.");
            window.location.href = "../index.html";
            return false;
        }
        /*Afficher les infos admin */

        const adminName = document.getElementById("adminName");
        const adminEmail = document.getElementById("adminEmail");
        if(adminName){
            adminName.textContent = adminProfile.name || adminUser.adminemail ||"Administrateur"
        }
        if(adminEmail){
            adminEmail.textContent = adminUser.email || "";
        }

    /*Back-office*/
    document.getElementById("loadinScreen").classList.add("hidden");
    document.getElementById("adminApp").classList.remove("hidden");
    return true;
    }catch(error){
        console.error("Erreur vérification admin:",error);
        window.location.href = "../index.html";
        return false;
    }
}

function showSection(sectionName){
    document.querySelectorAll("admin-section")
    .forEach(section =>{
        section.classList.add("hidden");
    });
    const section = document.getElementById(`section-${sectionName}`);
    if(section){
        section.classList.remove("hidden");
    }

    document.querySelectorAll(".admin-menu").forEach(button=>{
        button.classList.remove("bg-white/10");
    });

    const activeButton = document.querySelector(`.admin-menu[data-section="${sectionName}"]`);
    if(activeButton){
        activeButton.classList.add("bg-white/10");
    }

    const titles = {
        dashboard:"Tableau de bord",
        reservations:"Réservations",
        users:"Membres",
        activities:"Activités",
        spaces:"Espaces"
    };

    const pageTitle = document.getElementById("pageTitle");

    if(pageTitle){
        pageTitle.textContent = titles[sectionName]||"Administration";
    }

    /* Chargement */

    if(sectionName === "reservations"){
        loadReservations()
    }
    if(sectionName === "users"){
        loadUsers();
    }
    if(sectionName === "activities"){
        renderActivities();
    }
    closeMobileSidebar();
}


/*-------RESERVATIONS--------*/

async function loadReservations() {
    const table = document.getElementById("reservationsTable");
    if(!table){
        return;
    }
    table.innerHTML = `
    <tr>
        <td colspan="5" class = " text-center py-10 text-slate-400">Chargement...</td>
    </tr>`;

    const {data,error} = await supabaseClient.from("reservations")
        .select("id,user_id,activity,date,time,is_started, created_at")
        .order("date",{ascending:true})
        .order("time",{ascending:true});
        if(error){
            console.error("Erreur réservations :",error);
            table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-10 text-red-500">Impossible de récupérer les réservations.</td>
            </tr>`;
            return;
        }
        allReservations = data || [];
        renderReservations(allReservations);
        updateDashboardStats();
}

/*---AFFICHER RESERVATIONS----------*/

function renderActivities(reservations){
    const table = document.getElementById("reservationsTable");
    if(!table){
        return;
    }
    if(reservations.length === 0){
        table.innerHTML = `
        <tr>
            <td colspan="5" class="text-center py-10 text-slate-400">
                Aucune réservation.
            </td>
        </tr>`;
        return;
    }
    table.innerHTML = reservations.map(reservation =>{
        const started = reservation.is_started === true;
        return `
            <tr class="border-t border-slate-100 hover:bg-slate-500">
                <td class="px-5 py-4">
                    <p class="font-semibold">
                        ${escapeHtml(reservation.activity)}
                    </p>
                </td>
                <td class="px-5 py-4 text-sm">
                    ${escapeHtml(formatDate(
                        reservation.date
                    ))}
                </td>
                <td class="px-5 py-4 text-sm">
                    ${escapeHtml(Sting(
                        reservation.time || ""
                    ).slice(0,5))}
                </td>
                <td class=px-5 py-4>
                    ${
                        started? `
                        <span class="inline-flex px-3 py-1 rounded-full bg-green-100 text-xs font-bold">En cours</span>`:
                        `<span class="inline-flex px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">Réservée</span>`
                    }
                </td>
                <td class="px-5 py-4">
                    <span class="text-xs text-slate-400">
                        ${escapeHtml(
                            reservation.user_id
                        )}
                    </span>
                </td>

            </tr>`;
    }).join("")
}

/*------MEMBRES----------*/

async function loadUsers(){
    const table = document.getElementById("usersTable");
    if(!table){
        return;
    }
    table.innerHTML = `
        <tr>
            <td colspan="3 class="text-center py-10 text-slate-400">
                Chargement des membres...
            </td>
        </tr>`;
    const {data,error} = await supabaseClient.from(profiles)
    .select("id,name,phone,role").order("name",{
        ascending:true
    });
    if(error){
        console.error("Erreur utilisateur :",error);
        table.innerHTML = `
            <tr>
                <td colspan ="3" classe="text-center py-10 text-red-500">Impossible de récupérer les membres.</td>
            </tr>`;
            return;
    }
    allUsers = data || [];
    renderUsers(allUsers);
    updateDashboardStats();
}

/*---------AFFICHER MEMBRES---------*/

function renderUsers(users){
    const table = document.getElementById("usersTable");

if(!table){
    return;
}
if(users.length === 0){
    table.innerHTML = `
        <tr>
            <td colspan="3" class="text-center py-10 text-slate-400">
                Aucun membre
            </td>
        </tr>`;
        return;
}
table.innerHTML = users.map(user =>`
        <tr class="border-t border-slate-100 hover:bg-slate-500">
            <td class="px-5 py-4">
                <p class="font-semibold">
                    ${escapeHtml(
                        user.name || "Sans nom"
                    )}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                    ${escapeHtml(user.id)}
                </p>
            </td>
            <td class="px-5 py-4 text-sm">
            ${escapeHtml(user.phone || "-")}
            </td>
            <td class="px-5 py-4">
                    ${user.role==="admin"?
                        `<span class="px-4 py-1 rounded-full bg-purple-100 text-purple-100 text-xs font-bold">
                            Administrateur
                        </span>`:`
                        <span class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                            Membre
                        </span>`
                    }
            </td>
        </tr>`).join()
}