import { db } from './Store.js';

export class CalendarView {
    constructor() {
        this.container = null;
    }

    mount(elementId) {
        this.container = document.getElementById(elementId);
    }

    render(date, tasks) {
        if (!this.container) return;

        const year = date.getFullYear();
        const month = date.getMonth();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
        
        const firstDayIndex = new Date(year, month, 1).getDay();
        const lastDay = new Date(year, month + 1, 0).getDate();
        const today = new Date();

        this.container.innerHTML = `
            <div style="padding: 20px; animation: fadeIn 0.3s; display: flex; flex-direction: column; height: 100%;">
                
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <div style="display: flex; gap: 15px; align-items: center;">
                        <h2 style="font-family:'Rajdhani'; color:#fff; margin:0; text-transform: uppercase; letter-spacing: 2px; font-size: 1.5rem;">
                            <i class="fa-regular fa-calendar"></i> ${monthNames[month]} ${year}
                        </h2>
                        <div style="display:flex; gap:5px;">
                            <button id="btn-prev-month" class="nav-btn"><i class="fa-solid fa-chevron-left"></i></button>
                            <button id="btn-next-month" class="nav-btn"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                    
                    <button id="btn-today" class="btn-neon" style="padding: 5px 15px; font-size: 0.8rem;">HOJE</button>
                </div>

                <div class="calendar-wrapper">
                    <div class="calendar-day-header">DOM</div>
                    <div class="calendar-day-header">SEG</div>
                    <div class="calendar-day-header">TER</div>
                    <div class="calendar-day-header">QUA</div>
                    <div class="calendar-day-header">QUI</div>
                    <div class="calendar-day-header">SEX</div>
                    <div class="calendar-day-header">SÁB</div>

                    ${this.generateDaysHTML(year, month, firstDayIndex, lastDay, tasks, today)}
                </div>
            </div>
        `;
    }

    generateDaysHTML(year, month, firstDayIndex, lastDay, tasks, today) {
        let html = "";

        // Espaços vazios
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="calendar-day disabled"></div>`;
        }

        // Dias reais
        for (let day = 1; day <= lastDay; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = (day === today.getDate() && month === today.getMonth() && year === today.getFullYear());
            const todayClass = isToday ? 'today' : '';
            
            // Tarefas do dia
            const daysTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== 'pronto');

            html += `
                <div class="calendar-day ${todayClass}" data-date="${dateStr}">
                    <div class="day-number">${day}</div>
                    <div style="display:flex; flex-direction:column; gap:2px;">
                        ${daysTasks.slice(0, 3).map(t => {
                            const client = db.state.clients.find(c => c.name === t.client);
                            const bg = client ? client.color : '#ccc';
                            return `<div class="task-dot" style="background:${bg};" title="${t.title}">${t.client.substring(0,3)}: ${t.title}</div>`;
                        }).join('')}
                        ${daysTasks.length > 3 ? `<div class="more-tasks">+${daysTasks.length - 3}</div>` : ''}
                    </div>
                </div>
            `;
        }
        return html;
    }
}
