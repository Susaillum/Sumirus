import { db } from '../../core/Store.js';
import { DashboardView } from './DashboardView.js';

export class DashboardController {
    constructor() {
        this.view = new DashboardView();
        this.charts = [];
        this.editingProjectId = null;
    }

    init() {
        console.log('[DASHBOARD] Módulo Inicializado.');
        this.view.mount('kanban-container');
        this.refresh();
    }

    calculateKPIs() {
        let totalValue = 0;
        let pendingCount = 0;
        let doneCount = 0;

        db.state.tasks.forEach(t => {
            const val = parseFloat(t.value) || 0;
            if (t.status === 'pronto') {
                doneCount++;
            } else {
                pendingCount++;
                totalValue += val;
            }
        });

        return { totalValue, pendingCount, doneCount };
    }

    refresh() {
        const kpis = this.calculateKPIs();
        const projects = db.state.projects || [];
        this.view.render(kpis, projects);
        this.renderCharts();
        this.bindEvents();
    }

    bindEvents() {
        // --- 1. PADARIA / IA ---
        const btnBake = document.getElementById('btn-bake');
        if(btnBake) {
            btnBake.onclick = () => {
                const text = document.getElementById('bakery-input').value;
                if(!text) return;
                this.processBakery(text);
            };
            document.getElementById('bakery-input').onkeypress = (e) => {
                if(e.key === 'Enter') btnBake.click();
            };
        }

        // --- 2. MODAL DE PROJETOS ---
        // Buscamos o ID corrigido na View
        const modal = document.getElementById('modal-dash-overlay'); 
        
        const btnNew = document.getElementById('btn-new-project');
        const btnCancel = document.getElementById('dash-btn-cancel');
        const btnSave = document.getElementById('dash-btn-save');

        const inpTitle = document.getElementById('dash-proj-title');
        const inpProgress = document.getElementById('dash-proj-progress');
        const inpDeadline = document.getElementById('dash-proj-deadline');

        // Função interna para abrir modal
        const openModal = (proj = null) => {
            if(!modal) return;
            modal.style.display = 'flex'; // Abre o modal
            
            if (proj) {
                // Modo Edição
                this.editingProjectId = proj.id;
                inpTitle.value = proj.title;
                inpProgress.value = proj.progress;
                inpDeadline.value = proj.deadline || '';
                btnSave.innerText = 'SALVAR ALTERAÇÕES';
            } else {
                // Modo Novo
                this.editingProjectId = null;
                inpTitle.value = '';
                inpProgress.value = '';
                inpDeadline.value = '';
                btnSave.innerText = 'CRIAR PROJETO';
            }
        };

        // Eventos do Modal
        if(btnNew) btnNew.onclick = () => openModal();
        if(btnCancel) btnCancel.onclick = () => { if(modal) modal.style.display = 'none'; };
        
        if(btnSave) {
            btnSave.onclick = () => {
                const title = inpTitle.value;
                const prog = inpProgress.value;
                const dead = inpDeadline.value;

                if(!title) return window.SumirusSystem.notify('Nome obrigatório!', 'warning');

                if (this.editingProjectId) {
                    // ATUALIZAR
                    const p = db.state.projects.find(x => x.id == this.editingProjectId);
                    if(p) {
                        p.title = title;
                        p.progress = parseInt(prog) || 0;
                        p.deadline = dead;
                        db.save();
                        window.SumirusSystem.notify('Projeto atualizado!', 'success');
                    }
                } else {
                    // CRIAR
                    db.addProject(title, prog, dead);
                    window.SumirusSystem.notify('Projeto criado!', 'success');
                }
                
                if(modal) modal.style.display = 'none';
                this.refresh();
            };
        }

        // --- 3. AÇÕES DA LISTA (EDITAR / EXCLUIR) ---
        
        // Editar
        document.querySelectorAll('.btn-edit-proj').forEach(btn => {
            btn.onclick = () => {
                const id = btn.getAttribute('data-id');
                const proj = db.state.projects.find(p => p.id == id);
                if(proj) openModal(proj);
            };
        });

        // Excluir
        document.querySelectorAll('.btn-del-proj').forEach(btn => {
            btn.onclick = () => {
                if(confirm('Excluir este projeto?')) {
                    db.removeProject(btn.getAttribute('data-id'));
                    this.refresh();
                }
            };
        });
    }

    processBakery(text) {
        const lower = text.toLowerCase();
        let value = 0;
        
        const matchVal = text.match(/(\d+)/);
        if(matchVal) value = parseFloat(matchVal[0]);

        let client = 'INTERNO';
        db.state.clients.forEach(c => {
            if(lower.includes(c.name.toLowerCase())) client = c.name;
        });

        let assignee = 'Sem Dono';
        db.state.team.forEach(p => {
            if(lower.includes(p.name.toLowerCase())) assignee = p.name;
        });

        db.addTask({
            title: text.charAt(0).toUpperCase() + text.slice(1),
            value: value,
            client: client,
            assignee: assignee,
            status: 'entrada',
            description: `Auto-Logic: "${text}"`,
            createdAt: new Date().toISOString()
        });

        document.getElementById('bakery-input').value = '';
        window.SumirusSystem.notify(`Demanda criada! Resp: ${assignee}`, 'success');
        
        const kanbanBtn = document.querySelector('.nav-item:first-child');
        if(kanbanBtn) kanbanBtn.click();
    }

    renderCharts() {
        if(this.charts.length) { this.charts.forEach(c => c.destroy()); this.charts = []; }

        const ctxFin = document.getElementById('financeChart');
        if(ctxFin) {
            const data = {};
            db.state.tasks.forEach(t => {
                if(t.status !== 'pronto') {
                    const c = t.client || 'Outros';
                    data[c] = (data[c] || 0) + (parseFloat(t.value) || 0);
                }
            });

            this.charts.push(new Chart(ctxFin, {
                type: 'bar',
                data: {
                    labels: Object.keys(data),
                    datasets: [{
                        label: 'Valor (R$)',
                        data: Object.values(data),
                        backgroundColor: 'rgba(0, 240, 255, 0.6)',
                        borderColor: '#00f0ff',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#333' } }, x: { grid: { display: false } } } }
            }));
        }

        const ctxStat = document.getElementById('statusChart');
        if(ctxStat) {
            const counts = { entrada: 0, producao: 0, analise: 0 };
            db.state.tasks.forEach(t => { 
                if (counts[t.status] !== undefined) counts[t.status]++; 
            });

            this.charts.push(new Chart(ctxStat, {
                type: 'doughnut',
                data: {
                    labels: ['Entrada', 'Produção', 'Análise'],
                    datasets: [{
                        data: Object.values(counts),
                        backgroundColor: ['#fff', '#00f0ff', '#fcee0a'],
                        borderWidth: 0,
                        hoverOffset: 10
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#fff' } } }, cutout: '70%' }
            }));
        }
    }
}