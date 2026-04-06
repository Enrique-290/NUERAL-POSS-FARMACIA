import { STORAGE_KEYS, MODULES } from './constants.js';
import { load, save } from './storage.js';

function perms(all=false){return MODULES.reduce((a,m)=>{a[m.key]=all;return a;},{});}

export function seedData(){
  if(!load(STORAGE_KEYS.USERS)){
    save(STORAGE_KEYS.USERS,[
      {id:'usr_admin',nombre:'Administrador General',username:'admin',password:'1234',role:'Administrador',active:true,permissions:perms(true)},
      {id:'usr_caja',nombre:'Caja Mostrador',username:'caja',password:'1234',role:'Caja',active:true,permissions:{...perms(false),dashboard:true,ventas:true,clientes:true,historial:true}}
    ]);
  }
  if(!load(STORAGE_KEYS.CONFIG)) save(STORAGE_KEYS.CONFIG,{appName:'Neural POS Farmacia',footerText:'Hecho por Neural Apps',businessName:'Neural POS Farmacia',whatsapp:'525500000000'});
  if(!load(STORAGE_KEYS.INVENTORY)) save(STORAGE_KEYS.INVENTORY,[
    { id:'inv1', sku:'75020001', barcode:'75020001', nombre:'Paracetamol 500 mg', categoria:'Genérico', tipo:'Genérico', costo:22, precio:38, stock:22, stockMinimo:8, lote:'PAR-2401', caducidad:'2026-11-20', visible_web:true, precio_web:38, categoria_web:'Analgésicos', destacado:true },
    { id:'inv2', sku:'75020002', barcode:'75020002', nombre:'Omeprazol 20 mg', categoria:'Original', tipo:'Original', costo:46, precio:74, stock:9, stockMinimo:10, lote:'OME-2405', caducidad:'2026-05-15', visible_web:false, precio_web:74, categoria_web:'Digestivo', destacado:false },
    { id:'inv3', sku:'75020003', barcode:'75020003', nombre:'Jarabe infantil', categoria:'Pediatría', tipo:'Original', costo:58, precio:96, stock:12, stockMinimo:6, lote:'JAR-2402', caducidad:'2026-04-20', visible_web:true, precio_web:96, categoria_web:'Infantil', destacado:true }
  ]);
  if(!load(STORAGE_KEYS.BODEGA)) save(STORAGE_KEYS.BODEGA,[
    {id:'bod1',nombre:'Paracetamol caja',sku:'B-001',stock:80,stockMinimo:20,lote:'BPAR-1',caducidad:'2026-12-31'},
    {id:'bod2',nombre:'Omeprazol caja',sku:'B-002',stock:40,stockMinimo:10,lote:'BOME-1',caducidad:'2026-08-15'}
  ]);
  if(!load(STORAGE_KEYS.CLIENTES)) save(STORAGE_KEYS.CLIENTES,[
    {id:'cl1',nombre:'Mostrador',telefono:'',correo:'',direccion:'',tipo:'Mostrador',activo:true,notas:''},
    {id:'cl2',nombre:'Ana Ruiz',telefono:'5512345678',correo:'ana@mail.com',direccion:'CDMX',tipo:'Frecuente',activo:true,notas:'Cliente frecuente'}
  ]);
  if(!load(STORAGE_KEYS.HISTORIAL)) save(STORAGE_KEYS.HISTORIAL,[]);
  if(!load(STORAGE_KEYS.WEB)) save(STORAGE_KEYS.WEB,{storeName:'Neural Farmacia Online',bannerTitle:'Catálogo en línea',bannerSubtitle:'Selecciona y pide por WhatsApp'});
  if(!load(STORAGE_KEYS.MAYOREO_INVENTORY)) save(STORAGE_KEYS.MAYOREO_INVENTORY,[
    {id:'miv1',nombre:'Paracetamol lote mayoreo',sku:'M-001',tipo:'Genérico',precio:650,costo:480,stock:35,stockMinimo:10,lote:'MAY-PAR-1',caducidad:'2026-10-10'},
    {id:'miv2',nombre:'Omeprazol lote mayoreo',sku:'M-002',tipo:'Original',precio:1100,costo:840,stock:12,stockMinimo:8,lote:'MAY-OME-1',caducidad:'2026-07-25'}
  ]);
  if(!load(STORAGE_KEYS.MAYOREO_CLIENTES)) save(STORAGE_KEYS.MAYOREO_CLIENTES,[
    {id:'mc1',nombre:'Farmacia Centro',telefono:'5550001111',correo:'centro@farmacia.com',direccion:'Centro',tipo:'Mayoreo',activo:true,notas:'Compra semanal'},
    {id:'mc2',nombre:'Distribuidora Norte',telefono:'5550002222',correo:'norte@dist.com',direccion:'Norte',tipo:'Mayoreo',activo:true,notas:'Pide por volumen'}
  ]);
  if(!load(STORAGE_KEYS.MAYOREO_HISTORIAL)) save(STORAGE_KEYS.MAYOREO_HISTORIAL,[]);
}
