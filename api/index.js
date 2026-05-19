// --- Dépendances ---
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');

// Configuration dotenv - TOUJOURS charger pour compatibilité locale et Vercel
try {
    require('dotenv').config({ path: ['.env.local', '.env.production', '.env'] });
} catch (err) {
    console.log('ℹ️ No dotenv file found (using system environment variables)');
}

const fs = require('fs');
const path = require('path');
const PizZip = require("pizzip");
const DocxTemplater = require("docxtemplater");
const ImageModule = require('docxtemplater-image-module-free');
const fetch = require('node-fetch');
const archiver = require('archiver');
const sharp = require('sharp');
// const XLSX = require('xlsx'); // Temporairement désactivé pour éviter les vulnérabilités

// --- Configuration ---
const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Logging middleware pour débugger
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.path} - ${new Date().toISOString()}`);
    next();
});

// Servir les fichiers statiques AVANT les routes API
app.use(express.static(path.join(__dirname, '../public')));

// Security: hide Express signature
app.disable('x-powered-by');

// Vérification et configuration des variables d'environnement
console.log('🔧 ===== ENVIRONMENT DIAGNOSTICS =====');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('VERCEL:', process.env.VERCEL ? 'true' : 'false');
console.log('VERCEL_ENV:', process.env.VERCEL_ENV || 'N/A');
console.log('MONGODB_URI defined:', !!process.env.MONGODB_URI);
console.log('MONGODB_URI length:', process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0);
console.log('DB_NAME:', process.env.DB_NAME || 'teacherContributionsDB');
console.log('TEMPLATE_URL defined:', !!process.env.TEMPLATE_URL);
console.log('TEMPLATE_URL:', process.env.TEMPLATE_URL ? process.env.TEMPLATE_URL.substring(0, 50) + '...' : 'Not set');
console.log('TEMPLATE_URL_DP defined:', !!process.env.TEMPLATE_URL_DP);
console.log('TEMPLATE_URL_DP:', process.env.TEMPLATE_URL_DP ? process.env.TEMPLATE_URL_DP.substring(0, 50) + '...' : 'Not set');
console.log('TEMPLATE_URL_S2 defined:', !!process.env.TEMPLATE_URL_S2);
console.log('TEMPLATE_URL_S2:', process.env.TEMPLATE_URL_S2 ? process.env.TEMPLATE_URL_S2.substring(0, 50) + '...' : 'Not set (hardcoded S2 URL will be used)');
console.log('All env vars containing MONGO or DB:', 
    Object.keys(process.env).filter(k => k.toLowerCase().includes('mongo') || k.toLowerCase().includes('db_'))
);
console.log('=====================================');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;
const dbName = process.env.DB_NAME || 'teacherContributionsDB';

// Validation critique des variables d'environnement
if (!MONGODB_URI) {
    console.error('❌ CRITICAL: MONGODB_URI environment variable is MISSING!');
    console.error('📋 URGENT: Configure environment variables in Vercel Dashboard:');
    console.error('   1. Go to: https://vercel.com/dashboard');
    console.error('   2. Select your project: livret-ib2026');
    console.error('   3. Navigate to: Settings > Environment Variables');
    console.error('   4. Add variable: MONGODB_URI');
    console.error('   5. Add variable: DB_NAME = teacherContributionsDB');
    console.error('   6. Check all environments: Production, Preview, Development');
    console.error('   7. Save and Redeploy');
    console.error('');
    console.error('Current environment variables available:', Object.keys(process.env).slice(0, 20).join(', '));
} else {
    console.log('✅ MONGODB_URI is defined and available');
}
const contributionsCollectionName = 'contributions';
const studentsCollectionName = 'students';
const PUBLIC_DIR = path.join(__dirname, '../public');

let contributionsCollection;
let studentsCollection;
let isDbConnected = false;

// --- Structure Données (Référence pour les critères) ---
const criteriaBySubject = {
    // Matières PEI (PEI1-PEI5) et DP (DP1-DP2) - CRITÈRES IDENTIQUES A-D
    // ── Matières principales PEI / DP ──────────────────────────────────────────
    "Mathématiques":{
        A:"Connaissances et compréhension",
        B:"Recherche de modèles",
        C:"Communication",
        D:"Application des mathématiques dans des contextes de la vie réelle"
    },
    "Individus et sociétés":{
        A:"Connaissances et compréhension",
        B:"Recherche",
        C:"Communication",
        D:"Pensée critique"
    },
    "Langue et littérature":{
        A:"Analyse",
        B:"Organisation",
        C:"Production de texte",
        D:"Utilisation de la langue"
    },
    "Design":{
        A:"Recherche et analyse",
        B:"Développement des idées",
        C:"Création de la solution",
        D:"Évaluation"
    },
    "Sciences":{
        A:"Connaissances et compréhension",
        B:"Recherche et élaboration",
        C:"Traitement et évaluation",
        D:"Réflexion sur les répercussions de la science"
    },
    "Art visuel":{
        A:"Recherche",
        B:"Développement",
        C:"Création ou exécution",
        D:"Évaluation"
    },
    "Arts":{
        A:"Recherche",
        B:"Développement",
        C:"Création ou exécution",
        D:"Évaluation"
    },
    "Éducation physique et à la santé":{
        A:"Connaissances et compréhension",
        B:"Planification de la performance",
        C:"Application et exécution",
        D:"Réflexion et amélioration de la performance"
    },
    "Acquisition de langue (Anglais)":{
        A:"Listening Comprehension",
        B:"Reading Comprehension",
        C:"Speaking",
        D:"Writing"
    },
    "Acquisition de langue (اللغة العربية)":{
        A:"الاستماع",
        B:"القراءة",
        C:"التحدث",
        D:"الكتابة"
    },
    // ── Alias / rétrocompatibilité ─────────────────────────────────────────────
    "Éducation physique et sportive":{
        A:"Connaissances et compréhension",
        B:"Planification de la performance",
        C:"Application et exécution",
        D:"Réflexion et amélioration de la performance"
    },
    "Acquisition de langues (Anglais)":{A:"Listening Comprehension",B:"Reading Comprehension",C:"Speaking",D:"Writing"},
    "Langue et littérature (Français)":{A:"Analyse",B:"Organisation",C:"Production de texte",D:"Utilisation de la langue"},
    "Langues et littérature":{A:"Analyse",B:"Organisation",C:"Production de texte",D:"Utilisation de la langue"},
    "Biologie":{A:"Connaissances et compréhension",B:"Recherche et élaboration",C:"Traitement et évaluation",D:"Réflexion sur les répercussions de la science"},
    "Physique-Chimie":{A:"Connaissances et compréhension",B:"Recherche et élaboration",C:"Traitement et évaluation",D:"Réflexion sur les répercussions de la science"},
    "Langue Anglaise":{A:"Listening Comprehension",B:"Reading Comprehension",C:"Speaking",D:"Writing"},
    "Musique":{A:"Recherche",B:"Développement",C:"Création ou exécution",D:"Évaluation"},
    "ART":{A:"Recherche",B:"Développement",C:"Création ou exécution",D:"Évaluation"},
    "Éducation Physique":{A:"Connaissances et compréhension",B:"Planification de la performance",C:"Application et exécution",D:"Réflexion et amélioration de la performance"},
    "L.L":{A:"Analyse",B:"Organisation",C:"Production de texte",D:"Utilisation de la langue"},
    "I.S":{A:"Connaissances et compréhension",B:"Recherche",C:"Communication",D:"Pensée critique"},
    "E.S":{A:"Connaissances et compréhension",B:"Recherche et élaboration",C:"Traitement et évaluation",D:"Réflexion sur les répercussions de la science"}
};

// --- Connexion Base de Données ---
// IMPORTANT: Vercel serverless - cache client dans la portée du module (global)
// pour réutiliser la connexion entre les invocations à chaud (warm starts)
let mongoClient = global._mongoClient || null;
let connectionAttempts = 0;
const MAX_CONNECTION_ATTEMPTS = 3;
const CONNECTION_RETRY_DELAY = 1000; // 1 seconde (réduit pour serverless)
// Promise de connexion en cours pour éviter les connexions parallèles
let _connectingPromise = null;

async function connectToMongo(retryCount = 0) {
    if (!MONGODB_URI) {
        console.error("❌ FATAL ERROR: MONGODB_URI is not defined!");
        console.error("📋 Please set MONGODB_URI in Vercel Environment Variables.");
        return false;
    }

    // Si une connexion est déjà en cours, attendre qu'elle se termine
    if (_connectingPromise) {
        console.log('⏳ Connection already in progress, waiting...');
        return _connectingPromise;
    }

    _connectingPromise = _doConnect(retryCount);
    const result = await _connectingPromise;
    _connectingPromise = null;
    return result;
}

async function _doConnect(retryCount = 0) {
    connectionAttempts++;
    console.log(`🔄 MongoDB connection attempt ${connectionAttempts}...`);

    try {
        // Configuration optimisée pour Vercel serverless + MongoDB Atlas
        const clientOptions = {
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 8000,
            maxPoolSize: 5,       // Réduit pour serverless
            minPoolSize: 0,       // 0 pour serverless (pas de connexions persistantes idle)
            maxIdleTimeMS: 30000, // Fermer les connexions idle après 30s
            retryWrites: true,
            retryReads: true,
            w: 'majority'
        };

        // Réutiliser le client global si déjà connecté (warm start)
        if (global._mongoClient) {
            try {
                await global._mongoClient.db('admin').command({ ping: 1 });
                console.log('✅ Réutilisation de la connexion MongoDB existante (warm start)');
                mongoClient = global._mongoClient;
                const db = mongoClient.db(dbName);
                contributionsCollection = db.collection(contributionsCollectionName);
                studentsCollection = db.collection(studentsCollectionName);
                isDbConnected = true;
                connectionAttempts = 0;
                return true;
            } catch (pingErr) {
                console.log('⚠️ Connexion existante invalide, reconnexion...');
                try { await global._mongoClient.close(); } catch(e) {}
                global._mongoClient = null;
            }
        }

        mongoClient = new MongoClient(MONGODB_URI, clientOptions);
        console.log('🔌 Connecting to MongoDB Atlas...');
        await mongoClient.connect();

        // Ping pour valider la connexion
        await mongoClient.db('admin').command({ ping: 1 });
        console.log('✅ MongoDB connected and ping OK');

        // Stocker dans le global pour réutilisation (serverless warm start)
        global._mongoClient = mongoClient;

        const db = mongoClient.db(dbName);
        contributionsCollection = db.collection(contributionsCollectionName);
        studentsCollection = db.collection(studentsCollectionName);
        isDbConnected = true;

        // Créer les index (ne bloque pas la réponse)
        _setupIndexes().catch(err => console.warn('⚠️ Index setup error (non-fatal):', err.message));

        connectionAttempts = 0;
        return true;

    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        isDbConnected = false;
        global._mongoClient = null;

        if (retryCount < MAX_CONNECTION_ATTEMPTS - 1) {
            console.log(`⏳ Retry in ${CONNECTION_RETRY_DELAY/1000}s...`);
            await new Promise(resolve => setTimeout(resolve, CONNECTION_RETRY_DELAY));
            return _doConnect(retryCount + 1);
        }
        console.error(`❌ Failed after ${MAX_CONNECTION_ATTEMPTS} attempts. Check MONGODB_URI and Atlas Network Access (0.0.0.0/0).`);
        return false;
    }
}

async function _setupIndexes() {
    try {
        const idx = await contributionsCollection.indexes();
        const legacy = idx.find(i => i.unique && i.key && i.key.studentSelected === 1 && i.key.subjectSelected === 1 && Object.keys(i.key).length === 2);
        if (legacy) {
            try { await contributionsCollection.dropIndex(legacy.name); } catch(e) {}
        }
        try { await contributionsCollection.dropIndex('uniq_student_subject_class_section'); } catch(e) {}
        await contributionsCollection.createIndex(
            { studentSelected: 1, subjectSelected: 1, classSelected: 1, sectionSelected: 1, semester: 1 },
            { unique: true, name: 'uniq_student_subject_class_section_semester' }
        );
        await studentsCollection.createIndex({ studentSelected: 1 }, { unique: true });
        console.log('✅ Database indexes OK');
    } catch (e) {
        console.log('ℹ️ Indexes already exist or error (OK):', e.message);
    }
}

// Reconnection handler (non-serverless uniquement)
function setupMongoReconnection() {
    if (mongoClient && !process.env.VERCEL) {
        mongoClient.on('close', () => {
            console.log('⚠️ MongoDB connection closed');
            isDbConnected = false;
            global._mongoClient = null;
            setTimeout(() => connectToMongo(), 5000);
        });
        mongoClient.on('error', (error) => {
            console.error('❌ MongoDB client error:', error.message);
            isDbConnected = false;
        });
    }
}

// --- Helper Functions ---
function calculateFinalNote(totalLevel, maxNote = 8) {
    if (totalLevel <= 0 || isNaN(totalLevel)) return "1";
    let note = Math.round(totalLevel / 4);
    if (note < 1) note = 1;
    if (note > maxNote) note = maxNote;
    return note.toString();
}

async function fetchImage(url) {
    try {
        // Convertir les URLs Google Drive au format téléchargeable direct
        const downloadUrl = toGoogleDriveDirectUrl(url);
        if (downloadUrl !== url) {
            console.log(`📷 URL Google Drive convertie: ${downloadUrl.substring(0, 80)}`);
        }
        
        console.log(`📷 Fetching image: ${downloadUrl.substring(0, 60)}...`);
        
        // Timeout de 10 secondes pour les images Google Drive (peuvent être lentes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        // Ajouter des headers pour forcer le téléchargement
        const response = await fetch(downloadUrl, { 
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            },
            redirect: 'follow'
        });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            console.warn(`⚠️ Image fetch failed: ${response.status} ${response.statusText}`);
            return null;
        }
        
        const originalBuffer = Buffer.from(await response.arrayBuffer());
        console.log(`✅ Image fetched: ${originalBuffer.length} bytes`);
        
        // Vérifier que c'est bien une image (magic bytes)
        const isPNG = originalBuffer[0] === 0x89 && originalBuffer[1] === 0x50;
        const isJPG = originalBuffer[0] === 0xFF && originalBuffer[1] === 0xD8;
        const isWebP = originalBuffer[8] === 0x57 && originalBuffer[9] === 0x45 && originalBuffer[10] === 0x42 && originalBuffer[11] === 0x50;
        
        if (!isPNG && !isJPG && !isWebP) {
            console.warn(`⚠️ Format d'image invalide (premiers bytes: ${originalBuffer.slice(0, 4).toString('hex')})`);
            return null;
        }
        
        console.log(`📐 Redimensionnement de l'image pour le livret Word...`);
        
        // Photo portrait : 150×190 px, fond blanc (élimine transparence PNG → fond noir)
        // Qualité JPEG élevée pour une bonne netteté dans le document Word
        const resizedBuffer = await sharp(originalBuffer)
            .resize(150, 190, {
                fit: 'contain',      // contient l'image sans recadrage brutal
                position: 'center',
                background: { r: 255, g: 255, b: 255, alpha: 1 } // fond blanc
            })
            .flatten({ background: { r: 255, g: 255, b: 255 } }) // aplatit la transparence
            .jpeg({ 
                quality: 92          // haute qualité, netteté préservée
            })
            .toBuffer();
        
        console.log(`✅ Image redimensionnée: ${originalBuffer.length} → ${resizedBuffer.length} bytes (150×190px, JPEG 92%)`);
        
        // Si le fichier dépasse 150 KB, recompresser légèrement (cas rare)
        const MAX_IMAGE_SIZE = 150 * 1024;
        if (resizedBuffer.length > MAX_IMAGE_SIZE) {
            console.log(`⚠️ Image encore trop grande (${resizedBuffer.length} bytes), légère recompression...`);
            const finalBuffer = await sharp(originalBuffer)
                .resize(150, 190, { fit: 'contain', position: 'center', background: { r: 255, g: 255, b: 255, alpha: 1 } })
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: 80 })
                .toBuffer();
            console.log(`✅ Image recompressée: ${resizedBuffer.length} → ${finalBuffer.length} bytes (JPEG 80%)`);
            return finalBuffer;
        }
        
        return resizedBuffer;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.error(`⏱️ Image fetch timeout après 5s`);
        } else {
            console.error(`❌ Error fetching/processing image:`, error.message);
        }
        return null;
    }
}

