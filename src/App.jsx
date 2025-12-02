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
} from 'firebase/firestore';

// Variáveis globais fornecidas pelo ambiente para conexão com o Firebase.
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
const cardStyle = 'bg-white shadow-xl rounded-3xl p-6 transition duration-300 transform hover:scale-[1.01] border-t-4 border-rose-200';
const inputStyle = 'w-full p-3 border border-gray-300 rounded-lg focus:ring-rose-300 focus:border-rose-300 transition duration-150';


/**
 * Componente de Card Estilo Polaroid (Novo design e com data)
 */
const PolaroidCard = ({ moment, removeMoment }) => {
  const formattedDate = moment.date ? new Date(moment.date).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : 'Data Desconhecida';

  return (
    <div className="relative flex flex-col items-center p-2 bg-gray-50 shadow-2xl rounded-md group" 
         style={{ width: '250px', transform: `rotate(${Math.random() * 6 - 3}deg)` }}>
      
      {/* Botão de Excluir que aparece ao passar o mouse/tocar */}
      <button 
          onClick={() => removeMoment(moment.id)}
          title="Apagar Momento"
          className="absolute top-0 right-0 m-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition duration-300 z-10"
      >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
      </button>

      {/* Área da Foto */}
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
      
      {/* Área de Texto (Polaroid base) */}
      <div className="w-full pt-4 pb-2 px-2 text-center">
        <p className="font-bold text-lg text-gray-800 break-words mt-1">{moment.title || 'Nosso Momento'}</p>
        <p className="text-sm text-gray-500 mt-1">{formattedDate}</p>
        <p className="text-xs italic text-violet-600 mt-1 max-h-10 overflow-hidden">{moment.phrase || 'Um dia inesquecível!'}</p>
      </div>
    </div>
  );
};


/**
 * Componente de Lista Compartilhada com Checkbox (Filmes, Séries, Lugares, Músicas)
 * Implementa os pedidos 2 e 5.
 */
