import { load } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';
import { card } from '../helpers.js';
export function renderMayoreoDashboard(){const hist=load(STORAGE_KEYS.MAYOREO_HISTORIAL,[]);const inv=load(STORAGE_KEYS.MAYOREO_INVENTORY,[]);const cls=load(STORAGE_KEYS.MAYOREO_CLIENTES,[]);const total=hist.reduce((a,i)=>a+Number(i.total||0),0);return `<div class="page"><section class="grid grid-4">${card('Ventas mayoreo','$'+total.toFixed(2),'Acumulado')}${card('Operaciones',hist.length,'Historial mayoreo')}${card('Clientes mayoreo',cls.length,'Base separada')}${card('Stock bajo',inv.filter(i=>i.stock<=i.stockMinimo).length,'Inventario mayoreo')}</section></div>`;}