// Table de mapping: Prénom (DB) → Nom complet (affichage/Word)
const studentNameMapping = {
    // PEI 1
    'Faysal': 'Faysal Achar',
    'Bilal': 'Bilal Molina',
    'Jad': 'Jad Mahayni',
    'Manaf': 'Manaf Kotbi',
    // PEI 2
    'Ahmed': 'Ahmed Bouaziz',
    'Ali': 'Ali Kutbi',
    'Eyad': 'Eyad Hassan',
    'Yasser': 'Yasser Younes',
    // PEI 3
    'Adam': 'Adam Kaaki',
    'Ahmad': 'Ahmad Mahayni',
    'Seifeddine': 'Seifeddine Ayadi',
    'Wajih': 'Wajih Sabadine',
    // PEI 4
    'Abdulrahman': 'Abdulrahman Bouaziz',
    'Samir': 'Samir Kaaki',
    'Youssef': 'Youssef Baakak',
    // DP 2
    'Habib': 'Habib Lteif',
    'Salah': 'Salah Boumalouga',
    // Noms déjà complets (ne pas modifier)
    'Mohamed Chalak': 'Mohamed Chalak',
    'Mohamed Younes': 'Mohamed Younes',
    'Mohamed Amine Sgheir': 'Mohamed Amine Sgheir',
    'Mohamed Amine': 'Mohamed Amine Sgheir',
    'Mohamed': 'Mohamed Chalak' // Par défaut si ambiguïté
};

function getFullStudentName(firstName) {
    return studentNameMapping[firstName] || firstName;
}

