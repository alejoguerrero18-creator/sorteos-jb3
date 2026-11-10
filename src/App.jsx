import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyYOUR_API_KEY_HERE",
  authDomain: "sorteos-jb3.firebaseapp.com",
  projectId: "sorteos-jb3",
  storageBucket: "sorteos-jb3.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef123456"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const LINEAS_25_MAP = {
  'A': ['00', '25', '50', '75'],
  'B': ['01', '26', '51', '76'],
  'C': ['02', '27', '52', '77'],
  'D': ['03', '28', '53', '78'],
  'E': ['04', '29', '54', '79'],
  'F': ['05', '30', '55', '80'],
  'G': ['06', '31', '56', '81'],
  'H': ['07', '32', '57', '82'],
  'I': ['08', '33', '58', '83'],
  'J': ['09', '34', '59', '84'],
  'K': ['10', '35', '60', '85'],
  'L': ['11', '36', '61', '86'],
  'M': ['12', '37', '62', '87'],
  'N': ['13', '38', '63', '88'],
  'O': ['14', '39', '64', '89'],
  'P': ['15', '40', '65', '90'],
  'Q': ['16', '41', '66', '91'],
  'R': ['17', '42', '67', '92'],
  'S': ['18', '43', '68', '93'],
  'T': ['19', '44', '69', '94'],
  'U': ['20', '45', '70', '95'],
  'V': ['21', '46', '71', '96'],
  'W': ['22', '47', '72', '97'],
  'X': ['23', '48', '73', '98'],
  'Y': ['24', '49', '74', '99']
};

