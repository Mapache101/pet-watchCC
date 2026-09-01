/* =====================================================
   SANTA CRUZ PET WATCH
   Firebase + Firestore + Storage
===================================================== */

import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";

import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    doc,
    getDoc,
    serverTimestamp,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.18.0/firebase-storage.js";


/* =====================================================
   FIREBASE CONFIGURATION
===================================================== */

const firebaseConfig = {

    apiKey: "AIzaSyDuSlnvRYik3gctcKpaA_B5q8bMKdQgxVQ",

    authDomain: "pet-watch-7d8b0.firebaseapp.com",

    projectId: "pet-watch-7d8b0",

    storageBucket: "pet-watch-7d8b0.firebasestorage.app",

    messagingSenderId: "862266741136",

    appId: "1:862266741136:web:4474be628228f8985ee315"

};


/* =====================================================
   INITIALIZE FIREBASE
===================================================== */

const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const storage = getStorage(app);


/* =====================================================
   GLOBAL STATE
===================================================== */

let allReports = [];

let visibleReports = [];

let reportsPerPage = 6;

let currentPage = 1;


/* =====================================================
   DOM ELEMENTS
===================================================== */

const petContainer =
    document.getElementById("pet-container");

const petForm =
    document.getElementById("pet-form");

const formMessage =
    document.getElementById("form-message");

const statusFilter =
    document.getElementById("status-filter");

const areaFilter =
    document.getElementById("area-filter");

const searchInput =
    document.getElementById("search-input");

const loadMoreButton =
    document.getElementById("load-more-button");

const reportCount =
    document.getElementById("report-count");


/* =====================================================
   INITIALIZE APP
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    loadReports();

    setupFilters();

    setupAreaButtons();

});


/* =====================================================
   LOAD REPORTS FROM FIRESTORE
===================================================== */

async function loadReports() {

    try {

        showLoading();

        const reportsCollection =
            collection(db, "petReports");

        const reportsQuery =
            query(
                reportsCollection,
                orderBy("createdAt", "desc")
            );

        const snapshot =
            await getDocs(reportsQuery);


        allReports = snapshot.docs.map((document) => {

            return {
                id: document.id,
                ...document.data()
            };

        });


        /*
            If there are no reports yet,
            show the empty state.
        */

        reportCount.textContent =
            allReports.length;


        applyFilters();


    } catch (error) {

        console.error(
            "Error loading reports:",
            error
        );


        /*
            Firestore may not have any documents
            yet, or the database/rules may not
            be configured.
        */

        petContainer.innerHTML = `

            <div class="reports-loading">

                <strong>
                    Unable to load reports.
                </strong>

                <br>

                <span>
                    Please check your Firebase
                    Firestore configuration.
                </span>

            </div>

        `;

    }

}


/* =====================================================
   FILTER SETUP
===================================================== */

function setupFilters() {

    statusFilter.addEventListener(
        "change",
        () => {

            currentPage = 1;

            applyFilters();

        }
    );


    areaFilter.addEventListener(
        "change",
        () => {

            currentPage = 1;

            applyFilters();

        }
    );


    searchInput.addEventListener(
        "input",
        () => {

            currentPage = 1;

            applyFilters();

        }
    );


    loadMoreButton.addEventListener(
        "click",
        () => {

            currentPage++;

            renderReports();

        }
    );

}


/* =====================================================
   AREA BUTTONS
===================================================== */

function setupAreaButtons() {

    const areaButtons =
        document.querySelectorAll(
            ".area-card"
        );


    areaButtons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const area =
                    button.dataset.area;


                areaFilter.value =
                    area;


                currentPage = 1;

                applyFilters();

            }
        );

    });

}


/* =====================================================
   APPLY FILTERS
===================================================== */