function createCriteriaDataForTemplate(criteriaValues, originalSubjectName, className) {
    const criteriaNames = criteriaBySubject[originalSubjectName] || {};
    const templateData = {};
    let totalLevel = 0;
    
    // Utiliser A-D pour toutes les classes (PEI et DP)
    // Le template Word utilise les clés AO1, AO2, AO3, AO4
    const criteriaKeys = ['A', 'B', 'C', 'D'];
    const aoKeys     = ['AO1', 'AO2', 'AO3', 'AO4'];
    const maxNote = (className === 'DP1' || className === 'DP2') ? 7 : 8;
    
    criteriaKeys.forEach((key, idx) => {
        const aoKey = aoKeys[idx]; // AO1, AO2, AO3, AO4
        const critData = criteriaValues?.[key] || {};
        const finalLevelValue = critData.finalLevel ?? "-";

        // Clés au format attendu par le template Word
        templateData[`criteriaKey${aoKey}`]  = key;                             // {criteriaKeyAO1} = A
        templateData[`criteriaName ${aoKey}`] = criteriaNames[key] || `Critère ${key}`; // {criteriaName AO1}
        templateData[`criteria${aoKey}.sem1`] = critData.sem1 ?? "-";          // {criteriaAO1.sem1}
        templateData[`criteria${aoKey}.sem2`] = critData.sem2 ?? "-";          // {criteriaAO1.sem2}
        templateData[`finalLevel${aoKey}`]    = finalLevelValue;                // {finalLevelAO1}

        // Conserver aussi les anciennes clés pour compatibilité ascendante
        templateData[`criteriaKey.${key}`]  = key;
        templateData[`criteriaName ${key}`] = criteriaNames[key] || `Critère ${key}`;
        templateData[`criteria${key}.sem1`] = critData.sem1 ?? "-";
        templateData[`criteria${key}.sem2`] = critData.sem2 ?? "-";
        templateData[`finalLevel.${key}`]   = finalLevelValue;
        
        if (finalLevelValue !== "-" && !isNaN(finalLevelValue)) {
            totalLevel += parseFloat(finalLevelValue);
        }
    });
    
    const finalNote = calculateFinalNote(totalLevel, maxNote);
    templateData['seuil'] = totalLevel.toString();
    templateData['note'] = finalNote;
    return templateData;
}

// Fonction pour détecter la catégorie d'une matière (flexible avec variations de noms)
function getSubjectCategory(subjectName) {
    if (!subjectName) return 999;
    
    const name = subjectName.toLowerCase();
    
    // 1. Langue et littérature (LL, Français, etc.)
    if (name.includes('langue et litt') || name.includes('ll') || 
        (name.includes('langue') && name.includes('français'))) {
        return 1;
    }
    
    // 2. Acquisition de langue - ARABE (avec caractères arabes)
    if (name.includes('arabe') || name.includes('العربية') || name.includes('اللغة')) {
        return 2;
    }
    
    // 3. Acquisition de langue - ANGLAIS
    if (name.includes('anglais') || name.includes('english')) {
        return 3;
    }
    
    // 4. Individus et sociétés
    if (name.includes('individu') || name.includes('société')) {
        return 4;
    }
    
    // 5. Sciences
    if (name.includes('science')) {
        return 5;
    }
    
    // 6. Mathématiques
    if (name.includes('math')) {
        return 6;
    }
    
    // 7. Arts (Art visuel, Arts plastiques, etc.)
    if (name.includes('art')) {
        return 7;
    }
    
    // 8. Éducation physique (sportive, santé, etc.)
    if (name.includes('éducation physique') || name.includes('education physique') || 
        name.includes('eps') || (name.includes('physique') && name.includes('sport'))) {
        return 8;
    }
    
    // 9. Design
    if (name.includes('design')) {
        return 9;
    }
    
    // Si aucune catégorie trouvée, mettre à la fin
    return 999;
}

// Fonction pour trier les matières dans l'ordre pédagogique requis
function sortSubjectsByOrder(contributions) {
    return contributions.sort((a, b) => {
        const orderA = getSubjectCategory(a.subjectSelected);
        const orderB = getSubjectCategory(b.subjectSelected);
        
        // Si même catégorie, trier alphabétiquement
        if (orderA === orderB) {
            return (a.subjectSelected || '').localeCompare(b.subjectSelected || '');
        }
        
        return orderA - orderB;
    });
}

function prepareWordData(studentName, className, studentBirthdate, originalContributions, semester = 1) {
    // Utiliser le nom complet pour le document Word
    const fullName = getFullStudentName(studentName);
    
    // CORRECTION: Si pas de contributions, créer des tableaux avec données vides
    // pour éviter l'erreur DocxTemplater sur boucles vides dans tableaux Word
    if (!originalContributions || originalContributions.length === 0) {
        return {
            studentSelected: fullName,
            className: className || "",
            studentBirthdate: studentBirthdate ? new Date(studentBirthdate).toLocaleDateString('fr-FR') : "",
            // Au lieu de tableaux vides, créer une entrée avec des tirets
            atlSummaryTable: [{
                subject: "-",
                communication: "-",
                collaboration: "-",
                autogestion: "-",
                recherche: "-",
                reflexion: "-"
            }],
            contributionsBySubject: [{
                subjectSelected: "-",
                teacherName: "-",
                teacherComment: "-",
                "criteriaKey.A": "A",
                "criteriaName A": "-",
                "criteriaA.sem1": "-",
                "criteriaA.sem2": "-",
                "finalLevel.A": "-",
                "criteriaKey.B": "B",
                "criteriaName B": "-",
                "criteriaB.sem1": "-",
                "criteriaB.sem2": "-",
                "finalLevel.B": "-",
                "criteriaKey.C": "C",
                "criteriaName C": "-",
                "criteriaC.sem1": "-",
                "criteriaC.sem2": "-",
                "finalLevel.C": "-",
                "criteriaKey.D": "D",
                "criteriaName D": "-",
                "criteriaD.sem1": "-",
                "criteriaD.sem2": "-",
                "finalLevel.D": "-",
                "seuil": "-",
                "note": "-"
            }]
        };
    }
    
    const documentData = {
        studentSelected: fullName,
        className: className || "",
        studentBirthdate: studentBirthdate ? new Date(studentBirthdate).toLocaleDateString('fr-FR') : "",
        semester: semester ? semester.toString() : "1",
        atlSummaryTable: [],
        contributionsBySubject: []
    };
    
    // Trier les contributions selon l'ordre pédagogique
    const sortedContributions = sortSubjectsByOrder([...originalContributions]);
    console.log('📚 Ordre des matières dans le Word:', sortedContributions.map(c => c.subjectSelected));
    
    for (const c of sortedContributions) {
        const comm = c.communicationEvaluation || [];
        documentData.atlSummaryTable.push({
            subject: c.subjectSelected,
            communication: comm[0] || "-",
            collaboration: comm[1] || "-",
            autogestion: comm[2] || "-",
            recherche: comm[3] || "-",
            reflexion: comm[4] || "-"
        });
        
        const criteriaTemplateData = createCriteriaDataForTemplate(c.criteriaValues, c.subjectSelected, className);
        
        // Détecter si c'est la matière arabe pour appliquer RTL
        const isArabicSubject = c.subjectSelected && c.subjectSelected.includes('اللغة العربية');
        
        const subjectContributionData = {
            subjectSelected: c.subjectSelected,
            teacherName: c.teacherName || "N/A",
            teacherComment: c.teacherComment || "-",
            isArabic: isArabicSubject,  // Indicateur bool\u00e9en pour RTL dans le template
            ...criteriaTemplateData
        };
        documentData.contributionsBySubject.push(subjectContributionData);
    }
    
    return documentData;
}

// URL du template Semestre 2 (hardcodée + variable d'env en override)
const TEMPLATE_S2_DEFAULT_URL = 'https://lh3.googleusercontent.com/d/1FHsw_BxQfWnXJOmKME8TvqrGjRHcI7-1';

/**
 * Convertit une URL Google Drive (viewer/lh3) en URL de téléchargement direct.
 * Exemples reconnus:
 *   https://lh3.googleusercontent.com/d/FILE_ID
 *   https://drive.google.com/file/d/FILE_ID/view
 *   https://drive.google.com/open?id=FILE_ID
 * → https://drive.google.com/uc?export=download&id=FILE_ID
 */
function toGoogleDriveDirectUrl(url) {
    if (!url) return url;
    // Déjà une URL de téléchargement direct
    if (url.includes('drive.google.com/uc') || url.includes('export=download')) return url;
    // lh3.googleusercontent.com/d/FILE_ID
    const lh3Match = url.match(/lh3\.googleusercontent\.com\/d\/([A-Za-z0-9_-]+)/);
    if (lh3Match) {
        return `https://drive.google.com/uc?export=download&id=${lh3Match[1]}`;
    }
    // drive.google.com/file/d/FILE_ID/...
    const driveMatch = url.match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/);
    if (driveMatch) {
        return `https://drive.google.com/uc?export=download&id=${driveMatch[1]}`;
    }
    // drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/);
    if (openMatch) {
        return `https://drive.google.com/uc?export=download&id=${openMatch[1]}`;
    }
    return url; // URL inconnue, retourner telle quelle
}

/**
 * Télécharge un template Word (.docx) depuis une URL (Google Drive ou autre).
 * Gère les redirections et retourne un Buffer.
 */
async function fetchTemplate(rawUrl) {
    const url = toGoogleDriveDirectUrl(rawUrl);
    console.log(`📁 Template URL (direct): ${url.substring(0, 80)}...`);
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/octet-stream,*/*'
        },
        redirect: 'follow'
    });
    if (!response.ok) {
        throw new Error(`Failed to fetch template: ${response.status} ${response.statusText} (${url})`);
    }
    // Vérifier que ce n'est pas une page HTML (indique une redirection ratée)
    const contentType = response.headers.get('content-type') || '';
    const buffer = Buffer.from(await response.arrayBuffer());
    if (contentType.includes('text/html') || (buffer.length < 5000 && buffer.toString('utf8', 0, 5) !== 'PK\x03\x04')) {
        // Google Drive renvoie parfois une page de confirmation pour les gros fichiers
        // Essayer avec le lien de confirmation
        const fileIdMatch = url.match(/[?&]id=([A-Za-z0-9_-]+)/);
        if (fileIdMatch) {
            const confirmUrl = `https://drive.google.com/uc?export=download&confirm=t&id=${fileIdMatch[1]}`;
            console.log(`⚠️ Redirection HTML détectée, tentative avec confirmation: ${confirmUrl.substring(0,80)}`);
            const confirmResponse = await fetch(confirmUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/octet-stream,*/*'
                },
                redirect: 'follow'
            });
            if (!confirmResponse.ok) throw new Error(`Template fetch (confirm) failed: ${confirmResponse.status}`);
            const confirmBuffer = Buffer.from(await confirmResponse.arrayBuffer());
            console.log(`✅ Template loaded (confirm): ${confirmBuffer.length} bytes`);
            return confirmBuffer;
        }
        throw new Error(`Template returned HTML instead of DOCX (${buffer.length} bytes). Check Google Drive sharing permissions.`);
    }
    console.log(`✅ Template loaded: ${buffer.length} bytes`);
    return buffer;
}

