// --- IMPORTAÇÕES CORRIGIDAS (TUDO NA RAIZ) ---
import { bus } from './EventBus.js';
import { db } from './Store.js'; 
import { KanbanController } from './KanbanController.js';
import { DashboardController } from './DashboardController.js';
import { ClientController } from './ClientController.js';
import { CalendarController } from './CalendarController.js';
import { RoutineController } from './RoutineController.js';
import { IdeasController } from './IdeasController.js'; 
// import { LogisticsService } from './LogisticsService.js'; // REMOVIDO PARA NÃO TRAVAR

class SumirusApp {
    constructor() {
        this.activeModule = null;
        this.isEditingId = null; 
        this.tempFilter = null; // Armazena filtro vindo do CRM
        window.SumirusSystem = this; // Torna o app acessível globalmente
    }

    async boot() {
        console.clear();
        console.log(`%c SUMIRUS OS %c KERNEL STARTED`, 'background: #00f0ff; color: #000; font-weight: 800;', 'color: #00f0ff;');

        // Verifica Login
        if(!db.state.currentUser) {
            document.getElementById('boot-loader').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
            this.bindLoginEvents();
            return;
        }
        this.startInterface();
    }

    // --- FUNÇÃO DE NAVEGAÇÃO VIA CRM ---
    goToKanbanWithFilter(clientName) {
        // 1. Define o filtro na memória
        this.tempFilter = clientName;
        
        // 2. Força a navegação para a aba Kanban (simula clique)
        const navItems = document.querySelectorAll('.nav-item');
        let kanbanBtn = null;
        
        navItems.forEach(item => {
            if(item.innerText.toLowerCase().includes('processos') || item.innerText.toLowerCase().includes('kanban')) {
                kanbanBtn = item;
            }
        });

        if(kanbanBtn) {
            kanbanBtn.click();
            this.notify(`Filtrando fluxo para: ${clientName}`, 'success');
        } else {
            console.error('Botão do Kanban não encontrado na sidebar.');
        }
    }

