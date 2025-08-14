document.addEventListener('DOMContentLoaded', function() {
    const API_CONTACT_URL = `${window.API_BASE_URL}contact/`;
    document.getElementById('current-year').textContent = new Date().getFullYear();
    
    function alertar(event) {
        if (!confirm('Você será redirecionado para um site externo. Deseja continuar?')) {
            event.preventDefault();
        }
    }
    
    document.querySelectorAll('a[onclick="alertar()"]').forEach(link => {
        link.addEventListener('click', alertar);
    });
    
    const form = document.getElementById('atendaForm');
    if (form) {
        form.addEventListener('submit', async function(event) {
            event.preventDefault();
            
            const nome = document.getElementById('nomesobrenome').value.trim();
            const telefone = document.getElementById('telefone').value.trim();
            const email = document.getElementById('email').value.trim();
            const abordagem = document.getElementById('abordagem').value.trim();
            const contatoPreferencial = document.querySelector('input[name="contato"]:checked').value;
            const turnoPreferencial = document.getElementById('turno').value;
            const diaPreferencial = document.getElementById('dia').value;  
            const mensagem = document.getElementById('mensagem').value.trim();

            
            if (!nome || !telefone || !email || !abordagem) {
                alert('Por favor, preencha todos os campos obrigatórios (Nome, Telefone, Email, Abordagem).');
                return;
            }
            
            if (!/^\(\d{2}\) \d{5}-\d{4}$/.test(telefone)) {
                alert('Por favor, insira um telefone válido no formato (XX) XXXXX-XXXX.');
                return;
            }

            const formData = {
                name: nome,
                email: email,
                phone: telefone,
                message: `Abordagem: ${abordagem}\nContato Preferencial: ${contatoPreferencial}\nTurno: ${turnoPreferencial}\nDia: ${diaPreferencial}\nMensagem Adicional: ${mensagem}`,
            };

            try {
                const response = await fetch(API_CONTACT_URL, {
                    method: 'POST',
                    headers: window.getAuthHeaders(), 
                    body: JSON.stringify(formData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Erro da API ao enviar formulário:', errorData);
                    let errorMessage = `Erro ao enviar: ${response.status} ${response.statusText}`;
                    if (errorData.email) errorMessage += ` - Email: ${errorData.email[0]}`; 
                    
                    alert(`Falha ao enviar sua solicitação: ${errorMessage}.`);
                    return;
                }

                alert('Formulário enviado com sucesso! Entraremos em contato em breve.');
                form.reset();
            } catch (error) {
                console.error('Erro na requisição Fetch do formulário:', error);
                alert(`Erro na comunicação: ${error.message}. Verifique sua conexão ou o console.`);
            }
        });
    }
    
    const telefoneInput = document.getElementById('telefone');
    if (telefoneInput) {
        telefoneInput.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 0) {
                value = '(' + value;
            }
            if (value.length > 3) {
                value = value.substring(0, 3) + ') ' + value.substring(3);
            }
            if (value.length > 10) {
                value = value.substring(0, 10) + '-' + value.substring(10, 14);
            }
            
            e.target.value = value;
        });
    }
});