async function createWordDocumentBuffer(studentName, className, studentBirthdate, imageBuffer, originalContributions, semester = 1) {
    console.log(`🎓 Class: ${className} - Semestre ${semester}`);
    
    try {
        // Choisir l'URL du template selon le semestre
        let TEMPLATE_URL;
        if (semester === 2) {
            TEMPLATE_URL = process.env.TEMPLATE_URL_S2 || TEMPLATE_S2_DEFAULT_URL;
            console.log(`📁 Semestre 2: template S2`);
        } else {
            TEMPLATE_URL = process.env.TEMPLATE_URL;
            if (!TEMPLATE_URL) {
                throw new Error('TEMPLATE_URL not found in environment variables');
            }
            console.log(`📁 Semestre 1: template S1`);
        }
        
        console.log(`📁 Loading template from: ${TEMPLATE_URL.substring(0, 60)}...`);
        
        // Télécharger le template (gestion Google Drive + redirections)
        const templateContent = await fetchTemplate(TEMPLATE_URL);
        
        const zip = new PizZip(templateContent);
        console.log(`✅ PizZip created successfully`);
        
        console.log(`🔄 Preparing Word data for ${studentName}...`);
        const documentData = prepareWordData(studentName, className, studentBirthdate, originalContributions, semester);

        // --- Gestion image avec ImageModule ---
        // Le template S2 utilise {%image}, S1 peut utiliser {image} (texte) ou {%image}
        let docTemplaterOptions = {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => ''
        };
        
        let imageTagValue = ''; // valeur pour le tag texte {image}
        
        if (imageBuffer && imageBuffer.length > 0) {
            console.log(`📷 Image disponible (${imageBuffer.length} bytes) - configuration ImageModule`);
            try {
                const capturedImageBuffer = imageBuffer;
                const imageModuleOpts = {
                    centered: true,
                    fileType: 'docx',
                    getImage: function(tagValue, tagName) {
                        console.log(`📷 getImage called: tagName=${tagName}, tagValue=${String(tagValue).substring(0,30)}`);
                        return capturedImageBuffer;
                    },
                    getSize: function(img, tagValue, tagName) {
                        return [150, 190]; // largeur x hauteur en pixels (portrait, haute qualité)
                    }
                };
                const imageModule = new ImageModule(imageModuleOpts);
                docTemplaterOptions.modules = [imageModule];
                imageTagValue = '__PHOTO__'; // valeur déclenchant getImage
                console.log(`✅ ImageModule configuré - tag {%image} actif`);
            } catch (imgErr) {
                console.warn(`⚠️ ImageModule config échouée: ${imgErr.message}`);
                imageTagValue = '';
            }
        } else {
            console.log(`📷 Pas d'image disponible`);
        }
        
        const doc = new DocxTemplater(zip, docTemplaterOptions);
        
        const dataToRender = {
            ...documentData,
            image: imageTagValue
        };
        
        console.log(`🔄 Rendering Word document for ${studentName} (S${semester})...`);
        doc.render(dataToRender);
        console.log(`✅ Document rendered successfully`);
        
        const buffer = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        });
        console.log(`✅ Buffer: ${buffer.length} bytes`);
        
        return buffer;
    } catch (error) {
        console.error(`Error creating Word buffer for ${studentName}:`, error.message);
        if (error.properties && error.properties.errors) {
            console.error('DocxTemplater errors:', JSON.stringify(error.properties.errors));
        }
        // Fallback sans image
        console.warn(`⚠️ Tentative de génération sans image en fallback...`);
        return await createWordDocumentBufferNoImage(studentName, className, studentBirthdate, originalContributions, semester);
    }
}

// Fallback: génération sans image
async function createWordDocumentBufferNoImage(studentName, className, studentBirthdate, originalContributions, semester = 1) {
    let TEMPLATE_URL;
    if (semester === 2) {
        TEMPLATE_URL = process.env.TEMPLATE_URL_S2 || TEMPLATE_S2_DEFAULT_URL;
    } else {
        TEMPLATE_URL = process.env.TEMPLATE_URL;
        if (!TEMPLATE_URL) throw new Error('TEMPLATE_URL not found');
    }
    
    // Télécharger le template (gestion Google Drive + redirections)
    const templateContent = await fetchTemplate(TEMPLATE_URL);
    const zip = new PizZip(templateContent);
    
    const doc = new DocxTemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        nullGetter: () => ''
    });
    
    const documentData = prepareWordData(studentName, className, studentBirthdate, originalContributions, semester);
    doc.render({ ...documentData, image: '' });
    
    return doc.getZip().generate({ type: 'nodebuffer', compression: 'DEFLATE' });
}

// --- API Routes ---

// Static files served for local dev; on Vercel, public/ is served directly
app.use(express.static(PUBLIC_DIR));

// Root is handled by Vercel to serve public/index.html (see vercel.json)

// Middleware pour garantir la connexion MongoDB avant les requêtes API
async function ensureDbConnection(req, res, next) {
    // Vérifier si la connexion est valide (ping rapide si déjà connecté)
    if (isDbConnected && mongoClient && contributionsCollection && studentsCollection) {
        try {
            // Ping léger pour vérifier que la connexion est toujours active
            await mongoClient.db('admin').command({ ping: 1 });
            return next();
        } catch (pingErr) {
            console.warn('⚠️ Connexion perdue, reconnexion...');
            isDbConnected = false;
            global._mongoClient = null;
        }
    }

    console.log('⚠️ Database not connected, attempting connection...');

    try {
        const connected = await connectToMongo();
        if (connected) {
            console.log('✅ Database connection established in middleware');
            return next();
        } else {
            console.error('❌ Failed to establish database connection in middleware');
            return res.status(503).json({
                error: 'Service temporairement indisponible',
                details: 'Impossible de se connecter à la base de données. Vérifiez MONGODB_URI dans les variables Vercel.',
                dbConnected: false
            });
        }
    } catch (error) {
        console.error('❌ Error in database connection middleware:', error.message);
        return res.status(503).json({
            error: 'Service temporairement indisponible',
            details: 'Erreur lors de la connexion à la base de données.',
            dbConnected: false
        });
    }
}

// Appliquer le middleware à toutes les routes API sauf /api/test et /api/health
app.use('/api', (req, res, next) => {
    // Exclure les routes de santé du middleware de connexion DB
    if (req.path === '/test' || req.path === '/health') {
        return next();
    }
    return ensureDbConnection(req, res, next);
});

// Test de l'API
app.get('/api/test', (req, res) => {
    res.json({
        status: 'OK',
        message: 'API is working',
        dbConnected: isDbConnected,
        timestamp: new Date().toISOString()
    });
});

// Récupérer les données d'un élève/matière
app.post('/api/fetchData', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { studentSelected, subjectSelected, classSelected, sectionSelected, semester } = req.body;
        if (!studentSelected || !subjectSelected) {
            return res.json({ noDataForSubject: true, studentSelected });
        }
        const semNum = parseInt(semester) || 1;
        const query = { studentSelected, subjectSelected };
        if (classSelected) query.classSelected = classSelected;
        if (sectionSelected) query.sectionSelected = sectionSelected;
        // Filtrer par semestre
        if (semNum === 2) {
            query.semester = 2;
        } else {
            query.semester = { $in: [1, null] };
        }
        let contribution = await contributionsCollection.findOne(query);
        // Fallback S1: anciens enregistrements sans champ semester
        if (!contribution && semNum === 1) {
            delete query.semester;
            const fallbackQuery = { ...query };
            contribution = await contributionsCollection.findOne(fallbackQuery);
        }
        const studentInfo = await studentsCollection.findOne({ studentSelected }, { projection: { studentBirthdate: 1 } });
        
        if (contribution) {
            res.json({ ...contribution, studentBirthdate: studentInfo?.studentBirthdate });
        } else {
            res.json({ noDataForSubject: true, studentSelected, studentBirthdate: studentInfo?.studentBirthdate });
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        const { studentSelected } = req.body;
        res.json({ noDataForSubject: true, studentSelected });
    }
});

// Récupérer les infos d'un élève
app.post('/api/fetchStudentInfo', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { studentSelected } = req.body;
        if (!studentSelected) {
            return res.json(null);
        }
        const studentInfo = await studentsCollection.findOne(
            { studentSelected }, 
            { projection: { studentBirthdate: 1 } }
        );
        res.json(studentInfo || null);
    } catch (error) {
        console.error('Error fetching student info:', error);
        // Retourner null au lieu d'erreur 500 pour permettre à l'app de continuer
        res.json(null);
    }
});

