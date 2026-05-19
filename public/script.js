// =====================================================
// LIVRET IB — script.js v3.0
// =====================================================

// ---- Global state ----
let currentSemester = 1;

let currentData = {
    contributionId: null,
    teacherName: localStorage.getItem('teacherName') || null,
    classSelected: null,
    sectionSelected: null,
    subjectSelected: null,
    studentSelected: null,
    studentBirthdate: null,
    studentPhoto: null,
    teacherComment: null,
    communicationEvaluation: ['', '', '', '', ''],
    unitsSem1: 1,
    unitsSem2: 1,
    criteriaValues: {
        A: {sem1: null, sem2: null, finalLevel: null, sem1Units: [], sem2Units: []},
        B: {sem1: null, sem2: null, finalLevel: null, sem1Units: [], sem2Units: []},
        C: {sem1: null, sem2: null, finalLevel: null, sem1Units: [], sem2Units: []},
        D: {sem1: null, sem2: null, finalLevel: null, sem1Units: [], sem2Units: []}
    }
};

let currentContributionId = null;

// ---- DOM refs ----
const progressBarContainer   = document.getElementById('progressContainer');
const progressBar             = document.getElementById('progressBar');
const progressText            = document.getElementById('progressText');
const studentInfoContainer    = document.getElementById('studentInfoContainer');
const contributionEntrySections = document.getElementById('contributionEntrySections');
const submitButton            = document.getElementById('submitButton');
const teacherNameInput        = document.getElementById('teacherName');
const subjectsGrid            = document.getElementById('subjectsGrid');
const dataContainer           = document.getElementById('dataContainer');
const studentBirthdateInput   = document.getElementById('studentBirthdate');

// =====================================================
// DATA — Students, classes, subjects, criteria
// =====================================================

const studentData = {
    // Garçons
    'Faysal':              {fullName:'Faysal Achar',            birthdate:'2014-04-15', photo:'https://lh3.googleusercontent.com/d/1IB6BKROX3TRxaIIHVVVWbB7-Ii-V8VrC'},
    'Bilal':               {fullName:'Bilal Molina',             birthdate:'2015-02-15', photo:'https://lh3.googleusercontent.com/d/1B0QUZJhpSad5Fs3qRTugUe4oyTlUDEVu'},
    'Jad':                 {fullName:'Jad Mahayni',              birthdate:'2014-08-15', photo:'https://lh3.googleusercontent.com/d/1VLvrWjeJwaClf4pSaLiwjnS79N-HrsFr'},
    'Manaf':               {fullName:'Manaf Kotbi',              birthdate:'2014-08-15', photo:'https://lh3.googleusercontent.com/d/1h46Tqtqcp5tNqdY62wV6pyZFYknCEMWY'},
    'Ahmed':               {fullName:'Ahmed Bouaziz',            birthdate:'2013-09-15', photo:'https://lh3.googleusercontent.com/d/1cDF-yegSB2tqsWac0AoNttbi8qAALYT1'},
    'Yasser':              {fullName:'Yasser Younes',            birthdate:'2013-08-15', photo:'https://lh3.googleusercontent.com/d/1UUrrAJV_bgFNktGDinDkSrpwSZz-e47T'},
    'Eyad':                {fullName:'Eyad Hassan',              birthdate:'2013-04-15', photo:'https://lh3.googleusercontent.com/d/1HGyWS4cC1jWWD25Ah3WcT_eIbUHqFzJ1'},
    'Ali':                 {fullName:'Ali Kutbi',                birthdate:'2013-04-15', photo:'https://lh3.googleusercontent.com/d/1bN-fDf_IWkXoW3WjSOXI5_M4KkL3FDKr'},
    'Seifeddine':          {fullName:'Seifeddine Ayadi',         birthdate:'2012-01-15', photo:'https://lh3.googleusercontent.com/d/1tWdPSbtCAsTMB86WzDgqh3Xw01ahm9s6'},
    'Mohamed Chalak':      {fullName:'Mohamed Chalak',           birthdate:'2011-11-15', photo:'https://lh3.googleusercontent.com/d/1lB8ObGOvQDVT6FITL2y7C5TYmAGyggFn'},
    'Wajih':               {fullName:'Wajih Sabadine',           birthdate:'2012-06-15', photo:'https://lh3.googleusercontent.com/d/1MH6M05mQamOHevmDffVFNpSFNnxqbxs3'},
    'Ahmad':               {fullName:'Ahmad Mahayni',            birthdate:'2012-02-15', photo:'https://lh3.googleusercontent.com/d/1zU-jBuAbYjHanzank9C1BAd00skS1Y5J'},
    'Adam':                {fullName:'Adam Kaaki',               birthdate:'2012-12-15', photo:'https://lh3.googleusercontent.com/d/15I9p6VSnn1yVmPxRRbGsUkM-fsBKYOWF'},
    'Mohamed Younes':      {fullName:'Mohamed Younes',           birthdate:'2011-11-15', photo:'https://lh3.googleusercontent.com/d/1wzraoZY_lRafcDXeaxSBeX5cIU57p4xA'},
    'Mohamed Amine Sgheir':{fullName:'Mohamed Amine Sgheir',     birthdate:'2012-12-15', photo:'https://lh3.googleusercontent.com/d/1UrBw6guz0oBTUy8COGeewIs3XAK773bR'},
    'Samir':               {fullName:'Samir Kaaki',              birthdate:'2012-12-15', photo:'https://lh3.googleusercontent.com/d/1NdaCH8CU0DJFHXw4D0lItP-QnCswl23b'},
    'Abdulrahman':         {fullName:'Abdulrahman Bouaziz',      birthdate:'2012-04-15', photo:'https://lh3.googleusercontent.com/d/1yCTO5StU2tnPY0BEynnWzUveljMIUcLE'},
    'Youssef':             {fullName:'Youssef Baakak',           birthdate:'2011-11-15', photo:'https://lh3.googleusercontent.com/d/1Bygg5-PYrjjMOZdI5hAe16eZ8ltn772e'},
    'Habib':               {fullName:'Habib Lteif',              birthdate:'2008-10-15', photo:'https://lh3.googleusercontent.com/d/13u4y6JIyCBVQ_9PCwYhh837byyK9g8pF'},
    'Salah':               {fullName:'Salah Boumalouga',         birthdate:'2008-07-15', photo:'https://lh3.googleusercontent.com/d/1IG8S_i6jD8O6C2QD_nwLxrG932QgIVXu'},
    // Filles
    'Yomna Masrouhi':      {fullName:'Yomna Masrouhi',           birthdate:'2009-09-07', photo:null},
    'Isra Elalmi':         {fullName:'Isra Elalmi',              birthdate:'2008-03-25', photo:null},
    'Naya Sabbidine':      {fullName:'Naya Sabbidine',           birthdate:'2014-02-28', photo:null},
    'Israa Alkattan':      {fullName:'Israa Alkattan',           birthdate:'2013-09-19', photo:null},
    'Dina Tlili':          {fullName:'Dina Tlili',               birthdate:'2012-12-22', photo:null},
    'Lina Tlili':          {fullName:'Lina Tlili',               birthdate:'2012-12-22', photo:null},
    'Cynthia Fadlallah':   {fullName:'Cynthia Fadlallah',        birthdate:'2013-12-06', photo:null},
    'Neyla Molina':        {fullName:'Neyla Molina',             birthdate:'2014-01-13', photo:null},
    'Jawahair Eshmawi':    {fullName:'Jawahair Eshmawi',         birthdate:'2012-03-19', photo:null},
    'Yousr Letaief':       {fullName:'Yousr Letaief',            birthdate:'2011-06-14', photo:null},
    'Sarah Aldebasy':      {fullName:'Sarah Aldebasy',           birthdate:'2011-07-24', photo:null},
    'Maria Wahib':         {fullName:'Maria Wahib',              birthdate:'2011-07-16', photo:null},
    'Badia Khaldi':        {fullName:'Badia Khaldi',             birthdate:'2010-12-23', photo:null},
    'Luluwah Alghabashi':  {fullName:'Luluwah Alghabashi',       birthdate:'2010-04-29', photo:null}
};

const subjectsByClass = {
    PEI1: ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    PEI2: ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    PEI3: ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    PEI4: ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    PEI5: ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    DP1:  ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
    DP2:  ["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"]
};

