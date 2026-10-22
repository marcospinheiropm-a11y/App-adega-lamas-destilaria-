import React, { useState, useEffect } from 'react';
import { List, BarChart3, Plus, Trash2, FileText, Settings, CheckCircle, ArrowLeftRight } from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeyForAdegaLamas",
  authDomain: "adega-lamas-destilaria.firebaseapp.com",
  projectId: "adega-lamas-destilaria",
};

export default function App() {
  const [barris, setBarris] = useState(() => {
    const salvos = localStorage.getItem('barris_lamas_pro');
    return salvos ? JSON.parse(salvos) : [
      { id: 'B-001', tipo: 'Carvalho Americano', liquido: 'Whisky', lote: 'L-2023-A', capacidade: 200, dataEntrada: '2023-01-15', status: 'Em Maturação', observacao: 'Primeiro uso' },
      { id: 'B-002', tipo: 'Carvalho Francês', liquido: 'Cachaça', lote: 'L-2023-B', capacidade: 225, dataEntrada: '2023-03-20', status: 'Em Maturação', observacao: 'Envelhecimento especial' },
    ];
  });

  const [abaAtiva, setAbaAtiva] = useState('lista');
  const [busca, setBusca] = useState('');
  const [filtroMadeira, setFiltroMadeira] = useState('Todas');
  const [filtroLiquido, setFiltroLiquido] = useState('Todos');

  const [novoBarril, setNovoBarril] = useState({
    id: '', tipo: 'Carvalho Americano', liquido: 'Whisky', lote: '', capacidade: '', dataEntrada: '', status: 'Em Maturação', observacao: ''
  });

  useEffect(() => {
    localStorage.setItem('barris_lamas_pro', JSON.stringify(barris));
  }, [barris]);

  const adicionarBarril = (e) => {
    e.preventDefault();
    if (!novoBarril.id) return alert('Informe o número/ID do barril.');
    if (barris.some(b => b.id.toLowerCase() === novoBarril.id.toLowerCase())) {
      return alert('Já existe um barril com esta identificação.');
    }
    setBarris([...barris, novoBarril]);
    setNovoBarril({ id: '', tipo: 'Carvalho Americano', liquido: 'Whisky', lote: '', capacidade: '', dataEntrada: '', status: 'Em Maturação', observacao: '' });
    setAbaAtiva('lista');
  };

  const removerBarril = (id) => {
    if (window.confirm(`Deseja excluir o barril ${id}?`)) {
      setBarris(barris.filter(b => b.id !== id));
    }
  };

  const barrisFiltrados = barris.filter(b => {
    const atendeBusca = b.id.toLowerCase().includes(busca.toLowerCase()) || (b.lote && b.lote.toLowerCase().includes(busca.toLowerCase()));
    const atendeMadeira = filtroMadeira === 'Todas' || b.tipo === filtroMadeira;
    const atendeLiquido = filtroLiquido === 'Todos' || b.liquido === filtroLiquido;
    return atendeBusca && atendeMadeira && atendeLiquido;
  });

  const totalCapacidade = barris.reduce((acc, b) => acc + (Number(b.capacidade) || 0), 0);
  const totalEmMaturacao = barris.filter(b => b.status === 'Em Maturação').length;
  const totalProntos = barris.filter(b => b.status === 'Pronto para Envase').length;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-12 font-sans">
      <header className="bg-[#2D1810] text-[#E6C280] p-5 shadow-xl text-center sticky top-0 z-20">
        <h1 className="text-2xl font-black tracking-wide uppercase flex items-center justify-center gap-2">
          <Settings className="w-6 h-6" /> ADEGA LAMAS DESTILARIA
        </h1>
        <p className="text-sm text-[#C5A059] mt-1 font-semibold uppercase tracking-widest">
          Coordenador de Maturação: Marcos Pinheiro
        </p>
      </header>

      <nav className="flex justify-center bg-[#3D2317] text-white text-sm font-bold sticky top-[84px] z-10 shadow-md">
        <button onClick={() => setAbaAtiva('lista')} className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${abaAtiva === 'lista' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}>
          <List className="w-4 h-4" /> Barris ({barris.length})
        </button>
        <button onClick={() => setAbaAtiva('dashboard')} className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${abaAtiva === 'dashboard' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}>
          <BarChart3 className="w-4 h-4" /> Relatórios
        </button>
        <button onClick={() => setAbaAtiva('novo')} className={`flex-1 py-4 flex items-center justify-center gap-2 border-b-2 transition-all ${abaAtiva === 'novo' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}>
          <Plus className="w-4 h-4" /> Cadastro
        </button>
      </nav>

      <main className="max-w-2xl mx-auto p-4 space-y-4 mt-4">
        {abaAtiva === 'lista' && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-[#E6C280]/40 shadow-sm grid gap-3">
              <input type="text" placeholder="Buscar por ID ou lote..." value={busca} onChange={(e) => setBusca(e.target.value)} className="w-full p-3 rounded-lg border text-sm bg-gray-50 outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={filtroMadeira} onChange={(e) => setFiltroMadeira(e.target.value)} className="p-2 border rounded-lg text-sm bg-gray-50">
                  <option>Todas as Madeiras</option>
                  <option>Carvalho Americano</option>
                  <option>Carvalho Francês</option>
                  <option>Amburana</option>
                  <option>Bálsamo</option>
                </select>
                <select value={filtroLiquido} onChange={(e) => setFiltroLiquido(e.target.value)} className="p-2 border rounded-lg text-sm bg-gray-50">
                  <option>Todos os Líquidos</option>
                  <option>Whisky</option>
                  <option>Cachaça</option>
                  <option>Cachaça Premium</option>
                  <option>Gin</option>
                  <option>Rum</option>
                </select>
              </div>
            </div>

            {barrisFiltrados.map((b) => (
              <div key={b.id} className="bg-white p-5 rounded-xl border border-[#E6C280]/40 shadow-md">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="text-sm font-black bg-[#2D1810] text-[#E6C280] px-3 py-1 rounded shadow-sm">{b.id}</span>
                    <h3 className="font-bold text-gray-800 text-lg mt-2">{b.tipo}</h3>
                    <p className="text-sm font-bold text-amber-800 flex items-center gap-1 mt-1"><FileText className="w-4 h-4"/> {b.liquido}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-amber-900 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 block">{b.capacidade} L</span>
                    <span className={`text-xs font-bold mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded ${b.status === 'Pronto para Envase' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {b.status === 'Pronto para Envase' ? <CheckCircle className="w-3 h-3"/> : <ArrowLeftRight className="w-3 h-3"/>} {b.status}
                    </span>
                  </div>
                </div>
                <div className="text-sm text-gray-600 space-y-1 mt-3">
                  <p><strong>Lote:</strong> {b.lote || 'N/A'}</p>
                  <p><strong>Data de Entrada:</strong> {b.dataEntrada}</p>
                  {b.observacao && <p className="italic text-gray-500 bg-gray-50 p-3 rounded mt-2 border">"{b.observacao}"</p>}
                </div>
                <div className="mt-4 pt-3 border-t flex justify-end">
                  <button onClick={() => removerBarril(b.id)} className="text-sm flex items-center gap-1 text-red-600 font-bold hover:text-red-800"><Trash2 className="w-4 h-4"/> Excluir</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm text-center">
                <p className="text-sm text-gray-500 font-bold uppercase">Total em Estoque</p>
                <p className="text-4xl font-black text-[#2D1810] mt-2">{barris.length}</p>
              </div>
              <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm text-center">
                <p className="text-sm text-gray-500 font-bold uppercase">Volume Total</p>
                <p className="text-4xl font-black text-[#2D1810] mt-2">{totalCapacidade} L</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-amber-200 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 text-lg border-b pb-2 flex items-center gap-2"><BarChart3 className="w-5 h-5"/> Visão Geral da Adega</h3>
              <div className="flex justify-between items-center text-sm p-2 bg-blue-50 rounded">
                <span className="font-bold text-blue-900">Em Maturação</span>
                <span className="font-black text-blue-900">{totalEmMaturacao} barris</span>
              </div>
              <div className="flex justify-between items-center text-sm p-2 bg-green-50 rounded">
                <span className="font-bold text-green-900">Pronto para Envase</span>
                <span className="font-black text-green-900">{totalProntos} barris</span>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'novo' && (
          <form onSubmit={adicionarBarril} className="bg-white p-6 rounded-xl border border-[#E6C280]/40 shadow-lg space-y-4">
            <h2 className="font-black text-gray-800 text-lg border-b pb-2 text-[#2D1810] flex items-center gap-2">
              <Plus className="w-5 h-5"/> Cadastrar Barril
            </h2>
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Identificação (ID) *</label>
              <input type="text" required value={novoBarril.id} onChange={(e) => setNovoBarril({...novoBarril, id: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Madeira *</label>
                <select value={novoBarril.tipo} onChange={(e) => setNovoBarril({...novoBarril, tipo: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50">
                  <option>Carvalho Americano</option>
                  <option>Carvalho Francês</option>
                  <option>Amburana</option>
                  <option>Bálsamo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Líquido *</label>
                <select value={novoBarril.liquido} onChange={(e) => setNovoBarril({...novoBarril, liquido: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50">
                  <option>Whisky</option>
                  <option>Cachaça</option>
                  <option>Gin</option>
                  <option>Rum</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Capacidade (L)</label>
                <input type="number" value={novoBarril.capacidade} onChange={(e) => setNovoBarril({...novoBarril, capacidade: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Status</label>
                <select value={novoBarril.status} onChange={(e) => setNovoBarril({...novoBarril, status: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50">
                  <option>Em Maturação</option>
                  <option>Pronto para Envase</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Lote</label>
                <input type="text" value={novoBarril.lote} onChange={(e) => setNovoBarril({...novoBarril, lote: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Data</label>
                <input type="date" value={novoBarril.dataEntrada} onChange={(e) => setNovoBarril({...novoBarril, dataEntrada: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 uppercase mb-1">Observações</label>
              <textarea value={novoBarril.observacao} onChange={(e) => setNovoBarril({...novoBarril, observacao: e.target.value})} className="w-full p-3 border rounded-lg bg-gray-50 h-24"></textarea>
            </div>
            <button type="submit" className="w-full py-4 bg-[#2D1810] text-[#E6C280] font-black rounded-lg shadow-lg hover:bg-[#3D2317] transition-colors uppercase tracking-widest mt-2">
              Salvar Barril
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