function applyFilters() {

    const status =
        statusFilter.value;

    const area =
        areaFilter.value;

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    visibleReports =
        allReports.filter((report) => {


            /*
                STATUS FILTER
            */

            const matchesStatus =
                status === "all" ||
                report.status === status;


            /*
                AREA FILTER
            */

            const matchesArea =
                area === "all" ||
                report.area === area;


            /*
                SEARCH
            */

            const searchableText = [

                report.petName,

                report.petType,

                report.area,

                report.location,

                report.description,

                report.status

            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();


            const matchesSearch =
                !search ||
                searchableText.includes(search);


            return (
                matchesStatus &&
                matchesArea &&
                matchesSearch
            );

        });


    renderReports();

}


/* =====================================================
   RENDER REPORTS
===================================================== */

function renderReports() {

    const reportsToShow =
        visibleReports.slice(
            0,
            currentPage * reportsPerPage
        );


    if (reportsToShow.length === 0) {

        petContainer.innerHTML = `

            <div class="reports-loading">

                <strong>
                    No pet reports found.
                </strong>

                <br>

                <span>
                    Try changing your search
                    or filters.
                </span>

            </div>

        `;


        loadMoreButton.style.display =
            "none";


        return;

    }


    petContainer.innerHTML =
        reportsToShow
            .map(createPetCard)
            .join("");


    /*
        Show/hide Load More
    */

    if (
        reportsToShow.length <
        visibleReports.length
    ) {

        loadMoreButton.style.display =
            "inline-flex";

    } else {

        loadMoreButton.style.display =
            "none";

    }


    /*
        Add card click handlers
    */

    setupReportButtons();

}


/* =====================================================
   CREATE PET CARD
===================================================== */

function createPetCard(report) {

    const statusClass =
        String(report.status || "")
            .toLowerCase();


    const petTitle =
        escapeHTML(
            report.petName ||
            `${report.petType || "Pet"}`
        );


    const petType =
        escapeHTML(
            report.petType || "Pet"
        );


    const area =
        escapeHTML(
            report.area || "Santa Cruz"
        );


    const description =
        escapeHTML(
            report.description ||
            "No description provided."
        );


    const imageUrl =
        escapeAttribute(
            report.imageUrl ||
            "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=90"
        );


    const timeAgo =
        getTimeAgo(
            report.createdAt,
            report.lastSeen
        );


    return `

        <article
            class="pet-card"
            data-report-id="${report.id}"
        >

            <div class="pet-photo">

                <img
                    src="${imageUrl}"
                    alt="${petTitle}"
                    loading="lazy"
                >

                <span class="status ${statusClass}">
                    ${escapeHTML(report.status || "REPORT")}
                </span>

            </div>


            <div class="pet-info">

                <div class="pet-meta">

                    <span>
                        ${petType}
                    </span>

                    <span>
                        ${timeAgo}
                    </span>

                </div>


                <h3>
                    ${petTitle}
                </h3>


                <div class="pet-location">
                    ${area}
                </div>


                <p>
                    ${description}
                </p>


                <div class="pet-footer">

                    <span>
                        Contact available
                    </span>

                    <button
                        type="button"
                        class="view-details-button"
                        data-id="${report.id}"
                    >
                        View Details
                    </button>

                </div>

            </div>

        </article>

    `;

}


/* =====================================================
   REPORT BUTTONS
===================================================== */

function setupReportButtons() {

    const buttons =
        document.querySelectorAll(
            ".view-details-button"
        );


    buttons.forEach((button) => {

        button.addEventListener(
            "click",
            () => {

                const reportId =
                    button.dataset.id;


                showReportDetails(
                    reportId
                );

            }
        );

    });

}


/* =====================================================
   SHOW REPORT DETAILS
===================================================== */

async function showReportDetails(
    reportId
) {

    try {

        const reportReference =
            doc(
                db,
                "petReports",
                reportId
            );


        const reportSnapshot =
            await getDoc(
                reportReference
            );


        if (!reportSnapshot.exists()) {

            alert(
                "This report could not be found."
            );

            return;

        }


        const report =
            reportSnapshot.data();


        const image =
            escapeAttribute(
                report.imageUrl || ""
            );


        const petName =
            escapeHTML(
                report.petName ||
                report.petType ||
                "Pet"
            );


        const description =
            escapeHTML(
                report.description ||
                "No description provided."
            );


        const area =
            escapeHTML(
                report.area ||
                "Not specified"
            );


        const location =
            escapeHTML(
                report.location ||
                "Not specified"
            );


        const petType =
            escapeHTML(
                report.petType ||
                "Pet"
            );


        const status =
            escapeHTML(
                report.status ||
                "Report"
            );


        /*
            Create modal
        */

        const modal =
            document.createElement("div");


        modal.className =
            "pet-detail-modal";


        modal.innerHTML = `

            <div class="pet-detail-overlay"></div>

            <div class="pet-detail-content">

                <button
                    type="button"
                    class="pet-detail-close"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="pet-detail-image">

                    <img
                        src="${image}"
                        alt="${petName}"
                    >

                </div>


                <div class="pet-detail-body">

                    <span class="status ${String(report.status || "").toLowerCase()}">
                        ${status}
                    </span>


                    <h2>
                        ${petName}
                    </h2>


                    <div class="pet-detail-meta">

                        <span>
                            ${petType}
                        </span>

                        <span>
                            ${area}
                        </span>

                    </div>


                    <div class="pet-detail-location">

                        <strong>
                            Last known location
                        </strong>

                        <span>
                            ${location}
                        </span>

                    </div>


                    <div class="pet-detail-description">

                        <strong>
                            Description
                        </strong>

                        <p>
                            ${description}
                        </p>

                    </div>


                    <div class="pet-detail-contact">

                        <strong>
                            Contact
                        </strong>

                        <p>
                            ${escapeHTML(
                                report.contact ||
                                "Contact information unavailable."
                            )}
                        </p>

                    </div>

                </div>

            </div>

        `;


        document.body.appendChild(
            modal
        );


        /*
            Close button
        */

        const closeButton =
            modal.querySelector(
                ".pet-detail-close"
            );


        const overlay =
            modal.querySelector(
                ".pet-detail-overlay"
            );


        closeButton.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


        overlay.addEventListener(
            "click",
            () => {

                modal.remove();

            }
        );


        /*
            Escape key
        */

        document.addEventListener(
            "keydown",
            function closeWithEscape(event) {

                if (
                    event.key === "Escape"
                ) {

                    modal.remove();

                    document.removeEventListener(
                        "keydown",
                        closeWithEscape
                    );

                }

            }
        );


    } catch (error) {

        console.error(
            "Error opening report:",
            error
        );


        alert(
            "Unable to open this report."
        );

    }

}


/* =====================================================
   SUBMIT PET REPORT
===================================================== */

petForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        /*
            Get form values
        */

        const status =
            document.getElementById(
                "pet-status"
            ).value;


        const petType =
            document.getElementById(
                "pet-type"
            ).value;


        const petName =
            document.getElementById(
                "pet-name"
            ).value.trim();


        const photoInput =
            document.getElementById(
                "pet-photo"
            );


        const area =
            document.getElementById(
                "pet-area"
            ).value;


        const lastSeen =
            document.getElementById(
                "last-seen"
            ).value;


        const location =
            document.getElementById(
                "location"
            ).value.trim();


        const description =
            document.getElementById(
                "description"
            ).value.trim();


        const contact =
            document.getElementById(
                "contact"
            ).value.trim();


        /*
            Check photo
        */

        if (
            !photoInput.files ||
            photoInput.files.length === 0
        ) {

            showFormMessage(
                "Please choose a photo of the pet.",
                "error"
            );

            return;

        }


        const photo =
            photoInput.files[0];


        /*
            Validate file type
        */

        const allowedTypes = [

            "image/jpeg",

            "image/png",

            "image/webp"

        ];


        if (
            !allowedTypes.includes(
                photo.type
            )
        ) {

            showFormMessage(
                "Please upload a JPG, PNG, or WebP image.",
                "error"
            );

            return;

        }


        /*
            5 MB limit
        */

        const maxFileSize =
            5 * 1024 * 1024;


        if (
            photo.size >
            maxFileSize
        ) {

            showFormMessage(
                "Please choose an image smaller than 5 MB.",
                "error"
            );

            return;

        }


        /*
            Disable submit
        */

        const submitButton =
            petForm.querySelector(
                ".submit-button"
            );


        submitButton.disabled =
            true;


        submitButton.textContent =
            "Uploading...";


        showFormMessage(
            "Uploading your pet report...",
            "loading"
        );


        try {

            /*
                Create a unique file name
            */

            const safeFileName =
                photo.name
                    .replace(
                        /[^a-zA-Z0-9._-]/g,
                        "-"
                    );


            const fileName =
                `${Date.now()}-${safeFileName}`;


            const storagePath =
                `pet-photos/${fileName}`;


            /*
                Create Storage reference
            */

            const photoReference =
                ref(
                    storage,
                    storagePath
                );


            /*
                Upload image
            */

            await uploadBytes(
                photoReference,
                photo,
                {
                    contentType:
                        photo.type
                }
            );


            submitButton.textContent =
                "Saving report...";


            /*
                Get public download URL
            */

            const imageUrl =
                await getDownloadURL(
                    photoReference
                );


            /*
                Save report to Firestore
            */

            const reportData = {

                status: status,

                petType: petType,

                petName: petName,

                imageUrl: imageUrl,

                imagePath: storagePath,

                area: area,

                lastSeen: lastSeen,

                location: location,

                description: description,

                contact: contact,

                active: true,

                createdAt:
                    serverTimestamp()

            };


            const reportReference =
                await addDoc(
                    collection(
                        db,
                        "petReports"
                    ),
                    reportData
                );


            console.log(
                "Report created:",
                reportReference.id
            );


            /*
                Success
            */

            showFormMessage(
                "Your pet report has been submitted successfully. Thank you for helping the community!",
                "success"
            );


            /*
                Reset form
            */

            petForm.reset();


            /*
                Reload reports
            */

            await loadReports();


            /*
                Scroll to reports
            */

            setTimeout(() => {

                document
                    .getElementById("reports")
                    .scrollIntoView({
                        behavior: "smooth"
                    });

            }, 700);


        } catch (error) {

            console.error(
                "Error submitting pet report:",
                error
            );


            let message =
                "Something went wrong while submitting your report.";


            /*
                Firebase-specific errors
            */

            if (
                error.code ===
                "storage/unauthorized"
            ) {

                message =
                    "Photo upload was denied. Please check your Firebase Storage rules.";

            }


            if (
                error.code ===
                "permission-denied"
            ) {

                message =
                    "Firebase denied the request. Please check your Firestore security rules.";

            }


            showFormMessage(
                message,
                "error"
            );


        } finally {

            submitButton.disabled =
                false;


            submitButton.textContent =
                "Submit Pet Report";

        }

    }
);


