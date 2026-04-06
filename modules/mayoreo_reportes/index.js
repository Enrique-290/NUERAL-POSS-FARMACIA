import { load } from '../../core/storage.js';
import { STORAGE_KEYS } from '../../core/constants.js';
import { card } from '../helpers.js';
export function renderMayoreoReportes(){const hist=load(STORAGE_KEYS.MAYOREO_HISTORIAL,[]);const inv=load(STORAGE_KEYS.MAYOREO_INVENTORY,[]);const cls=load(STORAGE_KEYS.MAYOREO_CLIENTES,[]);const total=hist.reduce((a,i)=>a+Number(i.total||0),0);return `<div class="page"><section class="grid grid-4">${card('Venta mayoreo','$'+total.toFixed(2),'Acumulado')}${card('Clientes',cls.length,'Base mayoreo')}${card('Productos',inv.length,'Inventario mayoreo')}${card('Stock bajo',inv.filter(i=>i.stock<=i.stockMinimo).length,'Atender')}</section></div>`;}
