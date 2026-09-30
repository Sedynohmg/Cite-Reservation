let currentUser = null;
let currentDate = new Date();
let currentMonth = currentDate.getMonth();
let currentYear = currentDate.getFullYear();
let selectedDate = null;
let selectedTime = null;

let calendarReservations = [];

let currentUserProfile = null;
let currentUserProfilePromise = null;



  // HERO BACKGROUND SLIDER


function initHeroSlider() {
    const slides = document.querySelectorAll(".hero-slide");
    if (slides.length === 0) {
        return;
    }

    let currentSlide = 0;
    setInterval(() => {
        slides[currentSlide].classList.remove("active");
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add("active");
    }, 4000);
}


   //CRENEAUX


const timeSlots = [

    "11:00",
    "11:30",
    "12:00",
    "12:30",
    "13:00",
    "13:30",
    "14:00"

];

   //MOIS

const monthNames = [

    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"

];

  // ECHAPPEMENT HTML

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

   //FORMATER UNE DATE

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    return date.toLocaleDateString(
        "fr-FR",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

}

  // CREER DATE YYYY-MM-DD

function createDateString(year, month, day) {

    return (
        year + "-" + String(month + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0")
    );
}


  // MENU MOBILE

function initMobileMenu() {
    const menuButton = document.getElementById("menuButton");
    const mobileMenu =  document.getElementById("mobileMenu");
    if (!menuButton || !mobileMenu) {
        return;
    }

    menuButton.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        }
    );
    mobileMenu.querySelectorAll("a").forEach(link => {
            link.addEventListener("click",() => {
                    mobileMenu.classList.add("hidden");
                }
            );
        });
}

  // AFFICHER LES ACTIVITES PUBLIQUES

function renderPublicActivities(activities) {
    const container = document.getElementById("activitiesContainer");
    if (!container) {
        return;
    }

    container.innerHTML = activities.map(activity => {
            const color = activity.color || "bg-gradient-to-br from-blue-500 to-cyan-500";
            const icon = activity.icon || "bi bi-calendar-event";
            return `
                <div
                    class="activity-card bg-white rounded-2xl overflow-hidden border-slate-200 shadow-sm hover:shadow-lg transition"
                    data-category="${escapeHtml(
                        String(activity.category || "")
                            .trim()
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                    )}">

                    <div class="${escapeHtml(color)} h-36 p-6 text-white">
                        <div class="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                            <i class="bi ${escapeHtml(icon)} text-3xl"></i>
                        </div>
                    </div>
                    <div class="p-6">
                        <span class="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                            ${escapeHtml(activity.category)}
                        </span>
                        <h3
                            class="font-black text-xl mt-3 text-slate-800">
                            ${escapeHtml(activity.name)}
                        </h3>

                        <p class="text-slate-500 text-sm mt-2 min-h-[40px]">
                            ${escapeHtml(activity.description || "")}
                        </p>

                        <button type="button" class="w-full mt-5 px-4 py-3 bg-[#005383] hover:bg-[#00446c] text-white rounded-xl font-bold transition"
                                             onclick="openReservation('${escapeHtml(activity.name)}')">
                            <i class="bi bi-calendar-check mr-2"></i>
                            Réserver
                        </button>
                    </div>
                </div>
            `;
        }).join("");
}

  // CHARGER LES ACTIVITES PUBLIQUES

