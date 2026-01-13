import { db } from '../../core/Store.js';

export class DashboardView {
    constructor() {
        this.container = null;
    }

    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    render(kpis, projects) {
        if (!this.container) return;

        // Formatação de dinheiro
        const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
        
        // Pega contagem de Ideias para o 4º Card
        const ideasCount = (db.state.ideas || []).length;

        this.container.innerHTML = `
            <div class="dashboard-wrapper">
                
                <div class="bakery-section">
                    <div class="bakery-header">
                        <h4 class="section-title text-primary">
                            <i class="fa-solid fa-robot"></i> SUMIRUS AUTO-LOGIC
                        </h4>
                        <span class="beta-badge">BETA V3.0</span>
                    </div>
                    
                    <p class="bakery-desc">
                        Digite comandos operacionais rápidos e deixe a IA classificar.<br>
                        Ex: <i>"Cobrar Samengo 1500 referente ao frete extra para Marcos"</i>
                    </p>
                    
                    <div class="bakery-input-group">
                        <div class="input-icon-wrapper">
                            <i class="fa-solid fa-terminal"></i>
                            <input type="text" id="bakery-input" class="bakery-input" placeholder="Digite sua demanda aqui..." autocomplete="off">
                        </div>
                        <button id="btn-bake" class="btn-neon-action">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> PROCESSAR
                        </button>
                    </div>
                </div>

                <div class="kpi-grid">
                    <div class="kpi-card">
                        <div class="kpi-icon icon-primary">
                            <i class="fa-solid fa-wallet"></i>
                        </div>
                        <div class="kpi-content">
                            <span class="kpi-label">Previsão Financeira</span>
                            <h3 class="kpi-value">${fmt(kpis.totalValue)}</h3>
                        </div>
                    </div>
                    
                    <div class="kpi-card">
                        <div class="kpi-icon icon-warning">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <div class="kpi-content">
                            <span class="kpi-label">Fluxo Ativo</span>
                            <h3 class="kpi-value">${kpis.pendingCount} <small>demandas</small></h3>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon icon-success">
                            <i class="fa-solid fa-flag-checkered"></i>
                        </div>
                        <div class="kpi-content">
                            <span class="kpi-label">Finalizados</span>
                            <h3 class="kpi-value">${kpis.doneCount} <small>demandas</small></h3>
                        </div>
                    </div>

                    <div class="kpi-card">
                        <div class="kpi-icon icon-purple">
                            <i class="fa-regular fa-lightbulb"></i>
                        </div>
                        <div class="kpi-content">
                            <span class="kpi-label">Banco de Ideias</span>
                            <h3 class="kpi-value">${ideasCount} <small>insights</small></h3>
                        </div>
                    </div>
                </div>

                <div class="charts-grid">
                    <div class="chart-container">
                        <h4 class="chart-title"><i class="fa-solid fa-chart-column"></i> Receita por Cliente</h4>
                        <div class="canvas-wrapper">
                            <canvas id="financeChart"></canvas>
                        </div>
                    </div>
                    <div class="chart-container">
                        <h4 class="chart-title"><i class="fa-solid fa-chart-pie"></i> Status Operacional</h4>
                        <div class="canvas-wrapper flex-center">
                            <canvas id="statusChart"></canvas>
                        </div>
                    </div>
                </div>

                <div class="projects-section">
                    <div class="section-header">
                        <h4 class="section-title text-white">
                            <i class="fa-solid fa-bullseye"></i> Metas & Projetos
                        </h4>
                        <button id="btn-new-project" class="btn-small-neon">
                            <i class="fa-solid fa-plus"></i> NOVO PROJETO
                        </button>
                    </div>

                    <div class="projects-list">
                        ${projects.map(p => `
                            <div class="project-row">
                                <div class="proj-info">
                                    <div class="proj-name">${p.title}</div>
                                    <div class="proj-deadline">
                                        <i class="fa-regular fa-calendar"></i> 
                                        Prazo: ${p.deadline ? p.deadline.split('-').reverse().join('/') : 'Sem prazo'}
                                    </div>
                                </div>
                                
                                <div class="proj-progress-wrapper">
                                    <div class="progress-bar-bg">
                                        <div class="progress-bar-fill" style="width: ${p.progress}%; background: ${p.color || 'var(--color-primary)'}; box-shadow: 0 0 10px ${p.color};"></div>
                                    </div>
                                    <span class="progress-text">${p.progress}%</span>
                                </div>
                                
                                <div class="proj-actions">
                                    <button class="action-btn edit btn-edit-proj" data-id="${p.id}" title="Editar Projeto">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button class="action-btn delete btn-del-proj" data-id="${p.id}" title="Excluir">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                        
                        ${projects.length === 0 ? `
                            <div class="empty-projects">
                                <i class="fa-solid fa-bullseye"></i>
                                <p>Nenhum projeto estratégico definido.</p>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <div id="modal-dash-overlay" class="modal-overlay">
                    <div class="modal-box-dashboard">
                        <div class="modal-header">
                            <h3><i class="fa-solid fa-pen-to-square"></i> GESTÃO DE PROJETO</h3>
                        </div>
                        <div class="modal-body">
                            <label>Nome do Projeto</label>
                            <input type="text" id="dash-proj-title" placeholder="Ex: Expansão Frota 2026">
                            
                            <label>Progresso (%)</label>
                            <input type="number" id="dash-proj-progress" placeholder="0 a 100" max="100">
                            
                            <label>Prazo Final</label>
                            <input type="date" id="dash-proj-deadline">
                            
                            <div class="modal-footer">
                                <button id="dash-btn-cancel" class="btn-cancel">CANCELAR</button>
                                <button id="dash-btn-save" class="btn-confirm">SALVAR</button>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            <style>
                .dashboard-wrapper { padding: 25px; animation: fadeIn 0.4s ease; height: 100%; overflow-y: auto; color: #fff; }

                /* MODAL FORCE (CORREÇÃO DE OPAQUIDADE) */
                #modal-dash-overlay {
                    position: fixed; 
                    top: 0; left: 0; width: 100%; height: 100%;
                    background: rgba(0,0,0,0.85); 
                    backdrop-filter: blur(8px);
                    display: none; 
                    justify-content: center; 
                    align-items: center; 
                    z-index: 2147483647;
                    
                    /* CORREÇÃO CRÍTICA ABAIXO: */
                    opacity: 1 !important; 
                    pointer-events: auto !important;
                }

                .modal-box-dashboard {
                    background: #151a23; 
                    width: 400px; 
                    border: 1px solid var(--color-primary); 
                    border-radius: 12px; 
                    overflow: hidden; 
                    box-shadow: 0 0 50px rgba(0,0,0,0.9);
                    animation: fadeIn 0.2s ease;
                }

                /* ESTILOS PADRÃO */
                .bakery-section {
                    background: linear-gradient(90deg, rgba(0, 240, 255, 0.05) 0%, rgba(21, 26, 35, 0.8) 100%);
                    border: 1px dashed var(--color-primary); padding: 25px; border-radius: 12px; margin-bottom: 30px;
                }
                .bakery-header { display: flex; align-items: center; gap: 15px; margin-bottom: 10px; }
                .section-title { margin: 0; font-family: 'Rajdhani'; font-size: 1.2rem; text-transform: uppercase; letter-spacing: 1px; }
                .text-primary { color: var(--color-primary); }
                .text-white { color: #fff; }
                .beta-badge { font-size: 0.65rem; padding: 2px 8px; border: 1px solid #444; border-radius: 4px; color: #888; }
                .bakery-desc { font-size: 0.85rem; color: #888; margin-bottom: 15px; }
                
                .bakery-input-group { display: flex; gap: 10px; }
                .input-icon-wrapper { position: relative; flex: 1; }
                .input-icon-wrapper i { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: #666; }
                .bakery-input { 
                    width: 100%; padding: 12px 12px 12px 40px; background: rgba(0,0,0,0.3); 
                    border: 1px solid #444; border-radius: 6px; color: #fff; outline: none; font-family: var(--font-main);
                }
                .bakery-input:focus { border-color: var(--color-primary); background: rgba(0,0,0,0.5); }
                
                .btn-neon-action {
                    background: var(--color-primary); color: #000; border: none; padding: 0 25px; 
                    font-weight: 800; border-radius: 6px; cursor: pointer; transition: 0.2s;
                }
                .btn-neon-action:hover { filter: brightness(1.1); box-shadow: 0 0 15px var(--color-primary); }

                /* KPIs */
                .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-bottom: 30px; }
                .kpi-card { 
                    background: rgba(255,255,255,0.02); border: 1px solid #333; padding: 20px; 
                    border-radius: 12px; display: flex; align-items: center; gap: 20px; transition: 0.3s;
                }
                .kpi-card:hover { transform: translateY(-5px); background: rgba(255,255,255,0.04); border-color: #555; }
                
                .kpi-icon { width: 55px; height: 55px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid; }
                .icon-primary { color: var(--color-primary); border-color: var(--color-primary); box-shadow: 0 0 10px rgba(0,240,255,0.2); }
                .icon-warning { color: var(--color-warning); border-color: var(--color-warning); box-shadow: 0 0 10px rgba(252,238,10,0.2); }
                .icon-success { color: var(--color-success); border-color: var(--color-success); box-shadow: 0 0 10px rgba(0,255,157,0.2); }
                .icon-purple { color: #d946ef; border-color: #d946ef; box-shadow: 0 0 10px rgba(217,70,239,0.2); }

                .kpi-content { display: flex; flex-direction: column; }
                .kpi-label { font-size: 0.75rem; color: #888; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
                .kpi-value { font-family: 'JetBrains Mono'; font-size: 1.5rem; margin: 0; font-weight: 700; color: #fff; }
                .kpi-value small { font-size: 0.8rem; color: #555; font-family: 'Inter'; font-weight: 400; margin-left: 5px; }

                /* Gráficos */
                .charts-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 30px; }
                .chart-container { background: rgba(21, 26, 35, 0.6); border: 1px solid #333; padding: 20px; border-radius: 12px; }
                .chart-title { margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 1px solid #333; color: #ccc; font-family: 'Rajdhani'; font-size: 1rem; letter-spacing: 1px; text-transform: uppercase; }
                .canvas-wrapper { height: 220px; position: relative; }
                .flex-center { display: flex; justify-content: center; }

                /* Projetos */
                .projects-section { background: rgba(21, 26, 35, 0.6); border: 1px solid #333; padding: 20px; border-radius: 12px; }
                .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #333; padding-bottom: 15px; }
                
                .btn-small-neon {
                    background: transparent; border: 1px solid var(--color-primary); color: var(--color-primary);
                    padding: 5px 15px; border-radius: 4px; cursor: pointer; font-size: 0.75rem; font-weight: 700; transition: 0.2s;
                }
                .btn-small-neon:hover { background: var(--color-primary); color: #000; }

                .project-row { 
                    display: flex; align-items: center; gap: 20px; padding: 15px; 
                    border-bottom: 1px solid rgba(255,255,255,0.03); transition: 0.2s; 
                }
                .project-row:hover { background: rgba(255,255,255,0.02); }
                .project-row:last-child { border-bottom: none; }

                .proj-info { flex: 1; }
                .proj-name { font-weight: 700; font-size: 0.95rem; color: #fff; margin-bottom: 4px; }
                .proj-deadline { font-size: 0.75rem; color: #666; display: flex; gap: 6px; align-items: center; }

                .proj-progress-wrapper { flex: 2; display: flex; align-items: center; gap: 15px; }
                .progress-bar-bg { flex: 1; height: 8px; background: #0b0e14; border: 1px solid #333; border-radius: 4px; overflow: hidden; }
                .progress-bar-fill { height: 100%; border-radius: 4px; transition: width 0.5s ease; }
                .progress-text { font-family: 'JetBrains Mono'; font-size: 0.9rem; font-weight: bold; width: 45px; text-align: right; color: #fff; }

                .proj-actions { display: flex; gap: 8px; }
                .action-btn { 
                    width: 32px; height: 32px; background: #0b0e14; border: 1px solid #333; border-radius: 6px; 
                    color: #666; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; 
                }
                .action-btn.edit:hover { color: var(--color-primary); border-color: var(--color-primary); background: rgba(0,240,255,0.1); }
                .action-btn.delete:hover { color: var(--color-accent); border-color: var(--color-accent); background: rgba(255,0,60,0.1); }

                .empty-projects { text-align: center; padding: 30px; color: #555; border: 1px dashed #333; border-radius: 8px; }
                .empty-projects i { font-size: 1.5rem; margin-bottom: 10px; opacity: 0.5; }

                /* INTERIOR DO MODAL */
                .modal-header { background: #0b0e14; padding: 15px 20px; border-bottom: 1px solid #333; }
                .modal-header h3 { margin: 0; color: var(--color-primary); font-family: 'Rajdhani'; font-size: 1.1rem; }
                
                .modal-body { padding: 25px; display: flex; flex-direction: column; gap: 15px; }
                .modal-body label { font-size: 0.75rem; color: #888; font-weight: bold; text-transform: uppercase; }
                .modal-body input { 
                    background: #0b0e14; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; outline: none; 
                }
                .modal-body input:focus { border-color: var(--color-primary); }

                .modal-footer { display: flex; gap: 10px; margin-top: 10px; }
                .btn-cancel { flex: 1; background: transparent; border: 1px solid #444; color: #ccc; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                .btn-cancel:hover { background: rgba(255,255,255,0.1); color: #fff; }
                
                .btn-confirm { flex: 1; background: var(--color-primary); border: none; color: #000; padding: 10px; border-radius: 6px; cursor: pointer; font-weight: bold; }
                .btn-confirm:hover { filter: brightness(1.1); }
            </style>
        `;
    }
}