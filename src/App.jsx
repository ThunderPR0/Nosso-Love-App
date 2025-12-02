import React, { useState, useEffect, useCallback, useMemo } from 'react';

// --- Imports e Configuração do Firebase (NÃO ALTERAR) ---
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  collection, 
  onSnapshot, 
  setDoc, 
  addDoc, 
  deleteDoc, 
  query, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

// Variáveis globais fornecidas pelo ambiente para conexão com o Firebase.
// Se as variáveis estiverem vazias (como é o caso localmente), a configuração fica vazia.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'app-casal-default';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;


// ----------------------------------------------------
// --- Definição de Cores e Estilos (Classes Tailwind) ---
// ----------------------------------------------------

// Cores Pastel (Mesmas cores definidas anteriormente)
const primaryColor = 'bg-rose-300'; 
const secondaryColor = 'bg-violet-300'; 
const hoverColor = 'hover:bg-rose-400';
const accentColor = 'text-violet-700'; 
const cardStyle = 'bg-white shadow-lg rounded-2xl p-6 transition duration-300 transform hover:scale-[1.01]';
const inputStyle = 'w-full p-3 border border-gray-300 rounded-lg focus:ring-rose-300 focus:border-rose-300';


/**
 * Componente de Card Estilo Polaroid
 */
