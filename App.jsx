import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  Plus, Search, ShieldAlert, History, Edit, Trash2, 
  CheckCircle, ArrowLeftRight, Settings, Wine, Clock, UserCheck 
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeyForAdegaLamas123",
  authDomain: "adega-lamas-destilaria.firebaseapp.com",
  projectId: "adega-lamas-destilaria",
  storageBucket: "adega-lamas-destilaria.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Ativação da persistência offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência falhou: múltiplas abas abertas.');
  } else if (err.code === 'unimplemented') {
    console.warn('Navegador não suporta persistência offline.');
  }
});

// Dados Iniciais do Sistema
const INITIAL_WOODS = [
  'Carvalho Francês', 'Carvalho Americano', 'Sassafrás', 'Grápia', 
  'Ipê', 'Eucalipto', 'Castanheira', 'Angico', 'Cumaru', 'Butumuju', 'Pau Brasil'
];

const INITIAL_BEVERAGES = [
  'Whisky U', 'Whisky B', 'Whisky Lamas', 'Whisky Lamas 1 ano', 
  'Whisky Lamas 2 anos', 'Rum', 'Cachaça', 'Turfado'
];

export default function App() {
  // Estados Globais
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [tempEmail, setTempEmail] = useState('');
  const [barrels, setBarrels] = useState([]);
  const [woods, setWoods] = useState(INITIAL_WOODS);
  const [beverages, setBeverages] = useState(INITIAL_BEVERAGES);
  
  // Filtros e Navegação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWoodFilter, setSelectedWoodFilter] = useState('');
  const [selectedBevFilter, setSelectedBevFilter] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'config', 'reports'

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Item Selecionado
  const [currentBarrel, setCurrentBarrel] = useState(null);
  const [deletePin, setDeletePin] = useState('');
  const [pinError, setPinError] = useState('');

  // Formulário de Cadastro / Edição
  const [formData, setFormData] = useState({
    number: '',
    wood: INITIAL_WOODS[0],
    beverage: INITIAL_BEVERAGES[0],
    capacity: 200,
    currentVolume: 200,
    status: 'Cheio', // Cheio, Parcial, Vazio
    batchQuantity: 1,
    maturationYearsAlert: 2, // Anos para alerta automático
    entryDate: new Date().toISOString().split('T')[0]
  });

  // Novos Cadastros de Configuração
  const [newWood, setNewWood] = useState('');
  const [newBeverage, setNewBeverage] = useState('');

  // Sincronização com o Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'barris'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBarrels(docs);
    }, (error) => {
      console.log('Modo offline/Erro de conexão:', error);
    });
    return () => unsubscribe();
  }, []);

  // Login de Operador
  const handleLogin = (e) => {
    e.preventDefault();
    if (tempEmail) {
      localStorage.setItem('userEmail', tempEmail);
      setUserEmail(tempEmail);
    }
  };

  // Atualiza Status do Volume Automaticamente
  const calculateStatus = (vol, cap) => {
    const volume = Number(vol);
    const capacity = Number(cap);
    if (volume === 0) return 'Vazio';
    if (volume >= capacity) return 'Cheio';
    return 'Parcial';
  };

  // Salvar Novo Barril (Simples ou em Lote)
  const handleSaveBarrel = async (e) => {
    e.preventDefault();
    const qty = Number(formData.batchQuantity) || 1;
    const startNum = Number(formData.number);

    for (let i = 0; i < qty; i++) {
      const barrelNum = startNum + i;
      const status = calculateStatus(formData.currentVolume, formData.capacity);
      
      const newBarrel = {
        number: barrelNum,
        wood: formData.wood,
        beverage: formData.beverage,
        capacity: Number(formData.capacity),
        currentVolume: Number(formData.currentVolume),
        status,
        entryDate: formData.entryDate,
        maturationYearsAlert: Number(formData.maturationYearsAlert),
        history: [{
          date: new Date().toLocaleString('pt-BR'),
          action: 'Barril Cadastrado',
          user: userEmail,
          details: `Volume inicial: ${formData.currentVolume}L (${formData.beverage})`
        }]
      };

      await addDoc(collection(db, 'barris'), newBarrel);
    }

    setShowAddModal(false);
    resetForm();
  };

  // Atualizar Barril Existente
  const handleUpdateBarrel = async (e) => {
    e.preventDefault();
    if (!currentBarrel) return;

    const status = calculateStatus(formData.currentVolume, formData.capacity);
    const updatedHistory = [
      ...currentBarrel.history,
      {
        date: new Date().toLocaleString('pt-BR'),
        action: 'Edição de Dados/Volume',
        user: userEmail,
        details: `Alterado para: ${formData.currentVolume}L | Bebida: ${formData.beverage} | Madeira: ${formData.wood}`
      }
    ];

    await updateDoc(doc(db, 'barris', currentBarrel.id), {
      wood: formData.wood,
      beverage: formData.beverage,
      capacity: Number(formData.capacity),
      currentVolume: Number(formData.currentVolume),
      status,
      maturationYearsAlert: Number(formData.maturationYearsAlert),
      history: updatedHistory
    });

    setShowEditModal(false);
    setCurrentBarrel(null);
  };

  // Excluir Barril com Confirmação de Senha (PIN 1234)
  const handleDeleteBarrel = async () => {
    if (deletePin !== '1234') {
      setPinError('Senha incorreta! Digite 1234 para confirmar.');
      return;
    }

    if (currentBarrel) {
      await deleteDoc(doc(db, 'barris', currentBarrel.id));
      setShowDeleteConfirm(false);
      setCurrentBarrel(null);
      setDeletePin('');
      setPinError('');
    }
  };

  // Limpar Formulário
  const resetForm = () => {
    setFormData({
      number: '',
      wood: woods[0] || '',
      beverage: beverages[0] || '',
      capacity: 200,
      currentVolume: 200,
      status: 'Cheio',
      batchQuantity: 1,
      maturationYearsAlert: 2,
      entryDate: new Date().toISOString().split('T')[0]
    });
  };

  // Adicionar Nova Madeira Dinâmica
  const handleAddWood = () => {
    if (newWood && !woods.includes(newWood)) {
      setWoods([...woods, newWood]);
      setNewWood('');
    }
  };

  // Adicionar Nova Bebida Dinâmica
  const handleAddBeverage = () => {
    if (newBeverage && !beverages.includes(newBeverage)) {
      setBeverages([...beverages, newBeverage]);
      setNewBeverage('');
    }
  };

  // Métricas do Dashboard
  const totalBarrels = barrels.length;
  const fullBarrels = barrels.filter(b => b.status === 'Cheio').length;
  const partialBarrels = barrels.filter(b => b.status === 'Parcial').length;
  const emptyBarrels = barrels.filter(b => b.status === 'Vazio').length;
  const totalVolume = barrels.reduce((acc, b) => acc + (Number(b.currentVolume) || 0), 0);

  // Filtragem
  const filteredBarrels = barrels.filter(b => {
    const matchSearch = b.number.toString().includes(searchTerm) || 
                        b.beverage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.wood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWood = selectedWoodFilter ? b.wood === selectedWoodFilter : true;
    const matchBev = selectedBevFilter ? b.beverage === selectedBevFilter : true;
    return matchSearch && matchWood && matchBev;
  });

  // Tela de Identificação de Usuário
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full border border-[#E6DFD5]">
          <h1 className="text-2xl font-bold text-[#4A3B32] mb-1 text-center">Adega Lamas Destilaria</h1>
          <p className="text-center text-sm text-[#8C7A6B] mb-6">Controle de Maturação de Barris</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A3B32] mb-1">E-mail do Operador</label>
              <input 
                type="email" 
                required
                placeholder="operador@lamas.com.br"
                value={tempEmail} 
                onChange={(e) => setTempEmail(e.target.value)}
                className="w-full p-3 border border-[#D1C7BD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#5C3A21] text-white py-3 rounded-lg font-semibold hover:bg-[#4A2E1A] transition"
            >
              Acessar Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#33261D]">
      {/* CABEÇALHO */}
      <header className="bg-[#4A3222] text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs tracking-widest text-[#D9C3B0] uppercase font-semibold">ADEGA • CONTROLE DE MATURAÇÃO</span>
            <h1 className="text-2xl font-serif font-bold text-[#F2E8DC]">Adega Lamas Destilaria</h1>
            <div className="text-xs text-[#D9C3B0] mt-1">
              Coordenador de Maturação <br />
              <strong className="text-sm text-white font-semibold">Marcos A. Pinheiro</strong>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#382519] px-4 py-2 rounded-lg border border-[#614533]">
            <UserCheck className="w-5 h-5 text-[#D9C3B0]" />
            <div className="text-xs">
              <span className="block text-[#A69588]">Operador Conectado:</span>
              <strong className="text-white">{userEmail}</strong>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('userEmail'); setUserEmail(''); }}
              className="ml-2 text-xs bg-[#5C3A21] hover:bg-[#734A2B] px-2 py-1 rounded text-[#D9C3B0]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD DE MÉTRICAS */}
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section className="bg-white p-5 rounded-xl border border-[#E6DFD5] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-serif text-[#4A3B32]">Inventário de Maturação</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'inventory' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                Barris
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'reports' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                Relatório por Bebida
              </button>
              <button 
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'config' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                <Settings className="w-4 h-4 inline mr-1" /> Configurações
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">BARRIS CADASTRADOS</span>
              <p className="text-2xl font-bold text-[#4A3B32]">{totalBarrels} <span className="text-xs font-normal">unidades</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">CHEIOS</span>
              <p className="text-2xl font-bold text-[#2D5A27]">{fullBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">PARCIAIS</span>
              <p className="text-2xl font-bold text-[#B87333]">{partialBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">VAZIOS</span>
              <p className="text-2xl font-bold text-[#7A7A7A]">{emptyBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5] col-span-2 md:col-span-1">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">VOLUME EM MATURAÇÃO</span>
              <p className="text-2xl font-bold text-[#5C3A21]">{totalVolume.toLocaleString('pt-BR')} <span className="text-xs font-normal">L</span></p>
            </div>
          </div>
        </section>

        {/* TABA 1: BARRIS EM ACOMPANHAMENTO */}
        {activeTab === 'inventory' && (
          <section className="bg-white p-5 rounded-xl border border-[#E6DFD5] shadow-sm space-y-4">
            {/* BUSCA E FILTROS */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="flex flex-1 gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#8C7A6B]" />
                  <input 
                    type="text" 
                    placeholder="Buscar barril, bebida, madeira..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D1C7BD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                  />
                </div>
                <select 
                  value={selectedWoodFilter} 
                  onChange={(e) => setSelectedWoodFilter(e.target.value)}
                  className="p-2 border border-[#D1C7BD] rounded-lg text-sm bg-white"
                >
                  <option value="">Todas Madeiras</option>
                  {woods.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select 
                  value={selectedBevFilter} 
                  onChange={(e) => setSelectedBevFilter(e.target.value)}
                  className="p-2 border border-[#D1C7BD] rounded-lg text-sm bg-white"
                >
                  <option value="">Todas Bebidas</option>
                  {beverages.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="w-full md:w-auto bg-[#5C3A21] hover:bg-[#4A2E1A] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Adicionar Barril
              </button>
            </div>

            {/* TABELA DE BARRIS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F6F0] border-b border-[#E6DFD5] text-xs font-semibold text-[#8C7A6B] uppercase">
                    <th className="p-3">BARRIL</th>
                    <th className="p-3">MADEIRA</th>
                    <th className="p-3">CONTEÚDO / BEBIDA</th>
                    <th className="p-3">VOLUME / CAPACIDADE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ALERTA MATURAÇÃO</th>
                    <th className="p-3 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5] text-sm">
                  {filteredBarrels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-[#8C7A6B]">
                        Nenhum barril encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredBarrels.map((b) => {
                      // Cálculo de tempo de maturação
                      const entryDate = new Date(b.entryDate);
                      const now = new Date();
                      const yearsDiff = (now - entryDate) / (1000 * 60 * 60 * 24 * 365.25);
                      const isAlertActive = yearsDiff >= (b.maturationYearsAlert || 2);

                      return (
                        <tr key={b.id} className="hover:bg-[#FDFBF7]">
                          <td className="p-3 font-semibold text-[#4A3B32]">Nº {b.number}</td>
                          <td className="p-3">{b.wood}</td>
                          <td className="p-3 font-medium">{b.beverage}</td>
                          <td className="p-3">{b.currentVolume}L / {b.capacity}L</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'Cheio' ? 'bg-green-100 text-green-800' :
                              b.status === 'Parcial' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {isAlertActive ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold">
                                <Clock className="w-3 h-3" /> Atingiu {b.maturationYearsAlert} ano(s)!
                              </span>
                            ) : (
                              <span className="text-xs text-[#8C7A6B]">
                                Meta: {b.maturationYearsAlert} ano(s) ({yearsDiff.toFixed(1)} anos decorridos)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button 
                              onClick={() => { setCurrentBarrel(b); setShowHistoryModal(true); }}
                              className="p-1.5 text-[#5C3A21] hover:bg-[#F2E8DC] rounded"
                              title="Linha do Tempo / Histórico"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentBarrel(b);
  import React, { useState, useEffect } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  enableIndexedDbPersistence 
} from 'firebase/firestore';
import { 
  Plus, Search, ShieldAlert, History, Edit, Trash2, 
  CheckCircle, ArrowLeftRight, Settings, Wine, Clock, UserCheck 
} from 'lucide-react';

// --- CONFIGURAÇÃO DO FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyDemoConfigKeyForAdegaLamas123",
  authDomain: "adega-lamas-destilaria.firebaseapp.com",
  projectId: "adega-lamas-destilaria",
  storageBucket: "adega-lamas-destilaria.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

// Ativação da persistência offline
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Persistência falhou: múltiplas abas abertas.');
  } else if (err.code === 'unimplemented') {
    console.warn('Navegador não suporta persistência offline.');
  }
});

// Dados Iniciais do Sistema
const INITIAL_WOODS = [
  'Carvalho Francês', 'Carvalho Americano', 'Sassafrás', 'Grápia', 
  'Ipê', 'Eucalipto', 'Castanheira', 'Angico', 'Cumaru', 'Butumuju', 'Pau Brasil'
];

const INITIAL_BEVERAGES = [
  'Whisky U', 'Whisky B', 'Whisky Lamas', 'Whisky Lamas 1 ano', 
  'Whisky Lamas 2 anos', 'Rum', 'Cachaça', 'Turfado'
];

export default function App() {
  // Estados Globais
  const [userEmail, setUserEmail] = useState(localStorage.getItem('userEmail') || '');
  const [tempEmail, setTempEmail] = useState('');
  const [barrels, setBarrels] = useState([]);
  const [woods, setWoods] = useState(INITIAL_WOODS);
  const [beverages, setBeverages] = useState(INITIAL_BEVERAGES);
  
  // Filtros e Navegação
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWoodFilter, setSelectedWoodFilter] = useState('');
  const [selectedBevFilter, setSelectedBevFilter] = useState('');
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory', 'config', 'reports'

  // Modais
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Item Selecionado
  const [currentBarrel, setCurrentBarrel] = useState(null);
  const [deletePin, setDeletePin] = useState('');
  const [pinError, setPinError] = useState('');

  // Formulário de Cadastro / Edição
  const [formData, setFormData] = useState({
    number: '',
    wood: INITIAL_WOODS[0],
    beverage: INITIAL_BEVERAGES[0],
    capacity: 200,
    currentVolume: 200,
    status: 'Cheio', // Cheio, Parcial, Vazio
    batchQuantity: 1,
    maturationYearsAlert: 2, // Anos para alerta automático
    entryDate: new Date().toISOString().split('T')[0]
  });

  // Novos Cadastros de Configuração
  const [newWood, setNewWood] = useState('');
  const [newBeverage, setNewBeverage] = useState('');

  // Sincronização com o Firestore
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'barris'), (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setBarrels(docs);
    }, (error) => {
      console.log('Modo offline/Erro de conexão:', error);
    });
    return () => unsubscribe();
  }, []);

  // Login de Operador
  const handleLogin = (e) => {
    e.preventDefault();
    if (tempEmail) {
      localStorage.setItem('userEmail', tempEmail);
      setUserEmail(tempEmail);
    }
  };

  // Atualiza Status do Volume Automaticamente
  const calculateStatus = (vol, cap) => {
    const volume = Number(vol);
    const capacity = Number(cap);
    if (volume === 0) return 'Vazio';
    if (volume >= capacity) return 'Cheio';
    return 'Parcial';
  };

  // Salvar Novo Barril (Simples ou em Lote)
  const handleSaveBarrel = async (e) => {
    e.preventDefault();
    const qty = Number(formData.batchQuantity) || 1;
    const startNum = Number(formData.number);

    for (let i = 0; i < qty; i++) {
      const barrelNum = startNum + i;
      const status = calculateStatus(formData.currentVolume, formData.capacity);
      
      const newBarrel = {
        number: barrelNum,
        wood: formData.wood,
        beverage: formData.beverage,
        capacity: Number(formData.capacity),
        currentVolume: Number(formData.currentVolume),
        status,
        entryDate: formData.entryDate,
        maturationYearsAlert: Number(formData.maturationYearsAlert),
        history: [{
          date: new Date().toLocaleString('pt-BR'),
          action: 'Barril Cadastrado',
          user: userEmail,
          details: `Volume inicial: ${formData.currentVolume}L (${formData.beverage})`
        }]
      };

      await addDoc(collection(db, 'barris'), newBarrel);
    }

    setShowAddModal(false);
    resetForm();
  };

  // Atualizar Barril Existente
  const handleUpdateBarrel = async (e) => {
    e.preventDefault();
    if (!currentBarrel) return;

    const status = calculateStatus(formData.currentVolume, formData.capacity);
    const updatedHistory = [
      ...currentBarrel.history,
      {
        date: new Date().toLocaleString('pt-BR'),
        action: 'Edição de Dados/Volume',
        user: userEmail,
        details: `Alterado para: ${formData.currentVolume}L | Bebida: ${formData.beverage} | Madeira: ${formData.wood}`
      }
    ];

    await updateDoc(doc(db, 'barris', currentBarrel.id), {
      wood: formData.wood,
      beverage: formData.beverage,
      capacity: Number(formData.capacity),
      currentVolume: Number(formData.currentVolume),
      status,
      maturationYearsAlert: Number(formData.maturationYearsAlert),
      history: updatedHistory
    });

    setShowEditModal(false);
    setCurrentBarrel(null);
  };

  // Excluir Barril com Confirmação de Senha (PIN 1234)
  const handleDeleteBarrel = async () => {
    if (deletePin !== '1234') {
      setPinError('Senha incorreta! Digite 1234 para confirmar.');
      return;
    }

    if (currentBarrel) {
      await deleteDoc(doc(db, 'barris', currentBarrel.id));
      setShowDeleteConfirm(false);
      setCurrentBarrel(null);
      setDeletePin('');
      setPinError('');
    }
  };

  // Limpar Formulário
  const resetForm = () => {
    setFormData({
      number: '',
      wood: woods[0] || '',
      beverage: beverages[0] || '',
      capacity: 200,
      currentVolume: 200,
      status: 'Cheio',
      batchQuantity: 1,
      maturationYearsAlert: 2,
      entryDate: new Date().toISOString().split('T')[0]
    });
  };

  // Adicionar Nova Madeira Dinâmica
  const handleAddWood = () => {
    if (newWood && !woods.includes(newWood)) {
      setWoods([...woods, newWood]);
      setNewWood('');
    }
  };

  // Adicionar Nova Bebida Dinâmica
  const handleAddBeverage = () => {
    if (newBeverage && !beverages.includes(newBeverage)) {
      setBeverages([...beverages, newBeverage]);
      setNewBeverage('');
    }
  };

  // Métricas do Dashboard
  const totalBarrels = barrels.length;
  const fullBarrels = barrels.filter(b => b.status === 'Cheio').length;
  const partialBarrels = barrels.filter(b => b.status === 'Parcial').length;
  const emptyBarrels = barrels.filter(b => b.status === 'Vazio').length;
  const totalVolume = barrels.reduce((acc, b) => acc + (Number(b.currentVolume) || 0), 0);

  // Filtragem
  const filteredBarrels = barrels.filter(b => {
    const matchSearch = b.number.toString().includes(searchTerm) || 
                        b.beverage.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        b.wood.toLowerCase().includes(searchTerm.toLowerCase());
    const matchWood = selectedWoodFilter ? b.wood === selectedWoodFilter : true;
    const matchBev = selectedBevFilter ? b.beverage === selectedBevFilter : true;
    return matchSearch && matchWood && matchBev;
  });

  // Tela de Identificação de Usuário
  if (!userEmail) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full border border-[#E6DFD5]">
          <h1 className="text-2xl font-bold text-[#4A3B32] mb-1 text-center">Adega Lamas Destilaria</h1>
          <p className="text-center text-sm text-[#8C7A6B] mb-6">Controle de Maturação de Barris</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#4A3B32] mb-1">E-mail do Operador</label>
              <input 
                type="email" 
                required
                placeholder="operador@lamas.com.br"
                value={tempEmail} 
                onChange={(e) => setTempEmail(e.target.value)}
                className="w-full p-3 border border-[#D1C7BD] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-[#5C3A21] text-white py-3 rounded-lg font-semibold hover:bg-[#4A2E1A] transition"
            >
              Acessar Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#33261D]">
      {/* CABEÇALHO */}
      <header className="bg-[#4A3222] text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs tracking-widest text-[#D9C3B0] uppercase font-semibold">ADEGA • CONTROLE DE MATURAÇÃO</span>
            <h1 className="text-2xl font-serif font-bold text-[#F2E8DC]">Adega Lamas Destilaria</h1>
            <div className="text-xs text-[#D9C3B0] mt-1">
              Coordenador de Maturação <br />
              <strong className="text-sm text-white font-semibold">Marcos A. Pinheiro</strong>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-[#382519] px-4 py-2 rounded-lg border border-[#614533]">
            <UserCheck className="w-5 h-5 text-[#D9C3B0]" />
            <div className="text-xs">
              <span className="block text-[#A69588]">Operador Conectado:</span>
              <strong className="text-white">{userEmail}</strong>
            </div>
            <button 
              onClick={() => { localStorage.removeItem('userEmail'); setUserEmail(''); }}
              className="ml-2 text-xs bg-[#5C3A21] hover:bg-[#734A2B] px-2 py-1 rounded text-[#D9C3B0]"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD DE MÉTRICAS */}
      <main className="max-w-6xl mx-auto p-4 space-y-6">
        <section className="bg-white p-5 rounded-xl border border-[#E6DFD5] shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold font-serif text-[#4A3B32]">Inventário de Maturação</h2>
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'inventory' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                Barris
              </button>
              <button 
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'reports' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                Relatório por Bebida
              </button>
              <button 
                onClick={() => setActiveTab('config')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${activeTab === 'config' ? 'bg-[#5C3A21] text-white' : 'bg-[#F2E8DC] text-[#4A3B32]'}`}
              >
                <Settings className="w-4 h-4 inline mr-1" /> Configurações
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">BARRIS CADASTRADOS</span>
              <p className="text-2xl font-bold text-[#4A3B32]">{totalBarrels} <span className="text-xs font-normal">unidades</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">CHEIOS</span>
              <p className="text-2xl font-bold text-[#2D5A27]">{fullBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">PARCIAIS</span>
              <p className="text-2xl font-bold text-[#B87333]">{partialBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5]">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">VAZIOS</span>
              <p className="text-2xl font-bold text-[#7A7A7A]">{emptyBarrels} <span className="text-xs font-normal">barris</span></p>
            </div>
            <div className="p-3 bg-[#F9F6F0] rounded-lg border border-[#E6DFD5] col-span-2 md:col-span-1">
              <span className="text-xs font-semibold text-[#8C7A6B] uppercase">VOLUME EM MATURAÇÃO</span>
              <p className="text-2xl font-bold text-[#5C3A21]">{totalVolume.toLocaleString('pt-BR')} <span className="text-xs font-normal">L</span></p>
            </div>
          </div>
        </section>

        {/* TABA 1: BARRIS EM ACOMPANHAMENTO */}
        {activeTab === 'inventory' && (
          <section className="bg-white p-5 rounded-xl border border-[#E6DFD5] shadow-sm space-y-4">
            {/* BUSCA E FILTROS */}
            <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
              <div className="flex flex-1 gap-2 w-full">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-[#8C7A6B]" />
                  <input 
                    type="text" 
                    placeholder="Buscar barril, bebida, madeira..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-[#D1C7BD] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6239]"
                  />
                </div>
                <select 
                  value={selectedWoodFilter} 
                  onChange={(e) => setSelectedWoodFilter(e.target.value)}
                  className="p-2 border border-[#D1C7BD] rounded-lg text-sm bg-white"
                >
                  <option value="">Todas Madeiras</option>
                  {woods.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <select 
                  value={selectedBevFilter} 
                  onChange={(e) => setSelectedBevFilter(e.target.value)}
                  className="p-2 border border-[#D1C7BD] rounded-lg text-sm bg-white"
                >
                  <option value="">Todas Bebidas</option>
                  {beverages.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <button 
                onClick={() => { resetForm(); setShowAddModal(true); }}
                className="w-full md:w-auto bg-[#5C3A21] hover:bg-[#4A2E1A] text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow"
              >
                <Plus className="w-4 h-4" /> Adicionar Barril
              </button>
            </div>

            {/* TABELA DE BARRIS */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F9F6F0] border-b border-[#E6DFD5] text-xs font-semibold text-[#8C7A6B] uppercase">
                    <th className="p-3">BARRIL</th>
                    <th className="p-3">MADEIRA</th>
                    <th className="p-3">CONTEÚDO / BEBIDA</th>
                    <th className="p-3">VOLUME / CAPACIDADE</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3">ALERTA MATURAÇÃO</th>
                    <th className="p-3 text-right">AÇÕES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6DFD5] text-sm">
                  {filteredBarrels.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="p-6 text-center text-[#8C7A6B]">
                        Nenhum barril encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredBarrels.map((b) => {
                      // Cálculo de tempo de maturação
                      const entryDate = new Date(b.entryDate);
                      const now = new Date();
                      const yearsDiff = (now - entryDate) / (1000 * 60 * 60 * 24 * 365.25);
                      const isAlertActive = yearsDiff >= (b.maturationYearsAlert || 2);

                      return (
                        <tr key={b.id} className="hover:bg-[#FDFBF7]">
                          <td className="p-3 font-semibold text-[#4A3B32]">Nº {b.number}</td>
                          <td className="p-3">{b.wood}</td>
                          <td className="p-3 font-medium">{b.beverage}</td>
                          <td className="p-3">{b.currentVolume}L / {b.capacity}L</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              b.status === 'Cheio' ? 'bg-green-100 text-green-800' :
                              b.status === 'Parcial' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="p-3">
                            {isAlertActive ? (
                              <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold">
                                <Clock className="w-3 h-3" /> Atingiu {b.maturationYearsAlert} ano(s)!
                              </span>
                            ) : (
                              <span className="text-xs text-[#8C7A6B]">
                                Meta: {b.maturationYearsAlert} ano(s) ({yearsDiff.toFixed(1)} anos decorridos)
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right space-x-1">
                            <button 
                              onClick={() => { setCurrentBarrel(b); setShowHistoryModal(true); }}
                              className="p-1.5 text-[#5C3A21] hover:bg-[#F2E8DC] rounded"
                              title="Linha do Tempo / Histórico"
                            >
                              <History className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setCurrentBarrel(b);
  
