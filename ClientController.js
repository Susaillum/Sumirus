import { db } from '../../core/Store.js';
import { ClientView } from './ClientView.js';

export class ClientController {
    constructor() {
        this.view = new ClientView();
        
        // Estado local: Armazena o ID do cliente que está sendo editado no momento
        // Se null, o formulário está em modo "Adicionar Novo"
        this.editingId = null;
    }

    /**
     * Inicializa o módulo CRM
     */
    init() {
        console.log('[CRM] Módulo de Gestão de Parceiros Iniciado.');
        this.view.mount('kanban-container');
        this.refresh();
    }

    /**
     * Calcula métricas financeiras e operacionais para cada cliente
     * Baseado nas tarefas ativas no Kanban
     */
    calculateStats() {
        const stats = {};

        // 1. Inicializa todos os clientes cadastrados com zero
        db.state.clients.forEach(c => {
            stats[c.name] = { count: 0, value: 0 };
        });

        // 2. Varre todas as tarefas do sistema
        db.state.tasks.forEach(task => {
            // Ignora tarefas já finalizadas (Pronto) para a contagem de "Em Aberto"
            if (task.status !== 'pronto') {
                const clientName = task.client;
                const taskValue = parseFloat(task.value) || 0;

                // Se o cliente existe na lista oficial
                if (stats[clientName] !== undefined) {
                    stats[clientName].count++;
                    stats[clientName].value += taskValue;
                } 
                // Se for um cliente antigo ou digitado manualmente (Legado)
                else {
                    if (!stats[clientName]) stats[clientName] = { count: 0, value: 0 };
                    stats[clientName].count++;
                    stats[clientName].value += taskValue;
                }
            }
        });

        return stats;
    }

    /**
     * Configura todos os ouvintes de eventos (Cliques, Envios, etc)
     * Deve ser chamado toda vez que a tela é redesenhada
     */
    bindEvents() {
        // --- 1. BOTÃO DE ADICIONAR NOVO ---
        const btnAdd = document.getElementById('btn-add-client');
        if (btnAdd) {
            btnAdd.onclick = () => {
                const name = document.getElementById('client-name').value;
                const contact = document.getElementById('client-contact').value;
                const color = document.getElementById('client-color').value;

                // Validação
                if (!name || name.trim() === '') {
                    return window.SumirusSystem.notify('O nome da empresa é obrigatório!', 'warning');
                }

                // Criação do Objeto
                const newClient = {
                    id: Date.now(),
                    name: name.toUpperCase().trim(),
                    contact: contact || 'Geral',
                    color: color,
                    status: 'Ativo'
                };
                
                // Persistência
                db.state.clients.push(newClient);
                db.save();
                
                window.SumirusSystem.notify(`Parceiro ${name} adicionado com sucesso!`, 'success');
                this.refresh();
            };
        }

        // --- 2. BOTÃO DE SALVAR EDIÇÃO ---
        const btnUpdate = document.getElementById('btn-update-client');
        if (btnUpdate) {
            btnUpdate.onclick = () => {
                const name = document.getElementById('client-name').value;
                const contact = document.getElementById('client-contact').value;
                const color = document.getElementById('client-color').value;
                
                if (!name || name.trim() === '') {
                    return window.SumirusSystem.notify('O nome da empresa não pode ficar vazio!', 'warning');
                }

                // Objeto Atualizado
                const updatedClient = {
                    id: this.editingId, // Mantém o ID original
                    name: name.toUpperCase().trim(),
                    contact: contact,
                    color: color,
                    status: 'Ativo'
                };

                // Atualiza no Banco
                db.updateClient(updatedClient);
                
                // Finaliza modo de edição
                this.editingId = null; 
                window.SumirusSystem.notify('Dados do parceiro atualizados!', 'success');
                this.refresh();
            };
        }

        // --- 3. BOTÃO DE CANCELAR EDIÇÃO ---
        const btnCancel = document.getElementById('btn-cancel-edit');
        if (btnCancel) {
            btnCancel.onclick = () => {
                this.editingId = null; // Limpa estado
                this.refresh(); // Redesenha a tela no modo "Adicionar"
                window.SumirusSystem.notify('Edição cancelada.', 'warning');
            };
        }

        // --- 4. AÇÕES NOS CARDS (EDITAR / EXCLUIR / FILTRAR) ---
        
        // Botão Editar (Lápis no Card)
        const editBtns = document.querySelectorAll('.btn-edit-client');
        editBtns.forEach(btn => {
            btn.onclick = () => {
                // Captura o ID e coloca o controller em modo de edição
                this.editingId = parseInt(btn.getAttribute('data-id'));
                
                // Rola a página para o topo (onde está o formulário)
                const container = document.querySelector('.module-container');
                if(container) container.scrollTo({ top: 0, behavior: 'smooth' });

                this.refresh();
            };
        });

        // Botão Excluir (Lixeira no Card)
        const deleteBtns = document.querySelectorAll('.btn-delete-client');
        deleteBtns.forEach(btn => {
            btn.onclick = () => {
                const idToDelete = parseInt(btn.getAttribute('data-id'));
                
                if (confirm('ATENÇÃO: Deseja excluir este parceiro?\nIsso não apaga as tarefas dele, apenas o cadastro.')) {
                    db.removeClient(idToDelete);
                    
                    // Se o usuário deletou quem ele estava editando, cancela a edição
                    if (this.editingId === idToDelete) {
                        this.editingId = null;
                    }
                    
                    window.SumirusSystem.notify('Parceiro removido.', 'error');
                    this.refresh();
                }
            };
        });

        // Botão "Ver Tarefas" (Filtro)
        const viewBtns = document.querySelectorAll('.btn-view-tasks');
        viewBtns.forEach(btn => {
            btn.onclick = () => {
                const clientName = btn.getAttribute('data-client');
                // Chama a função global de navegação criada no main.js
                window.SumirusSystem.goToKanbanWithFilter(clientName);
            };
        });
    }

    /**
     * Redesenha a interface
     */
    refresh() {
        const stats = this.calculateStats();
        // Passa o ID de edição para a View saber como desenhar o formulário
        this.view.render(stats, this.editingId);
        this.bindEvents();
    }
}