// Enregistrer/Mettre à jour une contribution
app.post('/api/saveContribution', async (req, res) => {
    try {
        // s1CriteriaValues : données S1 modifiées depuis le formulaire S2 (feature 2)
        const { contributionId, studentBirthdate, studentPhoto, s1CriteriaValues, ...contribData } = req.body;
        contribData.timestamp = new Date();

        console.log(`Saving contribution for ${contribData.studentSelected} - ${contribData.subjectSelected} S${contribData.semester || 1}`);

        const required = ['studentSelected','subjectSelected','classSelected','sectionSelected','teacherName'];
        for (const key of required) {
            if (!contribData[key]) {
                return res.status(400).json({ success: false, error: `Champ manquant: ${key}` });
            }
        }

        // Mettre à jour la date de naissance
        if (studentBirthdate) {
            await studentsCollection.updateOne(
                { studentSelected: contribData.studentSelected },
                { $set: { studentBirthdate } },
                { upsert: true }
            );
        }

        const semNum = parseInt(contribData.semester) || 1;
        contribData.semester = semNum;

        // ---- Helper : upsert propre par semestre ----
        async function upsertSemDoc(semNumber, data) {
            const filter = {
                studentSelected: data.studentSelected,
                subjectSelected: data.subjectSelected,
                classSelected:   data.classSelected,
                sectionSelected: data.sectionSelected,
                semester:        semNumber
            };
            // Si on a un contributionId ET que le semestre correspond, on met à jour par _id
            // Sinon on fait toujours un upsert par filtre (plus sûr)
            return contributionsCollection.findOneAndUpdate(
                filter,
                { $set: data, $setOnInsert: { createdAt: new Date() } },
                { upsert: true, returnDocument: 'after' }
            );
        }

        // ---- Nettoyage criteriaValues pour le semestre courant ----
        function cleanCriteriaForSem(criteriaValues, sem) {
            const cleaned = {};
            for (const key of ['A','B','C','D']) {
                const src = criteriaValues?.[key] || {};
                if (sem === 1) {
                    cleaned[key] = {
                        sem1:       src.sem1      ?? null,
                        sem1Units:  src.sem1Units ?? [],
                        sem2:       null,
                        sem2Units:  [],
                        finalLevel: src.sem1      ?? null
                    };
                } else {
                    const s1v = src.sem1 ?? null;
                    const s2v = src.sem2 ?? null;
                    let fl = null;
                    if (s1v !== null && s2v !== null) fl = Math.round((parseFloat(s1v)+parseFloat(s2v))/2);
                    else if (s2v !== null) fl = s2v;
                    else if (s1v !== null) fl = s1v;
                    cleaned[key] = {
                        sem1:       null,
                        sem1Units:  [],
                        sem2:       s2v,
                        sem2Units:  src.sem2Units ?? [],
                        finalLevel: fl
                    };
                }
            }
            return cleaned;
        }

        // ---- 1. Sauvegarder l'enregistrement du semestre courant ----
        const mainData = { ...contribData };
        mainData.criteriaValues = cleanCriteriaForSem(contribData.criteriaValues, semNum);
        const result = await upsertSemDoc(semNum, mainData);

        // ---- 2. Si on est en S2 ET que des notes S1 modifiées sont fournies ----
        //        on met aussi à jour l'enregistrement S1 (feature 2)
        if (semNum === 2 && s1CriteriaValues && typeof s1CriteriaValues === 'object') {
            const s1Data = {
                studentSelected: contribData.studentSelected,
                subjectSelected: contribData.subjectSelected,
                classSelected:   contribData.classSelected,
                sectionSelected: contribData.sectionSelected,
                teacherName:     contribData.teacherName,
                timestamp:       new Date(),
                semester:        1,
                criteriaValues:  cleanCriteriaForSem(s1CriteriaValues, 1)
            };
            await upsertSemDoc(1, s1Data);
            console.log(`✅ Notes S1 également mises à jour depuis formulaire S2`);
        }

        const savedDoc = result?.value || result;
        const savedId  = savedDoc?._id || result?._id;
        console.log(`✅ Contribution saved (S${semNum}): ${savedId}`);
        res.json({ success: true, message: 'Contribution enregistrée/mise à jour', data: savedId });

    } catch (error) {
        console.error('Error saving contribution:', error);
        if (error.code === 11000) {
            res.status(409).json({ error: 'Contribution existe déjà' });
        } else {
            res.status(500).json({ error: 'Erreur serveur lors de la sauvegarde.' });
        }
    }
});

// Récupérer les contributions d'un élève
app.post('/api/fetchStudentContributions', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { studentSelected, classSelected, sectionSelected, semester } = req.body;
        if (!studentSelected) {
            return res.json({ contributions: [] });
        }
        // Construire le filtre de requête
        const semNum = parseInt(semester) || 1;
        const filter = { studentSelected };
        if (classSelected) filter.classSelected = classSelected;
        if (sectionSelected) filter.sectionSelected = sectionSelected;
        // Filtrer par semestre
        if (semNum === 2) {
            filter.semester = 2;
        } else {
            filter.semester = { $in: [1, null] };
        }
        
        let contributions = await contributionsCollection.find(filter)
            .sort({ subjectSelected: 1 })
            .toArray();
        
        // Fallback S1: si aucun résultat avec le filtre strict, chercher sans filtre semester
        if (semNum === 1 && contributions.length === 0) {
            const filterNoSem = { studentSelected };
            if (classSelected) filterNoSem.classSelected = classSelected;
            if (sectionSelected) filterNoSem.sectionSelected = sectionSelected;
            const allContribs = await contributionsCollection.find(filterNoSem).sort({ subjectSelected: 1 }).toArray();
            contributions = allContribs.filter(c => !c.semester || c.semester === 1);
            console.log(`📚 Contributions S1 (fallback) pour ${studentSelected}:`, contributions.length);
        }

        // DÉDUPLICATION: garder uniquement la contribution la plus récente par matière
        // (évite les doublons en cas de données corrompues dans la DB)
        const seen = new Map();
        for (const contrib of contributions) {
            const key = contrib.subjectSelected;
            if (!seen.has(key)) {
                seen.set(key, contrib);
            } else {
                // Garder la plus récente (timestamp le plus élevé)
                const existing = seen.get(key);
                const existingTime = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
                const newTime = contrib.timestamp ? new Date(contrib.timestamp).getTime() : 0;
                if (newTime > existingTime) {
                    seen.set(key, contrib);
                }
            }
        }
        const dedupedContributions = Array.from(seen.values())
            .sort((a, b) => (a.subjectSelected || '').localeCompare(b.subjectSelected || ''));

        console.log(`📚 Contributions S${semNum} pour ${studentSelected}: ${contributions.length} → ${dedupedContributions.length} (après dédup)`);
        res.json({ contributions: dedupedContributions });
    } catch (error) {
        console.error('Error fetching student contributions:', error);
        // Retourner un objet avec tableau vide au lieu d'erreur 500
        res.json({ contributions: [] });
    }
});

// ---- Suivi / Bilan par classe (feature 3) ----
// POST /api/studentProgress
// Body: { classSelected, sectionSelected }
// Retourne pour chaque élève : matières complétées S1, S2 et manquantes
app.post('/api/studentProgress', async (req, res) => {
    try {
        const { classSelected, sectionSelected } = req.body;
        if (!classSelected || !sectionSelected) {
            return res.status(400).json({ error: 'classSelected et sectionSelected sont requis' });
        }

        // Référentiel statique des matières par classe (même liste que côté client)
        const subjectsByClass = {
            PEI1:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            PEI2:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            PEI3:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            PEI4:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            PEI5:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            DP1:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"],
            DP2:["Mathématiques","Individus et sociétés","Langue et littérature","Design","Sciences","Art visuel","Éducation physique et à la santé","Acquisition de langue (Anglais)","Acquisition de langue (اللغة العربية)"]
        };

        const studentsByClassAndSection = {
            garçons:{ PEI1:["Bilal","Faysal","Jad","Manaf"], PEI2:["Ahmed","Ali","Eyad","Yasser"], PEI3:["Adam","Ahmad","Mohamed Chalak","Seifeddine","Wajih"], PEI4:["Abdulrahman","Mohamed Amine Sgheir","Mohamed Younes","Samir","Youssef"], DP2:["Habib","Salah"] },
            filles:{ PEI1:["Naya Sabbidine"], PEI2:["Israa Alkattan","Dina Tlili","Lina Tlili","Cynthia Fadlallah","Neyla Molina"], PEI3:["Jawahair Eshmawi"], PEI4:["Yousr Letaief","Sarah Aldebasy","Maria Wahib"], PEI5:["Badia Khaldi","Luluwah Alghabashi"], DP1:["Yomna Masrouhi"], DP2:["Isra Elalmi"] }
        };

        const expectedSubjects = subjectsByClass[classSelected] || [];
        const studentList = (studentsByClassAndSection[sectionSelected] || {})[classSelected] || [];

        if (studentList.length === 0) {
            return res.json({ students: [], expectedSubjects });
        }

        // Récupérer toutes les contributions de la classe (S1 + S2)
        const allContribs = await contributionsCollection.find({
            classSelected, sectionSelected,
            studentSelected: { $in: studentList }
        }, { projection: { studentSelected:1, subjectSelected:1, semester:1, teacherComment:1, communicationEvaluation:1, criteriaValues:1 } }).toArray();

        // Indexer par élève → matière → semestre
        const index = {};
        studentList.forEach(s => { index[s] = {}; });
        allContribs.forEach(c => {
            const sem = c.semester === 2 ? 2 : 1;
            if (!index[c.studentSelected]) index[c.studentSelected] = {};
            if (!index[c.studentSelected][c.subjectSelected]) index[c.studentSelected][c.subjectSelected] = {};
            index[c.studentSelected][c.subjectSelected][`s${sem}`] = c;
        });

        const students = studentList.map(studentName => {
            const subjectStatus = expectedSubjects.map(subj => {
                const s1 = index[studentName]?.[subj]?.s1;
                const s2 = index[studentName]?.[subj]?.s2;
                // Vérifier si les données sont complètes (notes saisies)
                const hasS1Notes = s1 && s1.criteriaValues && ['A','B','C','D'].some(k => s1.criteriaValues[k]?.sem1 !== null && s1.criteriaValues[k]?.sem1 !== undefined);
                const hasS2Notes = s2 && s2.criteriaValues && ['A','B','C','D'].some(k => s2.criteriaValues[k]?.sem2 !== null && s2.criteriaValues[k]?.sem2 !== undefined);
                const hasS1Comment = !!(s1?.teacherComment && s1.teacherComment.trim() && s1.teacherComment !== '-');
                const hasS2Comment = !!(s2?.teacherComment && s2.teacherComment.trim() && s2.teacherComment !== '-');
                const hasS1ATL = !!(s1?.communicationEvaluation?.some(v => v && v !== ''));
                const hasS2ATL = !!(s2?.communicationEvaluation?.some(v => v && v !== ''));
                return {
                    subject: subj,
                    s1: { done: !!s1, hasNotes: !!hasS1Notes, hasComment: hasS1Comment, hasATL: hasS1ATL },
                    s2: { done: !!s2, hasNotes: !!hasS2Notes, hasComment: hasS2Comment, hasATL: hasS2ATL }
                };
            });

            const totalSubjects = expectedSubjects.length;
            const s1Done  = subjectStatus.filter(s => s.s1.done).length;
            const s2Done  = subjectStatus.filter(s => s.s2.done).length;
            const missing = subjectStatus.filter(s => !s.s1.done || !s.s2.done);
            const incomplete = subjectStatus.filter(s => (s.s1.done && (!s.s1.hasNotes || !s.s1.hasComment)) || (s.s2.done && (!s.s2.hasNotes || !s.s2.hasComment)));

            return { studentName, totalSubjects, s1Done, s2Done, missing, incomplete, subjectStatus };
        });

        res.json({ students, expectedSubjects });
    } catch (error) {
        console.error('Error in studentProgress:', error);
        res.status(500).json({ error: error.message });
    }
});