const SharedListSection = ({ title, placeholder, items, addItem, removeItem, toggleCompleted }) => {
  const [newItem, setNewItem] = useState('');

  const handleAddItem = (e) => {
    e.preventDefault();
    if (newItem.trim()) {
      addItem(newItem.trim());
      setNewItem('');
    }
  };

  const completedItems = items.filter(item => item.completed);
  const pendingItems = items.filter(item => !item.completed);
  const totalItems = items.length;

  // Renderiza ícones de acordo com o título
  const renderIcon = () => {
    if (title.includes('Filmes')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
    if (title.includes('Séries')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1v-3m-6.447-2.839L14 10m-3.447 2.839L10 10m5 5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
    if (title.includes('Cultu')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-1 0h-5M9 7h1m-1 4h1m-1 4h1m-5 4v-4m0 0H9m-4 0h2m-4 0V7a4 4 0 014-4h4a4 4 0 014 4v14m-12 0h12" /></svg>;
    if (title.includes('Restaurantes')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 113.414 3.414L10.414 20H8v-2.414l9.586-9.586z" /></svg>;
    if (title.includes('Músicas')) return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v14L9 19zm0 0v-4" /></svg>;
    return null;
  };
  
  // Renderiza um item da lista (Pendente ou Completo)
  const renderItem = (item, isCompleted) => (
    <li 
      key={item.id} 
      className={`flex justify-between items-center p-3 rounded-xl transition duration-200 border-l-4 ${
        isCompleted 
          ? 'bg-green-50 border-green-300 hover:bg-green-100'
          : 'bg-rose-50 border-rose-300 hover:bg-rose-100'
      }`}
    >
      <div className="flex items-center flex-grow">
        {/* Checkbox */}
        <input 
          type="checkbox"
          checked={item.completed}
          onChange={() => toggleCompleted(item.id)}
          className={`h-5 w-5 rounded form-checkbox mr-3 transition duration-150 ${
            isCompleted 
              ? 'text-green-500 border-green-500 focus:ring-green-500' 
              : 'text-rose-500 border-gray-400 focus:ring-rose-500'
          }`}
        />
        
        {/* Nome do Item (com risco se completo) */}
        <span className={`text-gray-700 font-medium truncate pr-2 flex-grow ${isCompleted ? 'line-through text-gray-500 italic' : ''}`}>
          {item.name}
          {title.includes('Músicas') && (
            <a 
              href={item.name} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-violet-600 ml-2 hover:underline text-sm"
              onClick={(e) => e.stopPropagation()} // Não aciona o checkbox ao clicar no link
            >
              (Abrir Link)
            </a>
          )}
        </span>
      </div>

      {/* Botão de Excluir */}
      <button
        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
        className="text-red-500 hover:text-red-700 transition duration-150 p-1 rounded-full hover:bg-red-100 flex-shrink-0"
        title="Remover Item"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </li>
  );

  return (
    <div className={cardStyle}>
      <h3 className={`text-2xl font-bold mb-4 flex items-center ${accentColor}`}>
        <span className="mr-2">{renderIcon()}</span>
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
          className={`bg-rose-500 text-white font-bold py-3 px-4 rounded-xl flex-shrink-0 hover:bg-rose-600 transition duration-150 shadow-md`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        </button>
      </form>
      
      {/* Indicador de Progresso */}
      <div className="mb-4 text-center">
        <p className="text-sm font-semibold text-gray-700">
          Progresso: {completedItems.length} de {totalItems}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
          <div 
            className={`h-2 rounded-full transition-all duration-500 bg-rose-400`}
            style={{ width: `${totalItems > 0 ? (completedItems.length / totalItems) * 100 : 0}%` }}
          ></div>
        </div>
      </div>


      <ul className="space-y-3">
        <h4 className='font-bold text-gray-800 border-b pb-1'>Pendentes ({pendingItems.length})</h4>
        {pendingItems.map(item => renderItem(item, false))}
        {pendingItems.length === 0 && (
          <p className="text-gray-500 italic text-center text-sm">Tudo em dia! ✨</p>
        )}
      </ul>
      
      {completedItems.length > 0 && (
        <ul className="space-y-3 mt-6 pt-4 border-t border-gray-200">
          <h4 className='font-bold text-gray-800 border-b pb-1'>Concluídos ({completedItems.length})</h4>
          {completedItems.map(item => renderItem(item, true))}
        </ul>
      )}

      {totalItems === 0 && (
        <p className="text-gray-500 italic text-lg text-center mt-8">Nenhum item adicionado ainda!</p>
      )}
    </div>
  );
};


/**
 * Componente de Datas e Momentos (Galeria Polaroid)
 * Implementa os pedidos 3 e 7.
 */

const DateMomentSection = ({ moments, addMoment, removeMoment }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [photoURL, setPhotoURL] = useState('');
    const [phrase, setPhrase] = useState(''); // Nova frase romântica
    const [activeTab, setActiveTab] = useState('add');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title && date) {
            addMoment({ title, date, photoURL: photoURL.trim(), phrase: phrase.trim() }); // Passando a frase
            setTitle('');
            setDate('');
            setPhotoURL('');
            setPhrase('');
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
                            <label className="block text-sm font-medium text-gray-700">Frase Romântica (para a base do Polaroid)</label>
                            <input type="text" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="Ex: Meu amor para sempre! ❤️" className={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Link da Foto (URL)</label>
                            <input type="url" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="Cole o link da imagem aqui (ex: Imgur, Google Photos)" className={inputStyle} />
                            <p className="text-xs text-gray-500 mt-1">
                                *Dica: Você precisa de um link direto para a foto, pois não podemos armazenar arquivos no banco de dados.
                            </p>
                        </div>
                        <button
                            type="submit"
                            className={`w-full bg-violet-300 text-violet-900 font-bold py-3 rounded-xl hover:bg-violet-400 transition duration-150 shadow-md`}
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
                            <PolaroidCard key={moment.id} moment={moment} removeMoment={removeMoment} />
                        ))
                    ) : (
                        <p className="text-gray-500 italic text-lg mt-8">Nenhum momento registrado ainda. Que tal marcar um date?</p>
                    )}
                </div>
            )}
        </div>
    );
};