const PolaroidCard = ({ moment }) => {
  const formattedDate = moment.date ? new Date(moment.date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Data Desconhecida';

  return (
    <div className="flex flex-col items-center p-2 bg-gray-50 shadow-2xl rotate-1 rounded-md" style={{ width: '250px', transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
      <div className="w-full aspect-[4/3] bg-gray-200 overflow-hidden border-2 border-white">
        <img 
          src={moment.photoURL || `https://placehold.co/400x300/fecaca/9d174d?text=Sem+Foto`}
          alt={moment.title} 
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = `https://placehold.co/400x300/fecaca/9d174d?text=Link+de+Foto+Quebrado`;
          }}
        />
      </div>
      <div className="w-full pt-4 pb-2 px-2 text-center">
        <p className="font-title text-sm font-bold text-gray-800 break-words">{moment.title || 'Nosso Momento'}</p>
        <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
      </div>
    </div>
  );
};


/**
 * Componente de Lista Compartilhada
 */
const SharedListSection = ({ title, placeholder, items, addItem, removeItem }) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      addItem(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className={cardStyle}>
      <h3 className={`text-2xl font-bold mb-4 flex items-center ${accentColor}`}>
        <span className="mr-2">
          {/* Ícones */}
          {title.includes('Filmes') && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>}
          {title.includes('Séries') && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1v-3m-6.447-2.839L14 10m-3.447 2.839L10 10m5 5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          {title.includes('Cultural') && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-1 0h-5M9 7h1m-1 4h1m-1 4h1m-5 4v-4m0 0H9m-4 0h2m-4 0V7a4 4 0 014-4h4a4 4 0 014 4v14m-12 0h12" /></svg>}
          {title.includes('Restaurantes') && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 113.414 3.414L10.414 20H8v-2.414l9.586-9.586z" /></svg>}
          {title.includes('Músicas') && <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v14L9 19zm0 0v-4" /></svg>}
        </span>
        {title}
      </h3>

      <form onSubmit={handleAddItem} className="flex space-x-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className={inputStyle}
          aria-label={`Adicionar novo ${title}`}
        />
        <button
          type="submit"
          className={`bg-rose-500 text-white font-bold py-3 px-4 rounded-lg flex-shrink-0 hover:bg-rose-600 transition duration-150`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </form>

      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item.id} className="flex justify-between items-center bg-rose-50 p-3 rounded-xl border-l-4 border-rose-300">
            <span className="text-gray-700 font-medium truncate pr-2">{item.name}</span>
            <button
              onClick={() => removeItem(item.id)}
              className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-100 flex-shrink-0"
              title="Remover Item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </li>
        ))}
        {items.length === 0 && (
          <p className="text-gray-500 italic text-center">Nenhum item adicionado ainda!</p>
        )}
      </ul>
    </div>
  );
};


/**
 * Componente de Datas e Momentos e Viagens
 */

const DateMomentSection = ({ moments, addMoment, removeMoment }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [activeTab, setActiveTab] = useState('add');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && date) {
            addMoment({ title, date, photoURL: photoURL.trim() });
            setTitle('');
            setDate('');
            setPhotoURL('');
            setActiveTab('view'); 
        } else {
            console.log('Preencha título e data.');
        }
    };

    const sortedMoments = useMemo(() => {
        return [...moments].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [moments]);

    return (
        <div className='w-full'>
            <div className="flex justify-center border-b border-rose-200 mb-6">
                <button
                    onClick={() => setActiveTab('add')}
                    className={`px-4 py-2 text-lg font-semibold transition duration-150 ${activeTab === 'add' ? `border-b-4 border-rose-300 ${accentColor}` : 'text-gray-500 hover:text-rose-400'}`}
                >
                    Adicionar Novo Date
                </button>
                <button
                    onClick={() => setActiveTab('view')}
                    className={`px-4 py-2 text-lg font-semibold transition duration-150 ${activeTab === 'view' ? `border-b-4 border-rose-300 ${accentColor}` : 'text-gray-500 hover:text-rose-400'}`}
                >
                    Nossa Galeria ({moments.length})
                </button>
            </div>

            {activeTab === 'add' && (
                <div className={cardStyle}>
                    <h3 className={`text-xl font-bold mb-4 ${accentColor}`}>Onde e Quando Aconteceu?</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Título do Momento (Ex: Jantar de Aniversário)</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data do Date</label>
                            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Link da Foto (URL)</label>
                            <input type="url" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="Cole o link da imagem aqui (ex: Imgur, Google Photos)" className={inputStyle} />
                            <p className="text-xs text-gray-500 mt-1">
                                *Dica: Você precisa de um link direto para a foto, pois não podemos armazenar arquivos.
                            </p>
                        </div>
                        <button
                            type="submit"
                            className={`w-full bg-violet-300 text-violet-900 font-bold py-3 rounded-lg hover:bg-violet-400 transition duration-150`}
                        >
                            <div className="flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-12 5h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                Registrar Momento
                            </div>
                        </button>
                    </form>
                </div>
            )}

            {activeTab === 'view' && (
                <div className="flex flex-wrap justify-center gap-8 py-4">
                    {sortedMoments.length > 0 ? (
                        sortedMoments.map((moment) => (
                            <div key={moment.id} className="relative group">
                                <PolaroidCard moment={moment} />
                                <button 
                                    onClick={() => removeMoment(moment.id)}
                                    title="Apagar Momento"
                                    className="absolute top-0 right-0 m-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-300"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500 italic text-lg mt-8">Nenhum momento registrado ainda. Que tal marcar um date?</p>
                    )}
                </div>
            )}
        </div>
    );
};


const TravelPlannerSection = ({ trips, addTrip, removeTrip, addGoal, updateGoal, removeGoal }) => {
    const [newTripName, setNewTripName] = useState('');
    const [selectedTrip, setSelectedTrip] = useState(null); 
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');

    const handleAddTrip = (e) => {
        e.preventDefault();
        if (newTripName.trim()) {
            addTrip(newTripName.trim());
            setNewTripName('');
        }
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        const target = parseFloat(newGoalTarget);
        if (newGoalName.trim() && !isNaN(target) && selectedTrip) {
            addGoal(selectedTrip, { 
                name: newGoalName.trim(), 
                target: target, 
                current: 0, 
                id: Date.now().toString() 
            });
            setNewGoalName('');
            setNewGoalTarget('');
        }
    };

    const currentTrip = trips.find(t => t.id === selectedTrip);

    const totalTarget = currentTrip?.goals?.reduce((sum, goal) => sum + goal.target, 0) || 0;
    const totalCurrent = currentTrip?.goals?.reduce((sum, goal) => sum + goal.current, 0) || 0;
    const totalProgress = totalTarget > 0 ? Math.round((totalCurrent / totalTarget) * 100) : 0;
    const totalMissing = totalTarget - totalCurrent;
    
    const formatBRL = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


    if (selectedTrip && currentTrip) {
        return (
            <div className={cardStyle}>
                <button 
                    onClick={() => setSelectedTrip(null)}
                    className={`mb-4 flex items-center ${accentColor} hover:text-violet-800 font-semibold transition duration-150`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Voltar para Lista de Viagens
                </button>

                <h3 className={`text-3xl font-extrabold mb-6 ${accentColor}`}>{currentTrip.name}</h3>
                
                <div className="mb-8 p-4 bg-violet-100 rounded-xl shadow-inner">
                    <p className="text-xl font-bold text-gray-800">Meta Financeira Global:</p>
                    <div className="flex items-center space-x-4 mt-2">
                        <div className="w-1/2">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-500 bg-rose-300`}
                                    style={{ width: `${totalProgress}%` }}
                                ></div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mt-1">{totalProgress}% Completo</p>
                        </div>
                        <div className="w-1/2">
                            <p className="text-2xl font-bold">
                                {formatBRL(totalCurrent)} / {formatBRL(totalTarget)}
                            </p>
                            <p className="text-lg font-medium text-red-500">
                                Faltam: {formatBRL(totalMissing > 0 ? totalMissing : 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <h4 className="text-xl font-bold mb-3 text-gray-700">Metas de Planejamento:</h4>
                
                <form onSubmit={handleAddGoal} className="flex space-x-2 mb-6 p-3 bg-gray-50 rounded-lg">
                    <input
                        type="text"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                        placeholder="Nome da Meta (Ex: Passagens Aéreas)"
                        className={`${inputStyle} w-1/2`}
                        required
                    />
                    <input
                        type="number"
                        step="0.01"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                        placeholder="Valor R$"
                        className={`${inputStyle} w-1/4`}
                        required
                    />
                    <button
                        type="submit"
                        className={`w-1/4 bg-rose-300 text-rose-900 font-bold py-3 rounded-lg hover:bg-rose-400 transition duration-150`}
                    >
                        Add Meta
                    </button>
                </form>

                <ul className="space-y-4">
                    {currentTrip.goals?.map((goal) => {
                        const progress = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                        const missing = goal.target - goal.current;

                        return (
                            <li key={goal.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-sm">
                                <div className="flex justify-between items-start">
                                    <h5 className="font-bold text-lg text-gray-800">{goal.name}</h5>
                                    <button
                                        onClick={() => removeGoal(selectedTrip, goal.id)}
                                        className="text-red-500 hover:text-red-700 transition duration-150 p-1"
                                        title="Remover Meta"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>
                                
                                <p className="text-sm text-gray-500 mt-1">
                                    Meta: <span className="font-semibold">{formatBRL(goal.target)}</span> |
                                    Salvo: <span className="font-semibold text-green-600">{formatBRL(goal.current)}</span>
                                </p>

                                <div className="mt-2 flex items-center space-x-4">
                                    <div className="flex-grow">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-500 ${progress >= 100 ? 'bg-green-500' : 'bg-rose-300'}`}
                                                style={{ width: `${Math.min(100, progress)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-medium text-gray-600 w-12 text-right">{progress}%</span>
                                </div>

                                <div className="mt-4 flex space-x-2">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="Adicionar R$"
                                        className={inputStyle}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter') {
                                                const amount = parseFloat(e.target.value);
                                                if (!isNaN(amount) && amount > 0) {
                                                    updateGoal(selectedTrip, goal.id, goal.current + amount);
                                                    e.target.value = '';
                                                }
                                                e.preventDefault();
                                            }
                                        }}
                                    />
                                    <button 
                                        onClick={() => {
                                            if (missing > 0) {
                                                updateGoal(selectedTrip, goal.id, goal.target);
                                            } else {
                                                updateGoal(selectedTrip, goal.id, 0);
                                            }
                                        }}
                                        className={`px-3 py-2 text-sm font-bold rounded-lg transition duration-150 ${
                                            progress >= 100 ? 'bg-green-500 hover:bg-green-600' : 'bg-violet-300 hover:bg-violet-400 text-violet-900'
                                        }`}
                                    >
                                        {progress >= 100 ? 'Zerar' : 'Bater Meta'}
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>

            </div>
        );
    }

    return (
        <div className={cardStyle}>
            <h3 className={`text-2xl font-bold mb-4 ${accentColor}`}>Nossos Sonhos de Viagem</h3>
            
            <form onSubmit={handleAddTrip} className="flex space-x-2 mb-6">
                <input
                    type="text"
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder="Ex: Viagem para Paris em 2026"
                    className={inputStyle}
                    required
                />
                <button
                    type="submit"
                    className={`bg-violet-300 text-violet-900 font-bold py-3 px-4 rounded-lg flex-shrink-0 hover:bg-violet-400 transition duration-150`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                </button>
            </form>

            <ul className="space-y-3">
                {trips.map((trip) => {
                    const totalTargetTrip = trip.goals?.reduce((sum, goal) => sum + goal.target, 0) || 0;
                    const totalCurrentTrip = trip.goals?.reduce((sum, goal) => sum + goal.current, 0) || 0;
                    const progressTrip = totalTargetTrip > 0 ? Math.round((totalCurrentTrip / totalTargetTrip) * 100) : 0;
                    
                    return (
                        <li key={trip.id} className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border-l-4 border-rose-300">
                            <div className="flex-grow cursor-pointer" onClick={() => setSelectedTrip(trip.id)}>
                                <p className="font-semibold text-gray-800 hover:text-violet-600 transition duration-150">{trip.name}</p>
                                <div className="flex items-center mt-1">
                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full bg-rose-300`}
                                            style={{ width: `${progressTrip}%` }}
                                        ></div>
                                    </div>
                                    <span className="ml-2 text-xs font-medium text-gray-600">{progressTrip}% ({formatBRL(totalCurrentTrip)}/{formatBRL(totalTargetTrip)})</span>
                                </div>
                            </div>

                            <button
                                onClick={() => removeTrip(trip.id)}
                                className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-100 flex-shrink-0 ml-3"
                                title="Remover Viagem"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </li>
                    );
                })}
                {trips.length === 0 && (
                    <p className="text-gray-500 italic text-center">Nenhuma viagem planejada ainda.</p>
                )}
            </ul>
        </div>
    );
};