// ---- CORRECTED criteria names per subject (as requested) ----
const criteriaBySubject = {
    "Éducation physique et à la santé": {
        A: "Connaissances et compréhension",
        B: "Planification de la performance",
        C: "Application et exécution",
        D: "Réflexion et amélioration de la performance"
    },
    // Keep old name as alias
    "Éducation physique et sportive": {
        A: "Connaissances et compréhension",
        B: "Planification de la performance",
        C: "Application et exécution",
        D: "Réflexion et amélioration de la performance"
    },
    "Design": {
        A: "Recherche et analyse",
        B: "Développement des idées",
        C: "Création de la solution",
        D: "Évaluation"
    },
    "Art visuel": {
        A: "Recherche",
        B: "Développement",
        C: "Création ou exécution",
        D: "Évaluation"
    },
    "Arts": {
        A: "Recherche",
        B: "Développement",
        C: "Création ou exécution",
        D: "Évaluation"
    },
    "Acquisition de langue (Anglais)": {
        A: "Listening Comprehension",
        B: "Reading Comprehension",
        C: "Speaking",
        D: "Writing"
    },
    "Acquisition de langues (Anglais)": {
        A: "Listening Comprehension",
        B: "Reading Comprehension",
        C: "Speaking",
        D: "Writing"
    },
    "Individus et sociétés": {
        A: "Connaissances et compréhension",
        B: "Recherche",
        C: "Communication",
        D: "Pensée critique"
    },
    "Langue et littérature": {
        A: "Analyse",
        B: "Organisation",
        C: "Production de texte",
        D: "Utilisation de la langue"
    },
    "Sciences": {
        A: "Connaissances et compréhension",
        B: "Recherche et élaboration",
        C: "Traitement et évaluation",
        D: "Réflexion sur les répercussions de la science"
    },
    "Mathématiques": {
        A: "Connaissances et compréhension",
        B: "Recherche de modèles",
        C: "Communication",
        D: "Application des mathématiques dans des contextes de la vie réelle"
    },
    // Arabic — fixed criteria
    "Acquisition de langue (اللغة العربية)": {
        A: "الاستماع",
        B: "القراءة",
        C: "التحدث",
        D: "الكتابة"
    }
};

const studentsByClassAndSection = {
    garçons: {
        PEI1: ["Bilal","Faysal","Jad","Manaf"],
        PEI2: ["Ahmed","Ali","Eyad","Yasser"],
        PEI3: ["Adam","Ahmad","Mohamed Chalak","Seifeddine","Wajih"],
        PEI4: ["Abdulrahman","Mohamed Amine Sgheir","Mohamed Younes","Samir","Youssef"],
        DP2:  ["Habib","Salah"]
    },
    filles: {
        PEI1: ["Naya Sabbidine"],
        PEI2: ["Israa Alkattan","Dina Tlili","Lina Tlili","Cynthia Fadlallah","Neyla Molina"],
        PEI3: ["Jawahair Eshmawi"],
        PEI4: ["Yousr Letaief","Sarah Aldebasy","Maria Wahib"],
        PEI5: ["Badia Khaldi","Luluwah Alghabashi"],
        DP1:  ["Yomna Masrouhi"],
        DP2:  ["Isra Elalmi"]
    }
};

const availableClassesBySection = {
    'garçons': ['PEI1','PEI2','PEI3','PEI4','DP2'],
    'filles':  ['PEI1','PEI2','PEI3','PEI4','PEI5','DP1','DP2']
};

const subjectIcons = {
    "Mathématiques":                       "📐",
    "Individus et sociétés":               "🌍",
    "Langue et littérature":               "📚",
    "Design":                              "🎨",
    "Sciences":                            "🔬",
    "Art visuel":                          "🖼️",
    "Éducation physique et à la santé":    "⚽",
    "Éducation physique et sportive":      "⚽",
    "Acquisition de langue (Anglais)":     "🇬🇧",
    "Acquisition de langue (اللغة العربية)":"🇸🇦"
};

// Class metadata for icon display
const classInfo = {
    PEI1: { icon: '🏫', label: 'PEI 1', sub: 'Année 1', type: 'pei' },
    PEI2: { icon: '🏫', label: 'PEI 2', sub: 'Année 2', type: 'pei' },
    PEI3: { icon: '🏫', label: 'PEI 3', sub: 'Année 3', type: 'pei' },
    PEI4: { icon: '🏫', label: 'PEI 4', sub: 'Année 4', type: 'pei' },
    PEI5: { icon: '🏫', label: 'PEI 5', sub: 'Année 5', type: 'pei' },
    DP1:  { icon: '🎓', label: 'DP 1',  sub: 'Diplôme 1', type: 'dp' },
    DP2:  { icon: '🎓', label: 'DP 2',  sub: 'Diplôme 2', type: 'dp' }
};

// =====================================================
// TOAST NOTIFICATIONS
// =====================================================
function showToast(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success:'✅', error:'❌', warning:'⚠️', info:'ℹ️' };
    toast.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 250);
    }, duration);
}

// =====================================================
// API UTILITIES
// =====================================================
async function apiCall(endpoint, data) {
    const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
}

