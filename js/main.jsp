// SCRIPT DO BANNER ROTATIVO (Troca a cada 5 segundos)
    let slideIndex = 0;
    const slides = document.querySelectorAll(".slide");
    setInterval(() => {
        slides[slideIndex].style.display = "none";
        slideIndex = (slideIndex + 1) % slides.length;
        slides[slideIndex].style.display = "block";
    }, 5000);

    // CONTROLO DO MODAL
    function abrirModal(id, nome, preco) {
        document.getElementById('form_pacote_id').value = id;
        document.getElementById('modal-titulo-pacote').innerText = nome + " - " + preco + " MT";
        document.getElementById('modalPagamento').style.display = 'flex';
    }

    function fecharModal() {
        document.getElementById('modalPagamento').style.display = 'none';
    }

    // VALIDAÇÃO INTELIGENTE DO PREFIXO (Vodacom ou Movitel)
    function validarOperadora(input) {
        const num = input.value;
        const btn = document.getElementById('btn-submit-pagar');
        
        // Verifica se tem 9 dígitos e se começa com os prefixos corretos de Moçambique
        // Vodacom (84, 85) ou Movitel (86, 87)
        if (num.length === 9 && (num.startsWith('84') || num.startsWith('85') || num.startsWith('86') || num.startsWith('87'))) {
            btn.removeAttribute('disabled');
            if (num.startsWith('84') || num.startsWith('85')) {
                btn.style.backgroundColor = "#e60000"; // Cor M-Pesa (Vermelho)
                btn.innerText = "Pagar com M-Pesa";
            } else {
                btn.style.backgroundColor = "#fcc200"; // Cor e-Mola (Amarelo)
                btn.style.color = "#000";
                btn.innerText = "Pagar com e-Mola";
            }
        } else {
            btn.setAttribute('disabled', 'true');
            btn.style.backgroundColor = "#888";
            btn.style.color = "white";
            btn.innerText = "Introduza número válido";
        }
    }