/**
 * Componente de Planejamento de Viagem (Viagens e Metas)
 * Implementa o pedido 4 (Planejamento)
 */
const TravelPlannerSection = ({ trips, addTrip, removeTrip, addGoal, updateGoal, removeGoal }) => {
    const [newTripName, setNewTripName] = useState('');
    const [selectedTrip, setSelectedTrip] = useState(null); 
    const [newGoalName, setNewGoalName] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newTripDate, setNewTripDate] = useState('');

    const handleAddTrip = (e) => {
        e.preventDefault();
        if (newTripName.trim() && newTripDate) {
            addTrip(newTripName.trim(), newTripDate);
            setNewTripName('');
            setNewTripDate('');
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
    const formatDate = (dateString) => dateString ? new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR') : 'Sem data';


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

                <div className='flex justify-between items-center mb-6 border-b pb-3 border-rose-100'>
                    <h3 className={`text-3xl font-extrabold ${accentColor}`}>{currentTrip.name}</h3>
                    <span className='text-lg font-bold text-gray-700 bg-rose-100 p-2 rounded-lg'>
                        Data Alvo: {formatDate(currentTrip.date)}
                    </span>
                </div>
                
                <div className="mb-8 p-4 bg-violet-100 rounded-xl shadow-inner">
                    <p className="text-xl font-bold text-gray-800">Meta Financeira Global:</p>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-2">
                        <div className="w-full sm:w-1/2">
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div 
                                    className={`h-3 rounded-full transition-all duration-500 ${totalProgress >= 100 ? 'bg-green-400' : 'bg-rose-300'}`}
                                    style={{ width: `${Math.min(100, totalProgress)}%` }}
                                ></div>
                            </div>
                            <p className="text-sm font-medium text-gray-600 mt-1">{totalProgress}% Completo</p>
                        </div>
                        <div className="w-full sm:w-1/2">
                            <p className="text-2xl font-bold">
                                {formatBRL(totalCurrent)} / {formatBRL(totalTarget)}
                            </p>
                            <p className="text-lg font-medium text-red-500">
                                Faltam: {formatBRL(totalMissing > 0 ? totalMissing : 0)}
                            </p>
                        </div>
                    </div>
                </div>

                <h4 className="text-xl font-bold mb-3 text-gray-700 border-b pb-2">Passos para o Planejamento:</h4>
                
                <form onSubmit={handleAddGoal} className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                    <input
                        type="text"
                        value={newGoalName}
                        onChange={(e) => setNewGoalName(e.target.value)}
                        placeholder="Nome da Meta (Ex: Passagens Aéreas)"
                        className={`${inputStyle} md:w-1/2`}
                        required
                    />
                    <input
                        type="number"
                        step="0.01"
                        value={newGoalTarget}
                        onChange={(e) => setNewGoalTarget(e.target.value)}
                        placeholder="Valor R$"
                        className={`${inputStyle} md:w-1/4`}
                        required
                    />
                    <button
                        type="submit"
                        className={`md:w-1/4 bg-rose-300 text-rose-900 font-bold py-3 rounded-xl hover:bg-rose-400 transition duration-150 shadow-md`}
                    >
                        + Adicionar Meta
                    </button>
                </form>

                <ul className="space-y-4">
                    {currentTrip.goals?.map((goal) => {
                        const progress = goal.target > 0 ? Math.round((goal.current / goal.target) * 100) : 0;
                        const missing = goal.target - goal.current;

                        return (
                            <li key={goal.id} className="p-4 border border-gray-200 rounded-xl bg-white shadow-md">
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
                                    Salvo: <span className={`font-semibold ${goal.current >= goal.target ? 'text-green-600' : 'text-violet-600'}`}>{formatBRL(goal.current)}</span>
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
                                        className={`px-3 py-2 text-sm font-bold rounded-xl transition duration-150 shadow-sm ${
                                            progress >= 100 ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-violet-300 hover:bg-violet-400 text-violet-900'
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

    // View da Lista de Viagens
    return (
        <div className={cardStyle}>
            <h3 className={`text-2xl font-bold mb-4 ${accentColor} flex items-center`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                Nossos Sonhos de Viagem
            </h3>
            
            <form onSubmit={handleAddTrip} className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2 mb-6 p-4 bg-gray-50 rounded-lg shadow-sm">
                <input
                    type="text"
                    value={newTripName}
                    onChange={(e) => setNewTripName(e.target.value)}
                    placeholder="Ex: Viagem para Paris em 2026"
                    className={`${inputStyle} md:w-1/2`}
                    required
                />
                <input
                    type="date"
                    value={newTripDate}
                    onChange={(e) => setNewTripDate(e.target.value)}
                    className={`${inputStyle} md:w-1/4`}
                    required
                />
                <button
                    type="submit"
                    className={`md:w-1/4 bg-violet-300 text-violet-900 font-bold py-3 rounded-xl flex-shrink-0 hover:bg-violet-400 transition duration-150 shadow-md`}
                >
                    + Adicionar Sonho
                </button>
            </form>

            <ul className="space-y-3">
                {trips.map((trip) => {
                    const totalTargetTrip = trip.goals?.reduce((sum, goal) => sum + goal.target, 0) || 0;
                    const totalCurrentTrip = trip.goals?.reduce((sum, goal) => sum + goal.current, 0) || 0;
                    const progressTrip = totalTargetTrip > 0 ? Math.round((totalCurrentTrip / totalTargetTrip) * 100) : 0;
                    
                    return (
                        <li key={trip.id} className="flex justify-between items-center bg-rose-50 p-4 rounded-xl border-l-4 border-rose-300 shadow-sm">
                            <div className="flex-grow cursor-pointer" onClick={() => setSelectedTrip(trip.id)}>
                                <p className="font-semibold text-lg text-gray-800 hover:text-violet-600 transition duration-150">{trip.name}</p>
                                <p className="text-sm text-gray-500">Data Alvo: {formatDate(trip.date)}</p>
                                <div className="flex items-center mt-2">
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
                    <p className="text-gray-500 italic text-center mt-4">Nenhuma viagem planejada ainda.</p>
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
            // VERIFICAÇÃO DE MODO LOCAL: Se não há credenciais, ative o modo local.
            if (Object.keys(firebaseConfig).length === 0) {
                console.warn("Modo Local Ativo: Sem credenciais Firebase.");
                setIsLocalMode(true);
                setLoading(false);
                setIsAuthReady(true);
                return; 
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
        if (isLocalMode) return;

        if (!db || !isAuthReady || !userId) {
            return;
        }
        
        // FIX: Usar array de segmentos para construir o caminho, evitando o erro de 6 segmentos.
        const collectionsPathSegments = ['artifacts', appId, 'public', 'data']; 
        
        const collections = [
            { name: 'lists', setter: setListsData, initialData: { movies: [], series: [], cultural: [], restaurants: [], music: [] } },
            { name: 'moments', setter: setMomentsData, initialData: [] },
            { name: 'trips', setter: setTripsData, initialData: [] },
        ];

        const unsubscribers = [];
        let loadCount = 0;

        collections.forEach(({ name, setter, initialData }) => {
            const finalCollectionName = `casal_${name}`;
            // NEW: collection(db, 'artifacts', appId, 'public', 'data', 'casal_lists') -> 5 segments, que é o número ímpar correto para uma coleção.
            const collectionRef = collection(db, ...collectionsPathSegments, finalCollectionName);
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
                            // Garante que o campo 'completed' existe com o valor padrão false
                            listState[listKey] = (allDocs[listKey].items || []).map(item => ({
                                ...item,
                                completed: item.completed ?? false
                            }));
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
            return false;
        }
        if (!db) {
            console.error("Erro: Database não está pronto.");
            return false;
        }
        return true;
    }, [isLocalMode, db]);
    
    // Função para obter a referência do documento/coleção de forma segura
    const getCollectionRef = useCallback((collectionName) => {
        return collection(db, 'artifacts', appId, 'public', 'data', `casal_${collectionName}`);
    }, [db]);


    const updateSharedList = useCallback(async (listKey, newItems) => {
        if (!canSave()) return;
        try {
            const listRef = doc(getCollectionRef('lists'), listKey);
            await setDoc(listRef, { items: newItems });
        } catch (e) {
            console.error(`Erro ao atualizar lista ${listKey}:`, e);
        }
    }, [db, canSave, getCollectionRef]);

    const addItemToList = useCallback((listKey) => async (name) => {
        const currentItems = listsData[listKey] || [];
        const newItem = { 
            id: Date.now().toString(), 
            name: name, 
            completed: false // Novo item sempre começa como não concluído
        };
        const newItems = [...currentItems, newItem];
        await updateSharedList(listKey, newItems);
        if (isLocalMode) setListsData(prev => ({ ...prev, [listKey]: newItems }));
    }, [listsData, updateSharedList, isLocalMode]);

    const removeItemFromList = useCallback((listKey) => async (itemId) => {
        const currentItems = listsData[listKey] || [];
        const newItems = currentItems.filter(item => item.id !== itemId);
        await updateSharedList(listKey, newItems);
        if (isLocalMode) setListsData(prev => ({ ...prev, [listKey]: newItems }));
    }, [listsData, updateSharedList, isLocalMode]);

    // Nova função para toggleCompleted (pedidos 2 e 5)
    const toggleItemCompletion = useCallback((listKey) => async (itemId) => {
        const currentItems = listsData[listKey] || [];
        const newItems = currentItems.map(item => 
            item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        await updateSharedList(listKey, newItems);
        if (isLocalMode) setListsData(prev => ({ ...prev, [listKey]: newItems }));
    }, [listsData, updateSharedList, isLocalMode]);

    // Funções para Momentos (Pedidos 3 e 7)
    const addMoment = useCallback(async (moment) => {
        if (!canSave()) return;
        try {
            const docRef = await addDoc(getCollectionRef('moments'), {
                ...moment,
                createdAt: new Date().toISOString()
            });
            if (isLocalMode) setMomentsData(prev => [...prev, { ...moment, id: docRef.id, createdAt: new Date().toISOString() }]);
        } catch (e) {
            console.error("Erro ao adicionar momento:", e);
        }
    }, [db, canSave, isLocalMode, getCollectionRef]);

    const removeMoment = useCallback(async (momentId) => {
        if (!canSave()) return;
        try {
            await deleteDoc(doc(getCollectionRef('moments'), momentId));
            if (isLocalMode) setMomentsData(prev => prev.filter(m => m.id !== momentId));
        } catch (e) {
            console.error("Erro ao remover momento:", e);
        }
    }, [db, canSave, isLocalMode, getCollectionRef]);

    // Funções para Viagens e Metas (Pedido 4)
    const tripsRef = useMemo(() => getCollectionRef('trips'), [getCollectionRef]);

    const addTrip = useCallback(async (name, date) => {
        if (!canSave()) return;
        try {
            const docRef = await addDoc(tripsRef, {
                name: name,
                date: date,
                goals: []
            });
            if (isLocalMode) setTripsData(prev => [...prev, { name: name, date: date, goals: [], id: docRef.id }]);
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
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-rose-400"></div>
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
            
            {/* Cabeçalho (Estilo Aprimorado - Pedido 1) */}
            <header className={`py-8 px-4 mb-8 text-violet-900 rounded-3xl bg-violet-300 shadow-2xl border-b-8 border-violet-400`}>
                <h1 className="text-4xl md:text-5xl font-extrabold text-center">💖 Nosso Love App 💖</h1>
                <p className="text-center text-sm mt-2 font-medium">
                    {isLocalMode ? 'Modo de Visualização Local (Sem Salvar)' : 'Compartilhado em Tempo Real'}
                </p>
                {/* Remove o aviso grande de Modo Local, mas mantém a informação sutil */}
                {isLocalMode && (
                    <p className="text-center text-xs mt-2 text-violet-800 font-semibold bg-violet-200 p-2 rounded-lg max-w-sm mx-auto">
                        Aviso: Para salvar, configure as chaves Firebase no seu deploy.
                    </p>
                )}
                <p className="text-center text-xs mt-3 opacity-80">
                    ID de Colaboração: <span className="font-mono text-xs bg-violet-400 p-1 rounded-md text-white">{userId || 'Desconhecido'}</span>
                </p>
            </header>
            
            {/* Navegação por Tabs */}
            <nav className="flex flex-wrap justify-center space-x-2 md:space-x-4 mb-8 p-3 bg-white rounded-2xl shadow-lg border-b border-rose-200">
                {listSections.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 text-sm md:text-base font-semibold rounded-full transition duration-200 flex items-center mt-2 shadow-sm ${
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
                {/* Seção de Filmes e Séries (Pedido 2) */}
                {activeTab === 'movies' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SharedListSection
                            title="Filmes para Assistir"
                            placeholder="Nome do Filme"
                            items={listsData.movies || []}
                            addItem={addItemToList('movies')}
                            removeItem={removeItemFromList('movies')}
                            toggleCompleted={toggleItemCompletion('movies')}
                        />
                        <SharedListSection
                            title="Séries para Assistir"
                            placeholder="Nome da Série"
                            items={listsData.series || []}
                            addItem={addItemToList('series')}
                            removeItem={removeItemFromList('series')}
                            toggleCompleted={toggleItemCompletion('series')}
                        />
                    </div>
                )}
                
                {/* Seção de Lugares para Sair (Pedido 5) */}
                {activeTab === 'places' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SharedListSection
                            title="Locais Culturais pra Visitar"
                            placeholder="Nome do Local (Ex: Museu, Teatro)"
                            items={listsData.cultural || []}
                            addItem={addItemToList('cultural')}
                            removeItem={removeItemFromList('cultural')}
                            toggleCompleted={toggleItemCompletion('cultural')}
                        />
                        <SharedListSection
                            title="Restaurantes para Visitar"
                            placeholder="Nome do Restaurante"
                            items={listsData.restaurants || []}
                            addItem={addItemToList('restaurants')}
                            removeItem={removeItemFromList('restaurants')}
                            toggleCompleted={toggleItemCompletion('restaurants')}
                        />
                    </div>
                )}

                {/* Seção de Músicas Nossas (Pedido 6) */}
                {activeTab === 'music' && (
                    <div className="max-w-3xl mx-auto">
                        <SharedListSection
                            title="Músicas Nossas (Links/Playlists)"
                            placeholder="Cole o link da música (Spotify, YouTube, etc.)"
                            items={listsData.music || []}
                            addItem={addItemToList('music')}
                            removeItem={removeItemFromList('music')}
                            toggleCompleted={toggleItemCompletion('music')}
                        />
                         <p className='text-center text-sm text-gray-500 mt-4'>
                            *Dica: Para ouvir diretamente no site, cole o link e use um serviço que permita 'embed' (incorporação) de players, ou simplesmente clique em 'Abrir Link'.
                        </p>
                    </div>
                )}
                
                {/* Seção de Datas e Momentos (Polaroid) (Pedidos 3 e 7) */}
                {activeTab === 'dates' && (
                    <DateMomentSection
                        moments={momentsData}
                        addMoment={addMoment}
                        removeMoment={removeMoment}
                    />
                )}
                
                {/* Seção de Viagens e Planejamento (Metas) (Pedido 4) */}
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