// Récupérer une contribution spécifique
app.post('/api/fetchContribution', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { contributionId } = req.body;
        const contribution = await contributionsCollection.findOne({ _id: new ObjectId(contributionId) });
        
        if (!contribution) {
            return res.status(404).json({ error: 'Contribution non trouvée' });
        }
        
        const studentInfo = await studentsCollection.findOne(
            { studentSelected: contribution.studentSelected }, 
            { projection: { studentBirthdate: 1 } }
        );
        
        const fullData = { ...contribution, studentBirthdate: studentInfo?.studentBirthdate };
        res.json(fullData);
    } catch (error) {
        console.error('Error fetching contribution:', error);
        res.status(500).json({ error: 'Erreur lors de la récupération.' });
    }
});

// Supprimer une contribution
app.post('/api/deleteContribution', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { contributionId } = req.body;
        const result = await contributionsCollection.findOneAndDelete({ _id: new ObjectId(contributionId) });
        
        if (result.value) {
            console.log(`Contribution deleted: ${contributionId}`);
            res.json({ success: true, message: 'Contribution supprimée', deletedId: contributionId });
        } else {
            res.status(404).json({ error: 'Contribution non trouvée' });
        }
    } catch (error) {
        console.error('Error deleting contribution:', error);
        res.status(500).json({ error: 'Erreur lors de la suppression.' });
    }
});

// Table de données des photos élèves (même structure que côté client)
const studentPhotoData = {
    'Faysal': 'https://lh3.googleusercontent.com/d/1IB6BKROX3TRxaIIHVVVWbB7-Ii-V8VrC',
    'Bilal': 'https://lh3.googleusercontent.com/d/1B0QUZJhpSad5Fs3qRTugUe4oyTlUDEVu',
    'Jad': 'https://lh3.googleusercontent.com/d/1VLvrWjeJwaClf4pSaLiwjnS79N-HrsFr',
    'Manaf': 'https://lh3.googleusercontent.com/d/1h46Tqtqcp5tNqdY62wV6pyZFYknCEMWY',
    'Ahmed': 'https://lh3.googleusercontent.com/d/1cDF-yegSB2tqsWac0AoNttbi8qAALYT1',
    'Yasser': 'https://lh3.googleusercontent.com/d/1UUrrAJV_bgFNktGDinDkSrpwSZz-e47T',
    'Eyad': 'https://lh3.googleusercontent.com/d/1HGyWS4cC1jWWD25Ah3WcT_eIbUHqFzJ1',
    'Ali': 'https://lh3.googleusercontent.com/d/1bN-fDf_IWkXoW3WjSOXI5_M4KkL3FDKr',
    'Seifeddine': 'https://lh3.googleusercontent.com/d/1tWdPSbtCAsTMB86WzDgqh3Xw01ahm9s6',
    'Mohamed Chalak': 'https://lh3.googleusercontent.com/d/1lB8ObGOvQDVT6FITL2y7C5TYmAGyggFn',
    'Wajih': 'https://lh3.googleusercontent.com/d/1MH6M05mQamOHevmDffVFNpSFNnxqbxs3',
    'Ahmad': 'https://lh3.googleusercontent.com/d/1zU-jBuAbYjHanzank9C1BAd00skS1Y5J',
    'Adam': 'https://lh3.googleusercontent.com/d/15I9p6VSnn1yVmPxRRbGsUkM-fsBKYOWF',
    'Mohamed Younes': 'https://lh3.googleusercontent.com/d/1wzraoZY_lRafcDXeaxSBeX5cIU57p4xA',
    'Mohamed Amine Sgheir': 'https://lh3.googleusercontent.com/d/1UrBw6guz0oBTUy8COGeewIs3XAK773bR',
    'Samir': 'https://lh3.googleusercontent.com/d/1NdaCH8CU0DJFHXw4D0lItP-QnCswl23b',
    'Abdulrahman': 'https://lh3.googleusercontent.com/d/1yCTO5StU2tnPY0BEynnWzUveljMIUcLE',
    'Youssef': 'https://lh3.googleusercontent.com/d/1Bygg5-PYrjjMOZdI5hAe16eZ8ltn772e',
    'Habib': 'https://lh3.googleusercontent.com/d/13u4y6JIyCBVQ_9PCwYhh837byyK9g8pF',
    'Salah': 'https://lh3.googleusercontent.com/d/1IG8S_i6jD8O6C2QD_nwLxrG932QgIVXu'
};

