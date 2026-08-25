    let contador = 0;
const slides = document.querySelector('.slides');
const totalSlides = document.querySelectorAll('.slide').length;

function proximoSlide() {
    contador++;
    
    // Se passar do último slide, volta para o primeiro
    if (contador >= totalSlides) {
        contador = 0;
    }
    
    // Move o container dos slides
    let novaPosicao = -contador * 100;
    slides.style.transform = `translateX(${novaPosicao}%)`;
}

// Troca de slide a cada 3 segundos (3000 milissegundos)
setInterval(proximoSlide, 3000);