// ----------------------------------------------------
// --- COMPONENTE PRINCIPAL (App) ---
// ----------------------------------------------------
export default function App() {
    const [activeTab, setActiveTab] = useState('movies');
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [listsData, setListsData] = useState({}); 
    const [momentsData, setMomentsData] = useState([]);
    const [tripsData, setTripsData] = useState([]);
    const [error, setError] = useState(null);
    const [isLocalMode, setIsLocalMode] = useState(false);


    // --- 1. Inicialização e Autenticação do Firebase ---
    useEffect(() => {
        try {
            // VERIFICAÇÃO DE MODO LOCAL: Se não há credenciais, ative o modo local e desative o Firebase.
            if (Object.keys(firebaseConfig).length === 0) {
                setError("Modo Local: A conexão com o banco de dados está desativada. Seus dados não serão salvos permanentemente ou compartilhados. Adicione suas chaves Firebase para o modo colaborativo.");
                setIsLocalMode(true);
                setLoading(false);
                setIsAuthReady(true);
                return; // Sai do useEffect sem tentar inicializar o Firebase.
            }

            const app = initializeApp(firebaseConfig);
            const firestore = getFirestore(app);
            const authInstance = getAuth(app);
            
            setDb(firestore);
            setAuth(authInstance);

            const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                if (user) {
                    setUserId(user.uid);
                } else {
                    if (!initialAuthToken) {
                        const anonUser = await signInAnonymously(authInstance);
                        setUserId(anonUser.user.uid);
                    }
                }
                setIsAuthReady(true);
            });

            const signInToken = async () => {
                if (initialAuthToken) {
                    try {
                        const userCredential = await signInWithCustomToken(authInstance, initialAuthToken);
                        setUserId(userCredential.user.uid);
                    } catch (e) {
                        console.error("Erro ao autenticar com Custom Token, tentando Anônimo.", e);
                        const anonUser = await signInAnonymously(authInstance);
                        setUserId(anonUser.user.uid);
                    }
                }
            };

            signInToken();
            
            return () => unsubscribe();
        } catch (e) {
            console.error("Erro na inicialização do Firebase:", e);
            setError("Erro Fatal: Falha na conexão com o banco de dados. Verifique a configuração Firebase.");
            setLoading(false);
        }
    }, []);

    // --- 2. Carregamento e Assinatura dos Dados (onSnapshot) ---
    useEffect(() => {
        // Se estiver em modo local, não tente carregar dados do Firestore.
        if (isLocalMode) return;

        if (!db || !isAuthReady || !userId) {
            return;
        }
        
        const publicDataPath = `artifacts/${appId}/public/data`;
        
        const collections = [
            { name: 'lists', setter: setListsData, initialData: { movies: [], series: [], cultural: [], restaurants: [], music: [] } },
            { name: 'moments', setter: setMomentsData, initialData: [] },
            { name: 'trips', setter: setTripsData, initialData: [] },
        ];

        const unsubscribers = [];
        let loadCount = 0;

        collections.forEach(({ name, setter, initialData }) => {
            const collectionRef = collection(db, `${publicDataPath}/casal_${name}`);
            const q = query(collectionRef);
            
            const unsubscribe = onSnapshot(q, async (snapshot) => {
                let data;
                
                if (name === 'lists') {
                    const allDocs = {};
                    snapshot.forEach(doc => {
                        allDocs[doc.id] = { ...doc.data(), id: doc.id };
                    });
                    
                    const listState = { ...initialData };
                    
                    // Atualiza ou cria documentos para garantir que todas as listas existam
                    const listUpdatePromises = Object.keys(initialData).map(async (listKey) => {
                        if (allDocs[listKey]) {
                            listState[listKey] = allDocs[listKey].items || [];
                        } else {
                            // Se o documento não existir, crie-o
                            await setDoc(doc(collectionRef, listKey), { items: [] });
                            listState[listKey] = [];
                        }
                    });
                    await Promise.all(listUpdatePromises);

                    data = listState;
                } else {
                    data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
                }

                setter(data);

                loadCount++;
                if (loadCount === collections.length) {
                    setLoading(false);
                }
            }, (e) => {
                console.error(`Erro ao carregar dados de ${name}:`, e);
                setError(`Erro ao carregar lista de ${name}.`);
                setLoading(false);
            });
            unsubscribers.push(unsubscribe);
        });

        return () => {
            unsubscribers.forEach(unsub => unsub());
        };
    }, [db, isAuthReady, userId, isLocalMode]);

    // --- 3. Funções de Manipulação de Dados (Callbacks) ---

    // Função de verificação para modo local (retorna cedo se não puder salvar)
    const canSave = useCallback(() => {
        if (isLocalMode) {
            console.warn("Aviso: Tentativa de salvar dados falhou. Modo Local está ativo.");
            // Poderia adicionar uma interface de aviso aqui, mas por enquanto só logs.
            return false;
        }
        if (!db) {
            console.error("Erro: Database não está pronto.");
            return false;
        }
        return true;
    }, [isLocalMode, db]);


    const updateSharedList = useCallback(async (listKey, newItems) => {
        if (!canSave()) return;
        try {
            const listRef = doc(db, `artifacts/${appId}/public/data/casal_lists/${listKey}`);
            await setDoc(listRef, { items: newItems });
        } catch (e) {
            console.error(`Erro ao atualizar lista ${listKey}:`, e);
        }
    }, [db, canSave]);

    const addItemToList = useCallback((listKey) => async (name) => {
        const currentItems = listsData[listKey] || [];
        const newItems = [...currentItems, { id: Date.now().toString(), name: name }];
        await updateSharedList(listKey, newItems);
        if (isLocalMode) setListsData(prev => ({ ...prev, [listKey]: newItems })); // Atualiza localmente para feedback imediato
    }, [listsData, updateSharedList, isLocalMode]);

    const removeItemFromList = useCallback((listKey) => async (itemId) => {
        const currentItems = listsData[listKey] || [];
        const newItems = currentItems.filter(item => item.id !== itemId);
        await updateSharedList(listKey, newItems);
        if (isLocalMode) setListsData(prev => ({ ...prev, [listKey]: newItems })); // Atualiza localmente para feedback imediato
    }, [listsData, updateSharedList, isLocalMode]);

    const addMoment = useCallback(async (moment) => {
        if (!canSave()) return;
        try {
            const docRef = await addDoc(collection(db, `artifacts/${appId}/public/data/casal_moments`), {
                ...moment,
                createdAt: new Date().toISOString()
            });
            if (isLocalMode) setMomentsData(prev => [...prev, { ...moment, id: docRef.id, createdAt: new Date().toISOString() }]);
        } catch (e) {
            console.error("Erro ao adicionar momento:", e);
        }
    }, [db, canSave, isLocalMode]);

    const removeMoment = useCallback(async (momentId) => {
        if (!canSave()) return;
        try {
            await deleteDoc(doc(db, `artifacts/${appId}/public/data/casal_moments`, momentId));
            if (isLocalMode) setMomentsData(prev => prev.filter(m => m.id !== momentId));
        } catch (e) {
            console.error("Erro ao remover momento:", e);
        }
    }, [db, canSave, isLocalMode]);

    const tripsRef = useMemo(() => db ? collection(db, `artifacts/${appId}/public/data/casal_trips`) : null, [db]);

    const addTrip = useCallback(async (name) => {
        if (!canSave()) return;
        try {
            const docRef = await addDoc(tripsRef, {
                name: name,
                goals: []
            });
            if (isLocalMode) setTripsData(prev => [...prev, { name: name, goals: [], id: docRef.id }]);
        } catch (e) {
            console.error("Erro ao adicionar viagem:", e);
        }
    }, [tripsRef, canSave, isLocalMode]);

    const removeTrip = useCallback(async (tripId) => {
        if (!canSave()) return;
        try {
            await deleteDoc(doc(tripsRef, tripId));
            if (isLocalMode) setTripsData(prev => prev.filter(t => t.id !== tripId));
        } catch (e) {
            console.error("Erro ao remover viagem:", e);
        }
    }, [tripsRef, canSave, isLocalMode]);
    
    const updateTripGoals = useCallback(async (tripId, newGoals) => {
        if (!canSave()) return;
        try {
            await setDoc(doc(tripsRef, tripId), { goals: newGoals }, { merge: true });
            if (isLocalMode) setTripsData(prev => prev.map(t => t.id === tripId ? { ...t, goals: newGoals } : t));
        } catch (e) {
            console.error("Erro ao atualizar metas da viagem:", e);
        }
    }, [tripsRef, canSave, isLocalMode]);
    
    const addGoal = useCallback(async (tripId, goal) => {
        const trip = tripsData.find(t => t.id === tripId);
        if (!trip) return;
        const newGoals = [...(trip.goals || []), goal];
        await updateTripGoals(tripId, newGoals);
    }, [tripsData, updateTripGoals]);
    
    const removeGoal = useCallback(async (tripId, goalId) => {
        const trip = tripsData.find(t => t.id === tripId);
        if (!trip) return;
        const newGoals = (trip.goals || []).filter(g => g.id !== goalId);
        await updateTripGoals(tripId, newGoals);
    }, [tripsData, updateTripGoals]);
    
    const updateGoal = useCallback(async (tripId, goalId, newCurrentAmount) => {
        const trip = tripsData.find(t => t.id === tripId);
        if (!trip) return;
        const newGoals = (trip.goals || []).map(g => 
            g.id === goalId ? { ...g, current: Math.min(g.target, Math.max(0, newCurrentAmount)) } : g
        );
        await updateTripGoals(tripId, newGoals);
    }, [tripsData, updateTripGoals]);


    // --- Renderização de Status e Interface ---
    if (loading && !isLocalMode) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-pink-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-rose-300"></div>
                    <p className="mt-4 text-xl font-semibold text-violet-700">Carregando Nosso App...</p>
                    <p className="text-sm text-gray-500">Conectando em tempo real (Firestore).</p>
                </div>
            </div>
        );
    }

    if (error && !isLocalMode) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-red-50">
                <div className="text-center p-8 border-2 border-red-500 rounded-lg">
                    <p className="text-xl font-bold text-red-700">Erro Fatal:</p>
                    <p className="mt-2 text-gray-600">Falha na conexão com o banco de dados. Verifique a console do navegador.</p>
                </div>
            </div>
        );
    }

    const listSections = [
        { key: 'movies', label: 'Filmes & Séries', icon: '🎬' },
        { key: 'dates', label: 'Dates & Momentos', icon: '📸' },
        { key: 'travel', label: 'Viagens & Metas', icon: '✈️' },
        { key: 'places', label: 'Lugares para Sair', icon: '🍽️' },
        { key: 'music', label: 'Músicas Nossas', icon: '🎶' },
    ];
    
    // Renderização do App
    return (
        <div className="min-h-screen bg-pink-50 font-sans p-4 md:p-8">
            
            {/* Cabeçalho */}
            <header className={`py-6 px-4 mb-8 text-violet-900 rounded-xl bg-violet-300 shadow-xl`}>
                <h1 className="text-3xl md:text-4xl font-extrabold text-center">💖 Nosso Love App 💖</h1>
                <p className="text-center text-sm mt-2 opacity-80">
                    Usuário Colaborativo (Para você e seu amor): <span className="font-mono text-xs bg-violet-400 p-1 rounded-md text-white">{userId || 'Desconhecido'}</span>
                </p>
                {isLocalMode && (
                    <div className="mt-4 p-3 bg-red-200 text-red-800 font-semibold rounded-lg text-center border border-red-400">
                        AVISO: {error}
                    </div>
                )}
            </header>
            
            {/* Navegação por Tabs */}
            <nav className="flex flex-wrap justify-center space-x-2 md:space-x-4 mb-8 p-3 bg-white rounded-xl shadow-md">
                {listSections.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full transition duration-200 flex items-center mt-2 ${
                            activeTab === tab.key
                                ? `bg-rose-300 text-rose-900 shadow-md`
                                : 'text-gray-600 hover:bg-rose-100'
                        }`}
                    >
                        <span className="mr-2">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>
            
            {/* Conteúdo das Abas */}
            <main className="max-w-7xl mx-auto">
                {/* Seção de Filmes e Séries */}
                {(activeTab === 'movies' || activeTab === 'series') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SharedListSection
                            title="Filmes para Assistir"
                            placeholder="Nome do Filme"
                            items={listsData.movies || []}
                            addItem={addItemToList('movies')}
                            removeItem={removeItemFromList('movies')}
                        />
                        <SharedListSection
                            title="Séries para Assistir"
                            placeholder="Nome da Série"
                            items={listsData.series || []}
                            addItem={addItemToList('series')}
                            removeItem={removeItemFromList('series')}
                        />
                    </div>
                )}
                
                {/* Seção de Lugares para Sair */}
                {activeTab === 'places' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SharedListSection
                            title="Locais Culturais pra Visitar"
                            placeholder="Nome do Local"
                            items={listsData.cultural || []}
                            addItem={addItemToList('cultural')}
                            removeItem={removeItemFromList('cultural')}
                        />
                        <SharedListSection
                            title="Restaurantes para Visitar"
                            placeholder="Nome do Restaurante"
                            items={listsData.restaurants || []}
                            addItem={addItemToList('restaurants')}
                            removeItem={removeItemFromList('restaurants')}
                        />
                    </div>
                )}

                {/* Seção de Músicas Nossas */}
                {activeTab === 'music' && (
                    <div className="max-w-3xl mx-auto">
                        <SharedListSection
                            title="Músicas Nossas (Links/Playlists)"
                            placeholder="Cole o link da música ou playlist favorita"
                            items={listsData.music || []}
                            addItem={addItemToList('music')}
                            removeItem={removeItemFromList('music')}
                        />
                    </div>
                )}
                
                {/* Seção de Datas e Momentos (Polaroid) */}
                {activeTab === 'dates' && (
                    <DateMomentSection
                        moments={momentsData}
                        addMoment={addMoment}
                        removeMoment={removeMoment}
                    />
                )}
                
                {/* Seção de Viagens e Planejamento (Metas) */}
                {activeTab === 'travel' && (
                    <TravelPlannerSection
                        trips={tripsData}
                        addTrip={addTrip}
                        removeTrip={removeTrip}
                        addGoal={addGoal}
                        updateGoal={updateGoal}
                        removeGoal={removeGoal}
                    />
                )}
            </main>
        </div>
    );
}