async function loadPublicActivities() {
    const container = document.getElementById("activitiesContainer");
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="col-span-full text-center py-10">
            <div class="w-10 h-10 border-4 border-slate-200 border-t-[#005383] rounded-full animate-spin mx-auto">
            </div>

            <p class="text-slate-500 mt-3">
                Chargement des activités...
            </p>
        </div>

    `;

    try {

        const { data, error} = await supabaseClient
            .from("activities")
            .select(` id, name, category, description, icon, color, active`)
            .eq("active", true)
            .order("created_at", {
                ascending: true
            });

        if (error) {
            console.error("Erreur chargement activités:", error );
            container.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-red-500 font-semibold">
                        Impossible de charger les activités.
                    </p>
                </div>
            `;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-10">
                    <p class="text-slate-400">
                        Aucune activité disponible pour le moment.
                    </p>

                </div>
            `;
            return;
        }

        renderPublicActivities(data);

    } catch (error) {
        console.error("Erreur inattendue:", error);
        container.innerHTML = `
            <div class="col-span-full text-center py-10">
                <p class="text-red-500">
                    Une erreur est survenue.
                </p>
            </div>
        `;
    }
}

   //FILTRE ACTIVITES

function filterActivites(category, event) {
    const cards = document.querySelectorAll(".activity-card");
    cards.forEach(card => {
        const cardCategory = card.dataset.category;
        if (category === "all" || cardCategory === category) {
            card.classList.remove("hidden");
        } else {
            card.classList.add("hidden");
        }
    });

    document.querySelectorAll(".filter-btn").forEach(button => {
            button.classList.remove("bg-[#005383]","text-white");
            button.classList.add("bg-slate-100");
        });

    if (event) {
        const button = event.currentTarget || event.target;
        button.classList.remove("bg-slate-100");
        button.classList.add("bg-[#005383]", "text-white");
    }
}

  // AUTHENTIFICATION

const authModal = document.getElementById("authModal");
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const switchAuth = document.getElementById("switchAuth");
const forgotPasswordButton = document.getElementById("forgotPasswordButton");

  // AFFICHER AUTH

function showAuth() {
    if (!authModal) {
        return;
    }

    authModal.classList.remove(
        "hidden"
    );
    authModal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
}

  // CACHER AUTH

function hideAuth() {
    if (!authModal) {
        return;
    }

    authModal.classList.add("hidden");
    authModal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

  // MODE CONNEXION

function showLoginMode() {
    if (!registerForm || !loginForm) {
        return;
    }
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    if (forgotPasswordButton) {
        forgotPasswordButton.classList.remove("hidden");
    }
    const title = document.getElementById("authTitle");
    const description = document.getElementById("authDescription");
    if (title) {
        title.textContent = "Connexion";
    }

    if (description) {
        description.textContent ="Connectez-vous pour accéder à votre espace.";
    }

    if (switchAuth) {
        switchAuth.textContent = "Je veux créer un compte";
    }

}

  // MODE INSCRIPTION

function showRegisterMode() {
    if (!registerForm || !loginForm) {
        return;
    }
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    if (forgotPasswordButton) {
        forgotPasswordButton.classList.add("hidden");
    }

    const title = document.getElementById("authTitle");
    const description = document.getElementById("authDescription");
    if (title) {
        title.textContent ="Créer votre compte";
    }

    if (description) {
        description.textContent = "Créez votre compte pour accéder à CiteActive.";
    }

    if (switchAuth) {
        switchAuth.textContent ="J'ai déjà un compte";
    }

}

  // INSCRIPTION

async function registerUser(event) {
    event.preventDefault();
    const name = document.getElementById("registerName").value.trim();
    const phone = document.getElementById("registerPhone").value.trim();

    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById( "registerPassword").value;
    if (!name ||!phone ||!email ||!password) {
        alert("Veuillez remplir tous les champs.");
        return;
    }

    if (password.length < 6) {
        alert("Le mot de passe doit contenir au moins 6 caractères.");
        return;
    }

    const { data, error} = await supabaseClient.auth.signUp({
        email, password,
        options: {
            data: {name, phone}
        }

    });

    if (error) {
        console.error(error);
        alert("Erreur lors de l'inscription : " + error.message);
        return;
    }

    if (!data.session) {
        alert("Compte créé. Vérifiez votre adresse email puis connectez-vous.");
        showLoginMode();
        return;
    }

    await loadCurrentUser();
    alert(`Bienvenue ${name} !`);

}

  // CONNEXION

async function loginUser(event) {
    event.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    if (!email || !password) {
        alert("Veuillez saisir votre email et votre mot de passe.");
        return;
    }

    const { data, error} =
        await supabaseClient.auth.signInWithPassword({email, password});
    if (error) {
        console.error("Erreur de connexion :",error);
        alert("Connexion impossible : " + error.message);
        return;
    }

    if (!data || !data.user) {
        alert("Impossible de récupérer l'utilisateur connecté.");
        return;
    }

    currentUser = data.user;
    console.log("Utilisateur connecté :", currentUser);
    const {data: profile, error: profileError} = await supabaseClient
            .from("profiles")
            .select("id, name, phone, role")
            .eq("id",currentUser.id)
            .maybeSingle();
    if (profileError) {
        console.error("Erreur récupération profil :",profileError);
        alert("Impossible de récupérer votre profil.");
        return;
    }

    if (!profile) {
        alert("Votre profil est introuvable.");
        return;
    }
    console.log("Profil utilisateur :", profile);
    console.log("Rôle :", profile.role);
    if (profile.role === "admin") {
        alert("Connexion administrateur réussie !");
        window.location.href = "admin/admin.html";
        return;
    }

    await loadCurrentUser();
    alert("Connexion réussie !");
}

  // DECONNEXION

async function logoutUser() {
    const { error} = await supabaseClient.auth.signOut();
    if (error) {
        console.error(error);
        alert("Erreur lors de la déconnexion : " + error.message);
        return;
    }

    currentUser = null;
    currentUserProfile = null;
    currentUserProfilePromise = null;
    calendarReservations = [];

    const displayName = document.getElementById("userDisplayName");
    if (displayName) {
        displayName.textContent = "";
    }

    showAuth();
    showLoginMode();
}

   //MOT DE PASSE OUBLIE

async function resetPassword() {

    const email = document.getElementById("loginEmail").value.trim();
    if (!email) {
        alert("Saisissez d'abord votre adresse email.");
        return;
    }

    const { error} =
        await supabaseClient.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo: window.location.origin + window.location.pathname
                }
            );

    if (error) {
        console.error(error);
        alert("Impossible d'envoyer le lien : " + error.message);
        return;
    }

    alert("Un lien de réinitialisation a été envoyé.");
}

   //RECUPERER PROFIL

async function getMyProfile() {
    if (!currentUser) {
        return null;
    }

    if (currentUserProfile && currentUserProfile.id === currentUser.id) {

        return currentUserProfile;

    }

    // Requête déjà en cours
    if (currentUserProfilePromise) {
        return await currentUserProfilePromise;
    }

    const userId = currentUser.id;
    currentUserProfilePromise =(async () => {
            const {data, error} =
                await supabaseClient
                .from("profiles")
                .select("id, name, phone")
                .eq("id",userId)
                .maybeSingle();
            if (error) {
                console.error("Erreur profil :",error);
                return null;
            }

            currentUserProfile = data;
            return data;
        })();

    try { return await currentUserProfilePromise;
    } finally {
        currentUserProfilePromise = null;
    }

}

  // CHARGER ACTIVITES SUPABASE

async function loadActivitiesFromSupabase() {
    try {
        const {data, error} = await supabaseClient
                .from("activities")
                .select("id, name, category, description, icon, active")
                .eq("active",true)
                .order("created_at",{ascending: true});

        if (error) {
            console.error("Erreur lors du chargement des activités:",error);
            return [];

        }
        console.log("Activités chargées:",data);
        return data || [];
    } catch (error) {
        console.error("Erreur inattendue lors du chargement des activités:", error);
        return [];
    }
}

 //  UTILISATEUR ACTUEL

async function loadCurrentUser() {
    const { data, error} =
        await supabaseClient.auth.getUser();
    if ( error ||!data.user) {
        currentUser = null;
        currentUserProfile = null;
        currentUserProfilePromise = null;
        showAuth();
        return null;
    }

    currentUser = data.user;
    const profile = await getMyProfile();
    const displayName = document.getElementById("userDisplayName");
    if (displayName) {
        displayName.textContent = profile?.name || currentUser.user_metadata?.name || currentUser.email || "";
    }

    hideAuth();
    return currentUser;

}

   //PROGRAMME D'AUJOURD'HUI

function getProgramsColor(color) {
    const colors = {
        sky:"text-sky-600",
        green:"text-green-600",
        orange:"text-orange-600",
        blue:"text-blue-600",
        purple:"text-purple-600",
        red:"text-red-600"
    };

    return (
        colors[color] ||"text-sky-600");
}


function renderTodayProgram(programs) {
    const container = document.getElementById("todayProgram");
    if (!container) {
        return;
    }

    if (!programs.length) {
        container.innerHTML = `
            <div class="text-center py-6">
                <i class="bi bi-calendar-x text-3xl text-slate-300"></i>
                <p class="text-sm text-slate-500 mt-2">
                    Aucun programme prévu pour l'aujourd'hui.
                </p>
            </div>
        `;
        return;
    }

    container.innerHTML =
        programs.map(program => {
            const colorClass = getProgramsColor(program.color);
            const formattedTime = program.time ? program.time.substring(0, 5).replace(":", "h") : "";
            return `
                <div class="flex gap-4 p-4 rounded-2xl bg-slate-50">
                    <div class="font-bold ${colorClass}">
                        ${escapeHtml(formattedTime)}
                    </div>
                    <div>
                        <p class="font-semibold">
                            ${escapeHtml(program.title)}
                        </p>

                        <p class="text-sm text-slate-500">
                            ${escapeHtml(program.location || "")}
                        </p>
                    </div>
                </div>
            `;
        }).join("");
}

async function loadTodayProgram() {
    const programmContainer = document.getElementById("todayProgram");
    if (!programmContainer) {
        return;
    }

    try {
        const today = new Date().toISOString().split("T")[0];
        const {data, error} = await supabaseClient
                .from("programs")
                .select("id, title, time, location, color")
                .eq("program_date", today)
                .order("time", { ascending: true});
        if (error) {
            throw error;
        }

        renderTodayProgram(data || []);
    } catch (error) {
        console.error("Erreur chargement programme:", error);
        programmContainer.innerHTML = `
            <p class="text-sm text-slate-500 text-center py-4">
                Impossible de charger le programme.
            </p>
        `;
    }
}

   //OUVRIR RESERVATION

async function openReservation(activity = "") {
    if (!currentUser) {
        showAuth();
        return;
    }
    const modal = document.getElementById("reservationModal");
    if (!modal) {
        return;
    }

    const activityInput = document.getElementById("activity");
    if (activityInput &&activity) {
        activityInput.value = activity;
    }

    selectedDate = null;
    selectedTime = null;
    calendarReservations = [];
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    if (dateInput) {
        dateInput.value = "";}
    if (timeInput) {
        timeInput.value = "";
    }

    resetSubmitButton();
    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    renderCalendar();
    renderTimeSlots();
    await loadCalendarReservations();

}

   //FERMER RESERVATION

function closeReservation() {
    const modal = document.getElementById("reservationModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");

}

  // CALENDRIER - INITIALISATION

function initCalendarButtons() {
    const previousButton = document.getElementById("previousMonthButton");

    const nextButton = document.getElementById("nextMonthButton");
    if (previousButton) {
        previousButton.addEventListener("click", previousMonth);
    }

    if (nextButton) {
        nextButton.addEventListener("click", nextMonth);
    }

}

   //MOIS PRECEDENT

async function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }

    calendarReservations = [];
    renderCalendar();
    await loadCalendarReservations();

}

   //MOIS SUIVANT
async function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;

    }

    calendarReservations = [];
    renderCalendar();
    await loadCalendarReservations();

}

   //RESERVATIONS D'UN MOIS

async function getReservationsForActivityMonth( activity) {
    if (!activity) {
        return [];
    }

    const firstDate = createDateString( currentYear,currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0).getDate();
    const lastDate = createDateString(currentYear, currentMonth, lastDay);
    const {data,error} = await supabaseClient
            .from("reservations")
            .select("date, time, activity")
            .eq("activity", activity)
            .gte("date",firstDate)
            .lte("date",lastDate);
    if (error) {
        console.error("Erreur calendrier :",error);
        return [];
    }
    return data || [];
}

   //CHARGER LES RESERVATIONS DU MOIS EN MEMOIRE

async function loadCalendarReservations() {
    const activity = document.getElementById("activity")?.value || "";
    if (!activity) {
        calendarReservations = [];
        renderCalendar();
        return;
    }
    const reservations = await getReservationsForActivityMonth(activity);
    calendarReservations = reservations || [];
    renderCalendar();

    if (selectedDate) {
        renderTimeSlots();
    }

}

  // AFFICHER CALENDRIER

function renderCalendar() {
    const calendar = document.getElementById("calendar");
    const title = document.getElementById("calendarTitle");
    if (!calendar || !title) {
        return;
    }

    calendar.innerHTML = "";
    title.textContent =`${monthNames[currentMonth]} ${currentYear}`;

    const firstDay = new Date( currentYear, currentMonth,1);
    const daysInMonth = new Date(currentYear,currentMonth + 1,0).getDate();
    let startDay = firstDay.getDay() - 1;
    if (startDay === -1) {
        startDay = 6;
    }
    for (let i = 0;i < startDay; i++) {
        const emptyCell = document.createElement("div");
        emptyCell.className = "calendar-day min-h-12 border-b border-r border-slate-100";
        calendar.appendChild(emptyCell);
    }

    const reservations = calendarReservations;
    for (let day = 1;day <= daysInMonth; day++) {
        const dateString =
            createDateString(currentYear,currentMonth,day);
        const button = document.createElement("button");
        button.type ="button";
        button.className ="calendar-day relative min-h-12 border-b border-r border-slate-100 flex items-center justify-center font-semibold hover:bg-sky-100 transition";
        button.textContent = day;

        if ( dateString === selectedDate ) {
            button.classList.add("bg-sky-600","text-white");
        }

        const reservationsForDay = reservations.filter(reservation =>reservation.date === dateString);
        if (reservationsForDay.length >= timeSlots.length) {
            button.classList.add("bg-red-50","text-red-600");
            button.title ="Journée complète";
        }

        if (reservationsForDay.length > 0 && reservationsForDay.length < timeSlots.length && dateString !== selectedDate) {

            const dot = document.createElement("span");
            dot.className = "absolute bottom-1 w-1.5 h-1.5 bg-red-500 rounded-full";
            button.appendChild(dot);
        }

        button.addEventListener("click",() =>selectDate(dateString));
        calendar.appendChild( button);
    }

}

  // CHANGER D'ACTIVITE

async function updateAgenda() {
    const activityInput = document.getElementById("activity");
    if (!activityInput) {
        console.warn("Le champ #activity est introuvable.");
        return;
    }
    const activity = activityInput.value.trim();
    selectedDate = null;
    selectedTime =null;
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    if (dateInput) {
        dateInput.value = "";
    }

    if (timeInput) {
         timeInput.value ="";
    }

    resetSubmitButton();
    calendarReservations = [];
    renderCalendar();
    renderTimeSlots();
    await loadCalendarReservations();
    console.log("Activité sélectionnée :",activity);
}

  // SELECTION DATE

async function selectDate(dateString) {
    selectedDate =  dateString;
    selectedTime = null;
    const dateInput = document.getElementById("date");
    const timeInput = document.getElementById("time");
    if (dateInput) {
        dateInput.value = dateString;
    }

    if (timeInput) {
        timeInput.value = "";
    }

    resetSubmitButton();
    renderCalendar();
    await renderTimeSlots();

}

  // AFFICHER CRENEAUX

async function renderTimeSlots() {
    const container = document.getElementById("timeSlots");
    const selectedDateText = document.getElementById("selectedDateText");
    if (!container) {
        return;
    }
    container.innerHTML ="";
    if (!selectedDate) {
        if (selectedDateText) {
            selectedDateText.textContent ="Sélectionnez une date dans le calendrier.";
        }

        container.innerHTML = `
            <div class="sm:col-span-2 p-5 rounded-xl bg-slate-50 text-center">
                <div class="text-slate-400 mb-2">
                    <i class="bi bi-calendar-day text-2xl"></i>
                </div>
                <p class="text-sm text-slate-400">
                    Sélectionnez une date pour voir les créneaux.
                </p>
            </div>
        `;
        return;
    }

    if (selectedDateText) {
        selectedDateText.textContent = formatDate(selectedDate);
    }
    const activity = document.getElementById("activity")?.value || "";
    if (!activity) {
        container.innerHTML = `
            <div  class="sm:col-span-2 p-5 rounded-xl bg-yellow-50 border border-yellow-200 text-center">
                <p class="text-sm text-yellow-700">
                    Sélectionnez une activité pour voir les disponibilités.
                </p>
            </div>
        `;
        return;
    }

    const reservations = calendarReservations.filter( reservation =>
                        reservation.activity === activity && reservation.date === selectedDate
        );

    const reservedTimes = (reservations || []).map(reservation => String(reservation.time).slice(0, 5));
    timeSlots.forEach(
        time => {
            const existingReservation = reservedTimes.includes(time);
            const button = document.createElement("button");
            button.type ="button";
            if (existingReservation) {
                button.disabled = true;
                button.className = "flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 cursor-not-allowed";
                button.innerHTML = `
                    <span class="font-bold">
                        ${time}
                    </span>
                    <span class="flex items-center gap-2 text-sm">
                        <span class="w-2 h-2 bg-red-500 rounded-full"></span>
                        Réservé
                    </span>
                `;

            } else {

                button.className = "time-slot flex items-center justify-between p-4 rounded-xl bg-green-50 border border-green-200 text-green-700 hover:bg-green-500 hover:text-white transition";
                if (selectedTime ===time) {
                    button.classList.add("bg-sky-600","text-white","border-sky-600");
                }

                button.innerHTML = `
                    <span class="font-bold">
                        ${time}
                    </span>
                    <span class="flex items-center gap-2 text-sm">
                        <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                        Disponible
                    </span>
                `;

                button.addEventListener("click",() =>
                        selectTime(time)
                );
            }
            container.appendChild(button);
        }
    );

}

  //SELECTION CRENEAU

function selectTime(time) {
    selectedTime = time;
    const timeInput = document.getElementById("time");
    if (timeInput) {
        timeInput.value = time;
    }

    const submitButton = document.getElementById("submitReservation");
    if (!submitButton) {
        return;
    }

    submitButton.disabled =false;
    submitButton.className = "w-full bg-sky-600 hover:bg-sky-700 text-white py-3.5 rounded-xl font-bold transition";
    submitButton.textContent =`Réserver à ${time}`;
    renderTimeSlots();

}

   //RESET BOUTON RESERVATION

function resetSubmitButton() {
    const submitButton = document.getElementById("submitReservation");
    if (!submitButton) {
        return;
    }
    submitButton.disabled =true;
    submitButton.className ="w-full bg-slate-300 text-slate-500 py-3.5 rounded-xl font-bold cursor-not-allowed";
    submitButton.textContent = "Sélectionnez un créneau";
}

   //CREER RESERVATION

async function createReservation(activity,date,time) {
    if (!currentUser) {
        showAuth();
        return null;
    }
    const {data, error} = await supabaseClient
            .from("reservations")
            .insert({
                user_id:currentUser.id,
                activity:activity,
                date: date,
                time:time
            })
            .select()
            .single();

    if (error) {
        console.error("Erreur réservation :", error);
        if (error.code === "23505") {
            alert("Ce créneau vient d'être réservé par quelqu'un d'autre.");
        } else {
            alert("Impossible d'enregistrer la réservation : " + error.message);
        }
        return null;
    }

    return data;
}

   //SOUMISSION RESERVATION

async function handleReservationSubmit(event) {
    event.preventDefault();
    if (!currentUser) {
        showAuth();
        return;
    }

    const activity = document.getElementById("activity")?.value.trim();
    const date = document.getElementById("date")?.value.trim();
    const time = document.getElementById("time")?.value.trim();
    if (!activity ||!date ||!time) {
        alert("Veuillez sélectionner une activité, une date et un créneau.");
        return;
    }
    const reservation =
        await createReservation(activity, date,time);
    if (!reservation) {
        return;
    }
    alert("Votre réservation a été enregistrée avec succès !");
    document.getElementById("reservationForm")?.reset();
    selectedDate = null;
    selectedTime = null;
    resetSubmitButton();
    closeReservation();

}

  // VOS ACTIVITES

async function getMyReservations() {
    if (!currentUser) {
        return [];
    }

    const {data,error} = await supabaseClient
            .from("reservations")
            .select("id,user_id, activity, date, time,validated,is_started, created_at")
            .eq("user_id",currentUser.id)
            .order("date", {ascending: true})
            .order("time",{ascending: true});
    if (error) {
        console.error("Erreur récupération activités :",error);
        return [];
    }
    return data || [];
}

   //OUVRIR VOS ACTIVITES

async function openActivities() {
    if (!currentUser) {
        showAuth();
        return;
    }

    const modal = document.getElementById("activitiesModal");
    if (!modal) {
        return;
    }

    modal.classList.remove("hidden");
    modal.classList.add("flex");
    document.body.classList.add("overflow-hidden");
    const clientNameElement = document.getElementById("currentClientName");
    if (clientNameElement) {
        clientNameElement.textContent = currentUserProfile?.name || document.getElementById("userDisplayName")?.textContent ||
         currentUser.user_metadata?.name || currentUser.email || "";
    }

    await renderActivities();
}

  // FERMER VOS ACTIVITES

function closeActivities() {

    const modal = document.getElementById("activitiesModal");
    if (!modal) {
        return;
    }
    modal.classList.add("hidden");
    modal.classList.remove("flex");
    document.body.classList.remove("overflow-hidden");
}

   //AFFICHER VOS ACTIVITES

async function renderActivities() {
    const activitiesList = document.getElementById("activitiesList");
    const noActivities = document.getElementById("noActivities");
    if (!activitiesList || !noActivities) {
        return;
    }

    activitiesList.innerHTML = `
        <div class="text-center py-10">
            <div class="w-10 h-10 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin mx-auto"></div>
            <p class="text-sm text-slate-500 mt-3">
                Chargement de vos activités...
            </p>
        </div>

    `;

    const reservations = await getMyReservations();
    activitiesList.innerHTML = "";
    if ( reservations.length === 0) {
        noActivities.classList.remove("hidden");
        return;
    }

    noActivities.classList.add("hidden");
    reservations.forEach(
        reservation => {const isValidated = reservation.validated === true;
            const isStarted = reservation.is_started === true;
            const isFinished = reservation.is_finished === true;
            let statusText = "";
            let statusClass = "";
            if (!isValidated) {
                statusText = "En attente de validation";
                statusClass = "bg-amber-100 text-amber-700";
            } else if (!isStarted) {
                statusText = "Réservation confirmée";
                statusClass = "bg-emerald-500 text-black-500";
            } else if(isFinished){
                statusText = "Terminée";
                statusClass = "bg-red-200 text-white";
            }
            else {
                statusText ="En cours";
                statusClass = "bg-green-100 text-green-700";
            }

            const item = document.createElement("div");
            item.className = "flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl hover:border-sky-300 hover:bg-sky-50/50 transition";
            item.innerHTML = `
                <div class="w-12 h-12 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <i class="bi bi-calendar-check text-xl"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="font-bold text-slate-800 truncate">
                        ${escapeHtml(reservation.activity)}
                    </h3>
                    <p class="text-sm text-slate-500 mt-1">
                        <i class="bi bi-calendar3 mr-1"></i>
                        ${escapeHtml(reservation.date)}
                        <span class="mx-1">
                            •
                        </span>
                        <i class="bi bi-clock mr-1"></i>
                        ${escapeHtml( String(reservation.time ||"").slice(0, 5))}
                    </p>
                </div>
                <span class="activity-status shrink-0 text-xs font-bold px-3 py-1.5 rounded-full ${statusClass}">
                    ${statusText}
                </span>
            `;
            activitiesList.appendChild(item);
        }
    );
}

   //TOUCHE ECHAP

document.addEventListener("keydown", event => {
        if (event.key ==="Escape") {
            closeReservation();
            closeActivities();
        }
    }
);

  // INITIALISATION

document.addEventListener("DOMContentLoaded",async () => {
        loadTodayProgram();
        initHeroSlider();
        initMobileMenu();
        initCalendarButtons();
          // INSCRIPTION
        if (registerForm) {
            registerForm.addEventListener("submit",registerUser);
        }

           //CONNEXION

        if (loginForm) {
            loginForm.addEventListener("submit",loginUser);
        }

           //CHANGEMENT AUTH

        if (switchAuth) {
            switchAuth.addEventListener("click",() => {
                    const registerVisible =!registerForm.classList.contains("hidden");
                    if (registerVisible) {
                        showLoginMode();
                    } else {
                        showRegisterMode();
                    }
                }
            );
        }

           //MOT DE PASSE OUBLIE

        if (forgotPasswordButton) {
            forgotPasswordButton.addEventListener("click", resetPassword);
        }
           //DECONNEXION DESKTOP
        document.getElementById("logoutButton")?.addEventListener("click", logoutUser);
          // DECONNEXION MOBILE
        document.getElementById("mobileLogoutButton")?.addEventListener("click",logoutUser);
           //RESERVATION
        document.getElementById("reservationForm")?.addEventListener("submit",handleReservationSubmit);
           //SURVEILLER AUTH
        supabaseClient.auth.onAuthStateChange(
            async (_event,session) => {
                if (session?.user) {
                    currentUser = session.user;
                    const displayName = document.getElementById("userDisplayName");
                    const profile = await getMyProfile();
                    if (displayName) {
                        displayName.textContent = profile?.name || currentUser.user_metadata?.name || currentUser.email || "";
                    }
                    hideAuth();
                } else {
                    currentUser = null;
                    currentUserProfile = null;
                    currentUserProfilePromise = null;
                    calendarReservations =[];
                    showAuth();
                }
            }
        );
           //SESSION + ACTIVITES EN PARALLELE
        await Promise.all([loadPublicActivities(), loadCurrentUser()]);
    }
);