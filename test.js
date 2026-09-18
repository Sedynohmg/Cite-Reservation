

let adminUser = null;
let adminProfile = null;

let allReservations = [];
let allUsers = [];



// =====================================================
// ECHAPPEMENT HTML
// =====================================================



function formatDate(dateString) {

    if (!dateString) {
        return "";
    }

    const date = new Date(
        dateString + "T00:00:00"
    );

    return date.toLocaleDateString(
        "fr-FR",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );

}


// =====================================================
// VERIFICATION ADMIN
// =====================================================

async function checkAdminAccess() {

    try {

        // ---------------------------------------------
        // 1. Vérifier la connexion Supabase
        // ---------------------------------------------

        const {
            data,
            error
        } = await supabaseClient.auth.getUser();


        if (error || !data?.user) {

            window.location.href = "../index.html";

            return false;
        }


        adminUser = data.user;


        // ---------------------------------------------
        // 2. Récupérer le profil
        // ---------------------------------------------

        const {
            data: profile,
            error: profileError
        } = await supabaseClient
            .from("profiles")
            .select("id, name, phone, role")
            .eq("id", adminUser.id)
            .maybeSingle();


        if (
            profileError ||
            !profile
        ) {

            console.error(
                "Erreur profil :",
                profileError
            );

            alert(
                "Votre profil est introuvable."
            );

            window.location.href = "../index.html";

            return false;
        }


        adminProfile = profile;


        // ---------------------------------------------
        // 3. Vérifier le rôle
        // ---------------------------------------------

        if (
            adminProfile.role !== "admin"
        ) {

            alert(
                "Accès refusé. Cette page est réservée à l'administrateur."
            );

            window.location.href = "../index.html";

            return false;
        }


        // ---------------------------------------------
        // 4. Afficher les informations admin
        // ---------------------------------------------

        const adminName =
            document.getElementById("adminName");

        const adminEmail =
            document.getElementById("adminEmail");


        if (adminName) {

            adminName.textContent =
                adminProfile.name ||
                adminUser.email ||
                "Administrateur";

        }


        if (adminEmail) {

            adminEmail.textContent =
                adminUser.email || "";

        }


        // ---------------------------------------------
        // 5. Afficher le back-office
        // ---------------------------------------------

        document
            .getElementById("loadingScreen")
            ?.classList
            .add("hidden");


        document
            .getElementById("adminApp")
            ?.classList
            .remove("hidden");


        return true;

    }

    catch (error) {

        console.error(
            "Erreur vérification admin :",
            error
        );

        window.location.href = "../index.html";

        return false;
    }

}


// =====================================================
// CHANGER DE SECTION
// =====================================================

