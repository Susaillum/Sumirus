/**
 * SUMIRUS CORE DATABASE - V8 (FINAL STABLE)
 */
class Store {
    constructor() {
        this.dbName = 'SUMIRUS_PROD_V8'; 
        this.state = {
            currentUser: null, 
            
            // --- NOVA EQUIPE (Ponto 8) ---
            team: [
                { name: 'Lucca', role: 'Admin', avatar: 'L' },
                { name: 'Marcos', role: 'Operacional', avatar: 'M' },
                { name: 'Stephanny', role: 'Operacional', avatar: 'S' },
                { name: 'Ajudante 1', role: 'Suporte', avatar: 'A1' },
                { name: 'Ajudante 2', role: 'Suporte', avatar: 'A2' }
            ],

            // CLIENTES
            clients: [
                { id: 1, name: 'SAMENGO', color: '#b91c1c', accent: '#000', contact: 'Logística', status: 'Ativo' },
                { id: 2, name: 'DELICIA CASEIRA', color: '#22c55e', accent: '#fca5a5', contact: 'Produção', status: 'Ativo' },
                { id: 3, name: 'ALL MANAGEMENT SPORTS', color: '#1e3a8a', accent: '#000', contact: 'Eventos', status: 'Ativo' },
                { id: 4, name: 'INTERNO', color: '#64748b', accent: '#fff', contact: 'Adm', status: 'Ativo' }
            ],
            
            // PROJETOS (Dashboard)
            projects: [],

            // --- QUADRO DE IDEIAS (Ponto 7) ---
            ideas: [],

            // ROTINAS
            routines: [],

            // KANBAN TASKS
            tasks: [],
            
            columns: {
                'entrada': { title: '01. ENTRADA / PEDIDOS', color: '#fff' },
                'producao': { title: '02. EM PRODUÇÃO', color: '#00f0ff' },
                'analise': { title: '03. EM ANÁLISE', color: '#fcee0a' },
                'pronto': { title: '04. PRONTO / ENTREGUE', color: '#00ff9d' }
            }
        };
        this.init();
    }

    init() {
        const saved = localStorage.getItem(this.dbName);
        if (saved) {
            const parsed = JSON.parse(saved);
            // MERGE: Mantém o que salvou, mas garante que novos campos (team, ideas) existam
            this.state = { ...this.state, ...parsed };
            
            // Força a existência dos arrays novos se o backup for antigo
            if(!this.state.ideas) this.state.ideas = [];
            if(!this.state.team || this.state.team.length === 0) {
                this.state.team = [
                    { name: 'Lucca', role: 'Admin', avatar: 'L' },
                    { name: 'Marcos', role: 'Operacional', avatar: 'M' },
                    { name: 'Stephanny', role: 'Operacional', avatar: 'S' },
                    { name: 'Ajudante 1', role: 'Suporte', avatar: 'A1' },
                    { name: 'Ajudante 2', role: 'Suporte', avatar: 'A2' }
                ];
            }
        } else {
            this.save();
        }
    }

    save() { localStorage.setItem(this.dbName, JSON.stringify(this.state)); }

    // --- MÉTODOS DE TAREFAS ---
    addTask(task) {
        task.id = Date.now().toString(36);
        if(!task.createdAt) task.createdAt = new Date().toISOString();
        if(!task.assignee) task.assignee = 'Sem Dono'; // Padrão
        if(!task.history) task.history = [{ action: 'CRIADO', date: new Date().toISOString() }];
        
        this.state.tasks.push(task);
        this.save();
    }

    moveTask(taskId, newStatus) {
        const task = this.state.tasks.find(t => t.id == taskId);
        if (task) {
            task.status = newStatus;
            if(!task.history) task.history = [];
            task.history.push({ action: `MOVIDO P/ ${newStatus.toUpperCase()}`, date: new Date().toISOString() });
            this.save();
        }
    }

    // --- MÉTODOS DE PROJETOS ---
    addProject(title, progress, deadline) {
        const colors = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#ec4899'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        this.state.projects.push({
            id: Date.now(),
            title,
            progress: parseInt(progress) || 0,
            deadline,
            color: randomColor
        });
        this.save();
    }
    removeProject(id) {
        this.state.projects = this.state.projects.filter(p => p.id != id);
        this.save();
    }

    // --- MÉTODOS DE IDEIAS (Ponto 7) ---
    addIdea(text) {
        // Classificação simples automática
        let score = 1;
        let tags = ['Geral'];
        const lower = text.toLowerCase();
        
        if(lower.includes('dinheiro') || lower.includes('venda')) { score += 2; tags.push('Financeiro'); }
        if(lower.includes('app') || lower.includes('site') || lower.includes('bot')) { score += 2; tags.push('Tech'); }
        if(lower.includes('urgente')) { score += 3; tags.push('Prioridade'); }
        
        this.state.ideas.push({ id: Date.now(), text, score, tags, date: new Date().toISOString() });
        this.save();
    }
    removeIdea(id) {
        this.state.ideas = this.state.ideas.filter(i => i.id != id);
        this.save();
    }

    // --- MÉTODOS DE ROTINA ---
    toggleRoutine(id) {
        const item = this.state.routines.find(r => r.id == id);
        if(item) { item.done = !item.done; this.save(); }
    }
    addRoutine(text, type) {
        this.state.routines.push({ id: Date.now(), text, type, done: false });
        this.save();
    }
    removeRoutine(id) {
        this.state.routines = this.state.routines.filter(r => r.id != id);
        this.save();
    }

    // --- MÉTODOS DE CLIENTES ---
    addClient(name, contact) { 
        this.state.clients.push({ id: Date.now(), name: name.toUpperCase(), contact, color: '#333', status: 'Ativo' }); 
        this.save(); 
    }
    updateClient(updatedClient) { // Ponto 4 (Edição)
        const idx = this.state.clients.findIndex(c => c.id == updatedClient.id);
        if(idx !== -1) {
            this.state.clients[idx] = updatedClient;
            this.save();
        }
    }
    removeClient(id) { 
        this.state.clients = this.state.clients.filter(c => c.id != id); 
        this.save(); 
    }

    // --- AUTH ---
    login(user) { this.state.currentUser = { name: user }; this.save(); }
    logout() { this.state.currentUser = null; this.save(); }
}

export const db = new Store();