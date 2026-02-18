/* ================================================================
   1. VARIABLES Y CONFIGURACIÓN DE CARGA DINÁMICA
   ================================================================ */
const galleryContainer = document.getElementById('dynamic-gallery-container');
const prayerContainer = document.getElementById('dynamic-prayer-container');
const donationContainer = document.getElementById('dynamic-donation-container');

let galleryLoaded = false;
let prayerLoaded = false;
let donationLoaded = false;

// Variables globales para el carrusel
let currentImageIndex = 0;
let allGalleryImages = [];

async function fetchContent(url, container) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error 404: No se encontró el archivo ${url}`);
        const html = await response.text();
        container.innerHTML = html;
        container.style.opacity = "0";
        container.style.transition = "opacity 0.5s ease-in";
        setTimeout(() => container.style.opacity = "1", 10);
    } catch (error) {
        console.error("Error:", error);
    }
}

/* ================================================================
   2. OBSERVADOR DE SCROLL
   ================================================================ */
const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            if (entry.target === galleryContainer && !galleryLoaded) {
                galleryLoaded = true;
                fetchContent('gallery.html', galleryContainer);
            }
            if (entry.target === prayerContainer && !prayerLoaded) {
                prayerLoaded = true;
                fetchContent('pedidosdeoracion.html', prayerContainer);
            }
            if (entry.target === donationContainer && !donationLoaded) {
                donationLoaded = true;
                fetchContent('donaciones.html', donationContainer);
            }
        }
    });
}, { rootMargin: "0px 0px 150px 0px" });

if (galleryContainer) sectionObserver.observe(galleryContainer);
if (prayerContainer) sectionObserver.observe(prayerContainer);
if (donationContainer) sectionObserver.observe(donationContainer);

/* ================================================================
   3. AUTOMATIZACIÓN DE PROGRAMACIÓN Y RELOJ (SIN SEGUNDOS)
   ================================================================ */
function obtenerTiempoNica() {
    return new Date(new Date().toLocaleString("en-US", {timeZone: "America/Managua"}));
}

async function actualizarEstadoEnVivo() {
    try {
        const response = await fetch('programacion.json');
        if (!response.ok) return;
        
        const data = await response.json();
        const ahoraEnNica = obtenerTiempoNica();
        
        const diaSemana = ahoraEnNica.getDay();
        const horas = ahoraEnNica.getHours().toString().padStart(2, '0');
        const minutos = ahoraEnNica.getMinutes().toString().padStart(2, '0');
        const horaActualStr = `${horas}:${minutos}`;

        const nicaClockEl = document.getElementById('nica-clock');
        if (nicaClockEl) {
            nicaClockEl.innerText = ahoraEnNica.toLocaleTimeString("es-NI", { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: true 
            });
        }

        let programas;
        if (diaSemana === 5) { programas = data.viernes; } 
        else if (diaSemana === 6) { programas = data.sabado; } 
        else { programas = data.semana; }

        let programaActual = "Programación Regular";
        let proximoPrograma = "Consulte Horario";

        if (programas && programas.length > 0) {
            let indiceEncontrado = -1;
            for (let i = 0; i < programas.length; i++) {
                if (horaActualStr >= programas[i].hora) {
                    indiceEncontrado = i;
                } else {
                    break;
                }
            }

            if (indiceEncontrado !== -1) {
                programaActual = programas[indiceEncontrado].titulo;
                let siguienteIndice = (indiceEncontrado + 1) % programas.length;
                let horaSiguiente = programas[siguienteIndice].hora;
                let [h, m] = horaSiguiente.split(':');
                let ampm = h >= 12 ? 'PM' : 'AM';
                let h12 = h % 12 || 12;
                let horaFormateada = `${h12}:${m} ${ampm}`;
                proximoPrograma = `${programas[siguienteIndice].titulo} (${horaFormateada})`;
            } else {
                programaActual = programas[programas.length - 1].titulo;
                proximoPrograma = `${programas[0].titulo} (${programas[0].hora})`;
            }
        }

        const currentShowEl = document.getElementById('current-show');
        const nextShowEl = document.getElementById('next-show');
        if (currentShowEl) currentShowEl.innerText = programaActual;
        if (nextShowEl) nextShowEl.innerText = proximoPrograma;

    } catch (error) {
        console.error("Error en programación:", error);
    }
}

setInterval(actualizarEstadoEnVivo, 30000);
actualizarEstadoEnVivo();

/* ================================================================
   4. FUNCIONES EXTRAS (HEADER, ANCLAS Y SCROLL)
   ================================================================ */
const mainHeader = document.getElementById('mainHeader');
const scrollTopBtn = document.getElementById('scrollTopBtn');

window.addEventListener('scroll', () => {
    if (window.scrollY > 80) { 
        mainHeader.classList.add('scrolled'); 
    } else { 
        mainHeader.classList.remove('scrolled'); 
    }

    if (scrollTopBtn) {
        scrollTopBtn.style.display = (window.scrollY > 300) ? "flex" : "none";
    }
});

document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId.startsWith('#')) {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({ top: targetElement.offsetTop - 80, behavior: 'smooth' });
            }
        }
    });
});

/* ================================================================
   5. LÓGICA DE CARRUSEL (LIGHTBOX INTERACTIVO)
   ================================================================ */
function updateLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const currentImgData = allGalleryImages[currentImageIndex];
    
    if (currentImgData) {
        lightboxImg.style.opacity = "0";
        setTimeout(() => {
            lightboxImg.src = currentImgData.src;
            // Busca el texto en el pie de foto de la galería
            const caption = currentImgData.closest('.gallery-item').querySelector('.gallery-caption')?.innerText;
            lightboxCaption.innerText = caption || "";
            lightboxImg.style.opacity = "1";
        }, 150);
    }
}

function openLightbox(element) {
    // Escanea todas las imágenes disponibles en la galería en ese momento
    allGalleryImages = Array.from(document.querySelectorAll('.gallery-item img'));
    const clickedImg = element.querySelector('img');
    currentImageIndex = allGalleryImages.indexOf(clickedImg);
    
    updateLightbox();
    
    document.getElementById('lightbox').classList.add('active');
    document.body.style.overflow = 'hidden'; 
}

// Eventos de navegación
document.querySelector('.next-photo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageIndex = (currentImageIndex + 1) % allGalleryImages.length;
    updateLightbox();
});

document.querySelector('.prev-photo')?.addEventListener('click', (e) => {
    e.stopPropagation();
    currentImageIndex = (currentImageIndex - 1 + allGalleryImages.length) % allGalleryImages.length;
    updateLightbox();
});

// Navegación por teclado
document.addEventListener('keydown', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox.classList.contains('active')) return;
    
    if (e.key === "ArrowRight") document.querySelector('.next-photo').click();
    if (e.key === "ArrowLeft") document.querySelector('.prev-photo').click();
    if (e.key === "Escape") cerrarLightbox();
});

function cerrarLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
        lightbox.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

// Cerrar al hacer click fuera o en la X
document.addEventListener('click', (e) => {
    const lightbox = document.getElementById('lightbox');
    if (e.target.classList.contains('close-lightbox') || e.target === lightbox) {
        cerrarLightbox();
    }
});

/* ================================================================
   6. FUNCIONES FINALES (TOP Y COPYRIGHT)
   ================================================================ */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

const yearSpan = document.getElementById('year');
if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
}