    notify(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if(!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        
        let icon = 'fa-check-circle';
        if(type === 'error') icon = 'fa-circle-xmark';
        if(type === 'warning') icon = 'fa-triangle-exclamation';

        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
        toast.onclick = () => toast.remove();
        container.appendChild(toast);

        setTimeout(() => {
            if(toast.parentElement) toast.remove();
        }, 4000);
    }

    bindLoginEvents() {
        const btnLogin = document.getElementById('btn-login-action');
        if(btnLogin) {
            btnLogin.onclick = () => {
                const user = document.getElementById('login-input').value;
                if(user) {
                    db.login(user);
                    document.getElementById('login-screen').style.display = 'none';
                    this.startInterface();
                    this.notify(`Bem-vindo, Operador ${user}.`, 'success');
                } else {
                    this.notify('Identifique-se, operador.', 'error');
                }
            };
        }
    }

    async startInterface() {
        const loader = document.getElementById('boot-loader');
        if (loader) {
            loader.style.display = 'flex';
            this.updateLoader('Carregando módulos...');
        }
        
        await this.wait(400);

        if (loader) loader.style.display = 'none';
        document.getElementById('app-interface').style.display = 'flex';

        this.bindGlobalEvents(); 
        this.setupNavigation();
        this.startSystemClock();
        
        // Inicia no Kanban por padrão
        this.loadModule('kanban');
    }

    wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    updateLoader(text) { const el = document.querySelector('.loader-text'); if(el) el.innerText = text; }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', () => {
                // Atualiza classe visual (Active)
                navItems.forEach(n => { n.classList.remove('active'); n.classList.add('disabled'); });
                item.classList.add('active'); item.classList.remove('disabled');

                const text = item.innerText.toLowerCase();
                
                // Roteador simples
                if(text.includes('processos') || text.includes('kanban')) this.loadModule('kanban');
                else if(text.includes('dashboard')) this.loadModule('dashboard');
                else if(text.includes('clientes') || text.includes('crm')) this.loadModule('crm');
                else if(text.includes('calendário')) this.loadModule('calendar');
                else if(text.includes('rotina')) this.loadModule('routine');
                else if(text.includes('ideias') || text.includes('insights')) this.loadModule('ideas');
            });
        });
    }

    updateTitle(text) {
        const titleEl = document.querySelector('.page-title');
        if(titleEl) titleEl.innerText = text;
    }

    loadModule(moduleName) {
        const container = document.getElementById('kanban-container');
        container.innerHTML = ''; 

        // Limpa lixo de gráficos antigos (Chart.js)
        if(this.activeModule && this.activeModule.charts) {
            this.activeModule.charts.forEach(c => c.destroy());
        }

        const actionsDiv = document.querySelector('.actions');
        
        // Lógica de Carregamento
        switch (moduleName) {
            case 'kanban':
                this.updateTitle('Fluxo de Trabalho');
                this.activeModule = new KanbanController();
                if(actionsDiv) actionsDiv.style.display = 'flex';
                break;
            case 'dashboard':
                this.updateTitle('Dashboard & Metas');
                this.activeModule = new DashboardController();
                if(actionsDiv) actionsDiv.style.display = 'none';
                break;
            case 'crm':
                this.updateTitle('Gestão de Parceiros');
                this.activeModule = new ClientController();
                if(actionsDiv) actionsDiv.style.display = 'none';
                break;
            case 'calendar':
                this.updateTitle('Calendário de Entregas');
                this.activeModule = new CalendarController();
                // Calendário precisa de mount explícito às vezes dependendo da implementação
                if(this.activeModule.mount) this.activeModule.mount('kanban-container');
                if(actionsDiv) actionsDiv.style.display = 'none';
                break;
            case 'routine':
                this.updateTitle('Rotina Diária & Backlog');
                this.activeModule = new RoutineController();
                if(actionsDiv) actionsDiv.style.display = 'none';
                break;
            case 'ideas': 
                this.updateTitle('Quadro de Ideias & Insights');
                this.activeModule = new IdeasController();
                if(actionsDiv) actionsDiv.style.display = 'none';
                break;
        }

        // Inicializa o módulo carregado
        if (this.activeModule && this.activeModule.init) {
            this.activeModule.init();
        }
    }

    // --- POPULA DROPDOWNS (CLIENTES E EQUIPE) ---
    populateSelects() {
        // 1. Clientes
        const selectClient = document.getElementById('input-client');
        if (selectClient) {
            const currentVal = selectClient.value;
            selectClient.innerHTML = '<option value="">Selecione um parceiro...</option>';
            const clientes = db.state.clients || [];
            clientes.forEach(c => {
                const option = document.createElement('option');
                option.value = c.name;
                option.innerText = c.name;
                selectClient.appendChild(option);
            });
            if(currentVal) selectClient.value = currentVal;
        }

        // 2. Equipe (Responsável)
        const selectAssignee = document.getElementById('input-assignee');
        if (selectAssignee) {
            const currentVal = selectAssignee.value;
            selectAssignee.innerHTML = '<option value="Sem Dono">Definir depois...</option>';
            const team = db.state.team || [];
            team.forEach(p => {
                const option = document.createElement('option');
                option.value = p.name;
                option.innerText = `${p.name} (${p.role || 'Op'})`;
                selectAssignee.appendChild(option);
            });
            if(currentVal) selectAssignee.value = currentVal;
        }
    }

    bindGlobalEvents() {
        const modal = document.getElementById('task-modal');
        
        // Fechar Modal
        const btnClose = document.getElementById('btn-close-x');
        if(btnClose) btnClose.onclick = () => modal.classList.remove('active');

        // Abrir Modal (Botão do Header)
        const btnNew = document.getElementById('open-modal-btn');
        if (btnNew) {
            // Clone para remover listeners antigos e evitar duplicação
            const newBtn = btnNew.cloneNode(true);
            btnNew.parentNode.replaceChild(newBtn, btnNew);
            newBtn.addEventListener('click', () => this.openModal());
        }

        // Menu Usuário
        const btnUser = document.getElementById('btn-user-menu');
        const userMenu = document.getElementById('user-dropdown');
        if(btnUser && userMenu) {
            btnUser.onclick = (e) => {
                e.stopPropagation();
                userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
            };
            document.addEventListener('click', (e) => {
                if(!btnUser.contains(e.target) && !userMenu.contains(e.target)) {
                    userMenu.style.display = 'none';
                }
            });
        }

        // Logout
        const btnLogout = document.getElementById('btn-logout');
        if(btnLogout) btnLogout.onclick = () => { db.logout(); location.reload(); };

        // Backup Download
        const btnBackupDl = document.getElementById('btn-backup-download');
        if(btnBackupDl) {
            btnBackupDl.onclick = () => {
                const dataStr = JSON.stringify(db.state, null, 2);
                const blob = new Blob([dataStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `SUMIRUS_BACKUP_${new Date().toISOString().slice(0,10)}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                this.notify('Backup baixado com sucesso!', 'success');
            };
        }

        // Backup Restore
        const btnBackupRest = document.getElementById('btn-backup-restore');
        const inputRestore = document.getElementById('input-restore-backup');
        if(btnBackupRest && inputRestore) {
            btnBackupRest.onclick = () => inputRestore.click();
            inputRestore.onchange = (e) => {
                const file = e.target.files[0];
                if(!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const json = JSON.parse(ev.target.result);
                        if(json && json.tasks) {
                            if(confirm('ATENÇÃO: Substituir dados atuais pelo backup?')) {
                                db.state = json;
                                db.save();
                                this.notify('Sistema restaurado. Reiniciando...', 'success');
                                setTimeout(() => location.reload(), 1500);
                            }
                        } else {
                            this.notify('Arquivo de backup inválido.', 'error');
                        }
                    } catch (err) {
                        this.notify('Erro ao ler arquivo.', 'error');
                    }
                };
                reader.readAsText(file);
            };
        }

        // Upload Foto
        const btnUpload = document.getElementById('btn-trigger-upload');
        const fileInput = document.getElementById('hidden-file-input');
        if(btnUpload && fileInput) {
            btnUpload.onclick = () => fileInput.click();
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (readerEvent) => {
                        const base64Image = readerEvent.target.result;
                        const gallery = document.getElementById('evidence-gallery');
                        const imgDiv = document.createElement('div');
                        imgDiv.className = 'evidence-thumb';
                        imgDiv.style.backgroundImage = `url('${base64Image}')`;
                        imgDiv.dataset.content = base64Image;
                        imgDiv.onclick = () => { if(confirm('Remover imagem?')) imgDiv.remove(); }
                        gallery.appendChild(imgDiv);
                        this.notify('Imagem anexada!', 'success');
                    };
                    reader.readAsDataURL(file);
                }
            };
        }

        // Salvar Demanda (LÓGICA PRINCIPAL CORRIGIDA)
        const btnSave = document.getElementById('btn-save');
        if(btnSave) {
            const newSave = btnSave.cloneNode(true);
            btnSave.parentNode.replaceChild(newSave, btnSave);
            newSave.addEventListener('click', () => {
                // 1. Captura Cliente
                const selectEl = document.getElementById('input-client');
                const clientVal = selectEl ? selectEl.value : '';
                
                // 2. Captura Título
                const titleVal = document.getElementById('input-title').value;
                if(!titleVal) return this.notify('O título é obrigatório!', 'warning');
                
                // 3. Captura Status
                const activeStep = document.querySelector('.step-item.active');
                const statusVal = activeStep ? activeStep.getAttribute('data-value') : 'entrada';

                // 4. Captura Imagens
                const evidences = [];
                document.querySelectorAll('.evidence-thumb').forEach(thumb => {
                    evidences.push(thumb.dataset.content);
                });

                // 5. Captura Responsável (CORREÇÃO DE BINDING)
                const selectAssignee = document.getElementById('input-assignee');
                const assigneeVal = selectAssignee && selectAssignee.value ? selectAssignee.value : 'Sem Dono';

                const data = {
                    id: this.isEditingId,
                    titulo: titleVal,
                    cliente: clientVal,
                    assignee: assigneeVal, // Valor capturado corretamente
                    valor: document.getElementById('input-value').value,
                    dueDate: document.getElementById('input-date').value,
                    description: document.getElementById('input-desc').value,
                    status: statusVal,
                    evidences: evidences
                };
                
                bus.publish('kanban:save-demand', data);
                modal.classList.remove('active');
                this.notify('Demanda salva com sucesso!', 'success');
            });
        }
        
        // Stepper do Status
        const steps = document.querySelectorAll('.step-item');
        steps.forEach(step => {
            step.addEventListener('click', () => {
                steps.forEach(s => s.classList.remove('active'));
                step.classList.add('active');
            });
        });
        
        // Excluir Demanda
        const btnDel = document.getElementById('btn-delete-task');
        if(btnDel) {
            btnDel.onclick = () => {
                if(this.isEditingId && confirm('Tem certeza que deseja excluir esta demanda?')) {
                     db.state.tasks = db.state.tasks.filter(t => t.id != this.isEditingId);
                     db.save();
                     if(this.activeModule && this.activeModule.view && this.activeModule.view.render) {
                         this.activeModule.view.render();
                     }
                     modal.classList.remove('active');
                     this.notify('Demanda excluída.', 'warning');
                }
            }
        }
    }

    openModal(dados = null) {
        const modal = document.getElementById('task-modal');
        const logContainer = document.querySelector('.history-log');
        const gallery = document.getElementById('evidence-gallery');
        if(gallery) gallery.innerHTML = ''; 
        
        // 1. POPULA OS SELECTS ANTES DE TENTAR DEFINIR VALORES
        this.populateSelects(); 
        
        document.querySelectorAll('.step-item').forEach(s => s.classList.remove('active'));

        if (dados) {
            // MODO EDIÇÃO
            this.isEditingId = dados.id;
            document.getElementById('input-title').value = dados.title || '';
            document.getElementById('input-value').value = dados.value || '';
            document.getElementById('input-date').value = dados.dueDate || '';
            document.getElementById('input-desc').value = dados.description || '';
            
            // Define Cliente
            const selectEl = document.getElementById('input-client');
            if(selectEl && dados.client) selectEl.value = dados.client;

            // Define Responsável (CORREÇÃO)
            const selectAssignee = document.getElementById('input-assignee');
            if(selectAssignee) selectAssignee.value = dados.assignee || 'Sem Dono';

            // Define Status
            const currentStatus = dados.status || 'entrada';
            const stepToActivate = document.querySelector(`.step-item[data-value="${currentStatus}"]`);
            if(stepToActivate) stepToActivate.classList.add('active');
            else document.querySelector('.step-item[data-value="entrada"]').classList.add('active');

            document.getElementById('btn-delete-task').style.display = 'block';

            // Carrega Imagens
            if (dados.evidences && dados.evidences.length > 0) {
                dados.evidences.forEach(imgData => {
                    const imgDiv = document.createElement('div');
                    imgDiv.className = 'evidence-thumb';
                    imgDiv.style.backgroundImage = `url('${imgData}')`;
                    imgDiv.dataset.content = imgData;
                    imgDiv.onclick = () => { if(confirm('Remover imagem?')) imgDiv.remove(); };
                    gallery.appendChild(imgDiv);
                });
            }

            // Carrega Histórico
            if (dados.history && dados.history.length > 0) {
                logContainer.innerHTML = dados.history.slice().reverse().map(h => {
                    const dateObj = new Date(h.date);
                    const hora = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                    const dia = dateObj.toLocaleDateString('pt-BR');
                    return `
                        <div class="log-item" style="display:flex; gap:10px; margin-bottom:15px;">
                            <div class="log-dot" style="width:8px; height:8px; background: var(--color-primary); border-radius:50%; margin-top:5px;"></div>
                            <div>
                                <div class="log-action" style="font-weight:bold; font-size:0.75rem; color:#000;">${h.action}</div>
                                <div class="log-date" style="font-size:0.7rem; color:#666;">${dia} às ${hora}</div>
                            </div>
                        </div>
                    `;
                }).join('');
            } else {
                logContainer.innerHTML = '<div style="color:#666; font-size:0.8rem;">Sem histórico registrado.</div>';
            }

        } else {
            // MODO NOVO
            this.isEditingId = null;
            document.getElementById('input-title').value = '';
            document.getElementById('input-value').value = '';
            document.getElementById('input-date').value = dados && dados.dueDate ? dados.dueDate : ''; 
            document.getElementById('input-desc').value = '';
            
            const selectEl = document.getElementById('input-client');
            if(selectEl) selectEl.value = "";

            // Reset Responsável (CORREÇÃO)
            const selectAssignee = document.getElementById('input-assignee');
            if(selectAssignee) selectAssignee.value = "Sem Dono";
            
            document.querySelector('.step-item[data-value="entrada"]').classList.add('active');
            document.getElementById('btn-delete-task').style.display = 'none';

            logContainer.innerHTML = '<div style="color:#888; font-size:0.8rem; padding:10px 0;">Aguardando criação...</div>';
        }
        modal.classList.add('active');
    }

    startSystemClock() {
        setInterval(() => {
            const el = document.getElementById('system-clock');
            if(el) el.innerText = new Date().toLocaleTimeString('pt-BR');
        }, 1000);
    }
}

const app = new SumirusApp();
document.addEventListener('DOMContentLoaded', () => app.boot());
