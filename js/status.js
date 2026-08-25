// verificar_status.js
let transacaoId = "REFERENCIA_ENVIADA_AO_SISTEMA";

// Verifica a cada 3 segundos se o cliente colocou o PIN e o pagamento foi confirmado
let checarPagamento = setInterval(function() {
    fetch('verificar_banco.php?ref=' + transacaoId)
        .then(response => response.json())
        .then(dados => {
            if (dados.status === 'pago') {
                clearInterval(checarPagamento);
                
                // Exibe as credenciais no ecrã para o utilizador ver antes de ser autenticado
                document.getElementById('status-msg').innerHTML = 
                    "<h3>Pago com Sucesso!</h3><p>Seu Voucher: <b>" + dados.voucher + "</b></p>";
                
                // Preenche o formulário oculto do MikroTik e faz o login automático
                document.getElementById('mikrotik_username').value = dados.voucher;
                document.getElementById('mikrotik_password').value = dados.senha;
                
                setTimeout(function() {
                    document.forms['mikrotik_login'].submit();
                }, 4000); // Aguarda 4 segundos para o utilizador ler o código do voucher
            }
        });
}, 3000);