// Générer un document Word pour un élève
app.post('/api/generateSingleWord', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { studentSelected, classSelected, sectionSelected, studentPhotoUrl, semester } = req.body;
        
        if (!studentSelected || !classSelected || !sectionSelected) {
            return res.status(400).json({ error: 'Informations manquantes' });
        }
        
        const semesterNum = parseInt(semester) || 1;
        console.log(`Word generation for: ${studentSelected} (Semestre ${semesterNum})`);
        
        // ---------------------------------------------------------------
        // CORRECTION BUG 1 & BUG 2 : Fusion S1 + S2 pour le document Word
        // Depuis la correction Bug 1, chaque enregistrement DB ne contient
        // que les données de son propre semestre (sem1 ou sem2).
        // Pour le document Word on a besoin des DEUX (sem1 ET sem2) dans
        // chaque contribution → on charge S1 et S2 séparément puis on fusionne.
        // ---------------------------------------------------------------

        // 1. Charger les contributions S1
        let s1Filter = { semester: { $in: [1, null] } };
        let s1Contributions = await contributionsCollection.find({
            studentSelected, sectionSelected, ...s1Filter
        }).toArray();
        // Fallback anciens enregistrements sans champ semester
        if (s1Contributions.length === 0) {
            const all = await contributionsCollection.find({ studentSelected, sectionSelected }).toArray();
            s1Contributions = all.filter(c => !c.semester || c.semester === 1);
        }

        // 2. Charger les contributions S2
        let s2Contributions = await contributionsCollection.find({
            studentSelected, sectionSelected, semester: 2
        }).toArray();

        // 3. Construire un dictionnaire S2 indexé par matière
        const s2BySubject = {};
        s2Contributions.forEach(c => { s2BySubject[c.subjectSelected] = c; });

        // 4. Fusionner : pour chaque matière S1, injecter les valeurs sem2 depuis S2
        let studentContributions = s1Contributions.map(s1 => {
            const s2 = s2BySubject[s1.subjectSelected];
            if (!s2) return s1; // pas encore de données S2 → garder S1 tel quel

            // Fusionner criteriaValues : sem1 vient de S1, sem2 vient de S2
            const mergedCriteria = {};
            for (const key of ['A', 'B', 'C', 'D']) {
                const c1 = s1.criteriaValues?.[key] || {};
                const c2 = s2.criteriaValues?.[key] || {};
                const s1v = c1.sem1 ?? null;
                const s2v = c2.sem2 ?? null;
                let finalLevel = null;
                if (s1v !== null && s2v !== null) {
                    finalLevel = Math.round((parseFloat(s1v) + parseFloat(s2v)) / 2);
                } else if (s2v !== null) {
                    finalLevel = s2v;
                } else if (s1v !== null) {
                    finalLevel = s1v;
                }
                // Conserver aussi finalLevel enregistré en S2 si calculé là-bas
                if (c2.finalLevel !== null && c2.finalLevel !== undefined) {
                    finalLevel = c2.finalLevel;
                }
                mergedCriteria[key] = {
                    sem1:       s1v,
                    sem1Units:  c1.sem1Units ?? [],
                    sem2:       s2v,
                    sem2Units:  c2.sem2Units ?? [],
                    finalLevel: finalLevel
                };
            }

            return {
                ...s1,
                criteriaValues:        mergedCriteria,
                teacherComment:        s2.teacherComment        || s1.teacherComment,
                communicationEvaluation: s2.communicationEvaluation?.length
                    ? s2.communicationEvaluation
                    : s1.communicationEvaluation,
                teacherName:           s2.teacherName           || s1.teacherName
            };
        });

        // Ajouter les matières présentes uniquement en S2 (pas encore en S1)
        s2Contributions.forEach(s2 => {
            const alreadyMerged = studentContributions.some(c => c.subjectSelected === s2.subjectSelected);
            if (!alreadyMerged) {
                // Construire les criteriaValues avec sem2 uniquement
                const mergedCriteria = {};
                for (const key of ['A', 'B', 'C', 'D']) {
                    const c2 = s2.criteriaValues?.[key] || {};
                    mergedCriteria[key] = {
                        sem1: null, sem1Units: [],
                        sem2: c2.sem2 ?? null, sem2Units: c2.sem2Units ?? [],
                        finalLevel: c2.finalLevel ?? c2.sem2 ?? null
                    };
                }
                studentContributions.push({ ...s2, criteriaValues: mergedCriteria });
            }
        });

        // Si le document est pour S1 seulement (pas de fusion), utiliser uniquement S1
        if (semesterNum === 1) {
            // Pour S1, ne montrer que les données sem1 (pas de sem2)
            studentContributions = s1Contributions;
        }

        if (studentContributions.length === 0) {
            console.warn(`⚠️ No contributions found for ${studentSelected}, generating empty document`);
            // Permettre la génération d'un document vide plutôt que de retourner 404
        }
        
        // Récupérer la date de naissance
        const studentInfo = await studentsCollection.findOne(
            { studentSelected },
            { projection: { studentBirthdate: 1 } }
        );
        
        // Récupérer l'image - priorité: URL fournie par le client, sinon URL depuis notre table
        const photoUrl = (studentPhotoUrl && studentPhotoUrl.startsWith('http')) 
            ? studentPhotoUrl 
            : studentPhotoData[studentSelected] || null;
        
        let imageBuffer = null;
        if (photoUrl) {
            console.log(`📷 Récupération photo pour ${studentSelected}: ${photoUrl.substring(0, 60)}...`);
            imageBuffer = await fetchImage(photoUrl);
            if (imageBuffer) {
                console.log(`✅ Photo récupérée: ${imageBuffer.length} bytes`);
            } else {
                console.warn(`⚠️ Impossible de récupérer la photo pour ${studentSelected}`);
            }
        } else {
            console.log(`ℹ️ Pas de photo définie pour ${studentSelected}`);
        }
        
        // Créer le document
        const docBuffer = await createWordDocumentBuffer(
            studentSelected,
            classSelected,
            studentInfo?.studentBirthdate,
            imageBuffer,
            studentContributions,
            semesterNum
        );
        
        // Générer nom de fichier pour le téléchargement
        // Format: Livret-Nom-Prenom-SemestreX.docx (sans caractères spéciaux)
        const fullName = getFullStudentName(studentSelected); // Utiliser nom complet
        // Remplacer espaces par tirets, supprimer caractères spéciaux
        const safeStudentName = fullName
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Supprimer accents
            .replace(/[\s]+/g, '-') // Espaces -> tirets
            .replace(/[^a-zA-Z0-9\-]/g, '') // Garder seulement lettres, chiffres, tirets
            .replace(/\-+/g, '-') // Éviter tirets multiples
            .replace(/^\-|\-$/g, ''); // Supprimer tirets début/fin
        const docFileName = `Livret-${safeStudentName}-S${semesterNum}.docx`;
        
        // VERCEL COMPATIBLE: Stream direct sans écriture de fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename="${docFileName}"`);
        res.setHeader('Content-Length', docBuffer.length);
        
        console.log(`✅ Streaming Word document for ${fullName} (${docBuffer.length} bytes)`);
        res.send(docBuffer);
        
    } catch (error) {
        console.error('❌ Error generating Word document:', error);
        console.error('Error details:', {
            message: error.message,
            stack: error.stack,
            studentSelected: req.body.studentSelected
        });
        
        // Provide more detailed error message
        let errorMessage = 'Erreur génération Word';
        if (error.message.includes('template')) {
            errorMessage = 'Erreur: Le modèle Word est inaccessible. Veuillez contacter l\'administrateur.';
        } else if (error.message.includes('fetch')) {
            errorMessage = 'Erreur: Impossible de télécharger le modèle Word. Vérifiez votre connexion internet.';
        } else {
            errorMessage = `Erreur génération Word: ${error.message}`;
        }
        
        res.status(500).json({ error: errorMessage });
    }
});