/* =====================================================
   FORM MESSAGE
===================================================== */

function showFormMessage(
    message,
    type
) {

    formMessage.textContent =
        message;


    formMessage.className =
        `form-message ${type}`;

}


/* =====================================================
   LOADING STATE
===================================================== */

function showLoading() {

    petContainer.innerHTML = `

        <div class="reports-loading">

            Loading pet reports...

        </div>

    `;

}


/* =====================================================
   TIME AGO
===================================================== */

function getTimeAgo(
    timestamp,
    fallbackDate
) {

    let date;


    /*
        Firestore Timestamp
    */

    if (
        timestamp &&
        typeof timestamp.toDate === "function"
    ) {

        date =
            timestamp.toDate();

    }


    /*
        JavaScript Date
    */

    else if (
        timestamp instanceof Date
    ) {

        date =
            timestamp;

    }


    /*
        Last seen fallback
    */

    else if (
        fallbackDate
    ) {

        date =
            new Date(
                `${fallbackDate}T12:00:00`
            );

    }


    else {

        return "Recently";

    }


    const now =
        new Date();


    const difference =
        now.getTime() -
        date.getTime();


    const minutes =
        Math.floor(
            difference /
            (1000 * 60)
        );


    const hours =
        Math.floor(
            difference /
            (1000 * 60 * 60)
        );


    const days =
        Math.floor(
            difference /
            (1000 * 60 * 60 * 24)
        );


    if (minutes < 1) {

        return "Just now";

    }


    if (minutes < 60) {

        return `${minutes} min ago`;

    }


    if (hours < 24) {

        return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    }


    if (days < 30) {

        return `${days} ${days === 1 ? "day" : "days"} ago`;

    }


    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    );

}


