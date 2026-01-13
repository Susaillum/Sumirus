import { db } from '../../core/Store.js';
import { CalendarView } from './CalendarView.js';

export class CalendarController {
    constructor() {
        this.view = new CalendarView();
        this.currentDate = new Date();
    }

    // --- ESSENCIAL: O main.js chama essa função para dizer ONDE desenhar ---
    mount(elementId) {
        this.view.mount(elementId);
    }

    // --- ESSENCIAL: O main.js chama essa função para INICIAR ---
    init() {
        console.log('[CALENDAR] Módulo Iniciado.');
        this.render();
    }

    render() {
        const tasks = db.state.tasks || [];
        this.view.render(this.currentDate, tasks);
        this.bindEvents();
    }

    bindEvents() {
        // Navegação
        const btnPrev = document.getElementById('btn-prev-month');
        if(btnPrev) btnPrev.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        };

        const btnNext = document.getElementById('btn-next-month');
        if(btnNext) btnNext.onclick = () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        };

        const btnToday = document.getElementById('btn-today');
        if(btnToday) btnToday.onclick = () => {
            this.currentDate = new Date();
            this.render();
        };

        // Clique no Dia (Criar Tarefa)
        const days = document.querySelectorAll('.calendar-day:not(.disabled)');
        days.forEach(day => {
            day.onclick = (e) => {
                // Evita abrir modal se clicar na bolinha da tarefa (futuro: abrir tarefa)
                if(e.target.classList.contains('task-dot')) return;

                const date = day.getAttribute('data-date');
                if(window.SumirusSystem && window.SumirusSystem.openModal) {
                    window.SumirusSystem.openModal({
                        id: null,
                        title: '',
                        client: '',
                        dueDate: date,
                        status: 'entrada'
                    });
                }
            };
        });
    }
}