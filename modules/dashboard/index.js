import { card } from '../helpers.js';
export function renderDashboard(){return `<div class="page"><section class="grid grid-4">${card('Ventas hoy','$12,480','+8.2% contra ayer')}${card('Tickets','87','Promedio $143.44')}${card('Productos por caducar','14','Revisar hoy')}${card('Stock bajo','22','Surtir desde bodega')}</section></div>`;}