/* =====================================================
   HTML ESCAPING
===================================================== */

function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   ATTRIBUTE ESCAPING
===================================================== */

function escapeAttribute(value) {

    return escapeHTML(value);

}


/* =====================================================
   EXTRA STYLES FOR FIREBASE FEATURES
===================================================== */

/*
    These styles are injected here so you don't
    have to change your existing style.css.
*/

const firebaseStyles =
    document.createElement("style");


firebaseStyles.textContent = `

    .reports-loading {
        grid-column: 1 / -1;
        padding: 50px 20px;
        text-align: center;
        color: #777;
        line-height: 1.8;
    }


    .reports-loading strong {
        color: #333;
    }


    .pet-card {
        cursor: default;
    }


    .view-details-button {
        cursor: pointer;
    }


    .submit-button:disabled {
        opacity: 0.65;
        cursor: not-allowed;
    }


    .form-message {
        margin-top: 18px;
        line-height: 1.6;
    }


    .form-message.success {
        color: #39734a;
    }


    .form-message.error {
        color: #a33a32;
    }


    .form-message.loading {
        color: #777;
    }


    /*
        PET DETAIL MODAL
    */

    .pet-detail-modal {
        position: fixed;
        inset: 0;
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
    }


    .pet-detail-overlay {
        position: absolute;
        inset: 0;
        background: rgba(25, 35, 30, 0.72);
        backdrop-filter: blur(4px);
    }


    .pet-detail-content {
        position: relative;
        z-index: 2;
        width: min(760px, 100%);
        max-height: 90vh;
        overflow-y: auto;
        background: #fff;
        border-radius: 4px;
        box-shadow: 0 25px 80px rgba(0, 0, 0, 0.25);
    }


    .pet-detail-image {
        width: 100%;
        height: 340px;
        overflow: hidden;
    }


    .pet-detail-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
    }


    .pet-detail-body {
        padding: 32px;
    }


    .pet-detail-body h2 {
        margin: 14px 0 10px;
    }


    .pet-detail-meta {
        display: flex;
        gap: 20px;
        color: #777;
        margin-bottom: 24px;
    }


    .pet-detail-location,
    .pet-detail-description,
    .pet-detail-contact {
        margin-top: 22px;
    }


    .pet-detail-location strong,
    .pet-detail-description strong,
    .pet-detail-contact strong {
        display: block;
        margin-bottom: 7px;
    }


    .pet-detail-location span {
        color: #666;
    }


    .pet-detail-description p,
    .pet-detail-contact p {
        color: #555;
        line-height: 1.7;
        margin: 0;
    }


    .pet-detail-close {
        position: absolute;
        right: 16px;
        top: 16px;
        z-index: 5;
        width: 42px;
        height: 42px;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.94);
        color: #333;
        font-size: 28px;
        line-height: 1;
        cursor: pointer;
    }


    @media (max-width: 700px) {

        .pet-detail-modal {
            padding: 12px;
        }


        .pet-detail-image {
            height: 260px;
        }


        .pet-detail-body {
            padding: 24px;
        }

    }

`;


document.head.appendChild(
    firebaseStyles
);