async function downloadWordDocument(data) {
    const response = await fetch('/api/generateSingleWord', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const cd = response.headers.get('Content-Disposition');
    let filename = `Livret-${data.studentSelected}-${Date.now()}.docx`;
    if (cd) { const m = cd.match(/filename="([^"]+)"/); if (m) filename = m[1]; }
    const blob  = await response.blob();
    const url   = window.URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return { success: true, filename };
}

// =====================================================
// SEMESTER UI
// =====================================================
function handleSemesterChange(semester) {
    currentSemester = semester;
    updateSemesterUI();
    document.getElementById('step0b').style.display = 'block';
    _isPopulatingSubjects = false;
    if (currentData.studentSelected && currentData.classSelected) {
        populateSubjects();
    }
}

function updateSemesterUI() {
    const s1 = document.getElementById('sem1Btn');
    const s2 = document.getElementById('sem2Btn');
    if (s1 && s2) {
        if (currentSemester === 1) {
            s1.style.opacity = '1'; s1.style.boxShadow = '0 0 0 4px rgba(37,99,235,.4)';
            s2.style.opacity = '.5'; s2.style.boxShadow = 'none';
        } else {
            s2.style.opacity = '1'; s2.style.boxShadow = '0 0 0 4px rgba(22,163,74,.4)';
            s1.style.opacity = '.5'; s1.style.boxShadow = 'none';
        }
    }
    const badge = document.getElementById('semesterBadge');
    if (badge) {
        badge.textContent = `Semestre ${currentSemester}`;
        badge.style.backgroundColor = currentSemester === 1 ? '#2563eb' : '#16a34a';
        badge.style.display = 'inline-block';
    }
}

// =====================================================
// NAVIGATION — SECTION
// =====================================================
function handleSectionChange(value) {
    currentData.sectionSelected = value;
    document.getElementById('step0').style.display = 'none';
    document.getElementById('step0b').style.display = 'none';
    document.getElementById('step1').style.display = 'block';
    populateClassGrid(value);
    resetOnSectionChange();
}

function populateClassGrid(section) {
    const grid = document.getElementById('classGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const classes = availableClassesBySection[section] || [];
    classes.forEach(cls => {
        const info = classInfo[cls] || { icon:'🏫', label:cls, sub:'', type:'pei' };
        const card = document.createElement('div');
        card.className = `class-card ${info.type}`;
        card.dataset.class = cls;
        card.innerHTML = `
            <div class="class-icon">${info.icon}</div>
            <div class="class-label">${info.label}</div>
            <div class="class-sub">${info.sub}</div>
        `;
        card.onclick = () => handleClassChange(cls);
        grid.appendChild(card);
    });
}

// =====================================================
// NAVIGATION — CLASS
// =====================================================
function handleClassChange(value) {
    currentData.classSelected = value;
    // Highlight selected card
    document.querySelectorAll('.class-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.class === value);
    });
    resetOnClassChange();
    if (value) {
        populateStudentGrid();
        document.getElementById('step3').style.display = 'block';
    }
}

function populateStudentGrid() {
    const grid = document.getElementById('studentGrid');
    if (!grid) return;
    grid.innerHTML = '';
    const { classSelected, sectionSelected } = currentData;
    const list = (studentsByClassAndSection[sectionSelected]?.[classSelected] || []).slice().sort((a,b) => a.localeCompare(b));
    list.forEach(name => {
        const info   = studentData[name] || {};
        const full   = info.fullName || name;
        const photo  = info.photo;
        const initials = full.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
        const card = document.createElement('div');
        card.className = 'student-card';
        card.dataset.student = name;
        const photoHtml = photo
            ? `<img class="student-photo" src="${photo}" alt="${full}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"><div class="student-avatar" style="display:none;">${initials}</div>`
            : `<div class="student-avatar">${initials}</div>`;
        card.innerHTML = `${photoHtml}<div class="student-name">${full}</div>`;
        card.onclick = () => handleStudentChange(name);
        grid.appendChild(card);
    });
}

// =====================================================
// NAVIGATION — STUDENT
// =====================================================
function handleStudentChange(name) {
    currentData.studentSelected = name;
    // Highlight selected student card
    document.querySelectorAll('.student-card').forEach(c => {
        c.classList.toggle('selected', c.dataset.student === name);
    });
    resetOnStudentChange();
    if (name) {
        showStudentInfo();
        populateSubjects();
    }
}

async function showStudentInfo() {
    const name = currentData.studentSelected;
    if (!name) { studentInfoContainer.style.display = 'none'; return; }
    studentInfoContainer.style.display = 'block';

    const info   = studentData[name] || {};
    const full   = info.fullName || name;
    const photo  = info.photo;
    const initials = full.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();

    document.getElementById('studentNameDisplay').textContent = full;
    document.getElementById('studentClassBadge').textContent =
        `${currentData.classSelected} · ${currentData.sectionSelected} · Semestre ${currentSemester}`;

    const photoEl   = document.getElementById('studentPhotoPreview');
    const avatarEl  = document.getElementById('studentAvatarPlaceholder');
    if (photo) {
        photoEl.src  = photo;
        photoEl.style.display = 'block';
        avatarEl.style.display = 'none';
        photoEl.onerror = () => { photoEl.style.display='none'; avatarEl.style.display='flex'; avatarEl.textContent=initials; };
    } else {
        photoEl.style.display = 'none';
        avatarEl.style.display = 'flex';
        avatarEl.textContent = initials;
    }

    currentData.studentPhoto    = photo || null;
    currentData.studentBirthdate = info.birthdate || '';
    if (studentBirthdateInput) studentBirthdateInput.value = info.birthdate || '';

    try {
        const srv = await apiCall('fetchStudentInfo', { studentSelected: name });
        if (srv?.studentBirthdate) {
            currentData.studentBirthdate = srv.studentBirthdate;
            if (studentBirthdateInput) studentBirthdateInput.value = srv.studentBirthdate;
        }
    } catch(e) {}
}

// =====================================================
// SUBJECT GRID
// =====================================================
let completedSubjects = {};
let _isPopulatingSubjects = false;

async function populateSubjects() {
    if (_isPopulatingSubjects) return;
    _isPopulatingSubjects = true;
    try {
        const { classSelected, studentSelected } = currentData;
        if (!classSelected || !studentSelected || !subjectsGrid) return;
        subjectsGrid.innerHTML = '';

        let existingMap = {};
        try {
            const resp = await apiCall('fetchStudentContributions', {
                studentSelected, classSelected,
                sectionSelected: currentData.sectionSelected,
                semester: currentSemester
            });
            completedSubjects[studentSelected] = {};
            if (resp?.contributions) {
                const seen = new Set();
                resp.contributions.forEach(c => {
                    if (c.subjectSelected && !seen.has(c.subjectSelected)) {
                        seen.add(c.subjectSelected);
                        completedSubjects[studentSelected][c.subjectSelected] = true;
                    }
                });
            }
        } catch(e) {}

        const subjects = [...new Set(subjectsByClass[classSelected] || [])];
        subjects.forEach(subject => {
            const card = document.createElement('div');
            card.className = 'subject-card';
            card.dataset.subject = subject;
            if (completedSubjects[studentSelected]?.[subject]) card.classList.add('completed');
            if (currentData.subjectSelected === subject) card.classList.add('selected');
            const icon = subjectIcons[subject] || '📖';
            card.innerHTML = `<div class="subject-icon">${icon}</div><h3>${subject}</h3>`;
            card.onclick = () => handleSubjectCardClick(subject);
            subjectsGrid.appendChild(card);
        });

        document.getElementById('step2').style.display = 'block';
    } finally {
        _isPopulatingSubjects = false;
    }
}

function handleSubjectCardClick(subject) {
    document.querySelectorAll('.subject-card').forEach(c => c.classList.remove('selected'));
    document.querySelector(`.subject-card[data-subject="${CSS.escape(subject)}"]`)?.classList.add('selected');
    handleSubjectChange(subject);
}

// =====================================================
// SUBJECT CHANGE — loads form + data
// =====================================================
async function handleSubjectChange(value) {
    currentData.subjectSelected = value;
    resetOnSubjectChange();
    if (!value) return;

    const isArabic = value === 'Acquisition de langue (اللغة العربية)';
    document.querySelectorAll('.french-section').forEach(s => s.style.display = isArabic ? 'none' : 'block');
    document.querySelectorAll('.arabic-section').forEach(s => s.style.display = isArabic ? 'block' : 'none');

    // Update subject name badge
    const badge = document.getElementById('subjectNameBadge');
    if (badge) badge.textContent = value;

    contributionEntrySections.style.display = 'block';
    dataContainer.style.display = 'none';

    if (!isArabic) {
        updateCriteriaTableDynamically();
        updateCriteriaTableHeaders();
    } else {
        updateCriteriaTableDynamicallyArabic();
    }

    await fetchData();
}

// =====================================================
// CRITERIA TABLE UPDATES
// =====================================================
function updateCriteriaTableDynamically() {
    const isDP = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const maxV = isDP ? 7 : 8;
    const maxT = isDP ? 28 : 32;
    const heads = document.querySelectorAll('#criteriaTable thead th');
    if (heads.length >= 5) {
        heads[1].textContent = `Semestre 1 (/${maxV})`;
        heads[2].textContent = `Semestre 2 (/${maxV})`;
        heads[3].textContent = `Niveau Final (/${maxV})`;
        heads[4].textContent = `Seuil (/${maxT})`;
        if (heads[5]) heads[5].textContent = `Note (/${maxV})`;
    }
    document.querySelectorAll('#criteriaTable tbody input[type="number"]').forEach(i => { if (!i.readOnly) i.max = maxV; });
}

function updateCriteriaTableDynamicallyArabic() {
    const isDP = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const maxV = isDP ? 7 : 8;
    const maxT = isDP ? 28 : 32;
    const heads = document.querySelectorAll('#criteriaTableArabic thead th');
    if (heads.length >= 5) {
        heads[1].textContent = `الفصل الأول (/${maxV})`;
        heads[2].textContent = `الفصل الثاني (/${maxV})`;
        heads[3].textContent = `المستوى النهائي (/${maxV})`;
        heads[4].textContent = `المجموع (/${maxT})`;
        if (heads[5]) heads[5].textContent = `الدرجة (/${maxV})`;
    }
    document.querySelectorAll('#criteriaTableArabic tbody input[type="number"]').forEach(i => { if (!i.readOnly) i.max = maxV; });
}

function updateCriteriaTableHeaders() {
    const labels = criteriaBySubject[currentData.subjectSelected] || {};
    const keys = ['A','B','C','D'];
    document.querySelectorAll('#criteriaTable tbody tr').forEach((row, i) => {
        const key  = keys[i];
        const cell = row.cells[0];
        if (cell) cell.textContent = `${key} — ${labels[key] || 'Critère '+key}`;
    });
}

// =====================================================
// CRITERIA TABLE REBUILD (for units)
// =====================================================
function handleUnitsChange() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    if (isArabic) {
        currentData.unitsSem1 = parseInt(document.getElementById('unitsSem1SelectorArabic').value) || 1;
        currentData.unitsSem2 = parseInt(document.getElementById('unitsSem2SelectorArabic').value) || 1;
        rebuildCriteriaTableArabic();
    } else {
        currentData.unitsSem1 = parseInt(document.getElementById('unitsSem1Selector').value) || 1;
        currentData.unitsSem2 = parseInt(document.getElementById('unitsSem2Selector').value) || 1;
        rebuildCriteriaTable();
    }
}

