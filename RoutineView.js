import { db } from '../../core/Store.js';

export class RoutineView {
    constructor() {
        this.container = null;
    }

    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    render(routines, progress) {
        // Separa as rotinas em dois grupos:
        // 'daily' = Coisas que reseta todo dia (Protocolos)
        // 'eventual' = Lembretes rápidos que você apaga quando faz
        const daily = routines.filter(r => r.type === 'daily');
        const eventual = routines.filter(r => r.type === 'eventual');

        // Formata a data de hoje para o cabeçalho
        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        this.container.innerHTML = `
            <div class="routine-container">
                
                <div class="routine-header-card">
                    <div class="header-top">
                        <div>
                            <h2 class="page-header-title"><i class="fa-solid fa-clipboard-check"></i> STATUS OPERACIONAL</h2>
                            <span class="page-date">${today}</span>
                        </div>
                        <div class="progress-number">
                            ${progress}%
                        </div>
                    </div>
                    
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    
                    <div class="header-actions">
                        <button id="btn-reset-day" class="btn-header-action">
                            <i class="fa-solid fa-rotate-right"></i> INICIAR NOVO CICLO (RESET)
                        </button>
                        <span class="info-text">Reseta apenas os protocolos diários</span>
                    </div>
                </div>

                <div class="routine-grid">
                    
                    <div class="routine-col daily-col">
                        <div class="col-header">
                            <i class="fa-solid fa-repeat"></i> PROTOCOLOS DIÁRIOS
                        </div>
                        
                        <div class="add-box">
                            <input type="text" id="input-daily" placeholder="Nova rotina fixa..." autocomplete="off">
                            <button id="btn-add-daily"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        
                        <div class="task-list-scroll">
                            ${daily.map(item => this.createItemHTML(item)).join('')}
                            ${daily.length === 0 ? '<div class="empty-state">Nenhum protocolo definido.<br>Adicione tarefas fixas aqui.</div>' : ''}
                        </div>
                    </div>

                    <div class="routine-col backlog-col">
                        <div class="col-header backlog-header">
                            <i class="fa-regular fa-note-sticky"></i> BACKLOG RÁPIDO
                        </div>
                        
                        <div class="add-box">
                            <input type="text" id="input-eventual" placeholder="Lembrete rápido..." autocomplete="off">
                            <button id="btn-add-eventual" class="btn-warn"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        
                        <div class="task-list-scroll">
                            ${eventual.map(item => this.createItemHTML(item)).join('')}
                            ${eventual.length === 0 ? '<div class="empty-state">Mente vazia, oficina do sucesso.<br>Sem pendências extras.</div>' : ''}
                        </div>
                    </div>

                </div>
            </div>

            <style>
                .routine-container {
                    padding: 20px; 
                    animation: fadeIn 0.4s ease; 
                    height: 100%; 
                    display: flex; 
                    flex-direction: column; 
                    gap: 20px;
                    overflow: hidden; /* O scroll é interno nas colunas */
                }

                /* --- HEADER --- */
                .routine-header-card {
                    background: linear-gradient(135deg, rgba(21, 26, 35, 0.9) 0%, rgba(11, 14, 20, 0.95) 100%);
                    border: 1px solid #334155; padding: 25px; border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.3); flex-shrink: 0;
                }
                
                .header-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; }
                .page-header-title { font-family: 'Rajdhani'; color: #fff; margin: 0; text-transform: uppercase; font-size: 1.4rem; letter-spacing: 1px; }
                .page-date { font-size: 0.8rem; color: #64748b; text-transform: capitalize; }
                
                .progress-number { font-family: 'JetBrains Mono'; font-size: 2rem; color: var(--color-primary); font-weight: bold; text-shadow: 0 0 15px rgba(0,240,255,0.4); }
                
                .progress-track { background: rgba(255,255,255,0.05); height: 10px; border-radius: 5px; overflow: hidden; margin-bottom: 15px; border: 1px solid #333; }
                .progress-fill { height: 100%; background: linear-gradient(90deg, var(--color-primary), #00ff9d); transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 0 15px var(--color-primary); }

                .header-actions { display: flex; align-items: center; gap: 15px; }
                .btn-header-action {
                    background: transparent; border: 1px solid #444; color: #e0e6ed; padding: 8px 15px;
                    font-size: 0.75rem; cursor: pointer; border-radius: 6px; transition: 0.2s; font-weight: 600;
                    display: flex; gap: 8px; align-items: center;
                }
                .btn-header-action:hover { border-color: var(--color-primary); color: #fff; background: rgba(0,240,255,0.05); }
                .info-text { font-size: 0.7rem; color: #555; font-style: italic; }

                /* --- GRID --- */
                .routine-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; flex: 1; overflow: hidden; min-height: 0; }
                
                .routine-col { 
                    background: rgba(21, 26, 35, 0.6); border: 1px solid #333; border-radius: 12px; 
                    display: flex; flex-direction: column; overflow: hidden; backdrop-filter: blur(5px);
                }
                .daily-col { border-top: 3px solid var(--color-primary); }
                .backlog-col { border-top: 3px solid var(--color-warning); }

                .col-header { 
                    padding: 15px; border-bottom: 1px solid #333; font-weight: 800; 
                    color: var(--color-primary); font-size: 0.9rem; letter-spacing: 1px; background: rgba(0,0,0,0.2);
                    display: flex; align-items: center; gap: 10px;
                }
                .backlog-header { color: var(--color-warning); }

                .add-box { display: flex; padding: 15px; gap: 10px; border-bottom: 1px solid #333; }
                .add-box input { 
                    flex: 1; background: rgba(0,0,0,0.3); border: 1px solid #444; color: #fff; 
                    padding: 10px; border-radius: 6px; outline: none; font-family: var(--font-main); transition: 0.2s;
                }
                .add-box input:focus { border-color: #666; background: rgba(0,0,0,0.5); }
                
                .add-box button { 
                    background: rgba(0,240,255,0.1); border: 1px solid var(--color-primary); color: var(--color-primary); 
                    width: 40px; border-radius: 6px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center;
                }
                .add-box button:hover { background: var(--color-primary); color: #000; }
                .add-box button.btn-warn { border-color: var(--color-warning); color: var(--color-warning); background: rgba(255, 200, 0, 0.1); }
                .add-box button.btn-warn:hover { background: var(--color-warning); color: #000; }

                .task-list-scroll { flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 8px; }
                .task-list-scroll::-webkit-scrollbar { width: 5px; }
                .task-list-scroll::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }

                .empty-state { text-align: center; color: #555; font-size: 0.85rem; margin-top: 40px; font-style: italic; line-height: 1.5; }

                /* --- ITEM --- */
                .routine-item {
                    display: flex; align-items: center; justify-content: space-between;
                    background: rgba(255,255,255,0.02); padding: 12px 15px;
                    border-radius: 8px; border: 1px solid transparent; transition: all 0.2s ease;
                    position: relative; overflow: hidden;
                }
                .routine-item:hover { background: rgba(255,255,255,0.05); border-color: #444; transform: translateX(2px); }
                
                .routine-item.done { opacity: 0.6; background: rgba(0,0,0,0.2); }
                .routine-item.done span { text-decoration: line-through; color: #666; }
                .routine-item.done .check-circle { border-color: var(--color-success); background: var(--color-success); color: #000; }
                
                .check-circle {
                    width: 22px; height: 22px; border: 2px solid #555; border-radius: 50%; 
                    cursor: pointer; margin-right: 15px; display: flex; align-items: center; justify-content: center;
                    transition: 0.2s; font-size: 0.8rem; flex-shrink: 0;
                }
                .check-circle:hover { border-color: #fff; }

                .btn-del-routine { 
                    color: #444; cursor: pointer; font-size: 0.9rem; padding: 5px; 
                    transition: 0.2s; opacity: 0; 
                }
                .routine-item:hover .btn-del-routine { opacity: 1; }
                .btn-del-routine:hover { color: var(--color-accent); transform: scale(1.2); }
            </style>
        `;
    }

    createItemHTML(item) {
        return `
            <div class="routine-item ${item.done ? 'done' : ''}" data-id="${item.id}">
                <div style="display:flex; align-items:center; flex:1;">
                    <div class="check-circle action-toggle" title="Marcar/Desmarcar">
                        ${item.done ? '<i class="fa-solid fa-check"></i>' : ''}
                    </div>
                    <span style="font-family:'Inter'; font-size:0.95rem; color:#e0e6ed; word-break:break-word;">${item.text}</span>
                </div>
                <i class="fa-solid fa-trash action-delete btn-del-routine" title="Remover"></i>
            </div>
        `;
    }
}