import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Configuración de Firebase (meenapetw)
const firebaseConfig = {
  apiKey: "AIzaSyAPJV3oQ7-beld7Ns7oDfE52JDuEpuk0BA",
  authDomain: "meenapetw.firebaseapp.com",
  projectId: "meenapetw",
  storageBucket: "meenapetw.firebasestorage.app",
  messagingSenderId: "11863680243",
  appId: "1:11863680243:web:a7ceeb15b3e44572578386"
};

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Configuración de Cloudinary
const CLOUD_NAME = "h7v7iolz";
const UPLOAD_PRESET = "pet_unsigned"; // Asegúrate de que este preset exista y sea Unsigned en Cloudinary

// Elementos del DOM
const petForm = document.getElementById("pet-form");
const submitBtn = document.getElementById("submit-btn");
const petsGrid = document.getElementById("pets-grid");

// 1. Manejar el envío del formulario
if (petForm) {
  petForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("pet-name").value.trim() || "Sin nombre";
    const status = document.getElementById("pet-status").value;
    const type = document.getElementById("pet-type").value;
    const desc = document.getElementById("pet-desc").value.trim();
    const contact = document.getElementById("pet-contact").value.trim();
    const photoInput = document.getElementById("pet-photo");
    const photoFile = photoInput.files[0];

    if (!photoFile) {
      alert("Por favor selecciona una foto de la mascota.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Subiendo imagen...";

      // Subir archivo a Cloudinary
      const formData = new FormData();
      formData.append("file", photoFile);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error?.message || "Error al subir a Cloudinary");
      }

      const data = await res.json();
      const imageUrl = data.secure_url;

      submitBtn.textContent = "Guardando reporte...";

      // Guardar registro en Cloud Firestore
      await addDoc(collection(db, "reports"), {
        name: name,
        status: status,
        type: type,
        description: desc,
        contact: contact,
        imageUrl: imageUrl,
        createdAt: serverTimestamp()
      });

      alert("¡Reporte publicado exitosamente!");
      petForm.reset();
    } catch (error) {
      console.error("Error al publicar:", error);
      alert(`Ocurrió un error: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publicar Reporte";
    }
  });
}

// 2. Escuchar y mostrar reportes en tiempo real
if (petsGrid) {
  const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));

  onSnapshot(reportsQuery, (snapshot) => {
    petsGrid.innerHTML = "";

    if (snapshot.empty) {
      petsGrid.innerHTML = "<p>No hay reportes de mascotas registrados todavía.</p>";
      return;
    }

    snapshot.forEach((doc) => {
      const pet = doc.data();
      const card = document.createElement("div");
      card.className = "pet-card";

      const statusTag = pet.status === "perdido" 
        ? `<span class="badge badge-lost">Perdido</span>` 
        : `<span class="badge badge-found">Encontrado</span>`;

      card.innerHTML = `
        <div class="pet-img-container">
          <img src="${pet.imageUrl || 'https://via.placeholder.com/300'}" alt="${pet.name}" loading="lazy">
        </div>
        <div class="pet-info">
          <div class="pet-header">
            <h4>${pet.name}</h4>
            ${statusTag}
          </div>
          <p><strong>Tipo:</strong> ${pet.type}</p>
          <p><strong>Descripción:</strong> ${pet.description}</p>
          <p><strong>Contacto:</strong> ${pet.contact}</p>
        </div>
      `;

      petsGrid.appendChild(card);
    });
  }, (error) => {
    console.error("Error al cargar los reportes:", error);
  });
}