function rebuildCriteriaTable() {
    const isDP   = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const maxV   = isDP ? 7 : 8;
    const uS1    = currentData.unitsSem1 || 1;
    const uS2    = currentData.unitsSem2 || 1;
    const labels = criteriaBySubject[currentData.subjectSelected] || {};
    const keys   = ['A','B','C','D'];

    // Header
    let hdr = '<tr><th>Critères</th>';
    if (uS1 === 1) { hdr += `<th>Semestre 1 (/${maxV})</th>`; }
    else { for(let i=1;i<=uS1;i++) hdr+=`<th>S1-U${i} (/${maxV})</th>`; hdr+=`<th style="background:#e7f3ff;">Moy. S1 (/${maxV})</th>`; }
    if (uS2 === 1) { hdr += `<th>Semestre 2 (/${maxV})</th>`; }
    else { for(let i=1;i<=uS2;i++) hdr+=`<th>S2-U${i} (/${maxV})</th>`; hdr+=`<th style="background:#e7f3ff;">Moy. S2 (/${maxV})</th>`; }
    hdr += `<th>Niveau Final (/${maxV})</th><th>Seuil (/${isDP?28:32})</th><th>Note (/${maxV})</th></tr>`;
    document.getElementById('criteriaTableHead').innerHTML = hdr;

    // Body
    let body = '';
    keys.forEach((key, idx) => {
        const cv  = currentData.criteriaValues[key] || {};
        const lbl = `${key} — ${labels[key] || 'Critère '+key}`;
        body += `<tr data-criteria="${key}"><td>${lbl}</td>`;
        if (uS1 === 1) {
            body += `<td class="sem1-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem1??''}" oninput="validateInput(this)" data-unit="0"></td>`;
        } else {
            for(let i=0;i<uS1;i++) body += `<td class="sem1-unit-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem1Units?.[i]??''}" oninput="validateInput(this)" data-unit="${i}"></td>`;
            body += `<td style="background:#e7f3ff;"><input type="number" readonly tabindex="-1" value="${cv.sem1??''}" class="sem1-avg-input"></td>`;
        }
        if (uS2 === 1) {
            body += `<td class="sem2-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem2??''}" oninput="validateInput(this)" data-unit="0"></td>`;
        } else {
            for(let i=0;i<uS2;i++) body += `<td class="sem2-unit-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem2Units?.[i]??''}" oninput="validateInput(this)" data-unit="${i}"></td>`;
            body += `<td style="background:#e7f3ff;"><input type="number" readonly tabindex="-1" value="${cv.sem2??''}" class="sem2-avg-input"></td>`;
        }
        body += `<td><input type="number" readonly tabindex="-1" value="${cv.finalLevel??''}" class="final-level-input"></td>`;
        if (idx === 0) {
            body += `<td rowspan="4"><input id="threshold" type="number" readonly tabindex="-1" style="background:#e9ecef;"></td>`;
            body += `<td rowspan="4"><input id="finalNote" type="number" readonly tabindex="-1" style="background:#e9ecef;"></td>`;
        }
        body += '</tr>';
    });
    document.getElementById('criteriaTableBody').innerHTML = body;
    calculateTotals();
    if (currentSemester === 2) applySemester2Mode();
}

function rebuildCriteriaTableArabic() {
    const isDP   = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const maxV   = isDP ? 7 : 8;
    const uS1    = currentData.unitsSem1 || 1;
    const uS2    = currentData.unitsSem2 || 1;
    const keys   = ['A','B','C','D'];
    const arNames = { A:'الاستماع', B:'القراءة', C:'التحدث', D:'الكتابة' };

    let hdr = '<tr><th>المعايير</th>';
    if (uS1 === 1) { hdr += `<th>الفصل الأول (/${maxV})</th>`; }
    else { for(let i=1;i<=uS1;i++) hdr+=`<th>ف1-و${i} (/${maxV})</th>`; hdr+=`<th style="background:#e7f3ff;">متوسط ف1 (/${maxV})</th>`; }
    if (uS2 === 1) { hdr += `<th>الفصل الثاني (/${maxV})</th>`; }
    else { for(let i=1;i<=uS2;i++) hdr+=`<th>ف2-و${i} (/${maxV})</th>`; hdr+=`<th style="background:#e7f3ff;">متوسط ف2 (/${maxV})</th>`; }
    hdr += `<th>المستوى النهائي (/${maxV})</th><th>المجموع (/${isDP?28:32})</th><th>الدرجة (/${maxV})</th></tr>`;
    document.getElementById('criteriaTableHeadArabic').innerHTML = hdr;

    let body = '';
    keys.forEach((key, idx) => {
        const cv  = currentData.criteriaValues[key] || {};
        const lbl = `${key}: ${arNames[key]||key}`;
        body += `<tr data-criteria="${key}"><td>${lbl}</td>`;
        if (uS1 === 1) {
            body += `<td class="sem1-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem1??''}" oninput="validateInput(this)" data-unit="0"></td>`;
        } else {
            for(let i=0;i<uS1;i++) body+=`<td class="sem1-unit-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem1Units?.[i]??''}" oninput="validateInput(this)" data-unit="${i}"></td>`;
            body+=`<td style="background:#e7f3ff;"><input type="number" readonly tabindex="-1" value="${cv.sem1??''}" class="sem1-avg-input"></td>`;
        }
        if (uS2 === 1) {
            body += `<td class="sem2-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem2??''}" oninput="validateInput(this)" data-unit="0"></td>`;
        } else {
            for(let i=0;i<uS2;i++) body+=`<td class="sem2-unit-cell"><input type="number" min="0" max="${maxV}" value="${cv.sem2Units?.[i]??''}" oninput="validateInput(this)" data-unit="${i}"></td>`;
            body+=`<td style="background:#e7f3ff;"><input type="number" readonly tabindex="-1" value="${cv.sem2??''}" class="sem2-avg-input"></td>`;
        }
        body += `<td><input type="number" readonly tabindex="-1" value="${cv.finalLevel??''}" class="final-level-input"></td>`;
        if (idx === 0) {
            body += `<td rowspan="4"><input id="thresholdArabic" type="number" readonly tabindex="-1" style="background:#e9ecef;"></td>`;
            body += `<td rowspan="4"><input id="finalNoteArabic" type="number" readonly tabindex="-1" style="background:#e9ecef;"></td>`;
        }
        body += '</tr>';
    });
    document.getElementById('criteriaTableBodyArabic').innerHTML = body;
    calculateTotals();
    if (currentSemester === 2) applySemester2Mode();
}

// =====================================================
// INPUT HANDLING
// =====================================================
function validateInput(input) {
    const isDP = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const max  = isDP ? 7 : 8;
    input.value = input.value.replace(/[^0-9]/g, '');
    if (input.value !== '' && parseFloat(input.value) > max) {
        showToast(`Le maximum est ${max}`, 'warning', 2000);
        input.value = max;
    }
    handleCriteriaChange(input);
}

function handleCriteriaChange(inputElement) {
    const row = inputElement.closest('tr');
    if (!row) return;
    const key = row.getAttribute('data-criteria');
    if (!key) return;
    const isDP = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const max  = isDP ? 7 : 8;

    if (!currentData.criteriaValues[key]) {
        currentData.criteriaValues[key] = { sem1:null, sem2:null, finalLevel:null, sem1Units:[], sem2Units:[] };
    }

    // S1
    const s1Inputs = row.querySelectorAll('.sem1-unit-cell input, .sem1-cell input');
    let s1Units=[], s1Sum=0, s1Count=0;
    s1Inputs.forEach(inp => {
        const u = parseInt(inp.dataset.unit||'0');
        const v = inp.value !== '' ? parseFloat(inp.value) : null;
        s1Units[u] = v;
        if (v !== null && !isNaN(v)) { s1Sum+=v; s1Count++; }
    });
    let s1Avg = currentData.unitsSem1===1 ? s1Units[0]??null : (s1Count>0 ? Math.round(s1Sum/s1Count) : null);
    const s1AvgEl = row.querySelector('.sem1-avg-input');
    if (s1AvgEl) s1AvgEl.value = s1Avg!==null ? s1Avg : '';

    // S2
    const s2Inputs = row.querySelectorAll('.sem2-unit-cell input, .sem2-cell input');
    let s2Units=[], s2Sum=0, s2Count=0;
    s2Inputs.forEach(inp => {
        const u = parseInt(inp.dataset.unit||'0');
        const v = inp.value !== '' ? parseFloat(inp.value) : null;
        s2Units[u] = v;
        if (v !== null && !isNaN(v)) { s2Sum+=v; s2Count++; }
    });
    let s2Avg = currentData.unitsSem2===1 ? s2Units[0]??null : (s2Count>0 ? Math.round(s2Sum/s2Count) : null);
    const s2AvgEl = row.querySelector('.sem2-avg-input');
    if (s2AvgEl) s2AvgEl.value = s2Avg!==null ? s2Avg : '';

    // Final
    let final = null;
    if (s1Avg!==null && s2Avg!==null) final = Math.round((s1Avg+s2Avg)/2);
    else if (s1Avg!==null) final = s1Avg;
    else if (s2Avg!==null) final = s2Avg;
    const finEl = row.querySelector('.final-level-input');
    if (finEl) finEl.value = final!==null ? final : '';

    currentData.criteriaValues[key] = { sem1:s1Avg, sem2:s2Avg, finalLevel:final, sem1Units:s1Units, sem2Units:s2Units };
    calculateTotals();
}

function calculateTotals() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const tbody = document.getElementById(isArabic ? 'criteriaTableBodyArabic' : 'criteriaTableBody');
    if (!tbody) return;
    const isDP   = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    const maxN   = isDP ? 7 : 8;
    const maxT   = isDP ? 28 : 32;
    let total = 0;
    tbody.querySelectorAll('.final-level-input').forEach(inp => {
        if (inp.value !== '') total += parseFloat(inp.value);
    });
    const tEl = document.getElementById(isArabic ? 'thresholdArabic' : 'threshold');
    if (tEl) tEl.value = total;
    let note = total > 0 ? Math.max(1, Math.min(maxN, Math.round(total/4))) : 0;
    const nEl = document.getElementById(isArabic ? 'finalNoteArabic' : 'finalNote');
    if (nEl) nEl.value = note;
}