function showSection(sectionName) {

    document
        .querySelectorAll(".admin-section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    const section =
        document.getElementById(
            `section-${sectionName}`
        );


    if (section) {

        section.classList.remove("hidden");

    }


    // ---------------------------------------------
    // Menu actif
    // ---------------------------------------------

    document
        .querySelectorAll(".admin-menu")
        .forEach(button => {

            button.classList.remove(
                "bg-white/10"
            );

        });


    const activeButton =
        document.querySelector(
            `.admin-menu[data-section="${sectionName}"]`
        );


    if (activeButton) {

        activeButton.classList.add(
            "bg-white/10"
        );

    }


    // ---------------------------------------------
    // Titre
    // ---------------------------------------------

    const titles = {

        dashboard: "Tableau de bord",

        reservations: "Réservations",

        users: "Membres",

        activities: "Activités",

        spaces: "Espaces"

    };


    const pageTitle =
        document.getElementById(
            "pageTitle"
        );


    if (pageTitle) {

        pageTitle.textContent =
            titles[sectionName] ||
            "Administration";

    }


    // ---------------------------------------------
    // Chargement spécifique
    // ---------------------------------------------

    if (
        sectionName === "reservations"
    ) {

        loadReservations();

    }


    if (
        sectionName === "users"
    ) {

        loadUsers();

    }


    if (
        sectionName === "activities"
    ) {

        renderActivities();

    }


    closeMobileSidebar();

}


// =====================================================
// RESERVATIONS
// =====================================================

async function loadReservations() {

    const table =
        document.getElementById(
            "reservationsTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>
            <td colspan="5"
                class="text-center py-10 text-slate-400">

                Chargement des réservations...

            </td>
        </tr>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("reservations")
        .select(
            "id, user_id, activity, date, time, is_started, created_at"
        )
        .order(
            "date",
            {
                ascending: true
            }
        )
        .order(
            "time",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Erreur réservations :",
            error
        );


        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center py-10 text-red-500">

                    Impossible de récupérer les réservations.

                </td>
            </tr>
        `;

        return;
    }


    allReservations =
        data || [];


    renderReservations(
        allReservations
    );


    updateDashboardStats();

}


// =====================================================
// AFFICHER RESERVATIONS
// =====================================================

function renderReservations(
    reservations
) {

    const table =
        document.getElementById(
            "reservationsTable"
        );


    if (!table) {
        return;
    }


    if (
        reservations.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="5"
                    class="text-center py-10 text-slate-400">

                    Aucune réservation.

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        reservations
            .map(
                reservation => {

                    const started =
                        reservation.is_started === true;


                    return `

                        <tr class="border-t border-slate-100 hover:bg-slate-50">

                            <td class="px-5 py-4">

                                <p class="font-semibold">

                                    ${escapeHtml(
                                        reservation.activity
                                    )}

                                </p>

                            </td>


                            <td class="px-5 py-4 text-sm">

                                ${escapeHtml(
                                    formatDate(
                                        reservation.date
                                    )
                                )}

                            </td>


                            <td class="px-5 py-4 text-sm">

                                ${escapeHtml(
                                    String(
                                        reservation.time || ""
                                    ).slice(0, 5)
                                )}

                            </td>


                            <td class="px-5 py-4">

                                ${
                                    started

                                    ?

                                    `
                                    <span class="inline-flex
                                                 px-3 py-1
                                                 rounded-full
                                                 bg-green-100
                                                 text-green-700
                                                 text-xs
                                                 font-bold">

                                        En cours

                                    </span>
                                    `

                                    :

                                    `
                                    <span class="inline-flex
                                                 px-3 py-1
                                                 rounded-full
                                                 bg-slate-100
                                                 text-slate-600
                                                 text-xs
                                                 font-bold">

                                        Réservée

                                    </span>
                                    `
                                }

                            </td>


                            <td class="px-5 py-4">

                                <span class="text-xs text-slate-400">

                                    ${escapeHtml(
                                        reservation.user_id
                                    )}

                                </span>

                            </td>

                        </tr>

                    `;
                }
            )
            .join("");

}


// =====================================================
// MEMBRES
// =====================================================

async function loadUsers() {

    const table =
        document.getElementById(
            "usersTable"
        );


    if (!table) {
        return;
    }


    table.innerHTML = `
        <tr>
            <td colspan="3"
                class="text-center py-10 text-slate-400">

                Chargement des membres...

            </td>
        </tr>
    `;


    const {
        data,
        error
    } = await supabaseClient
        .from("profiles")
        .select(
            "id, name, phone, role"
        )
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {

        console.error(
            "Erreur utilisateurs :",
            error
        );


        table.innerHTML = `
            <tr>
                <td colspan="3"
                    class="text-center py-10 text-red-500">

                    Impossible de récupérer les membres.

                </td>
            </tr>
        `;

        return;
    }


    allUsers =
        data || [];


    renderUsers(
        allUsers
    );


    updateDashboardStats();

}


// =====================================================
// AFFICHER MEMBRES
// =====================================================

function renderUsers(users) {

    const table =
        document.getElementById(
            "usersTable"
        );


    if (!table) {
        return;
    }


    if (
        users.length === 0
    ) {

        table.innerHTML = `
            <tr>
                <td colspan="3"
                    class="text-center py-10 text-slate-400">

                    Aucun membre.

                </td>
            </tr>
        `;

        return;
    }


    table.innerHTML =
        users
            .map(
                user => `

                    <tr class="border-t border-slate-100 hover:bg-slate-50">

                        <td class="px-5 py-4">

                            <p class="font-semibold">

                                ${escapeHtml(
                                    user.name ||
                                    "Sans nom"
                                )}

                            </p>

                            <p class="text-xs text-slate-400 mt-1">

                                ${escapeHtml(
                                    user.id
                                )}

                            </p>

                        </td>


                        <td class="px-5 py-4 text-sm">

                            ${escapeHtml(
                                user.phone ||
                                "-"
                            )}

                        </td>


                        <td class="px-5 py-4">

                            ${
                                user.role === "admin"

                                ?

                                `
                                <span class="px-3 py-1
                                             rounded-full
                                             bg-purple-100
                                             text-purple-700
                                             text-xs
                                             font-bold">

                                    Administrateur

                                </span>
                                `

                                :

                                `
                                <span class="px-3 py-1
                                             rounded-full
                                             bg-slate-100
                                             text-slate-600
                                             text-xs
                                             font-bold">

                                    Membre

                                </span>
                                `
                            }

                        </td>

                    </tr>

                `
            )
            .join("");

}


// =====================================================
// ACTIVITES
// =====================================================

function renderActivities() {

    const grid =
        document.getElementById(
            "activitiesGrid"
        );


    if (!grid) {
        return;
    }


    grid.innerHTML =
        activities
            .map(
                activity => `

                    <div class="bg-white rounded-2xl
                                p-6 shadow-sm
                                border border-slate-200">

                        <div class="w-12 h-12
                                    rounded-xl
                                    bg-[#A71D78]/10
                                    text-[#A71D78]
                                    flex items-center
                                    justify-center">

                            <i class="bi ${escapeHtml(
                                activity.icon
                            )} text-xl"></i>

                        </div>


                        <span class="inline-block
                                     mt-5
                                     px-3 py-1
                                     rounded-full
                                     bg-slate-100
                                     text-slate-600
                                     text-xs
                                     font-bold">

                            ${escapeHtml(
                                activity.category
                            )}

                        </span>


                        <h3 class="font-black
                                   text-xl mt-3">

                            ${escapeHtml(
                                activity.name
                            )}

                        </h3>


                        <p class="text-slate-500
                                  text-sm mt-2">

                            ${escapeHtml(
                                activity.description
                            )}

                        </p>

                    </div>

                `
            )
            .join("");

}


// =====================================================
// STATISTIQUES
// =====================================================

async function updateDashboardStats() {

    // ---------------------------------------------
    // Membres
    // ---------------------------------------------

    const {
        count: usersCount
    } = await supabaseClient
        .from("profiles")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    // ---------------------------------------------
    // Réservations
    // ---------------------------------------------

    const {
        count: reservationsCount
    } = await supabaseClient
        .from("reservations")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        );


    // ---------------------------------------------
    // Activités en cours
    // ---------------------------------------------

    const {
        count: startedCount
    } = await supabaseClient
        .from("reservations")
        .select(
            "id",
            {
                count: "exact",
                head: true
            }
        )
        .eq(
            "is_started",
            true
        );


    const usersElement =
        document.getElementById(
            "dashboardUsersCount"
        );

    const reservationsElement =
        document.getElementById(
            "dashboardReservationsCount"
        );

    const activitiesElement =
        document.getElementById(
            "dashboardActivitiesCount"
        );

    const startedElement =
        document.getElementById(
            "dashboardStartedCount"
        );


    if (usersElement) {

        usersElement.textContent =
            usersCount ?? 0;

    }


    if (reservationsElement) {

        reservationsElement.textContent =
            reservationsCount ?? 0;

    }


    if (activitiesElement) {

        activitiesElement.textContent =
            activities.length;

    }


    if (startedElement) {

        startedElement.textContent =
            startedCount ?? 0;

    }

}


// =====================================================
// RESERVATIONS RECENTES
// =====================================================

async function loadRecentReservations() {

    const container =
        document.getElementById(
            "recentReservations"
        );


    if (!container) {
        return;
    }


    const {
        data,
        error
    } = await supabaseClient
        .from("reservations")
        .select(
            "id, user_id, activity, date, time, is_started"
        )
        .order(
            "created_at",
            {
                ascending: false
            }
        )
        .limit(5);


    if (error) {

        console.error(
            "Erreur récentes :",
            error
        );


        container.innerHTML = `
            <p class="text-center text-red-500 py-5">

                Impossible de récupérer les réservations.

            </p>
        `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <p class="text-center text-slate-400 py-8">

                Aucune réservation pour le moment.

            </p>
        `;

        return;
    }


    container.innerHTML =
        data
            .map(
                reservation => `

                    <div class="flex flex-col sm:flex-row
                                sm:items-center
                                justify-between
                                gap-3
                                py-4
                                border-b border-slate-100
                                last:border-0">

                        <div>

                            <p class="font-bold">

                                ${escapeHtml(
                                    reservation.activity
                                )}

                            </p>

                            <p class="text-sm text-slate-500 mt-1">

                                ${escapeHtml(
                                    formatDate(
                                        reservation.date
                                    )
                                )}

                                •

                                ${escapeHtml(
                                    String(
                                        reservation.time || ""
                                    ).slice(0, 5)
                                )}

                            </p>

                        </div>


                        ${
                            reservation.is_started

                            ?

                            `
                            <span class="self-start
                                         sm:self-auto
                                         px-3 py-1
                                         rounded-full
                                         bg-green-100
                                         text-green-700
                                         text-xs
                                         font-bold">

                                En cours

                            </span>
                            `

                            :

                            `
                            <span class="self-start
                                         sm:self-auto
                                         px-3 py-1
                                         rounded-full
                                         bg-slate-100
                                         text-slate-600
                                         text-xs
                                         font-bold">

                                Réservée

                            </span>
                            `
                        }

                    </div>

                `
            )
            .join("");

}


// =====================================================
// RECHERCHE RESERVATION
// =====================================================

function searchReservations(value) {

    const search =
        value
            .trim()
            .toLowerCase();


    if (!search) {

        renderReservations(
            allReservations
        );

        return;
    }


    const filtered =
        allReservations.filter(
            reservation =>

                String(
                    reservation.activity || ""
                )
                .toLowerCase()
                .includes(search)

        );


    renderReservations(
        filtered
    );

}


// =====================================================
// RECHERCHE MEMBRE
// =====================================================

function searchUsers(value) {

    const search =
        value
            .trim()
            .toLowerCase();


    if (!search) {

        renderUsers(
            allUsers
        );

        return;
    }


    const filtered =
        allUsers.filter(
            user =>

                String(
                    user.name || ""
                )
                .toLowerCase()
                .includes(search)

                ||

                String(
                    user.phone || ""
                )
                .toLowerCase()
                .includes(search)

        );


    renderUsers(
        filtered
    );

}


// =====================================================
// SIDEBAR MOBILE
// =====================================================

function openMobileSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    sidebar?.classList.remove(
        "-translate-x-full"
    );

    overlay?.classList.remove(
        "hidden"
    );

}


function closeMobileSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );


    if (
        window.innerWidth < 1024
    ) {

        sidebar?.classList.add(
            "-translate-x-full"
        );

        overlay?.classList.add(
            "hidden"
        );

    }

}


// =====================================================
// DECONNEXION
// =====================================================

async function logoutAdmin() {

    const {
        error
    } = await supabaseClient
        .auth
        .signOut();


    if (error) {

        console.error(
            "Erreur déconnexion :",
            error
        );

        alert(
            "Erreur lors de la déconnexion."
        );

        return;
    }


    window.location.href =
        "../index.html";

}


// =====================================================
// INITIALISATION
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    async () => {


        // ---------------------------------------------
        // Vérifier administrateur
        // ---------------------------------------------

        const isAdmin =
            await checkAdminAccess();


        if (!isAdmin) {
            return;
        }


        // ---------------------------------------------
        // Menu
        // ---------------------------------------------

        document
            .querySelectorAll(".admin-menu")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        showSection(
                            button.dataset.section
                        );

                    }
                );

            });


        // ---------------------------------------------
        // Mobile
        // ---------------------------------------------

        document
            .getElementById("menuButton")
            ?.addEventListener(
                "click",
                openMobileSidebar
            );


        document
            .getElementById("sidebarOverlay")
            ?.addEventListener(
                "click",
                closeMobileSidebar
            );


        // ---------------------------------------------
        // Déconnexion
        // ---------------------------------------------

        document
            .getElementById("logoutButton")
            ?.addEventListener(
                "click",
                logoutAdmin
            );


        // ---------------------------------------------
        // Recherche
        // ---------------------------------------------

        document
            .getElementById("reservationSearch")
            ?.addEventListener(
                "input",
                event => {

                    searchReservations(
                        event.target.value
                    );

                }
            );


        document
            .getElementById("userSearch")
            ?.addEventListener(
                "input",
                event => {

                    searchUsers(
                        event.target.value
                    );

                }
            );


        // ---------------------------------------------
        // Actualiser réservations
        // ---------------------------------------------

        document
            .getElementById("refreshReservations")
            ?.addEventListener(
                "click",
                async () => {

                    await loadReservations();

                    await loadRecentReservations();

                    await updateDashboardStats();

                }
            );


        // ---------------------------------------------
        // Chargement initial
        // ---------------------------------------------

        renderActivities();

        await loadReservations();

        await loadUsers();

        await loadRecentReservations();

        await updateDashboardStats();


        // ---------------------------------------------
        // Surveiller la session
        // ---------------------------------------------

        supabaseClient
            .auth
            .onAuthStateChange(
                async (
                    _event,
                    session
                ) => {

                    if (!session?.user) {

                        window.location.href =
                            "../index.html";

                    }

                }
            );

    }
);