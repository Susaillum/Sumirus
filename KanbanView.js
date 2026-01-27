import { db } from './Store.js';

export class KanbanView {
    constructor() {
        this.container = null;
    }

    /**
     * Define onde o Kanban será renderizado na tela
     * @param {string} elementId - O ID do container principal (ex: 'kanban-container')
     */
    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    /**
     * Renderiza o quadro completo com colunas e tarefas
     */
    render() {
        // Segurança: Se o container não existir, para tudo.
        if (!this.container) return;

        const columns = db.state.columns;
        const tasks = db.state.tasks || []; // Garante array vazio se não houver tarefas

        // Monta a estrutura base: O Quadro (Board) + Área Invisível de Impressão
        this.container.innerHTML = `
            <div class="kanban-board" id="kanban-board"></div>
            <div id="print-area"></div>
        `;
        
        const board = this.container.querySelector('#kanban-board');

        // Loop para criar cada coluna (Entrada, Produção, Análise, Pronto)
        for (const [key, col] of Object.entries(columns)) {
            
            // Filtra as tarefas que pertencem a esta coluna específica
            const tasksInCol = tasks.filter(t => t.status === key);
            
            // Botão de Impressão (Aparece apenas na coluna 'pronto')
            const printBtn = key === 'pronto' 
                ? `<i class="fa-solid fa-print btn-print-manifest" title="Imprimir Romaneio / Manifesto" style="cursor:pointer; margin-left:auto; color:var(--color-primary); font-size:1rem;"></i>` 
                : '';

            // HTML da Coluna
            const colHTML = `
                <div class="kanban-column" data-status="${key}">
                    
                    <div class="column-header" style="border-top: 3px solid ${col.color}">
                        <div class="column-title">
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div style="width: 8px; height: 8px; border-radius: 50%; background: ${col.color}; box-shadow: 0 0 8px ${col.color}"></div>
                                <span>${col.title}</span>
                            </div>
                            
                            <div style="display:flex; align-items:center; gap:10px;">
                                <span class="column-count">${tasksInCol.length}</span>
                                ${printBtn}
                            </div>
                        </div>
                    </div>

                    <div class="column-body" id="col-${key}">
                        ${tasksInCol.map(task => this.createCardHTML(task)).join('')}
                    </div>
                </div>
            `;
            
            // Adiciona a coluna ao quadro
            board.innerHTML += colHTML;
        }
    }

    /**
     * Busca a cor e o estilo visual baseados no nome do Cliente
     * Se o cliente não existir, retorna um cinza padrão.
     */
    getClientStyle(clientName) {
        if (!clientName) return { color: '#64748b', accent: '#fff' }; 
        
        // Busca case-insensitive
        const client = db.state.clients.find(c => c.name.toUpperCase() === clientName.toUpperCase());
        
        if (client) {
            return { color: client.color, accent: '#fff' };
        }
        
        // Fallback: cor padrão se o cliente foi deletado ou é novo
        return { color: '#ffd700', accent: '#000' }; 
    }

    /**
     * Formata datas ISO (YYYY-MM-DD) para PT-BR (DD/MM/YYYY)
     */
    formatDate(dateString) {
        if (!dateString) return 'S/ Prazo';
        
        // Garante que o fuso horário não mude o dia
        const dateToParse = dateString.includes('T') ? dateString : dateString + 'T12:00:00';
        const date = new Date(dateToParse);
        
        if (isNaN(date.getTime())) return '---'; 
        return date.toLocaleDateString('pt-BR');
    }

    /**
     * Gera o HTML de um único cartão de tarefa
     */
    createCardHTML(task) {
        // Formata Valor Monetário
        const value = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(task.value || 0);
        
        // Formata ID (apenas os 4 primeiros caracteres para ficar limpo)
        const safeId = String(task.id || '???'); 
        const displayId = safeId.length > 4 ? safeId.substring(0, 4) : safeId;
        
        // Pega estilo do cliente
        const style = this.getClientStyle(task.client);
        
        // Formata Data
        const dateLabel = task.dueDate ? this.formatDate(task.dueDate) : 'Sem Data';

        // --- NOVO: Visualização do Responsável ---
        const resp = task.assignee || 'Sem Dono';
        const respHtml = resp !== 'Sem Dono' ? `<span style="font-size:0.65rem; color:#888; margin-top:2px;"><i class="fa-solid fa-user"></i> ${resp}</span>` : '';

        // Retorna o HTML do Card
        return `
            <div class="task-card" draggable="true" data-id="${task.id}" style="border-left-color: ${style.color}">
                
                <div class="task-header">
                    <span style="opacity: 0.7;">#${displayId.toUpperCase()}</span>
                    <span style="font-size: 0.7rem; opacity: 0.5;">
                        <i class="fa-regular fa-calendar"></i> ${dateLabel}
                    </span>
                </div>
                
                <div class="task-title">${task.title}</div>
                
                <div class="task-footer">
                    <div class="task-tags">
                        <span style="border: 1px solid ${style.color}; background: ${style.color}15; color: ${style.color}; padding: 2px 8px; border-radius: 4px;">
                            ${task.client || 'Sem Cliente'}
                        </span>
                    </div>
                    <div style="display:flex; flex-direction:column; align-items:flex-end;">
                        <div class="task-value">${value}</div>
                        ${respHtml}
                    </div>
                </div>
            </div>
        `;
    }
}