function handleCommunicationChange() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const sel = isArabic ? '#communicationTableArabic tbody select' : '#communicationTable tbody select';
    currentData.communicationEvaluation = Array.from(document.querySelectorAll(sel)).map(s=>s.value);
}

function handleTeacherNameChange(value) {
    currentData.teacherName = value.trim();
    localStorage.setItem('teacherName', currentData.teacherName);
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const other = document.getElementById(isArabic ? 'teacherName' : 'teacherNameArabic');
    if (other) other.value = value.trim();
}

function handleCommentChange(value) {
    currentData.teacherComment = value;
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const other = document.getElementById(isArabic ? 'teacherComment' : 'teacherCommentArabic');
    if (other) other.value = value;
}

function handleStudentBirthdateChange(value) {
    currentData.studentBirthdate = value;
}

function syncFormDataFromDOM() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const commentEl = document.getElementById(isArabic ? 'teacherCommentArabic' : 'teacherComment');
    if (commentEl) currentData.teacherComment = commentEl.value;
    const nameEl = document.getElementById(isArabic ? 'teacherNameArabic' : 'teacherName');
    if (nameEl && nameEl.value.trim()) {
        currentData.teacherName = nameEl.value.trim();
        localStorage.setItem('teacherName', currentData.teacherName);
    }
    if (studentBirthdateInput?.value) currentData.studentBirthdate = studentBirthdateInput.value;
}

// =====================================================
// SEMESTER 2 MODE
// =====================================================
function applySemester2Mode() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const banner = document.getElementById(isArabic ? 's2InfoBannerArabic' : 's2InfoBanner');
    if (banner) banner.style.display = 'flex';
    const other  = document.getElementById(isArabic ? 's2InfoBanner' : 's2InfoBannerArabic');
    if (other) other.style.display = 'none';

    const sel = isArabic
        ? '#criteriaTableBodyArabic .sem1-cell input, #criteriaTableBodyArabic .sem1-unit-cell input'
        : '#criteriaTableBody .sem1-cell input, #criteriaTableBody .sem1-unit-cell input';

    document.querySelectorAll(sel).forEach(inp => {
        inp.readOnly = false;
        inp.style.backgroundColor = '#dbeafe';
        inp.title = 'Note S1 — modifiable, sera sauvegardée dans S1';
    });
}

function hideSemester2Banners() {
    document.getElementById('s2InfoBanner')?.setAttribute('style','display:none');
    document.getElementById('s2InfoBannerArabic')?.setAttribute('style','display:none');
}

// =====================================================
// FETCH DATA
// =====================================================
async function fetchData() {
    if (!currentData.studentSelected || !currentData.subjectSelected) return;
    try {
        const data = await apiCall('fetchData', {
            studentSelected: currentData.studentSelected,
            subjectSelected: currentData.subjectSelected,
            classSelected:   currentData.classSelected,
            sectionSelected: currentData.sectionSelected,
            semester: currentSemester
        });

        resetInputTables();

        if (currentSemester === 2) {
            let s1Data = null;
            try {
                s1Data = await apiCall('fetchData', {
                    studentSelected: currentData.studentSelected,
                    subjectSelected: currentData.subjectSelected,
                    classSelected:   currentData.classSelected,
                    sectionSelected: currentData.sectionSelected,
                    semester: 1
                });
            } catch(e) {}

            const s1cv = (s1Data && !s1Data.noDataForSubject) ? JSON.parse(JSON.stringify(s1Data.criteriaValues||{})) : {};

            if (data && !data.noDataForSubject) {
                if (!data.criteriaValues) data.criteriaValues = {};
                ['A','B','C','D'].forEach(k => {
                    if (!data.criteriaValues[k]) data.criteriaValues[k] = {};
                    data.criteriaValues[k].sem1      = s1cv[k]?.sem1      ?? null;
                    data.criteriaValues[k].sem1Units = s1cv[k]?.sem1Units ?? [];
                    const s1v = data.criteriaValues[k].sem1;
                    const s2v = data.criteriaValues[k].sem2 ?? null;
                    data.criteriaValues[k].finalLevel = s1v!==null&&s2v!==null ? Math.round((parseFloat(s1v)+parseFloat(s2v))/2) : (s2v!==null?s2v:s1v);
                });
                fillFormWithData(data);
                currentContributionId = data._id || null;
            } else {
                currentContributionId = null;
                if (teacherNameInput) teacherNameInput.value = currentData.teacherName || '';
                const tcAr = document.getElementById('teacherNameArabic');
                if (tcAr) tcAr.value = currentData.teacherName || '';
                ['teacherComment','teacherCommentArabic'].forEach(id => {
                    const el = document.getElementById(id); if(el) el.value='';
                });
                currentData.teacherComment = null;
                document.querySelectorAll('#communicationTable tbody select, #communicationTableArabic tbody select').forEach(s=>s.value='');
                currentData.communicationEvaluation = ['','','','',''];
                ['A','B','C','D'].forEach(k => {
                    currentData.criteriaValues[k] = {
                        sem1: s1cv[k]?.sem1??null, sem1Units: s1cv[k]?.sem1Units??[],
                        sem2: null, sem2Units: [], finalLevel: s1cv[k]?.sem1??null
                    };
                });
            }

            const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
            if (isArabic) rebuildCriteriaTableArabic(); else rebuildCriteriaTable();
            applySemester2Mode();
        } else {
            hideSemester2Banners();
            if (data && !data.noDataForSubject) {
                fillFormWithData(data);
                currentContributionId = data._id || null;
            } else {
                currentContributionId = null;
                if (teacherNameInput) teacherNameInput.value = currentData.teacherName || '';
                const tc = document.getElementById('teacherComment');
                if (tc) tc.value = '';
                currentData.teacherComment = null;
                calculateTotals();
            }
        }

        contributionEntrySections.style.display = 'block';
    } catch(e) {
        console.error('fetchData error:', e);
        showToast('Erreur lors du chargement des données', 'error');
    }
}

function fillFormWithData(data) {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    if (teacherNameInput) teacherNameInput.value = data.teacherName || currentData.teacherName || '';
    currentData.teacherName = teacherNameInput?.value || '';
    localStorage.setItem('teacherName', currentData.teacherName);
    const tcAr = document.getElementById('teacherNameArabic');
    if (tcAr) tcAr.value = currentData.teacherName;

    const commentEl = document.getElementById(isArabic ? 'teacherCommentArabic' : 'teacherComment');
    if (commentEl) commentEl.value = data.teacherComment || '';
    currentData.teacherComment = data.teacherComment;

    currentData.communicationEvaluation = data.communicationEvaluation || ['','','','',''];
    const commSel = isArabic ? '#communicationTableArabic tbody select' : '#communicationTable tbody select';
    document.querySelectorAll(commSel).forEach((s,i) => s.value = currentData.communicationEvaluation[i]||'');

    if (data.unitsSem1) {
        currentData.unitsSem1 = data.unitsSem1;
        const u1 = document.getElementById(isArabic?'unitsSem1SelectorArabic':'unitsSem1Selector');
        if (u1) u1.value = data.unitsSem1;
    }
    if (data.unitsSem2) {
        currentData.unitsSem2 = data.unitsSem2;
        const u2 = document.getElementById(isArabic?'unitsSem2SelectorArabic':'unitsSem2Selector');
        if (u2) u2.value = data.unitsSem2;
    }

    currentData.criteriaValues = data.criteriaValues ? JSON.parse(JSON.stringify(data.criteriaValues)) : {A:{},B:{},C:{},D:{}};
    ['A','B','C','D'].forEach(k => {
        if (!currentData.criteriaValues[k]) currentData.criteriaValues[k] = {sem1:null,sem2:null,finalLevel:null,sem1Units:[],sem2Units:[]};
        if (!currentData.criteriaValues[k].sem1Units) currentData.criteriaValues[k].sem1Units=[];
        if (!currentData.criteriaValues[k].sem2Units) currentData.criteriaValues[k].sem2Units=[];
    });

    if (isArabic) rebuildCriteriaTableArabic(); else rebuildCriteriaTable();
    currentData.studentBirthdate = data.studentBirthdate || currentData.studentBirthdate || '';
    if (studentBirthdateInput) studentBirthdateInput.value = currentData.studentBirthdate;
    calculateTotals();
}