const MODALIDADES = [
  { id: 1, tipo: 'numeros', nombre: '$2.000 - Doble Oportunidad', desc: '00 al 99 (1 num/puesto) - 2 Últimas ($100k), 2 Primeras ($40k)', precio: 2000, premio: 140000, maxRecaudo: 200000, utilidad: 60000, totalItems: 100 },
  { id: 2, tipo: 'letras', nombre: '$5.000 - 4 Oportunidades (A-Y)', desc: '25 Líneas (4 nums/línea) - 2 Últimas ($80k)', precio: 5000, premio: 250000, maxRecaudo: 500000, utilidad: 250000, totalItems: 25 },
  { id: 3, tipo: 'numeros', nombre: '$3.000 - Doble + Acumulado', desc: '00 al 99 - 2 Últimas ($50k), 2 Primeras ($50k) + Pozo Acumulado', precio: 3000, premio: 150000, maxRecaudo: 300000, utilidad: 150000, totalItems: 100 },
  { id: 4, tipo: 'letras', nombre: '$6.000 - Sorteo Espejo', desc: '50 Líneas o variantes - 2 Últimas ($100k), 2 Primeras ($100k)', precio: 6000, premio: 300000, maxRecaudo: 600000, utilidad: 300000, totalItems: 25 },
  { id: 5, tipo: 'numeros', nombre: '$3.000 - Triple Oportunidad', desc: '00 al 99 - 2 Últimas ($100k), 2 Primeras ($50k), Medio ($50k)', precio: 3000, premio: 200000, maxRecaudo: 300000, utilidad: 100000, totalItems: 100 },
  { id: 6, tipo: 'letras', nombre: '$10.000 - 4 Oportunidades (A-Y)', desc: '25 Líneas (4 nums/línea) - 2 Últimas ($150k)', precio: 10000, premio: 450000, maxRecaudo: 1000000, utilidad: 550000, totalItems: 25 }
];

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [modality, setModality] = useState(MODALIDADES[5]);
  const [numbers, setNumbers] = useState({});
  const [selectedNum, setSelectedNum] = useState(null);
  const [buyerName, setBuyerName] = useState('');
  
  const [qrUrl, setQrUrl] = useState('');
  const [lotteryResultImg, setLotteryResultImg] = useState('');

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('breb');
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "sorteos", "estado_actual"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.numbers) setNumbers(data.numbers);
        
        // Carga y sincroniza la modalidad activa guardada en Firebase
        if (data.modalityId) {
          const modEncontrada = MODALIDADES.find(m => m.id === data.modalityId);
          if (modEncontrada) setModality(modEncontrada);
        }

        if (data.qrUrl) setQrUrl(data.qrUrl);
        if (data.lotteryResultImg !== undefined) setLotteryResultImg(data.lotteryResultImg);
      } else {
        setDoc(doc(db, "sorteos", "estado_actual"), {
          numbers: {},
          modalityId: 5,
          qrUrl: '',
          lotteryResultImg: ''
        });
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!selectedNum) {
      setTimeLeft(300);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setSelectedNum(null);
          alert('El tiempo de reserva de 5 minutos ha expirado.');
          return 300;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedNum]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'Juanemib' && password === 'Mamiteamo14*') {
      setIsAdmin(true);
      setShowLoginModal(false);
      setUsername('');
      setPassword('');
    } else {
      alert('Usuario o Contraseña incorrectos');
    }
  };

  const selectModality = async (mod) => {
    setModality(mod);
    // Guarda el ID de la modalidad en Firestore para que no cambie al recargar la página
    await updateDoc(doc(db, "sorteos", "estado_actual"), { 
      modalityId: mod.id, 
      numbers: {} 
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setLotteryResultImg(base64String);
        await updateDoc(doc(db, "sorteos", "estado_actual"), { lotteryResultImg: base64String });
        alert('¡Imagen del resultado cargada con éxito!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = async () => {
    if (window.confirm("¿Deseas eliminar la imagen del resultado?")) {
      setLotteryResultImg('');
      await updateDoc(doc(db, "sorteos", "estado_actual"), { lotteryResultImg: '' });
    }
  };

  const handleQrUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        setQrUrl(base64String);
        await updateDoc(doc(db, "sorteos", "estado_actual"), { qrUrl: base64String });
        alert('¡Código QR de pago actualizado con éxito!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!selectedNum || !buyerName) return;
    const newNumbers = {
      ...numbers,
      [selectedNum]: { nombre: buyerName, estado: 'reservado' }
    };
    await updateDoc(doc(db, "sorteos", "estado_actual"), { numbers: newNumbers });
    setSelectedNum(null);
    setBuyerName('');
    alert('¡Puesto apartado con éxito! El administrador verificará tu pago.');
  };

  const updateStatus = async (numStr, state) => {
    const newNumbers = { ...numbers };
    if (state === 'libre') {
      delete newNumbers[numStr];
    } else {
      newNumbers[numStr] = { ...newNumbers[numStr], estado: state };
    }
    await updateDoc(doc(db, "sorteos", "estado_actual"), { numbers: newNumbers });
  };

  const resetBoard = async () => {
    if (window.confirm("¿Seguro que deseas reiniciar todo el tablero para un nuevo juego?")) {
      await updateDoc(doc(db, "sorteos", "estado_actual"), { numbers: {}, lotteryResultImg: '' });
      setLotteryResultImg('');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copiado al portapapeles: ${text}`);
  };

  const formatCOP = (val) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalOcupados = Object.keys(numbers).length;
  const porcentajeOcupado = Math.round((totalOcupados / modality.totalItems) * 100);

  const itemsList = modality.tipo === 'letras' 
    ? Object.keys(LINEAS_25_MAP) 
    : Array.from({ length: 100 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', backgroundColor: '#0b0f19', minHeight: '100vh', color: '#f8fafc', padding: '20px' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        
        {/* Header Principal */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', border: '1px solid #1f2937', padding: '15px 25px', borderRadius: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div 
              onClick={() => !isAdmin && setShowLoginModal(true)}
              style={{ 
                background: '#f59e0b', 
                color: '#000', 
                fontWeight: '900', 
                padding: '10px 14px', 
                borderRadius: '8px', 
                fontSize: '1.2rem', 
                boxShadow: '0 0 15px rgba(245,158,11,0.4)',
                cursor: 'pointer'
              }}
              title={isAdmin ? "Administrador Activo" : "SORTEOS JB3"}
            >
              JB3
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#ffffff', letterSpacing: '0.5px' }}>SORTEOS JB3</h1>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9ca3af' }}>Control Inteligente de Juegos y Rifas</p>
            </div>
          </div>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button onClick={resetBoard} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#831843', color: '#fbcfe8', border: '1px solid #9d174d', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                🔄 Nuevo Juego
              </button>
              <button 
                onClick={() => setIsAdmin(false)}
                style={{ 
                  background: '#dc2626', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '8px 12px', 
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Salir Admin
              </button>
            </div>
          )}
        </header>

        {/* Modal de Login Secreto */}
        {showLoginModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', zIndex: 1100 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #f59e0b', padding: '25px', borderRadius: '16px', maxWidth: '340px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ margin: 0, color: '#f59e0b' }}>🔐 Acceso Administrador</h3>
                <button onClick={() => setShowLoginModal(false)} style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
              </div>

              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Usuario</label>
                  <input
                    type="text"
                    placeholder="Usuario admin"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: '#0b0f19', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Contraseña</label>
                  <input
                    type="password"
                    placeholder="Contraseña"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: '#0b0f19', color: 'white', boxSizing: 'border-box' }}
                  />
                </div>

                <button type="submit" style={{ width: '100%', padding: '12px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}>
                  Ingresar
                </button>
              </form>

              <button onClick={() => setShowLoginModal(false)} style={{ width: '100%', padding: '8px', background: '#1f2937', color: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Panel Admin de Configuración */}
        {isAdmin && (
          <div style={{ backgroundColor: '#111827', border: '1px solid #f59e0b', padding: '20px', borderRadius: '12px', marginBottom: '20px' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#f59e0b' }}>⚙️ Panel Admin: Configuración del Sorteo</h3>
            
            <div style={{ marginBottom: '15px', background: '#0b0f19', padding: '15px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <label style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                🖼️ Subir Imagen del Resultado / Lotería (JPG o PNG):
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}
              />
              {lotteryResultImg && (
                <button 
                  onClick={handleRemoveImage}
                  style={{ marginTop: '10px', padding: '6px 12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🗑️ Eliminar Imagen del Resultado
                </button>
              )}
            </div>

            <div style={{ marginBottom: '20px', background: '#0b0f19', padding: '15px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              <label style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>
                💳 Actualizar Código QR de Pago (Nu / Bre-B):
              </label>
              <input
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleQrUpload}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #374151', background: '#111827', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}
              />
            </div>

            <p style={{ fontSize: '0.9rem', color: '#e5e7eb', marginBottom: '10px' }}>Seleccionar Modalidad Activa para Hoy:</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
              {MODALIDADES.map(m => (
                <button 
                  key={m.id} 
                  onClick={() => selectModality(m)} 
                  style={{ 
                    padding: '12px', 
                    textAlign: 'left',
                    background: modality.id === m.id ? '#1e293b' : '#0b0f19', 
                    color: 'white', 
                    border: modality.id === m.id ? '2px solid #f59e0b' : '1px solid #1f2937', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#f59e0b', marginBottom: '4px' }}>{m.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{m.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sección Visual del Resultado */}
        {lotteryResultImg && (
          <div style={{ background: '#111827', border: '1px solid #374151', padding: '15px', borderRadius: '14px', marginBottom: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', color: '#f59e0b' }}>🎟️ Resultado / Lotería del Sorteo</h3>
            <img 
              src={lotteryResultImg} 
              alt="Resultado Lotería" 
              style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', objectFit: 'contain', border: '1px solid #1f2937' }} 
            />
          </div>
        )}

        {/* Tarjeta de Modalidad Activa */}
        <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '20px', borderRadius: '14px', marginBottom: '20px' }}>
          <div style={{ background: '#1e293b', border: '2px solid #f59e0b', borderRadius: '10px', padding: '16px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#f59e0b', marginBottom: '6px' }}>
              {modality.nombre}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>{modality.desc}</div>
          </div>
        </div>

        {/* Panel de Estadísticas */}
        <div style={{ display: 'grid', gridTemplateColumns: isAdmin ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: '15px', marginBottom: '25px' }}>
          <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📦 LÍNEAS / PUESTOS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#ffffff', margin: '4px 0' }}>{totalOcupados} / {modality.totalItems}</div>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 'bold' }}>{porcentajeOcupado}% Ocupado</span>
          </div>

          <div style={{ background: '#111827', border: '1px solid #1f2937', padding: '18px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>🏆 BOLSA PREMIOS</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#facc15', margin: '4px 0' }}>{formatCOP(modality.premio)}</div>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Premio Mayor garantizado</span>
          </div>

          {isAdmin && (
            <div style={{ background: '#111827', border: '1px solid #38bdf8', padding: '18px', borderRadius: '12px' }}>
              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📊 UTILIDAD NETA (Admin)</span>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#38bdf8', margin: '4px 0' }}>{formatCOP(modality.utilidad)}</div>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Al vender 100%</span>
            </div>
          )}
        </div>

        {/* Cuadrícula de Puestos */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '15px', marginBottom: '30px' }}>
          {itemsList.map((itemStr) => {
            const itemData = numbers[itemStr];
            
            let badgeBg = '#1f2937';
            let badgeText = '#9ca3af';
            let badgeLabel = 'Libre';
            let cardBorder = '#1f2937';

            if (itemData?.estado === 'reservado') {
              badgeBg = '#713f12';
              badgeText = '#facc15';
              badgeLabel = 'Reservado';
              cardBorder = '#ca8a04';
            } else if (itemData?.estado === 'pagado') {
              badgeBg = '#14532d';
              badgeText = '#4ade80';
              badgeLabel = 'Pagado';
              cardBorder = '#16a34a';
            }

            const titleLabel = modality.tipo === 'letras' ? `Línea ${itemStr}` : `N.° ${itemStr}`;

            return (
              <div 
                key={itemStr}
                style={{
                  background: '#111827',
                  border: `1px solid ${cardBorder}`,
                  borderRadius: '12px',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.3)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#9ca3af' }}>{titleLabel}</span>
                  <span style={{ background: badgeBg, color: badgeText, padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: '600' }}>
                    {badgeLabel} {itemData?.nombre ? `(${itemData.nombre})` : ''}
                  </span>
                </div>

                <div style={{ textAlign: 'center', fontSize: '1.4rem', fontWeight: 'bold', color: '#ffffff', margin: '4px 0', background: '#0b0f19', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  {itemStr}
                </div>

                {modality.tipo === 'letras' && (
                  <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#38bdf8', marginBottom: '8px', fontWeight: '600' }}>
                    Nums: [{LINEAS_25_MAP[itemStr].join(' - ')}]
                  </div>
                )}

                <button
                  onClick={() => setSelectedNum(itemStr)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#1f2937',
                    color: '#f59e0b',
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    fontWeight: '600',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  {itemData ? 'Ver / Gestionar' : '+ Apartar Puesto'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Modal de Reserva y Selección Dinámica de Métodos de Pago */}
        {selectedNum && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '15px', zIndex: 1000 }}>
            <div style={{ backgroundColor: '#111827', border: '1px solid #374151', padding: '25px', borderRadius: '16px', maxWidth: '420px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)', maxHeight: '90vh', overflowY: 'auto' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h3 style={{ margin: 0, color: '#f59e0b' }}>{modality.tipo === 'letras' ? `Línea ${selectedNum}` : `Puesto N.° ${selectedNum}`}</h3>
                <span style={{ background: '#1f2937', color: '#9ca3af', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem' }}>{modality.nombre}</span>
              </div>

              {/* Temporizador de 5 Minutos */}
              {!numbers[selectedNum] && (
                <div style={{ background: '#831843', border: '1px solid #9d174d', padding: '8px 12px', borderRadius: '8px', textAlign: 'center', marginBottom: '15px' }}>
                  <span style={{ fontSize: '0.8rem', color: '#fbcfe8', fontWeight: '600' }}>⏱️ Tiempo para realizar el pago: </span>
                  <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{formatTimer(timeLeft)}</strong>
                </div>
              )}

              {modality.tipo === 'letras' && (
                <div style={{ background: '#0b0f19', padding: '10px', borderRadius: '8px', marginBottom: '12px', textAlign: 'center', border: '1px solid #1f2937' }}>
                  <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Números de esta línea:</span>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38bdf8', marginTop: '2px' }}>
                    {LINEAS_25_MAP[selectedNum].join(', ')}
                  </div>
                </div>
              )}
              
              {numbers[selectedNum] ? (
                <div>
                  <div style={{ background: '#0b0f19', padding: '12px', borderRadius: '8px', marginBottom: '15px', border: '1px solid #1f2937' }}>
                    <p style={{ margin: '0 0 5px 0' }}><strong>Comprador:</strong> {numbers[selectedNum].nombre}</p>
                    <p style={{ margin: 0 }}><strong>Estado:</strong> <span style={{ color: numbers[selectedNum].estado === 'pagado' ? '#4ade80' : '#facc15' }}>{numbers[selectedNum].estado.toUpperCase()}</span></p>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                      <button onClick={() => updateStatus(selectedNum, 'pagado')} style={{ flex: 1, padding: '10px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Confirmar Pago</button>
                      <button onClick={() => updateStatus(selectedNum, 'libre')} style={{ flex: 1, padding: '10px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Liberar</button>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleReserve}>
                  <p style={{ fontSize: '0.9rem', color: '#cbd5e1', marginBottom: '12px' }}>
                    Valor Total a Pagar: <strong style={{ color: '#4ade80', fontSize: '1.1rem' }}>{formatCOP(modality.precio)}</strong>
                  </p>
                  
                  <div style={{ marginBottom: '15px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#9ca3af', display: 'block', marginBottom: '5px' }}>Nombre completo del Comprador:</label>
                    <input
                      type="text"
                      placeholder="Ej. Juan Pérez"
                      required
                      value={buyerName}
                      onChange={e => setBuyerName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #374151', background: '#0b0f19', color: 'white', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Selector de Métodos de Pago */}
                  <div style={{ background: '#0b0f19', padding: '15px', borderRadius: '10px', marginBottom: '15px', border: '1px solid #1f2937' }}>
                    <label style={{ fontSize: '0.85rem', color: '#f59e0b', display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                      💳 Selecciona tu Método de Pago:
                    </label>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '15px' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('breb')}
                        style={{
                          padding: '8px 4px',
                          background: selectedPaymentMethod === 'breb' ? '#f59e0b' : '#111827',
                          color: selectedPaymentMethod === 'breb' ? '#000' : '#e5e7eb',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Llave Bre-B
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('qr')}
                        style={{
                          padding: '8px 4px',
                          background: selectedPaymentMethod === 'qr' ? '#f59e0b' : '#111827',
                          color: selectedPaymentMethod === 'qr' ? '#000' : '#e5e7eb',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Código QR
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPaymentMethod('nequi')}
                        style={{
                          padding: '8px 4px',
                          background: selectedPaymentMethod === 'nequi' ? '#f59e0b' : '#111827',
                          color: selectedPaymentMethod === 'nequi' ? '#000' : '#e5e7eb',
                          border: '1px solid #374151',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          cursor: 'pointer'
                        }}
                      >
                        Nequi
                      </button>
                    </div>

                    {/* Vista para Llave Bre-B */}
                    {selectedPaymentMethod === 'breb' && (
                      <div style={{ textAlign: 'center', background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 6px 0' }}>Usa esta Llave Bre-B desde tu App bancaria:</p>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '1px', marginBottom: '8px' }}>
                          @QHM487
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('@QHM487')}
                          style={{ padding: '6px 12px', background: '#1e293b', color: '#f59e0b', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          📋 Copiar Llave
                        </button>
                      </div>
                    )}

                    {/* Vista para Código QR */}
                    {selectedPaymentMethod === 'qr' && (
                      <div style={{ textAlign: 'center', background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 8px 0' }}>Escanea con tu App para realizar el pago:</p>
                        {qrUrl ? (
                          <img src={qrUrl} alt="QR de Pago" style={{ maxWidth: '180px', width: '100%', borderRadius: '8px', border: '1px solid #374151' }} />
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>No hay imagen QR cargada aún.</span>
                        )}
                      </div>
                    )}

                    {/* Vista para Nequi */}
                    {selectedPaymentMethod === 'nequi' && (
                      <div style={{ textAlign: 'center', background: '#111827', padding: '12px', borderRadius: '8px', border: '1px solid #374151' }}>
                        <p style={{ fontSize: '0.8rem', color: '#9ca3af', margin: '0 0 6px 0' }}>Transfiere a esta cuenta Nequi:</p>
                        <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#4ade80', letterSpacing: '1px', marginBottom: '8px' }}>
                          3182521952
                        </div>
                        <button
                          type="button"
                          onClick={() => copyToClipboard('3182521952')}
                          style={{ padding: '6px 12px', background: '#1e293b', color: '#4ade80', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: '600' }}
                        >
                          📋 Copiar Número Nequi
                        </button>
                      </div>
                    )}
                  </div>

                  <button type="submit" style={{ width: '100%', padding: '12px', background: '#f59e0b', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px', fontSize: '0.95rem' }}>
                    Confirmar Reserva y Notificar Pago
                  </button>
                </form>
              )}

              <button onClick={() => setSelectedNum(null)} style={{ width: '100%', padding: '10px', background: '#1f2937', color: '#e5e7eb', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                Cerrar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}