// Nouvelle route: Générer un ZIP pour toute une classe
app.post('/api/generateClassZip', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        const { classSelected, sectionSelected } = req.body;
        
        if (!classSelected || !sectionSelected) {
            return res.status(400).json({ error: 'Classe et section sont requis' });
        }
        
        console.log(`📦 Génération ZIP pour classe: ${classSelected} (${sectionSelected})`);
        
        // Récupérer tous les élèves de la classe
        const classStudents = await studentsCollection.find({
            classSelected: classSelected,
            sectionSelected: sectionSelected
        }).toArray();
        
        if (classStudents.length === 0) {
            return res.status(404).json({ error: 'Aucun élève trouvé pour cette classe' });
        }
        
        console.log(`✅ ${classStudents.length} élèves trouvés`);
        
        // Créer un fichier ZIP en mémoire
        const archive = archiver('zip', {
            zlib: { level: 9 } // Compression maximale
        });
        
        // Headers pour le téléchargement ZIP
        const zipFileName = `Livrets-${classSelected}-${sectionSelected}.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
        
        // Pipe l'archive vers la réponse
        archive.pipe(res);
        
        // Gérer les erreurs de l'archive
        archive.on('error', (err) => {
            console.error('❌ Erreur archive:', err);
            throw err;
        });
        
        // Générer un document Word pour chaque élève
        let successCount = 0;
        let errorCount = 0;
        
        for (const student of classStudents) {
            try {
                const studentName = student.studentSelected;
                console.log(`📄 Génération pour: ${studentName}`);
                
                // Récupérer les contributions de l'élève
                const studentContributions = await contributionsCollection.find({
                    studentSelected: studentName,
                    sectionSelected: sectionSelected
                }).toArray();
                
                // Récupérer l'image de l'élève
                let imageBuffer = null;
                if (student.studentPhotoUrl && student.studentPhotoUrl.startsWith('http')) {
                    imageBuffer = await fetchImage(student.studentPhotoUrl);
                    if (imageBuffer) {
                        console.log(`✅ Photo récupérée pour ${studentName}: ${imageBuffer.length} bytes`);
                    } else {
                        console.log(`⚠️ Pas de photo pour ${studentName}`);
                    }
                }
                
                // Créer le document Word
                const docBuffer = await createWordDocumentBuffer(
                    studentName,
                    classSelected,
                    student.studentBirthdate,
                    imageBuffer,
                    studentContributions
                );
                
                // Nom du fichier dans le ZIP
                const fullName = getFullStudentName(studentName);
                const safeStudentName = fullName
                    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
                    .replace(/[\s]+/g, '-')
                    .replace(/[^a-zA-Z0-9\-]/g, '')
                    .replace(/\-+/g, '-')
                    .replace(/^\-|\-$/g, '');
                const docFileName = `Livret-${safeStudentName}.docx`;
                
                // Ajouter le fichier au ZIP
                archive.append(docBuffer, { name: docFileName });
                successCount++;
                console.log(`✅ ${successCount}/${classStudents.length}: ${docFileName}`);
                
            } catch (error) {
                errorCount++;
                console.error(`❌ Erreur pour ${student.studentSelected}:`, error.message);
                // Continuer avec les autres élèves même en cas d'erreur
            }
        }
        
        // Finaliser l'archive
        await archive.finalize();
        
        console.log(`✅ ZIP généré: ${successCount} réussites, ${errorCount} erreurs`);
        
    } catch (error) {
        console.error('❌ Erreur génération ZIP:', error);
        if (!res.headersSent) {
            res.status(500).json({ 
                error: 'Erreur génération ZIP',
                details: error.message 
            });
        }
    }
});

// Endpoint pour ajouter des données de test (temporaire pour débugger)
app.post('/api/addTestData', async (req, res) => {
    // Le middleware ensureDbConnection garantit que la DB est connectée
    try {
        // Données de test pour Bilal
        const testContribution = {
            studentSelected: 'Bilal',
            sectionSelected: 'garcons',
            subjectSelected: 'Mathématiques',
            teacherName: 'Professeur Test',
            teacherComment: 'Excellent travail en mathématiques',
            criteriaValues: {
                A: { sem1: '6', sem2: '7', finalLevel: '7' },
                B: { sem1: '5', sem2: '6', finalLevel: '6' },
                C: { sem1: '7', sem2: '7', finalLevel: '7' },
                D: { sem1: '6', sem2: '7', finalLevel: '7' }
            },
            communicationEvaluation: ['B', 'A', 'B', 'A', 'B']
        };
        
        // Insérer ou mettre à jour
        await contributionsCollection.replaceOne(
            { studentSelected: 'Bilal', subjectSelected: 'Mathématiques' },
            testContribution,
            { upsert: true }
        );
        
        res.json({ success: true, message: 'Données de test ajoutées pour Bilal' });
        
    } catch (error) {
        console.error('Error adding test data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Route de diagnostic complète pour débugger les problèmes
app.get('/api/health', async (req, res) => {
    const healthStatus = {
        status: isDbConnected ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            VERCEL: !!process.env.VERCEL,
            VERCEL_ENV: process.env.VERCEL_ENV || 'N/A',
            MONGODB_URI_defined: !!MONGODB_URI,
            MONGODB_URI_length: MONGODB_URI ? MONGODB_URI.length : 0,
            DB_NAME: dbName
        },
        database: {
            connected: isDbConnected,
            connectionAttempts: connectionAttempts,
            collections: {
                contributions: !!contributionsCollection,
                students: !!studentsCollection
            }
        }
    };
    
    // Test de ping MongoDB si connecté
    if (isDbConnected && mongoClient) {
        try {
            const db = mongoClient.db(dbName);
            await db.admin().ping();
            healthStatus.database.pingSuccess = true;
            healthStatus.database.lastPing = new Date().toISOString();
        } catch (pingError) {
            healthStatus.database.pingSuccess = false;
            healthStatus.database.pingError = pingError.message;
        }
    }
    
    res.json(healthStatus);
});

// Endpoint de diagnostic détaillé (accessible uniquement si besoin)
app.get('/api/diagnostics', async (req, res) => {
    const diagnostics = {
        timestamp: new Date().toISOString(),
        application: {
            name: 'Livret-IB',
            version: '1.0.0',
            uptime: `${Math.floor(process.uptime())} seconds`
        },
        environment: {
            nodeVersion: process.version,
            platform: process.platform,
            NODE_ENV: process.env.NODE_ENV || 'development',
            isVercel: !!process.env.VERCEL,
            vercelEnv: process.env.VERCEL_ENV || 'N/A'
        },
        configuration: {
            MONGODB_URI: MONGODB_URI ? '✅ Defined (hidden for security)' : '❌ NOT DEFINED',
            DB_NAME: dbName,
            PORT: PORT
        },
        database: {
            connectionStatus: isDbConnected ? '✅ Connected' : '❌ Not Connected',
            connectionAttempts: connectionAttempts,
            contributionsCollection: contributionsCollection ? '✅ Available' : '❌ Not Available',
            studentsCollection: studentsCollection ? '✅ Available' : '❌ Not Available'
        },
        endpoints: {
            '/api/test': 'API test endpoint',
            '/api/health': 'Health check endpoint',
            '/api/diagnostics': 'Detailed diagnostics',
            '/api/fetchData': 'Fetch student/subject data',
            '/api/saveContribution': 'Save contribution',
            '/api/generateSingleWord': 'Generate Word document'
        }
    };
    
    // Test database connection if connected
    if (isDbConnected) {
        try {
            const db = mongoClient.db(dbName);
            await db.admin().ping();
            diagnostics.database.pingTest = '✅ Success';
            
            // Count documents
            const contribCount = await contributionsCollection.countDocuments();
            const studentCount = await studentsCollection.countDocuments();
            diagnostics.database.contributionsCount = contribCount;
            diagnostics.database.studentsCount = studentCount;
        } catch (err) {
            diagnostics.database.pingTest = `❌ Failed: ${err.message}`;
        }
    }
    
    res.json(diagnostics);
});

// Route '/' handled by Vercel (public/index.html)

// Catch-all for API only; static routing is handled by Vercel
app.all('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.status(404).end();
});

// --- Démarrage ---
console.log('🚀 ===== APPLICATION STARTUP =====');
console.log('Starting Livret-IB application...');

// Initialiser la connexion MongoDB
connectToMongo().then((success) => {
    if (success) {
        console.log('✅ Server initialized successfully with database connection');
        setupMongoReconnection(); // Configure reconnection handlers
    } else {
        console.warn('⚠️ Server initialized BUT database connection FAILED');
        console.warn('⚠️ The application will run in READ-ONLY mode (no save/update)');
        console.warn('📋 Please check Vercel Environment Variables:');
        console.warn('   - MONGODB_URI must be set correctly');
        console.warn('   - DB_NAME should be set to: teacherContributionsDB');
    }
    
    // Démarrage local (seulement si pas dans Vercel)
    if (require.main === module) {
        app.listen(PORT, () => {
            console.log('================================');
            console.log(`🚀 Server is running on port ${PORT}`);
            console.log(`🌐 Local URL: http://localhost:${PORT}`);
            console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
            console.log(`📊 Diagnostics: http://localhost:${PORT}/api/diagnostics`);
            console.log('================================');
        });
    }
}).catch(err => {
    console.error('❌ CRITICAL: Failed to initialize server');
    console.error('Error details:', err);
    console.error('The application may not function correctly');
    
    // Sur Vercel, on continue quand même pour que l'app démarre
    if (process.env.VERCEL) {
        console.warn('⚠️ Running in Vercel - application will start despite DB error');
        console.warn('⚠️ Please fix environment variables in Vercel Dashboard');
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('📴 SIGTERM received, closing server gracefully...');
    if (mongoClient) {
        await mongoClient.close();
        console.log('✅ MongoDB connection closed');
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('📴 SIGINT received, closing server gracefully...');
    if (mongoClient) {
        await mongoClient.close();
        console.log('✅ MongoDB connection closed');
    }
    process.exit(0);
});

console.log('✅ Server startup sequence complete');
console.log('==================================');

// ENDPOINT ADMINISTRATIF : Afficher les contributions DP2 garçons
// URL: /api/admin/view-dp2-garcons?secret=merge-dp2-2026
app.get('/api/admin/view-dp2-garcons', async (req, res) => {
    try {
        // Protection simple
        const secret = req.query.secret;
        if (secret !== 'merge-dp2-2026') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!isDbConnected) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const dp2Students = ['Habib', 'Salah'];
        const result = {
            students: [],
            summary: {
                totalStudents: dp2Students.length,
                totalContributions: 0
            },
            orphanedContributions: []
        };

        // Récupérer les contributions pour chaque élève
        for (const studentName of dp2Students) {
            const contributions = await contributionsCollection.find({ 
                studentSelected: studentName,
                classSelected: 'DP2',
                sectionSelected: 'garcons'
            }).toArray();

            const studentData = {
                name: studentName,
                contributionsCount: contributions.length,
                subjects: contributions.map(c => ({
                    subject: c.subjectSelected,
                    teacher: c.teacherName || 'Non défini',
                    hasComment: !!(c.teacherComment && c.teacherComment !== '-'),
                    hasCriteria: !!c.criteriaValues,
                    hasATL: !!(c.communicationEvaluation && c.communicationEvaluation.length > 0)
                }))
            };

            result.students.push(studentData);
            result.summary.totalContributions += contributions.length;
        }

        // Vérifier les contributions orphelines (noms complets)
        const orphaned = await contributionsCollection.find({
            studentSelected: { $in: ['Habib Lteif', 'Salah Boumalouga'] },
            classSelected: 'DP2'
        }).toArray();

        result.orphanedContributions = orphaned.map(c => ({
            studentName: c.studentSelected,
            subject: c.subjectSelected,
            teacher: c.teacherName || 'Non défini'
        }));

        result.summary.orphanedCount = orphaned.length;
        result.summary.averagePerStudent = (result.summary.totalContributions / dp2Students.length).toFixed(1);

        res.json({
            success: true,
            message: 'Contributions DP2 garçons récupérées',
            data: result
        });

    } catch (error) {
        console.error('❌ Error viewing DP2 garcons contributions:', error);
        res.status(500).json({
            error: 'Failed to view DP2 garcons contributions',
            details: error.message
        });
    }
});

// ENDPOINT ADMINISTRATIF : Fusion des contributions DP2
// URL: /api/admin/merge-dp2-names?secret=VOTRE_SECRET
app.get('/api/admin/merge-dp2-names', async (req, res) => {
    try {
        // Protection simple (dans un environnement de production, utiliser un vrai système d'auth)
        const secret = req.query.secret;
        if (secret !== 'merge-dp2-2026') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        if (!isDbConnected) {
            return res.status(503).json({ error: 'Database not connected' });
        }

        const mergeMappings = [
            { fullName: 'Habib Lteif', firstName: 'Habib' },
            { fullName: 'Salah Boumalouga', firstName: 'Salah' }
        ];

        const results = [];

        for (const mapping of mergeMappings) {
            // 1. Mettre à jour les contributions
            const contribResult = await contributionsCollection.updateMany(
                { studentSelected: mapping.fullName },
                { $set: { studentSelected: mapping.firstName } }
            );

            // 2. Supprimer l'entrée avec le nom complet dans students
            const deleteResult = await studentsCollection.deleteMany({
                studentSelected: mapping.fullName
            });

            // 3. Vérifier que l'entrée avec le prénom existe
            const studentExists = await studentsCollection.findOne({
                studentSelected: mapping.firstName
            });

            results.push({
                mapping: `${mapping.fullName} → ${mapping.firstName}`,
                contributionsUpdated: contribResult.modifiedCount,
                studentsDeleted: deleteResult.deletedCount,
                studentExists: !!studentExists
            });
        }

        // Vérification finale
        const habibCount = await contributionsCollection.countDocuments({ studentSelected: 'Habib' });
        const salahCount = await contributionsCollection.countDocuments({ studentSelected: 'Salah' });

        res.json({
            success: true,
            results: results,
            finalCounts: {
                Habib: habibCount,
                Salah: salahCount
            }
        });

    } catch (error) {
        console.error('❌ Error merging DP2 names:', error);
        res.status(500).json({
            error: 'Failed to merge DP2 names',
            details: error.message
        });
    }
});

// Export pour Vercel
module.exports = app;