// =====================================================
// SUBMIT FORM
// =====================================================
async function submitForm() {
    const isArabic = currentData.subjectSelected === 'Acquisition de langue (اللغة العربية)';
    const commentEl    = document.getElementById(isArabic ? 'teacherCommentArabic' : 'teacherComment');
    const teacherNameEl = document.getElementById(isArabic ? 'teacherNameArabic' : 'teacherName');
    if (commentEl) currentData.teacherComment = commentEl.value;
    if (teacherNameEl) {
        currentData.teacherName = teacherNameEl.value.trim();
        localStorage.setItem('teacherName', currentData.teacherName);
    }

    if (!currentData.teacherName || !currentData.classSelected || !currentData.studentSelected || !currentData.subjectSelected) {
        showToast('Veuillez remplir tous les champs requis (nom enseignant, classe, élève, matière)', 'error', 4000);
        return;
    }

    const btnEl = document.getElementById(isArabic ? 'submitButtonArabic' : 'submitButton');
    const btnElOther = document.getElementById(isArabic ? 'submitButton' : 'submitButtonArabic');
    if (btnEl) { btnEl.disabled = true; btnEl.textContent = '⏳ Enregistrement...'; }
    if (btnElOther) { btnElOther.disabled = true; }

    try {
        syncFormDataFromDOM();
        handleCommunicationChange();

        const payload = { ...currentData, contributionId: currentContributionId, semester: currentSemester };
        const cleanedCv = {};
        const s1cv = currentSemester === 2 ? {} : null;

        for (const k of ['A','B','C','D']) {
            const src = payload.criteriaValues?.[k] || {};
            if (currentSemester === 1) {
                cleanedCv[k] = { sem1: src.sem1??null, sem1Units: src.sem1Units??[], sem2: null, sem2Units: [], finalLevel: src.sem1??null };
            } else {
                s1cv[k] = { sem1: src.sem1??null, sem1Units: src.sem1Units??[], sem2: null, sem2Units: [], finalLevel: src.sem1??null };
                const s1v=src.sem1??null, s2v=src.sem2??null;
                let fl=null;
                if (s1v!==null&&s2v!==null) fl=Math.round((parseFloat(s1v)+parseFloat(s2v))/2);
                else if (s2v!==null) fl=s2v; else if (s1v!==null) fl=s1v;
                cleanedCv[k] = { sem1: null, sem1Units: [], sem2: s2v, sem2Units: src.sem2Units??[], finalLevel: fl };
            }
        }
        payload.criteriaValues = cleanedCv;
        if (s1cv) payload.s1CriteriaValues = s1cv;

        const result = await apiCall('saveContribution', payload);

        if (result.success) {
            currentContributionId = result.data;
            showToast('✅ Contribution enregistrée avec succès !', 'success');

            // Mark subject card completed
            if (!completedSubjects[currentData.studentSelected]) completedSubjects[currentData.studentSelected]={};
            completedSubjects[currentData.studentSelected][currentData.subjectSelected] = true;
            document.querySelector(`.subject-card[data-subject="${CSS.escape(currentData.subjectSelected)}"]`)?.classList.add('completed');
        } else {
            throw new Error(result.error || 'Erreur inconnue');
        }
    } catch(e) {
        showToast(`Erreur: ${e.message || 'Erreur sauvegarde'}`, 'error');
    } finally {
        if (btnEl) { btnEl.disabled = false; btnEl.textContent = '✅ Soumettre / Mettre à jour'; }
        if (btnElOther) { btnElOther.disabled = false; btnElOther.textContent = '✅ إرسال / تحديث'; }
    }
}

// =====================================================
// SHOW STUDENT CONTRIBUTIONS
// =====================================================
async function showStudentData() {
    if (!currentData.studentSelected) { showToast('Sélectionnez un élève', 'warning'); return; }
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'block';
    await fetchStudentContributions(currentData.studentSelected);
}

async function fetchStudentContributions(student) {
    if (!student) return;
    try {
        const resp = await apiCall('fetchStudentContributions', {
            studentSelected: student,
            classSelected: currentData.classSelected,
            sectionSelected: currentData.sectionSelected,
            semester: currentSemester
        });
        const contribs = resp?.contributions || [];
        dataContainer.innerHTML = '<h3 style="margin:0 0 14px;font-size:1em;color:var(--gray-700);">📋 Contributions enregistrées</h3>';
        if (contribs.length > 0) {
            contribs.sort((a,b)=>(a.subjectSelected||'').localeCompare(b.subjectSelected||''));
            contribs.forEach(c => dataContainer.appendChild(createContributionElement(c)));
        } else {
            dataContainer.innerHTML += '<p style="color:var(--gray-500);text-align:center;padding:20px;">Aucune contribution trouvée.</p>';
        }
        dataContainer.style.display = 'block';
    } catch(e) {
        showToast('Erreur chargement contributions', 'error');
    }
}

function createContributionElement(c) {
    const div = document.createElement('div');
    div.className = 'contribution';
    const color = getSubjectColor(c.subjectSelected);
    const icon  = subjectIcons[c.subjectSelected] || '📖';
    div.innerHTML = `
        <div class="contribution-header" style="background:${color};">
            <h3>${icon} ${c.subjectSelected||'N/A'}</h3>
            <div class="contribution-buttons">
                <button onclick="toggleContributionDetails(this)" data-contribution-id="${c._id}">Afficher</button>
                <button onclick="editContribution('${c._id}')">Modifier</button>
                <button onclick="deleteContribution('${c._id}')">Supprimer</button>
            </div>
        </div>
        <div class="contribution-content" id="content-${c._id}" style="display:none;">Chargement...</div>
    `;
    return div;
}

async function toggleContributionDetails(btn) {
    const id      = btn.getAttribute('data-contribution-id');
    const content = document.getElementById(`content-${id}`);
    if (!content) return;
    const hidden = content.style.display === 'none';
    content.style.display = hidden ? 'block' : 'none';
    btn.textContent = hidden ? 'Masquer' : 'Afficher';
    if (hidden && content.innerHTML === 'Chargement...') {
        try {
            const data = await apiCall('fetchContribution', { contributionId: id });
            if (data) renderContributionDetails(content, data);
            else content.innerHTML = '<p>Erreur chargement.</p>';
        } catch(e) { content.innerHTML = '<p>Erreur chargement.</p>'; }
    }
}

function renderContributionDetails(el, data) {
    const commHTML = createCommunicationTableHTML(data.communicationEvaluation);
    const critHTML = createCriteriaTableHTML(data.criteriaValues, data.subjectSelected);
    el.innerHTML = `
        <p><strong>Enseignant :</strong> ${data.teacherName||'-'}</p>
        <h4 style="margin:10px 0 6px;font-size:.9em;">Compétences ATL</h4>${commHTML}
        <h4 style="margin:10px 0 6px;font-size:.9em;">Critères</h4>${critHTML}
        <h4 style="margin:10px 0 6px;font-size:.9em;">Commentaires</h4>
        <p style="font-size:.88em;">${data.teacherComment||'-'}</p>
        <p><small style="color:var(--gray-500);">Dernière modification : ${new Date(data.timestamp||Date.now()).toLocaleString('fr-FR')}</small></p>
    `;
}

function createCommunicationTableHTML(evals=[]) {
    return `<table class="details-table"><thead><tr><th>Comm</th><th>Collab</th><th>Auto</th><th>Rech</th><th>Réfl</th></tr></thead>
    <tbody><tr>${[0,1,2,3,4].map(i=>`<td>${evals[i]||'-'}</td>`).join('')}</tr></tbody></table>`;
}

function createCriteriaTableHTML(criteria={}, subject) {
    const labels = criteriaBySubject[subject] || {};
    const isDP = currentData.classSelected === 'DP1' || currentData.classSelected === 'DP2';
    let total=0;
    const rows = ['A','B','C','D'].map(k=>{
        const c=criteria[k]||{};
        const f=c.finalLevel??'-';
        if(f!=='-'&&!isNaN(f)) total+=parseFloat(f);
        return `<tr><td style="text-align:left;font-size:.8em;">${labels[k]||`Crit. ${k}`}</td><td>${c.sem1??'-'}</td><td>${c.sem2??'-'}</td><td><strong>${f}</strong></td></tr>`;
    }).join('');
    const maxN=isDP?7:8, maxT=isDP?28:32;
    const note=total>0?Math.max(1,Math.min(maxN,Math.round(total/4))):0;
    return `<table class="details-table"><thead><tr><th>Critère</th><th>S1</th><th>S2</th><th>Final</th></tr></thead>
    <tbody>${rows}</tbody><tfoot><tr><td colspan="3">Seuil /${maxT}:</td><td><strong>${total}</strong></td></tr>
    <tr><td colspan="3">Note /${maxN}:</td><td><strong>${note}</strong></td></tr></tfoot></table>`;
}

