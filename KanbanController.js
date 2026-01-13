import { db } from './Store.js';
import { bus } from './EventBus.js';
import { KanbanView } from './KanbanView.js';

export class KanbanController {
    constructor() {
        this.view = new KanbanView();
        this.draggedCardId = null;
        this.targetCardId = null; 
    }

    init() {
        console.log('[KANBAN] Sistema Iniciado.');
        this.view.mount('kanban-container');
        
        // 1. Renderiza o Quadro
        this.view.render();

        // 2. Aplica Filtros se vierem do CRM
        if (window.SumirusSystem.tempFilter) {
            this.applyFilter(window.SumirusSystem.tempFilter);
            window.SumirusSystem.tempFilter = null;
        }

        // 3. Verificações Visuais
        this.checkDeadlines();
        this.setupPrint(); // <--- Impressão Ativada

        // 4. Sistema de Eventos (Salvar)
        bus.listeners['kanban:save-demand'] = []; 
        bus.subscribe('kanban:save-demand', (dados) => this.handleSaveDemand(dados));

        // 5. Interações do Usuário
        this.setupDragAndDrop();
        this.setupContextMenu();
        this.setupGlobalClicks();
        this.setupSearch(); 
    }

    // --- FUNÇÃO DE IMPRESSÃO (ROMANEIO) ---
    setupPrint() {
        const container = document.getElementById('kanban-container');
        if(!container) return;

        // Delegação de evento para o botão de imprimir
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-print-manifest')) {
                this.printManifest();
            }
        });
    }

    printManifest() {
        // 1. Filtra apenas tarefas prontas
        const tasks = db.state.tasks.filter(t => t.status === 'pronto');
        
        if (tasks.length === 0) {
            return window.SumirusSystem.notify('Nenhuma carga pronta para expedição.', 'warning');
        }

        // 2. Gera o HTML do Relatório
        const today = new Date().toLocaleString('pt-BR');
        let total = 0;
        
        let html = `
            <div style="text-align:center; margin-bottom:30px;">
                <h1 style="margin:0; font-size:24px;">ROMANEIO DE EXPEDIÇÃO</h1>
                <p style="margin:5px 0; font-size:14px;">SUMIRUS LOGISTICS • Emissão: ${today}</p>
            </div>
            
            <table class="manifest-table" style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead>
                    <tr style="background:#eee;">
                        <th style="border:1px solid #000; padding:8px;">ID</th>
                        <th style="border:1px solid #000; padding:8px;">CLIENTE</th>
                        <th style="border:1px solid #000; padding:8px;">DESCRIÇÃO / TÍTULO</th>
                        <th style="border:1px solid #000; padding:8px;">VALOR</th>
                        <th style="border:1px solid #000; padding:8px; text-align:center;">CONFERÊNCIA</th>
                    </tr>
                </thead>
                <tbody>
        `;

        tasks.forEach(t => {
            const val = parseFloat(t.value) || 0;
            total += val;
            html += `
                <tr>
                    <td style="border:1px solid #000; padding:8px;">#${t.id.substring(0,4).toUpperCase()}</td>
                    <td style="border:1px solid #000; padding:8px;">${t.client}</td>
                    <td style="border:1px solid #000; padding:8px;">${t.title}</td>
                    <td style="border:1px solid #000; padding:8px;">R$ ${val.toFixed(2)}</td>
                    <td style="border:1px solid #000; padding:8px; text-align:center;">[ ] OK</td>
                </tr>
            `;
        });

        html += `
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3" style="text-align:right; font-weight:bold; padding:8px; border:1px solid #000;">TOTAL CARGA:</td>
                        <td colspan="2" style="font-weight:bold; padding:8px; border:1px solid #000;">R$ ${total.toFixed(2)}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top:60px; display:flex; justify-content:space-between; gap:50px;">
                <div style="border-top:1px solid #000; width:45%; text-align:center; padding-top:5px; font-size:10px;">
                    ASSINATURA DO MOTORISTA
                </div>
                <div style="border-top:1px solid #000; width:45%; text-align:center; padding-top:5px; font-size:10px;">
                    ASSINATURA DO CONFERENTE
                </div>
            </div>
        `;

        // 3. Injeta e Imprime
        const printArea = document.getElementById('print-area');
        if(printArea) {
            printArea.innerHTML = html;
            window.print();
        }
    }

    // --- MANIPULAÇÃO DE TAREFAS ---
    handleSaveDemand(dados) {
        if (!dados.titulo) {
            return window.SumirusSystem.notify('O título é obrigatório!', 'error');
        }
        
        const currentUser = db.state.currentUser ? db.state.currentUser.name : 'Operador';

        if (dados.id) {
            // Edição
            const idx = db.state.tasks.findIndex(t => t.id == dados.id);
            if (idx !== -1) {
                const old = db.state.tasks[idx];
                let action = 'ATUALIZADO';
                if(old.status !== dados.status) action = `MOVIDO P/ ${dados.status.toUpperCase()}`;
                
                if(!old.history) old.history = [];
                old.history.push({ action: `${action} POR ${currentUser.toUpperCase()}`, date: new Date().toISOString() });

                db.state.tasks[idx] = { 
                    ...old, 
                    title: dados.titulo, 
                    client: dados.cliente, 
                    value: parseFloat(dados.valor) || 0, 
                    dueDate: dados.dueDate, 
                    description: dados.description, 
                    status: dados.status, 
                    evidences: dados.evidences || old.evidences || [] 
                };
            }
        } else {
            // Criação
            db.addTask({
                title: dados.titulo, 
                client: dados.cliente || 'INTERNO', 
                value: parseFloat(dados.valor) || 0,
                dueDate: dados.dueDate, 
                description: dados.description, 
                status: 'entrada',
                evidences: dados.evidences || [], 
                history: [{ action: `CRIADO POR ${currentUser.toUpperCase()}`, date: new Date().toISOString() }]
            });
        }
        
        db.save();
        this.view.render();
        this.checkDeadlines();
    }

    deleteTask(id) {
        db.state.tasks = db.state.tasks.filter(t => t.id != id);
        db.save();
        this.view.render();
        this.checkDeadlines();
    }

    // --- INTERFACE E EVENTOS ---
    setupSearch() {
        const searchInput = document.getElementById('global-search');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.task-card');

            cards.forEach(card => {
                const title = card.querySelector('.task-title')?.innerText.toLowerCase() || '';
                const client = card.querySelector('.task-tags')?.innerText.toLowerCase() || '';
                const idText = card.querySelector('.task-header')?.innerText.toLowerCase() || '';

                const match = title.includes(term) || client.includes(term) || idText.includes(term);
                
                if (match) {
                    card.style.display = 'block';
                    setTimeout(() => card.style.opacity = '1', 50);
                } else {
                    card.style.opacity = '0.2';
                    card.style.display = 'none';
                }
            });
        });
    }

    setupDragAndDrop() {
        const container = document.getElementById('kanban-container');
        if(!container) return;

        // Inicio do Arrasto
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('task-card')) {
                this.draggedCardId = e.target.getAttribute('data-id');
                e.target.style.opacity = '0.4';
            }
        });

        // Fim do Arrasto
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('task-card')) {
                e.target.style.opacity = '1';
                this.draggedCardId = null;
            }
        });

        // Permitir Soltar
        container.addEventListener('dragover', (e) => e.preventDefault());

        // Soltar
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            const col = e.target.closest('.kanban-column');
            
            if (col && this.draggedCardId) {
                const status = col.getAttribute('data-status');
                const task = db.state.tasks.find(t => t.id == this.draggedCardId);
                
                if(task && task.status !== status) {
                    // Histórico
                    if(!task.history) task.history = [];
                    task.history.push({
                        action: `MOVIDO P/ ${status.toUpperCase()}`, 
                        date: new Date().toISOString()
                    });
                    
                    db.moveTask(this.draggedCardId, status);
                    this.view.render();
                    this.checkDeadlines();
                }
            }
        });
    }

    setupContextMenu() {
        const menu = document.getElementById('context-menu');
        
        // Abrir Menu
        document.addEventListener('contextmenu', (e) => {
            const card = e.target.closest('.task-card');
            if (card) {
                e.preventDefault(); 
                this.targetCardId = card.getAttribute('data-id');
                menu.style.top = `${e.clientY}px`;
                menu.style.left = `${e.clientX}px`;
                menu.classList.add('visible');
            }
        });

        // Botão Excluir
        const btnDelete = document.getElementById('ctx-delete');
        if(btnDelete) {
            const newDelete = btnDelete.cloneNode(true);
            btnDelete.parentNode.replaceChild(newDelete, btnDelete);
            
            newDelete.onclick = () => {
                if (this.targetCardId && confirm('Excluir esta missão?')) {
                    this.deleteTask(this.targetCardId);
                    menu.classList.remove('visible');
                }
            };
        }

        // Botão Editar
        const btnEdit = document.getElementById('ctx-edit');
        if(btnEdit) {
            const newEdit = btnEdit.cloneNode(true);
            btnEdit.parentNode.replaceChild(newEdit, btnEdit);
            
            newEdit.onclick = () => {
                const tarefa = db.state.tasks.find(t => t.id == this.targetCardId);
                if (tarefa) window.SumirusSystem.openModal(tarefa);
                menu.classList.remove('visible');
            };
        }
    }

    setupGlobalClicks() {
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.context-menu')) {
                const menu = document.getElementById('context-menu');
                if(menu) menu.classList.remove('visible');
            }
        });
    }

    // --- REGRAS DE NEGÓCIO ---
    applyFilter(clientName) {
        const cards = document.querySelectorAll('.task-card');
        let count = 0;
        
        // Header personalizado
        const header = document.querySelector('.top-bar .page-title');
        if(header) {
            header.innerHTML = `Fluxo: <span style="color:var(--color-primary)">${clientName}</span> <i class="fa-solid fa-xmark" style="cursor:pointer; font-size:1rem; margin-left:10px;" onclick="location.reload()" title="Limpar Filtro"></i>`;
        }

        cards.forEach(card => {
            const cardClient = card.querySelector('.task-tags')?.innerText || '';
            if (cardClient.toUpperCase().includes(clientName.toUpperCase())) {
                card.style.display = 'block';
                count++;
            } else {
                card.style.display = 'none';
            }
        });
        
        if(count === 0 && window.SumirusSystem.notify) {
            window.SumirusSystem.notify(`Nenhuma tarefa encontrada para ${clientName}`, 'warning');
        }
    }

    checkDeadlines() {
        const cards = document.querySelectorAll('.task-card');
        const today = new Date().toISOString().split('T')[0];

        cards.forEach(card => {
            const id = card.getAttribute('data-id');
            const task = db.state.tasks.find(t => t.id == id);

            if (task && task.dueDate && task.status !== 'pronto') {
                if (task.dueDate < today) {
                    // Atrasado
                    card.style.border = '1px solid #ff003c';
                    card.style.boxShadow = '0 0 15px rgba(255, 0, 60, 0.2)';
                    
                    const header = card.querySelector('.task-header');
                    if(header && !header.innerHTML.includes('fa-triangle-exclamation')) {
                        header.innerHTML += ' <i class="fa-solid fa-triangle-exclamation" style="color:#ff003c; margin-left:5px;" title="ATRASADO"></i>';
                    }
                } else if (task.dueDate === today) {
                    // Hoje
                    card.style.border = '1px solid #fcee0a';
                }
            }
        });
    }
}
