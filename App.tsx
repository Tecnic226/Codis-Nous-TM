
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Terminal,
  Cpu,
  Download, 
  Upload,
  FileText,
  SearchCode,
  RotateCcw,
  Loader2,
  Building2,
  Trash2,
  Edit3,
  X,
  Fingerprint,
  Sparkles,
  Search,
  Code2,
  Database,
  LayoutDashboard,
  ChevronDown,
  Info,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { Articulo, FormDataState } from './types';
import { DEFAULT_CLIENTES } from './constants';
import { storageService } from './services/storageService';
import { geminiService } from './services/geminiService';

const App: React.FC = () => {
  const [articulos, setArticulos] = useState<Articulo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewClient, setIsNewClient] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const initialFormData: FormDataState = {
    clienteId: "001",
    clienteNombreManual: "",
    codigoInterno: "",
    codigoCliente: "",
    ordenFabricacion: ""
  };

  const [formData, setFormData] = useState<FormDataState>(initialFormData);

  useEffect(() => {
    setArticulos(storageService.getArticulos());
  }, []);

  const listaClientesDinamica = useMemo(() => {
    const clientesMap = { ...DEFAULT_CLIENTES };
    articulos.forEach(art => {
      if (!clientesMap[art.clienteId]) {
        clientesMap[art.clienteId] = art.clienteNombre;
      }
    });
    return Object.entries(clientesMap).sort((a, b) => 
      a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' })
    );
  }, [articulos]);

  const filteredArticulos = useMemo(() => {
    if (!searchTerm) return articulos;
    const lower = searchTerm.toLowerCase();
    return articulos.filter(a => 
      a.codigoInterno.toLowerCase().includes(lower) ||
      a.codigoCliente.toLowerCase().includes(lower) ||
      a.clienteNombre.toLowerCase().includes(lower) ||
      a.ordenes.some(o => o.toLowerCase().includes(lower))
    );
  }, [articulos, searchTerm]);

  const registroExistente = useMemo(() => {
    if (!formData.codigoCliente || editingId) return null;
    const refLimpia = formData.codigoCliente.trim().toUpperCase();
    return articulos.find(a => 
      a.clienteId === formData.clienteId && 
      a.codigoCliente.trim().toUpperCase() === refLimpia
    );
  }, [formData.codigoCliente, formData.clienteId, articulos, editingId]);

  // Sincronizar Código Interno si el registro ya existe
  useEffect(() => {
    if (registroExistente && !editingId) {
      setFormData(prev => ({ ...prev, codigoInterno: registroExistente.codigoInterno }));
    } else if (!registroExistente && !editingId && formData.codigoInterno === (articulos.find(a => a.id === registroExistente?.id)?.codigoInterno || "")) {
       // Opcional: limpiar si deja de coincidir y era el código del existente
    }
  }, [registroExistente, editingId]);

  const sugerirCodigo = () => {
    const articulosDelCliente = articulos.filter(a => a.clienteId === formData.clienteId);
    const siguienteNumero = (articulosDelCliente.length + 1).toString().padStart(4, '0');
    setFormData(prev => ({ ...prev, codigoInterno: `${prev.clienteId}-${siguienteNumero}` }));
  };

  const manejarAccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigoCliente) return;

    setLoading(true);
    const ofLimpia = formData.ordenFabricacion.trim().toUpperCase();
    const refClienteLimpia = formData.codigoCliente.trim().toUpperCase();
    const nombreCliente = isNewClient 
      ? formData.clienteNombreManual 
      : (listaClientesDinamica.find(([id]) => id === formData.clienteId)?.[1] || formData.clienteId);

    try {
      if (editingId) {
        const itemActual = articulos.find(a => a.id === editingId);
        if (itemActual) {
          const nuevasOFs = ofLimpia 
            ? Array.from(new Set([...(itemActual.ordenes || []), ofLimpia])) 
            : (itemActual.ordenes || []);
          
          storageService.updateArticulo(editingId, {
            clienteId: formData.clienteId,
            clienteNombre: nombreCliente,
            codigoCliente: refClienteLimpia,
            codigoInterno: formData.codigoInterno.trim().toUpperCase(),
            ordenes: nuevasOFs
          });
          setEditingId(null);
        }
      } else if (registroExistente) {
        const nuevasOFs = Array.from(new Set([...(registroExistente.ordenes || []), ofLimpia]));
        storageService.updateArticulo(registroExistente.id, {
          ordenes: nuevasOFs
        });
      } else {
        storageService.addArticulo({
          clienteId: formData.clienteId,
          clienteNombre: nombreCliente,
          codigoCliente: refClienteLimpia,
          codigoInterno: (formData.codigoInterno || `${formData.clienteId}-NEW`).trim().toUpperCase(),
          ordenes: ofLimpia ? [ofLimpia] : []
        });
      }
      
      setArticulos(storageService.getArticulos());
      setFormData(initialFormData);
      setIsNewClient(false);
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setLoading(false);
    }
  };

  const eliminarRegistro = (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro permanentemente?")) return;
    storageService.deleteArticulo(id);
    setArticulos(storageService.getArticulos());
  };

  const iniciarEdicion = (art: Articulo) => {
    setEditingId(art.id);
    setFormData({
      clienteId: art.clienteId,
      clienteNombreManual: DEFAULT_CLIENTES[art.clienteId] ? "" : art.clienteNombre,
      codigoInterno: art.codigoInterno,
      codigoCliente: art.codigoCliente,
      ordenFabricacion: ""
    });
    setIsNewClient(!DEFAULT_CLIENTES[art.clienteId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const manejarImportacion = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          const existing = storageService.getArticulos();
          storageService.saveArticulos([...data, ...existing]);
          setArticulos(storageService.getArticulos());
          alert("Importación completada con éxito");
        }
      } catch (err) {
        console.error("Error importando:", err);
        alert("Error al procesar el archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  const exportarJSON = () => {
    const blob = new Blob([JSON.stringify(articulos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_codis_nous_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-100">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* HEADER */}
        <header className="bg-slate-900 p-8 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 border-b-8 border-indigo-600 relative overflow-hidden ring-1 ring-white/10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="relative group/logo cursor-pointer">
              <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 group-hover/logo:opacity-50 transition-all duration-700"></div>
              <div className="relative bg-gradient-to-tr from-indigo-700 via-blue-600 to-indigo-500 p-1 rounded-[1.8rem] shadow-2xl transform transition-transform group-hover/logo:rotate-12 duration-500">
                <div className="bg-slate-900 rounded-[1.6rem] p-5 flex items-center justify-center overflow-hidden">
                  <div className="absolute -bottom-2 -right-2 text-indigo-500/5 rotate-12">
                    <Database size={60} />
                  </div>
                  <div className="relative flex items-center justify-center">
                    <div className="absolute animate-spin-slow opacity-10 text-white">
                      <Cpu size={32} />
                    </div>
                    <div className="relative bg-indigo-950 p-3 rounded-2xl border border-white/20 text-white shadow-inner">
                      <Terminal size={32} strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none select-none">
                CODIS <span className="text-indigo-400 italic">NOUS</span> TM
              </h1>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full border border-white/10 backdrop-blur-md">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Central de Datos</span>
                </div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-[0.4em]">Engineering</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4 relative z-10">
            <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={manejarImportacion} />
            <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-3xl text-[10px] font-black hover:text-white transition-all uppercase tracking-widest border border-slate-700 shadow-xl">
              <Upload size={18} /> Importar
            </button>
            <button onClick={exportarJSON} className="flex items-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl text-[10px] font-black shadow-lg transition-all uppercase tracking-widest hover:scale-105 active:scale-95">
              <Download size={18} /> Exportar
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* PANEL DE REGISTRO */}
          <aside className="lg:col-span-4">
            <div className={`bg-slate-50 rounded-[3.5rem] p-10 shadow-xl border-4 transition-all duration-700 ${editingId ? 'border-amber-400 bg-amber-50/20' : 'border-white'} sticky top-8 ring-1 ring-slate-200`}>
              <div className="flex items-center justify-between border-b-2 border-slate-200/50 pb-8 mb-8">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-2xl ${editingId ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                      {editingId ? <Edit3 size={24} /> : <PlusCircle size={24} />}
                   </div>
                   <div className="space-y-1">
                    <h2 className="text-xl font-black text-slate-800 uppercase leading-none">
                      {editingId ? 'Editor' : 'Registro'}
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Consola de Entrada</p>
                  </div>
                </div>
                {editingId && (
                  <button onClick={() => {setEditingId(null); setFormData(initialFormData);}} className="p-2 rounded-full bg-slate-200 text-slate-500 hover:bg-red-500 hover:text-white transition-all">
                    <X size={20} />
                  </button>
                )}
              </div>

              <form onSubmit={manejarAccion} className="space-y-8">
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-3 flex items-center gap-2 tracking-[0.2em]"><Building2 size={14} className="text-indigo-400"/> Cliente Emisor</label>
                    <div className="relative bg-white p-2 rounded-[2.2rem] shadow-sm border border-slate-200 focus-within:border-indigo-400 transition-colors">
                      {isNewClient ? (
                        <div className="flex gap-2">
                          <input type="text" placeholder="ID" className="w-20 p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none uppercase" value={formData.clienteId} onChange={(e) => setFormData({...formData, clienteId: e.target.value})} />
                          <input type="text" placeholder="Nombre..." className="flex-1 p-4 bg-slate-50 rounded-2xl text-sm font-bold outline-none uppercase" value={formData.clienteNombreManual} onChange={(e) => setFormData({...formData, clienteNombreManual: e.target.value})} />
                        </div>
                      ) : (
                        <>
                          <select value={formData.clienteId} onChange={(e) => setFormData({...formData, clienteId: e.target.value})} className="w-full p-4 pr-12 bg-transparent text-sm font-bold outline-none cursor-pointer appearance-none">
                            {listaClientesDinamica.map(([id, nombre]) => (
                              <option key={id} value={id}>{id} - {nombre}</option>
                            ))}
                          </select>
                          <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-indigo-600">
                             <ChevronDown size={24} strokeWidth={3} />
                          </div>
                        </>
                      )}
                    </div>
                    <button type="button" onClick={() => setIsNewClient(!isNewClient)} className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest ml-4 hover:underline">
                      {isNewClient ? '← Seleccionar de lista' : '+ Añadir cliente nuevo'}
                    </button>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-3 tracking-[0.2em]">Ref. Plano / Cliente</label>
                    <div className="bg-white p-2 rounded-[2.2rem] shadow-sm border border-slate-200 focus-within:border-indigo-400 transition-colors">
                       <input type="text" required placeholder="Escribir referencia técnica..." value={formData.codigoCliente} onChange={(e) => setFormData({...formData, codigoCliente: e.target.value})} className="w-full p-4 bg-transparent text-sm font-mono font-bold outline-none uppercase placeholder:text-slate-300" />
                    </div>

                    {/* MENSAJE DE ESTADO DE LA REFERENCIA */}
                    {formData.codigoCliente.trim().length > 1 && (
                      <div className={`mt-4 p-4 rounded-3xl border animate-in slide-in-from-top-2 duration-300 ${registroExistente ? 'bg-indigo-50 border-indigo-100' : 'bg-emerald-50 border-emerald-100'}`}>
                        <div className="flex gap-3 items-start">
                          <div className={registroExistente ? 'text-indigo-600' : 'text-emerald-600'}>
                             {registroExistente ? <Info size={20} /> : <CheckCircle2 size={20} />}
                          </div>
                          <div>
                            <p className={`text-xs font-black uppercase tracking-widest ${registroExistente ? 'text-indigo-900' : 'text-emerald-900'}`}>
                              {registroExistente ? 'Referencia detectada' : 'Referencia nueva'}
                            </p>
                            <p className={`text-[11px] font-medium leading-relaxed mt-1 ${registroExistente ? 'text-indigo-700' : 'text-emerald-700'}`}>
                              {registroExistente ? (
                                <>
                                  Este código ya existe en la base de datos (ID: <span className="font-black">{registroExistente.codigoInterno}</span>). 
                                  {registroExistente.ordenes.length > 0 && (
                                    <span className="block mt-1 italic font-bold text-indigo-600">Registrado en: {registroExistente.ordenes.join(', ')}</span>
                                  )}
                                  <span className="block mt-1 text-[10px] text-indigo-400 font-bold uppercase tracking-tight">Introduce solo la nueva OF abajo para vincularla.</span>
                                </>
                              ) : (
                                "Esta referencia no consta en el archivo maestro. Por favor, asigne una ID interna para crear el registro."
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-3 tracking-[0.2em]">Código Interno TM</label>
                    <div className={`flex gap-3 items-center p-2 rounded-[2.2rem] shadow-sm border transition-all duration-300 ${registroExistente ? 'bg-slate-100 border-indigo-200' : 'bg-white border-slate-200 focus-within:border-indigo-400'}`}>
                      <input 
                        type="text" 
                        required={!registroExistente} 
                        disabled={!!registroExistente && !editingId}
                        placeholder={registroExistente ? "ID Bloqueado (Detectado)" : "ID Interno..."} 
                        value={formData.codigoInterno} 
                        onChange={(e) => setFormData({...formData, codigoInterno: e.target.value})} 
                        className={`flex-1 p-4 bg-transparent text-sm font-mono font-bold outline-none uppercase placeholder:text-slate-300 ${registroExistente ? 'text-indigo-500' : ''}`} 
                      />
                      {!editingId && !registroExistente && (
                        <button type="button" onClick={sugerirCodigo} className="p-4 bg-slate-100 text-slate-400 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">
                          <RotateCcw size={18} />
                        </button>
                      )}
                      {registroExistente && !editingId && (
                        <div className="p-4 text-indigo-400">
                           <Lock size={18} />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-indigo-600 uppercase ml-3 tracking-[0.2em]">Orden de Fabricación (OF)</label>
                    <div className="bg-indigo-600 p-1.5 rounded-[2.5rem] shadow-[0_15px_30px_rgba(79,70,229,0.2)]">
                       <input type="text" placeholder="Asignar OF..." value={formData.ordenFabricacion} onChange={(e) => setFormData({...formData, ordenFabricacion: e.target.value})} className="w-full p-5 bg-white rounded-[2.2rem] text-lg font-mono font-bold outline-none text-indigo-700 placeholder:text-indigo-200 shadow-inner uppercase" />
                    </div>
                  </div>
                </div>

                <button type="submit" disabled={loading} className={`w-full py-7 rounded-[2.5rem] font-black text-white shadow-2xl transition-all flex items-center justify-center gap-4 uppercase tracking-[0.3em] text-xs ${editingId ? 'bg-amber-500 hover:bg-amber-600' : (registroExistente ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-slate-800')} hover:-translate-y-1 active:scale-95`}>
                  {loading ? <Loader2 className="animate-spin" size={22} /> : (editingId ? <Fingerprint size={22} /> : (registroExistente ? <CheckCircle2 size={22} /> : <PlusCircle size={22} />))}
                  {editingId ? 'Confirmar Edición' : (registroExistente ? 'Vincular nueva OF' : 'Crear Nuevo Registro')}
                </button>
              </form>
            </div>
          </aside>

          <div className="lg:col-span-8 flex flex-col gap-10">
            {/* ESTADÍSTICAS Y BUSCADOR */}
            <section className="bg-slate-800 p-8 rounded-[3.5rem] shadow-2xl border-b-4 border-indigo-500 flex flex-col md:flex-row gap-8 items-center justify-between relative group overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
               <div className="relative w-full md:w-[450px]">
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within/search:text-indigo-400 transition-colors">
                     <Search size={22} />
                  </div>
                  <input 
                    type="text" 
                    placeholder="Buscar códigos u OFs..." 
                    className="w-full pl-16 pr-8 py-5 bg-slate-900/50 border-2 border-slate-700 rounded-[2rem] text-sm font-bold text-white placeholder:text-slate-600 focus:bg-slate-900 focus:border-indigo-500 outline-none transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>
               <div className="flex gap-12 px-8 relative z-10">
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1 justify-center">
                       <LayoutDashboard size={14} className="text-indigo-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Registros</span>
                    </div>
                    <span className="text-4xl font-black text-white tabular-nums">{articulos.length}</span>
                  </div>
                  <div className="w-px h-16 bg-slate-700"></div>
                  <div className="text-center">
                    <div className="flex items-center gap-2 mb-1 justify-center">
                       <Building2 size={14} className="text-indigo-400" />
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresas</span>
                    </div>
                    <span className="text-4xl font-black text-white tabular-nums">{listaClientesDinamica.length}</span>
                  </div>
               </div>
            </section>

            {/* LISTADO DE BASE DE DATOS */}
            <main className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[700px] ring-1 ring-slate-100">
               <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                  <div className="flex items-center gap-5">
                    <div className="bg-indigo-600 text-white p-4 rounded-3xl shadow-xl transform -rotate-3 group-hover:rotate-0 transition-transform">
                       <FileText size={28} />
                    </div>
                    <div className="space-y-1">
                       <h2 className="text-lg font-black text-slate-800 uppercase tracking-widest leading-none">Base de Datos de Ingeniería</h2>
                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm"></span> Archivo Maestro TM
                       </p>
                    </div>
                  </div>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full text-left table-fixed">
                    <thead>
                      <tr className="bg-slate-50/80">
                        <th className="w-1/4 px-6 py-8 border-r border-slate-100">
                           <div className="flex flex-col items-center leading-none gap-1">
                              <span className="text-xl font-black text-slate-500 uppercase tracking-[0.2em]">ID</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.4em]">CLIENTE</span>
                           </div>
                        </th>
                        <th className="w-1/3 px-6 py-8 border-r border-slate-100">
                           <div className="flex flex-col items-center leading-none">
                              <span className="text-xl font-black text-slate-500 uppercase tracking-widest">REFERENCIA</span>
                           </div>
                        </th>
                        <th className="w-1/4 px-6 py-8 text-xl font-black text-slate-500 uppercase tracking-[0.2em] border-r border-slate-100 text-center">
                           OF
                        </th>
                        <th className="w-24 py-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredArticulos.map((art) => (
                        <tr key={art.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-6 py-10 border-r border-slate-50/50">
                             <div className="flex flex-col items-center gap-3">
                                <span className="text-2xl font-black text-indigo-700 font-mono leading-none block tracking-tighter">{art.codigoInterno}</span>
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 w-fit rounded-xl border border-slate-200 shadow-sm">
                                   <Building2 size={12} className="text-slate-500" />
                                   <span className="text-[10px] font-bold text-slate-700 uppercase">{art.clienteNombre}</span>
                                </div>
                             </div>
                          </td>
                          <td className="px-6 py-10 border-r border-slate-50/50">
                             <div className="flex flex-col items-center gap-4">
                                <span className="text-2xl font-bold text-slate-800 font-mono uppercase bg-white px-4 py-2 rounded-xl border-2 border-slate-100 shadow-sm block w-fit tracking-wide">{art.codigoCliente}</span>
                             </div>
                          </td>
                          <td className="px-6 py-10 border-r border-slate-50/50">
                             <div className="flex flex-wrap gap-2.5 justify-center">
                                {art.ordenes?.length > 0 ? art.ordenes.map((of, i) => (
                                  <span key={i} className="text-base font-mono font-black bg-indigo-50 text-indigo-800 border-2 border-indigo-100 px-4 py-2 rounded-2xl shadow-sm hover:bg-indigo-600 hover:text-white transition-all cursor-default transform hover:scale-105">
                                     {of}
                                  </span>
                                )) : (
                                  <span className="text-xs font-black text-slate-200 uppercase tracking-widest italic">Sin OF</span>
                                )}
                             </div>
                          </td>
                          <td className="px-4 py-10">
                             <div className="flex flex-col items-center gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={() => iniciarEdicion(art)} className="p-3 bg-white text-slate-400 hover:text-amber-600 hover:bg-amber-50 border-2 border-slate-100 rounded-2xl shadow-md hover:scale-110 active:scale-95 transition-all">
                                   <Edit3 size={18} />
                                </button>
                                <button onClick={() => eliminarRegistro(art.id)} className="p-3 bg-white text-slate-400 hover:text-red-600 hover:bg-red-50 border-2 border-slate-100 rounded-2xl shadow-md hover:scale-110 active:scale-95 transition-all">
                                   <Trash2 size={18} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredArticulos.length === 0 && (
                    <div className="py-40 text-center flex flex-col items-center gap-8 bg-slate-50/10">
                       <div className="relative">
                          <div className="absolute inset-0 bg-indigo-100 blur-[80px] rounded-full opacity-20 animate-pulse"></div>
                          <div className="relative bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                             <Code2 size={80} strokeWidth={1} className="text-slate-100" />
                          </div>
                       </div>
                       <div className="space-y-3">
                          <h3 className="text-2xl font-black text-slate-300 uppercase tracking-[0.4em]">Sin Datos</h3>
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Introduce una referencia en el panel lateral para comenzar</p>
                       </div>
                    </div>
                  )}
               </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