// =====================================================
// EDIT / DELETE CONTRIBUTION
// =====================================================
async function editContribution(id) {
    try {
        const data = await apiCall('fetchContribution', { contributionId: id });
        if (!data) { showToast('Contribution introuvable', 'error'); return; }
        contributionEntrySections.style.display = 'block';
        dataContainer.style.display = 'none';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        currentContributionId = id;
        currentData.subjectSelected = data.subjectSelected;
        const isArabic = data.subjectSelected === 'Acquisition de langue (اللغة العربية)';
        document.querySelectorAll('.french-section').forEach(s=>s.style.display=isArabic?'none':'block');
        document.querySelectorAll('.arabic-section').forEach(s=>s.style.display=isArabic?'block':'none');
        fillFormWithData(data);
        const photoEl = document.getElementById('studentPhotoPreview');
        const photoUrl = studentData[data.studentSelected]?.photo||null;
        currentData.studentPhoto = photoUrl;
        if (photoUrl && photoEl) { photoEl.src=photoUrl; photoEl.style.display='block'; }
        if (currentSemester === 2) applySemester2Mode();
    } catch(e) {
        showToast('Erreur lors de l\'édition', 'error');
    }
}

async function deleteContribution(id) {
    if (!confirm(`Supprimer cette contribution ? Cette action est irréversible.`)) return;
    try {
        const result = await apiCall('deleteContribution', { contributionId: id });
        if (result.success) {
            showToast('Contribution supprimée', 'success');
            fetchStudentContributions(currentData.studentSelected);
            if (currentContributionId === id) resetOnSubjectChange();
        } else throw new Error(result.error||'Erreur suppression');
    } catch(e) { showToast(`Erreur: ${e.message}`, 'error'); }
}

// =====================================================
// GENERATE WORD
// =====================================================
async function generateAllWordsInSection() {
    const { sectionSelected, classSelected } = currentData;
    if (!sectionSelected || !classSelected) {
        showToast('Sélectionnez d\'abord une section et une classe', 'warning'); return;
    }
    const list = studentsByClassAndSection[sectionSelected]?.[classSelected] || [];
    if (!list.length) { showToast(`Aucun élève pour ${classSelected}`, 'warning'); return; }
    if (!confirm(`Générer ${list.length} livret(s) Word pour ${classSelected} ?\n(${list.length} téléchargements séparés)`)) return;

    progressBarContainer.style.display = 'block';
    document.getElementById('generateWordButton').disabled = true;
    let ok=0, err=0;
    for (let i=0; i<list.length; i++) {
        const name = list[i];
        const pct  = Math.round((i/list.length)*100);
        progressText.textContent = `${name} (${i+1}/${list.length}) — ${pct}%`;
        progressBar.style.width  = pct+'%';
        try {
            await downloadWordDocument({
                studentSelected: name,
                classSelected, sectionSelected,
                studentPhotoUrl: studentData[name]?.photo||null,
                semester: currentSemester
            });
            ok++;
        } catch(e) {
            showToast(`Erreur Word pour ${name}: ${e.message}`, 'error');
            err++;
        }
        if (i < list.length-1) await new Promise(r=>setTimeout(r,1000));
    }
    progressBar.style.width = '100%';
    progressText.textContent = `Terminé — ${ok} succès, ${err} erreur(s)`;
    setTimeout(()=>{ progressBarContainer.style.display='none'; progressBar.style.width='0'; }, 3500);
    document.getElementById('generateWordButton').disabled = false;
    showToast(`Génération terminée: ${ok} livrets créés`, ok>0?'success':'warning');
}

function generateExcel() {
    showToast('Export Excel en cours d\'implémentation', 'info');
}

// =====================================================
// NAVIGATION BACK FUNCTIONS
// =====================================================
function goToHome() {
    resetOnSectionChange();
    ['step0','step0b','step1','step2','step3'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = id==='step0' ? 'block' : 'none';
    });
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'none';
    studentInfoContainer.style.display = 'none';
    currentSemester = 1;
    updateSemesterUI();
    // Reset semester button styles
    const s1=document.getElementById('sem1Btn'), s2=document.getElementById('sem2Btn');
    if(s1){s1.style.opacity='1';s1.style.boxShadow='none';}
    if(s2){s2.style.opacity='1';s2.style.boxShadow='none';}
    const badge=document.getElementById('semesterBadge'); if(badge) badge.style.display='none';
}

function goBackToSemester() {
    document.getElementById('step0b').style.display = 'none';
    document.getElementById('step0').style.display  = 'block';
    const s1=document.getElementById('sem1Btn'), s2=document.getElementById('sem2Btn');
    if(s1){s1.style.opacity='1';s1.style.boxShadow='none';}
    if(s2){s2.style.opacity='1';s2.style.boxShadow='none';}
}

function goBackToSection() {
    document.getElementById('step1').style.display  = 'none';
    document.getElementById('step3').style.display  = 'none';
    document.getElementById('step0').style.display  = 'block';
    document.getElementById('step0b').style.display = 'block';
    studentInfoContainer.style.display = 'none';
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'none';
    currentData.classSelected = null;
    currentData.studentSelected = null;
    currentData.subjectSelected = null;
    resetFormData();
}

function goBackToClass() {
    document.getElementById('step3').style.display  = 'none';
    document.getElementById('step1').style.display  = 'block';
    studentInfoContainer.style.display = 'none';
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'none';
    currentData.studentSelected = null;
    currentData.subjectSelected = null;
    resetFormData();
}

function goBackToStudent() {
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'none';
    document.getElementById('step2').style.display = 'none';
    studentInfoContainer.style.display = 'none';
    document.getElementById('step3').style.display = 'block';
    currentData.subjectSelected = null;
    resetFormData();
}

// =====================================================
// RESET FUNCTIONS
// =====================================================
function resetOnSectionChange() {
    document.getElementById('step3').style.display = 'none';
    studentInfoContainer.style.display = 'none';
    contributionEntrySections.style.display = 'none';
    dataContainer.style.display = 'none';
    const classGrid = document.getElementById('classGrid'); if(classGrid) classGrid.innerHTML='';
    const studentGrid = document.getElementById('studentGrid'); if(studentGrid) studentGrid.innerHTML='';
    currentData.classSelected = null;
    currentData.studentSelected = null;
    currentData.subjectSelected = null;
    resetFormData();
}

function resetOnClassChange() {
    document.getElementById('step3').style.display = 'none';
    resetOnStudentChange();
}

function resetOnStudentChange() {
    _isPopulatingSubjects = false;
    if (subjectsGrid) subjectsGrid.innerHTML = '';
    document.getElementById('step2').style.display = 'none';
    studentInfoContainer.style.display = 'none';
    currentData.studentSelected = null;
    resetOnSubjectChange();
    dataContainer.style.display = 'none';
}

function resetOnSubjectChange() {
    contributionEntrySections.style.display = 'none';
    resetFormData();
}

function resetFormData() {
    resetInputTables();
    currentData.teacherComment = null;
    currentData.communicationEvaluation = ['','','','',''];
    currentData.unitsSem1 = 1;
    currentData.unitsSem2 = 1;
    ['unitsSem1Selector','unitsSem2Selector','unitsSem1SelectorArabic','unitsSem2SelectorArabic'].forEach(id => {
        const el = document.getElementById(id); if(el) el.value='1';
    });
    currentData.criteriaValues = {
        A:{sem1:null,sem2:null,finalLevel:null,sem1Units:[],sem2Units:[]},
        B:{sem1:null,sem2:null,finalLevel:null,sem1Units:[],sem2Units:[]},
        C:{sem1:null,sem2:null,finalLevel:null,sem1Units:[],sem2Units:[]},
        D:{sem1:null,sem2:null,finalLevel:null,sem1Units:[],sem2Units:[]}
    };
    currentContributionId = null;
    hideSemester2Banners();
}

function resetInputTables() {
    document.querySelectorAll('#communicationTable tbody select, #communicationTableArabic tbody select').forEach(s=>s.value='');
    document.querySelectorAll('#criteriaTableBody input, #criteriaTableBodyArabic input').forEach(i=>{
        i.readOnly=false; i.style.backgroundColor=''; i.style.cursor=''; i.removeAttribute('title'); i.value='';
    });
    ['threshold','finalNote','thresholdArabic','finalNoteArabic'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.value='';
    });
    ['teacherComment','teacherCommentArabic'].forEach(id=>{
        const el=document.getElementById(id); if(el) el.value='';
    });
}

