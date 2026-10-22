const { useState, useEffect } = React;

// --- COMPONENTE PRINCIPAL ADEGA LAMAS DESTILARIA ---
function App() {
  const [barris, setBarris] = useState(() => {
    const salvos = localStorage.getItem('barris_lamas');
    return salvos ? JSON.parse(salvos) : [
      { id: 'B-001', tipo: 'Carvalho Americano', lote: 'L-2023-A', capacidade: 200, dataEntrada: '2023-01-15', status: 'Em Maturação', observacao: 'Primeiro uso - Whisky' },
      { id: 'B-002', tipo: 'Carvalho Francês', lote: 'L-2023-B', capacidade: 225, dataEntrada: '2023-03-20', status: 'Em Maturação', observacao: 'Envelhecimento Cachaça' },
      { id: 'B-003', tipo: 'Amburana', lote: 'L-2024-C', capacidade: 200, dataEntrada: '2024-02-10', status: 'Pronto para Envase', observacao: 'Edição Especial' }
    ];
  });

  const [abaAtiva, setAbaAtiva] = useState('lista');
  const [filtro, setFiltro] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');
  const [novoBarril, setNovoBarril] = useState({ id: '', tipo: 'Carvalho Americano', lote: '', capacidade: '', dataEntrada: '', status: 'Em Maturação', observacao: '' });

  useEffect(() => {
    localStorage.setItem('barris_lamas', JSON.stringify(barris));
  }, [barris]);

  const adicionarBarril = (e) => {
    e.preventDefault();
    if (!novoBarril.id) return alert('Por favor, informe a identificação do barril.');
    if (barris.some(b => b.id.toLowerCase() === novoBarril.id.toLowerCase())) {
      return alert('Já existe um barril cadastrado com essa identificação.');
    }
    setBarris([...barris, novoBarril]);
    setNovoBarril({ id: '', tipo: 'Carvalho Americano', lote: '', capacidade: '', dataEntrada: '', status: 'Em Maturação', observacao: '' });
    setAbaAtiva('lista');
  };

  const removerBarril = (id) => {
    if (confirm(`Tem certeza que deseja excluir o barril ${id}?`)) {
      setBarris(barris.filter(b => b.id !== id));
    }
  };

  const barrisFiltrados = barris.filter(b => {
    const atendeTexto = b.id.toLowerCase().includes(filtro.toLowerCase()) ||
      b.tipo.toLowerCase().includes(filtro.toLowerCase()) ||
      (b.lote && b.lote.toLowerCase().includes(filtro.toLowerCase()));
    const atendeStatus = filtroStatus === 'Todos' || b.status === filtroStatus;
    return atendeTexto && atendeStatus;
  });

  const totalCapacidade = barris.reduce((acc, b) => acc + (Number(b.capacidade) || 0), 0);
  const totalEmMaturacao = barris.filter(b => b.status === 'Em Maturação').length;
  const totalProntos = barris.filter(b => b.status === 'Pronto para Envase').length;

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-[#2D1810] text-[#E6C280] p-4 shadow-xl text-center sticky top-0 z-20">
        <h1 className="text-xl font-extrabold tracking-wide">
          🛢️ ADEGA LAMAS DESTILARIA
        </h1>
        <p className="text-xs text-[#C5A059] mt-0.5 uppercase tracking-wider font-semibold">
          Controle de Maturação & Envelhecimento
        </p>
      </header>

      {/* Navegação */}
      <nav className="flex justify-center bg-[#3D2317] text-white text-xs font-bold sticky top-[60px] z-10 shadow-md">
        <button 
          onClick={() => setAbaAtiva('lista')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${abaAtiva === 'lista' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}
        >
          📋 Barris ({barris.length})
        </button>
        <button 
          onClick={() => setAbaAtiva('dashboard')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${abaAtiva === 'dashboard' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}
        >
          📊 Resumo
        </button>
        <button 
          onClick={() => setAbaAtiva('novo')}
          className={`flex-1 py-3 text-center border-b-2 transition-all ${abaAtiva === 'novo' ? 'border-[#C5A059] text-[#E6C280] bg-[#4A2D1F]' : 'border-transparent text-gray-300'}`}
        >
          ➕ Novo Barril
        </button>
      </nav>

      {/* Conteúdo */}
      <main className="max-w-md mx-auto p-4 space-y-4">
        {abaAtiva === 'lista' && (
          <div className="space-y-4">
            <div className="bg-white p-3 rounded-xl border border-[#E6C280]/40 shadow-sm space-y-2">
              <input 
                type="text"
                placeholder="🔍 Buscar por ID, madeira ou lote..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none"
              />
              <div className="flex gap-1 text-xs">
                {['Todos', 'Em Maturação', 'Pronto para Envase'].map(st => (
                  <button
                    key={st}
                    onClick={() => setFiltroStatus(st)}
                    className={`flex-1 py-1.5 rounded-md font-medium ${filtroStatus === st ? 'bg-[#2D1810] text-[#E6C280]' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {barrisFiltrados.map((b) => (
              <div key={b.id} className="bg-white p-4 rounded-xl border border-[#E6C280]/40 shadow-md relative">
                <div className="flex justify-between items-start border-b pb-2 mb-2">
                  <div>
                    <span className="text-xs font-extrabold bg-[#2D1810] text-[#E6C280] px-2.5 py-1 rounded">
                      {b.id}
                    </span>
                    <h3 className="font-bold text-gray-800 text-base mt-2">{b.tipo}</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 block">
                      {b.capacidade} L
                    </span>
                    <span className={`text-[10px] font-semibold mt-1 inline-block px-2 py-0.5 rounded ${b.status === 'Pronto para Envase' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1 mt-2">
                  <p><strong>Lote:</strong> {b.lote || 'N/A'}</p>
                  <p><strong>Data Entrada:</strong> {b.dataEntrada}</p>
                  {b.observacao && <p className="italic text-gray-500 mt-2 bg-gray-50 p-2 rounded">"{b.observacao}"</p>}
                </div>

                <button 
                  onClick={() => removerBarril(b.id)}
                  className="mt-3 text-xs text-red-600 font-bold block text-right w-full"
                >
                  Excluir Registro
                </button>
              </div>
            ))}
          </div>
        )}

        {abaAtiva === 'dashboard' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-xl border border-amber-200 text-center">
                <p className="text-xs text-gray-500 font-bold uppercase">Total em Estoque</p>
                <p className="text-2xl font-black text-[#2D1810] mt-1">{barris.length}</p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-amber-200 text-center">
                <p className="text-xs text-gray-500 font-bold uppercase">Volume Total</p>
                <p className="text-2xl font-black text-[#2D1810] mt-1">{totalCapacidade} L</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-amber-200 space-y-3">
              <h3 className="font-bold text-gray-800 text-sm border-b pb-2">Status da Adega</h3>
              <div className="flex justify-between text-xs">
                <span>🔵 Em Maturação</span>
                <span className="font-bold">{totalEmMaturacao} barris</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>🟢 Pronto para Envase</span>
                <span className="font-bold">{totalProntos} barris</span>
              </div>
            </div>
          </div>
        )}

        {abaAtiva === 'novo' && (
          <form onSubmit={adicionarBarril} className="bg-white p-5 rounded-xl border border-[#E6C280]/40 shadow-lg space-y-4">
            <h2 className="font-extrabold text-gray-800 text-base border-b pb-2 text-[#2D1810]">
              Cadastrar Novo Barril
            </h2>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">ID / Nº Barril *</label>
              <input 
                type="text" 
                placeholder="Ex: B-004"
                value={novoBarril.id}
                onChange={(e) => setNovoBarril({...novoBarril, id: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Madeira *</label>
              <select 
                value={novoBarril.tipo}
                onChange={(e) => setNovoBarril({...novoBarril, tipo: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
              >
                <option>Carvalho Americano</option>
                <option>Carvalho Francês</option>
                <option>Amburana</option>
                <option>Bálsamo</option>
                <option>Jequitibá Rosa</option>
                <option>Cana-fístula</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Capacidade (L)</label>
                <input 
                  type="number" 
                  placeholder="Ex: 200"
                  value={novoBarril.capacidade}
                  onChange={(e) => setNovoBarril({...novoBarril, capacidade: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Status</label>
                <select 
                  value={novoBarril.status}
                  onChange={(e) => setNovoBarril({...novoBarril, status: e.target.value})}
                  className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
                >
                  <option>Em Maturação</option>
                  <option>Pronto para Envase</option>
                  <option>Manutenção / Vazio</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Lote do Destilado</label>
              <input 
                type="text" 
                placeholder="Ex: L-2024-01"
                value={novoBarril.lote}
                onChange={(e) => setNovoBarril({...novoBarril, lote: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Entrada</label>
              <input 
                type="date" 
                value={novoBarril.dataEntrada}
                onChange={(e) => setNovoBarril({...novoBarril, dataEntrada: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Observações</label>
              <textarea 
                placeholder="Notas adicionais..."
                value={novoBarril.observacao}
                onChange={(e) => setNovoBarril({...novoBarril, observacao: e.target.value})}
                className="w-full p-2.5 border rounded-lg text-sm bg-gray-50 h-20"
              ></textarea>
            </div>
            <button type="submit" className="w-full py-3 bg-[#2D1810] text-[#E6C280] font-bold rounded-lg shadow">
              Salvar Registro de Barril
            </button>
          </form>
        )}
      </main>
    </div>
  );
}

// Renderização Nativa no DOM
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
