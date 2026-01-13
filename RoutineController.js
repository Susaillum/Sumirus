import { db } from './Store.js';
import { RoutineView } from './RoutineView.js';

export class RoutineController {
    constructor() {
        this.view = new RoutineView();
    }

    init() {
        console.log('[ROUTINE] Módulo de Rotina Iniciado.');
        this.view.mount('kanban-container');
        this.render();
    }

    render() {
        // Garante que existe o array no banco (caso seja backup antigo ou primeira vez)
        if (!db.state.routines) db.state.routines = [];
        
        // --- LÓGICA DE PROGRESSO ---
        // Calcula progresso baseando-se APENAS nas tarefas 'daily' (Protocolos Fixos)
        // Lembretes rápidos (backlog) não afetam a % de eficiência do dia.
        const dailyTasks = db.state.routines.filter(r => r.type === 'daily');
        const total = dailyTasks.length;
        const done = dailyTasks.filter(r => r.done).length;
        
        let progress = 0;
        if (total > 0) progress = Math.round((done / total) * 100);

        this.view.render(db.state.routines, progress);
        this.bindEvents();
    }

    bindEvents() {
        // 1. ADICIONAR PROTOCOLO DIÁRIO
        const btnAddDaily = document.getElementById('btn-add-daily');
        const inputDaily = document.getElementById('input-daily');
        
        const addDaily = () => {
            if(!inputDaily.value.trim()) return;
            db.addRoutine(inputDaily.value, 'daily');
            this.render();
            // Refocus para digitar vários seguidos
            setTimeout(() => document.getElementById('input-daily').focus(), 50);
        };

        if(btnAddDaily) btnAddDaily.onclick = addDaily;
        if(inputDaily) inputDaily.onkeypress = (e) => { if(e.key === 'Enter') addDaily(); };


        // 2. ADICIONAR BACKLOG EVENTUAL
        const btnAddEventual = document.getElementById('btn-add-eventual');
        const inputEventual = document.getElementById('input-eventual');

        const addEventual = () => {
            if(!inputEventual.value.trim()) return;
            db.addRoutine(inputEventual.value, 'eventual');
            this.render();
            setTimeout(() => document.getElementById('input-eventual').focus(), 50);
        };

        if(btnAddEventual) btnAddEventual.onclick = addEventual;
        if(inputEventual) inputEventual.onkeypress = (e) => { if(e.key === 'Enter') addEventual(); };


        // 3. BOTÃO DE RESET (INICIAR NOVO DIA)
        const btnReset = document.getElementById('btn-reset-day');
        if(btnReset) {
            btnReset.onclick = () => {
                if(confirm('Tem certeza? Isso vai desmarcar todos os protocolos diários para iniciar um novo dia.')) {
                    // Reseta apenas os 'daily', mantém os 'eventual' até serem feitos/deletados
                    db.state.routines.forEach(r => {
                        if(r.type === 'daily') r.done = false;
                    });
                    db.save();
                    window.SumirusSystem.notify('Ciclo diário reiniciado com sucesso!', 'success');
                    this.render();
                }
            };
        }

        // 4. CHECKBOX (TOGGLE)
        // Usamos delegação ou querySelectorAll. Aqui o querySelectorAll é seguro pois rodamos após o render.
        const items = document.querySelectorAll('.action-toggle');
        items.forEach(el => {
            el.onclick = (e) => {
                // Encontra o ID no pai .routine-item
                const id = e.target.closest('.routine-item').getAttribute('data-id');
                db.toggleRoutine(id);
                this.render();
            };
        });

        // 5. DELETAR ITEM
        const dels = document.querySelectorAll('.action-delete');
        dels.forEach(el => {
            el.onclick = (e) => {
                const id = e.target.closest('.routine-item').getAttribute('data-id');
                // Confirmação sutil, apenas se tiver texto, pra evitar clique acidental
                // Mas pra agilidade, vamos deletar direto. Se quiser confirm, descomente:
                // if(confirm('Remover item?')) { ... }
                db.removeRoutine(id);
                this.render();
            };
        });
    }
}