// =====================================================
// UTILITIES
// =====================================================
function getSubjectColor(subject) {
    const colors = {
        "Mathématiques":                      "#16a34a",
        "Individus et sociétés":              "#7c3aed",
        "Langue et littérature":              "#2563eb",
        "Design":                             "#6610f2",
        "Sciences":                           "#b45309",
        "Art visuel":                         "#dc2626",
        "Éducation physique et à la santé":   "#0891b2",
        "Éducation physique et sportive":     "#0891b2",
        "Acquisition de langue (Anglais)":    "#374151",
        "Acquisition de langue (اللغة العربية)": "#92400e"
    };
    return colors[subject] || "#475569";
}

// =====================================================
// PROGRESS PANEL (Suivi)
// =====================================================
function initProgressPanel() {
    const sectionSel = document.getElementById('progressSection');
    if (!sectionSel) return;
    sectionSel.addEventListener('change', () => {
        const section  = sectionSel.value;
        const classSel = document.getElementById('progressClass');
        classSel.innerHTML = '<option value="">— Classe —</option>';
        (availableClassesBySection[section]||[]).forEach(c => {
            const o=document.createElement('option'); o.value=c; o.textContent=c;
            classSel.appendChild(o);
        });
        document.getElementById('progressContent').innerHTML =
            '<p style="color:var(--gray-500);text-align:center;margin-top:30px;">Sélectionnez une classe.</p>';
    });
}

function toggleProgressPanel() {
    const panel   = document.getElementById('progressPanel');
    const overlay = document.getElementById('progressOverlay');
    if (!panel) return;
    const open = panel.style.display !== 'none';
    panel.style.display   = open ? 'none' : 'block';
    overlay.style.display = open ? 'none' : 'block';
    if (!open) {
        // Auto-fill from current selection
        const secEl = document.getElementById('progressSection');
        const clsEl = document.getElementById('progressClass');
        if (currentData.sectionSelected && secEl) {
            secEl.value = currentData.sectionSelected;
            clsEl.innerHTML = '<option value="">— Classe —</option>';
            (availableClassesBySection[currentData.sectionSelected]||[]).forEach(c=>{
                const o=document.createElement('option'); o.value=c; o.textContent=c;
                clsEl.appendChild(o);
            });
            if (currentData.classSelected) {
                clsEl.value = currentData.classSelected;
                loadProgressPanel();
            }
        }
    }
}

async function loadProgressPanel() {
    const section = document.getElementById('progressSection')?.value;
    const classe  = document.getElementById('progressClass')?.value;
    const content = document.getElementById('progressContent');
    if (!section || !classe || !content) return;
    content.innerHTML = '<p style="text-align:center;color:var(--gray-500);padding:30px;">⏳ Chargement...</p>';
    try {
        const resp = await fetch('/api/studentProgress', {
            method:'POST',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ classSelected: classe, sectionSelected: section })
        });
        const data = await resp.json();
        if (!data.students) { content.innerHTML='<p style="color:red;">Erreur de chargement.</p>'; return; }
        const totalSubjects = data.expectedSubjects?.length || 9;
        let html = '';
        data.students.forEach(student => {
            const pctS1 = Math.round((student.s1Done/totalSubjects)*100);
            const pctS2 = Math.round((student.s2Done/totalSubjects)*100);
            const allDone = student.s1Done===totalSubjects && student.s2Done===totalSubjects;
            const borderColor = allDone ? '#16a34a' : (student.s1Done<totalSubjects||student.s2Done<totalSubjects) ? '#f59e0b' : '#e5e7eb';

            html += `<div class="progress-student-card" style="border-color:${borderColor};">`;
            html += `<div class="progress-student-header ${allDone?'done':''}">
                <strong>${studentData[student.studentName]?.fullName||student.studentName}</strong>
                <span class="counts">S1: ${student.s1Done}/${totalSubjects} · S2: ${student.s2Done}/${totalSubjects}</span>
            </div>`;
            html += `<div class="progress-bars">
                <div class="progress-bar-row">
                    <span class="sem-label" style="color:#2563eb;">S1</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pctS1}%;background:#2563eb;"></div></div>
                    <span class="pct-label">${pctS1}%</span>
                </div>
                <div class="progress-bar-row">
                    <span class="sem-label" style="color:#16a34a;">S2</span>
                    <div class="bar-track"><div class="bar-fill" style="width:${pctS2}%;background:#16a34a;"></div></div>
                    <span class="pct-label">${pctS2}%</span>
                </div>
            </div>`;

            // Subject detail rows — only non-complete
            const incompleteRows = student.subjectStatus.filter(ss => !(ss.s1.done&&ss.s1.hasNotes&&ss.s2.done&&ss.s2.hasNotes));
            if (incompleteRows.length > 0) {
                html += `<div class="progress-subjects-list">`;
                incompleteRows.forEach(ss => {
                    const s1ok = ss.s1.done && ss.s1.hasNotes;
                    const s2ok = ss.s2.done && ss.s2.hasNotes;
                    const icon = (!ss.s1.done && !ss.s2.done) ? '❌' : (s1ok&&!s2ok) ? '🟡' : (!s1ok&&s2ok) ? '🟠' : '⚠️';
                    const s1txt = ss.s1.done ? (ss.s1.hasNotes?'✅':'⚠️ notes') : '—';
                    const s2txt = ss.s2.done ? (ss.s2.hasNotes?'✅':'⚠️ notes') : '—';
                    // Build navigation data — stored as escaped JSON string attribute
                    const navObj = JSON.stringify({
                        student: student.studentName,
                        subject: ss.subject,
                        section, classe,
                        semester: ss.s1.done && !ss.s2.done ? 2 : 1
                    });
                    const navData = navObj.replace(/'/g, "\\'").replace(/"/g, '&quot;');
                    html += `<div class="progress-subject-row" onclick="navigateToContribution(decodeNavData(this))" data-nav="${navData}" title="Aller à la contribution">
                        <span class="sub-name">${icon} ${ss.subject}</span>
                        <span class="sub-status">S1: ${s1txt} &nbsp; S2: ${s2txt}</span>
                        <span class="nav-arrow">→</span>
                    </div>`;
                });
                html += `</div>`;
            }

            html += `</div>`;
        });
        content.innerHTML = html || '<p style="color:#16a34a;text-align:center;padding:20px;">✅ Tout est complet !</p>';
    } catch(e) {
        content.innerHTML = `<p style="color:red;">Erreur: ${e.message}</p>`;
    }
}

// =====================================================
// DIRECT NAVIGATION FROM PROGRESS PANEL
// Feature 4: clicking a subject row navigates directly
// =====================================================
function decodeNavData(el) {
    try { return JSON.parse(el.getAttribute('data-nav').replace(/&quot;/g, '"')); }
    catch(e) { return null; }
}

async function navigateToContribution(navDataStr) {
    let nav;
    try {
        if (!navDataStr) return;
        nav = typeof navDataStr === 'string' ? JSON.parse(navDataStr) : navDataStr;
    }
    catch(e) { return; }

    const { student, subject, section, classe, semester } = nav;
    // Close panel
    toggleProgressPanel();
    // Show loading toast
    showToast(`Chargement de ${studentData[student]?.fullName||student} — ${subject}`, 'info', 2500);

    // Set state
    currentSemester = semester || 1;
    updateSemesterUI();
    currentData.sectionSelected = section;
    currentData.classSelected   = classe;
    currentData.studentSelected = student;
    currentData.subjectSelected = null;

    // Show section step
    document.getElementById('step0').style.display  = 'none';
    document.getElementById('step0b').style.display = 'none';

    // Build class grid
    populateClassGrid(section);
    document.getElementById('step1').style.display = 'block';
    // Highlight class
    document.querySelectorAll('.class-card').forEach(c => c.classList.toggle('selected', c.dataset.class===classe));

    // Build student grid
    populateStudentGrid();
    document.getElementById('step3').style.display = 'block';
    // Highlight student
    document.querySelectorAll('.student-card').forEach(c => c.classList.toggle('selected', c.dataset.student===student));

    // Show student info
    await showStudentInfo();

    // Load subjects
    await populateSubjects();

    // Click the subject card
    await handleSubjectChange(subject);
    // Highlight subject card
    document.querySelectorAll('.subject-card').forEach(c => c.classList.toggle('selected', c.dataset.subject===subject));

    // Scroll to form
    setTimeout(() => {
        contributionEntrySections.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 200);
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Livret IB v3.0 — Nouvelle interface, critères corrigés, navigation directe');
    if (currentData.teacherName && teacherNameInput) teacherNameInput.value = currentData.teacherName;
    updateSemesterUI();
    initProgressPanel();
    console.log('✅ Application prête.');
});

// =====================================================
// WINDOW EXPORTS
// =====================================================
window.toggleProgressPanel    = toggleProgressPanel;
window.loadProgressPanel      = loadProgressPanel;
window.navigateToContribution = navigateToContribution;
window.decodeNavData          = decodeNavData;
