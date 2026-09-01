import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Download,
  Gift,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Wifi
} from 'lucide-react';
import {
  adminLogin,
  createOrder,
  downloadAdminCsv,
  generateVouchers,
  getAdminSummary,
  getOrderStatus,
  getPlans,
  startFreeTrial
} from './api.js';
import { hexMD5 } from './utils/md5.js';
import backgroundImage from '../img/restaur.jpg';
import mobileBackgroundImage from '../img/restaurante.jpg';
import slideOne from '../img/slide-1.jpg';
import slideTwo from '../img/slide-2.jpg';
import slideThree from '../img/slide-3.jpg';
import logo from '../img/logo-2.png';

const tabs = [
  { id: 'horas', label: 'Horas' },
  { id: 'dias', label: 'Diarios' },
  { id: 'semanal', label: 'Semanais' }
];

const slides = [slideOne, slideTwo, slideThree];

function App() {
  const path = window.location.pathname;

  if (path.startsWith('/aguardando')) {
    return <WaitingPage />;
  }

  if (path.startsWith('/admin')) {
    return <AdminPage />;
  }

  return <PortalPage />;
}

function PortalPage() {
  const params = new URLSearchParams(window.location.search);
  const [plans, setPlans] = useState([]);
  const [activeTab, setActiveTab] = useState('horas');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [freeTrialAccess, setFreeTrialAccess] = useState(null);
  const [freeTrialLoading, setFreeTrialLoading] = useState(false);
  const [error, setError] = useState(params.get('error') || '');
  const [loadingPlans, setLoadingPlans] = useState(true);

  const hotspot = {
    mac: cleanHotspotParam(params.get('mac')),
    ip: cleanHotspotParam(params.get('ip')),
    linkorig: cleanHotspotParam(params.get('linkorig') || params.get('dst'), 'https://www.google.com/'),
    loginUrl: cleanHotspotParam(params.get('loginUrl') || params.get('loginurl') || params.get('link-login-only')),
    chapId: cleanHotspotParam(params.get('chapId') || params.get('chapid') || params.get('chap-id')),
    chapChallenge: cleanHotspotParam(
      params.get('chapChallenge') || params.get('chapchallenge') || params.get('chap-challenge')
    )
  };

  useEffect(() => {
    getPlans()
      .then((data) => setPlans(data.plans || []))
      .catch(() => setError('Nao foi possivel carregar os planos. Verifique o banco de dados.'))
      .finally(() => setLoadingPlans(false));
  }, []);

  const visiblePlans = useMemo(() => plans.filter((plan) => plan.categoria === activeTab), [plans, activeTab]);

  async function startFreeAccess() {
    setFreeTrialLoading(true);
    setError('');

    try {
      const trial = await startFreeTrial(hotspot);
      setFreeTrialAccess(trial);
    } catch (err) {
      setError(err.message);
    } finally {
      setFreeTrialLoading(false);
    }
  }

  return (
    <Shell>
      <main className="mx-auto flex min-h-screen w-full max-w-[390px] items-center px-4 py-5">
        <section className="glass-panel w-full p-3">
          <div className="overflow-hidden rounded-[18px] bg-white">
            <ImageSlider />
          </div>

          {error ? (
            <div className="mt-3 rounded-md bg-ink/90 px-3 py-2 text-center text-sm font-semibold text-red-200">
              {error}
            </div>
          ) : null}

          <div className="my-3 flex items-center gap-2 rounded-full bg-ink/90 p-1 pl-3 text-sm font-semibold text-white">
            <span className="min-w-0 flex-1 text-center">Escolha um plano abaixo</span>
            <button
              type="button"
              onClick={startFreeAccess}
              disabled={freeTrialLoading}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-3 text-xs font-black text-ink shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
            >
              {freeTrialLoading ? <Loader2 size={13} className="animate-spin" /> : <Gift size={13} />}
              15 Minutos Gratis
            </button>
          </div>

          <div className="mb-3 grid grid-cols-3 rounded-full bg-white/10 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-2 py-2 text-sm font-semibold transition ${
                  activeTab === tab.id ? 'bg-white text-primary shadow-sm' : 'text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            {loadingPlans ? (
              <LoadingBlock label="A carregar planos" />
            ) : visiblePlans.length > 0 ? (
              visiblePlans.map((plan) => <PlanCard key={plan.id} plan={plan} onBuy={setSelectedPlan} />)
            ) : (
              <div className="rounded-md bg-white px-4 py-5 text-center text-sm font-semibold text-slate-600">
                Nenhum plano cadastrado nesta categoria.
              </div>
            )}
          </div>

          <footer className="mt-3 text-center text-[11px] font-semibold text-white/70">
            Seu IP: {hotspot.ip || 'indisponivel'} | MAC: {hotspot.mac || 'indisponivel'}
          </footer>
        </section>
      </main>

      {selectedPlan ? (
        <PaymentModal
          plan={selectedPlan}
          hotspot={hotspot}
          onClose={() => setSelectedPlan(null)}
          onError={(message) => setError(message)}
        />
      ) : null}

      {freeTrialAccess ? (
        <FreeTrialAccessModal
          trial={freeTrialAccess}
          hotspot={hotspot}
          onClose={() => setFreeTrialAccess(null)}
        />
      ) : null}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div
      className="min-h-screen bg-cover bg-center font-hotspot text-ink"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(8, 8, 14, 0.2), rgba(8, 8, 14, 0.35)), url(${backgroundImage})`
      }}
    >
      <style>{`@media (max-width: 768px) { body #root > div { background-image: linear-gradient(180deg, rgba(8, 8, 14, 0.1), rgba(8, 8, 14, 0.35)), url(${mobileBackgroundImage}) !important; } }`}</style>
      {children}
    </div>
  );
}

function ImageSlider() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((current) => (current + 1) % slides.length), 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[170px] w-full overflow-hidden">
      <div
        className="flex h-full transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, slideIndex) => (
          <img
            key={slide}
            src={slide}
            alt={`Publicidade ${slideIndex + 1}`}
            className="h-full min-w-full object-cover"
          />
        ))}
      </div>
      <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm">
        <img src={logo} alt="" className="h-5 w-5 rounded-full object-cover" />
        Eyazs Imperium
      </div>
    </div>
  );
}

function PlanCard({ plan, onBuy }) {
  return (
    <article className="plan-card">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-extrabold text-ink">{plan.nome}</h2>
        <p className="mt-1 text-base font-semibold text-slate-500">{plan.tempo}</p>
        <p className="mt-1 text-[11px] font-bold text-slate-500">Acesso ilimitado por {plan.tempo}</p>
      </div>

      <div className="flex shrink-0 flex-col items-end">
        <strong className="text-lg font-black text-primary">MZN {Number(plan.preco).toFixed(2)}</strong>
        <button type="button" onClick={() => onBuy(plan)} className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:shadow-lift">
          <CreditCard size={16} />
          Comprar
        </button>
      </div>
    </article>
  );
}

function PaymentModal({ plan, hotspot, onClose, onError }) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');
  const provider = detectProvider(phone);
  const normalizedPhone = normalizePhone(phone);
  const isEmola = provider === 'emola';
  const valid = normalizedPhone.length === 9 && provider === 'mpesa';

  async function submitPayment(event) {
    event.preventDefault();

    if (!valid) return;

    setSubmitting(true);
    setLocalError('');

    try {
      const order = await createOrder({
        pacoteId: plan.id,
        telefone: normalizePhone(phone),
        ...hotspot
      });

      window.location.href = order.waitingUrl;
    } catch (error) {
      setLocalError(error.message);
      onError('');
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <form onSubmit={submitPayment} className="w-full max-w-[360px] rounded-lg bg-white p-6 text-center shadow-soft">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Smartphone size={24} />
        </div>
        <h2 className="text-xl font-black">{plan.nome} - {Number(plan.preco).toFixed(2)} MT</h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Introduza o numero de telefone para debito direto.
        </p>

        <input
          value={phone}
          onChange={(event) => {
            setPhone(normalizePhone(event.target.value));
            setLocalError('');
          }}
          inputMode="numeric"
          autoFocus
          maxLength={9}
          placeholder="84XXXXXXX ou 86XXXXXXX"
          className="mt-5 h-12 w-full rounded-full border-2 border-slate-200 px-4 text-center text-lg font-bold outline-none transition focus:border-primary"
        />

        {isEmola ? (
          <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold leading-5 text-amber-800">
            Pagamentos com e-Mola não estão disponíveis ainda. Só M-Pesa.
          </p>
        ) : null}

        {localError ? (
          <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold leading-5 text-red-700">
            {localError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!valid || submitting}
          className={`mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full font-black transition disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white ${
            provider === 'emola' ? 'bg-emola text-ink' : 'bg-mpesa text-white'
          }`}
        >
          {submitting ? <Loader2 className="animate-spin" size={18} /> : <CreditCard size={18} />}
          {buttonLabel(provider, submitting)}
        </button>

        <button type="button" onClick={onClose} className="mt-4 text-sm font-bold text-slate-500 hover:text-ink">
          Cancelar
        </button>
      </form>
    </div>
  );
}

function FreeTrialAccessModal({ trial, hotspot, onClose }) {
  const formRef = useRef(null);
  const loginUrl =
    trial.mikrotikLoginUrl ||
    hotspot.loginUrl ||
    import.meta.env.VITE_MIKROTIK_LOGIN_URL ||
    'http://10.5.50.1/login';
  const linkorig = trial.linkorig || hotspot.linkorig || 'https://www.google.com/';
  const loginPassword =
    hotspot.chapId && hotspot.chapChallenge && trial.senha
      ? hexMD5(`${hotspot.chapId}${trial.senha}${hotspot.chapChallenge}`)
      : trial.senha || '';

  useEffect(() => {
    const timer = setTimeout(() => {
      formRef.current?.submit();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4">
      <section className="w-full max-w-[390px] rounded-lg bg-white p-6 text-center shadow-soft">
        <CheckCircle2 className="mx-auto text-green-600" size={46} />
        <h2 className="mt-4 text-2xl font-black text-green-700">Teste gratis ativo</h2>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Acesso liberado por {trial.minutes || 15} minutos. A entrar no Hotspot automaticamente.
        </p>

        <div className="mt-5 rounded-lg border-2 border-dashed border-sky-400 bg-sky-50 p-4 text-left text-sm font-bold text-sky-900">
          <p>Utilizador: <span className="font-mono text-lg text-ink">{trial.voucher}</span></p>
          <p>Senha: <span className="font-mono text-lg text-ink">{trial.senha}</span></p>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => formRef.current?.submit()}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-black text-white"
          >
            Entrar agora
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-md bg-slate-100 px-4 text-sm font-black text-slate-600"
          >
            Fechar
          </button>
        </div>

        <form ref={formRef} action={loginUrl} method="post" className="hidden">
          <input type="hidden" name="username" value={trial.voucher || ''} readOnly />
          <input type="hidden" name="password" value={loginPassword} readOnly />
          <input type="hidden" name="dst" value={linkorig} readOnly />
          <input type="hidden" name="popup" value="true" readOnly />
        </form>
      </section>
    </div>
  );
}

function WaitingPage() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('ref') || '';
  const clientIp = cleanHotspotParam(params.get('ip'));
  const clientMac = cleanHotspotParam(params.get('mac'));
  const linkorig = cleanHotspotParam(params.get('linkorig'), 'https://www.google.com/');
  const loginUrlFromHotspot = cleanHotspotParam(
    params.get('loginUrl') || params.get('loginurl') || params.get('link-login-only')
  );
  const chapId = cleanHotspotParam(params.get('chapId') || params.get('chapid') || params.get('chap-id'));
  const chapChallenge = cleanHotspotParam(
    params.get('chapChallenge') || params.get('chapchallenge') || params.get('chap-challenge')
  );
  const [state, setState] = useState({ status: 'pendente' });
  const [message, setMessage] = useState('');
  const formRef = useRef(null);
  const timerRef = useRef(null);
  const loginUrl = loginUrlFromHotspot || state.mikrotikLoginUrl || import.meta.env.VITE_MIKROTIK_LOGIN_URL || 'http://10.5.50.1/login';
  const canAutoLogin = Boolean((clientIp || clientMac) && loginUrl);
  const loginPassword =
    chapId && chapChallenge && state.senha ? hexMD5(`${chapId}${state.senha}${chapChallenge}`) : state.senha || '';

  useEffect(() => {
    if (!reference) {
      setState({ status: 'erro' });
      setMessage('Referencia de transacao em falta.');
      return undefined;
    }

    async function poll() {
      try {
        const data = await getOrderStatus(reference);
        setState(data);

        if (data.status === 'pago' && !timerRef.current) {
          timerRef.current = setTimeout(() => {
            if (data.access?.activated) {
              window.location.href = linkorig;
              return;
            }

            if (canAutoLogin) {
              formRef.current?.submit();
            }
          }, data.access?.activated ? 2500 : 6000);
        }
      } catch (error) {
        setMessage(error.message);
      }
    }

    poll();
    const interval = setInterval(poll, 3000);

    return () => {
      clearInterval(interval);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [reference, canAutoLogin]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-3 py-6 font-hotspot text-ink">
      <main className="w-full max-w-[576px]">
        <section className="min-h-[450px] w-full rounded-[14px] bg-white px-10 py-12 text-center shadow-soft">
          {state.status === 'pago' ? (
            <>
              <CheckCircle2 className="mx-auto text-green-600" size={48} />
              <h1 className="mt-4 text-2xl font-black text-green-700">Pagamento confirmado</h1>
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                {state.access?.activated
                  ? 'O acesso foi libertado no MikroTik. Guarde o voucher para reconectar depois.'
                  : canAutoLogin
                    ? 'O acesso esta a ser libertado. Guarde o voucher para reconectar depois.'
                  : 'O pagamento foi confirmado, mas esta pagina nao recebeu IP/MAC do Hotspot. Use o voucher abaixo no dispositivo ligado ao Wi-Fi.'}
              </p>
              <div className="mt-5 rounded-lg border-2 border-dashed border-sky-400 bg-sky-50 p-4 text-left text-sm font-bold text-sky-900">
                <p>Utilizador: <span className="font-mono text-lg text-ink">{state.voucher}</span></p>
                <p>Senha: <span className="font-mono text-lg text-ink">{state.senha}</span></p>
              </div>
              {state.access?.activated ? (
                <p className="mt-4 text-xs font-bold text-green-700">Acesso ativo. A redirecionar...</p>
              ) : canAutoLogin ? (
                <p className="mt-4 text-xs font-bold text-slate-500">
                  {state.access?.message || 'A redirecionar em instantes...'}
                </p>
              ) : (
                <p className="mt-4 text-xs font-bold leading-5 text-slate-500">
                  Ligue-se ao Wi-Fi do Hotspot e abra o login do MikroTik. Se este computador nao estiver nessa rede,
                  10.5.50.1 vai expirar mesmo com pagamento confirmado.
                </p>
              )}
              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => formRef.current?.submit()}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-black text-white"
                >
                  Entrar no Hotspot
                </button>
                <a
                  href={loginUrl}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-slate-700 px-4 text-sm font-black text-white"
                >
                  Abrir login do MikroTik
                </a>
              </div>
            </>
          ) : state.status === 'cancelado' ? (
            <>
              <h1 className="text-2xl font-black text-red-700">Pagamento cancelado</h1>
              <p className="mt-3 text-sm font-semibold text-slate-600">{state.message}</p>
              <a href="/" className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-white">
                Escolher outro plano
              </a>
            </>
          ) : (
            <>
              <h1 className="mt-3 text-[29px] font-black leading-tight text-slate-800">Aguardando Pagamento</h1>
              <p className="mx-auto mt-7 max-w-[500px] text-lg font-medium leading-7 text-slate-700">
                Enviámos uma notificação para o seu telemóvel. Por favor,{' '}
                <strong className="font-black">introduza o seu PIN</strong> na janela (Push USSD) que apareceu no ecrã
                para autorizar o débito.
              </p>
              <div className="pin-loader mx-auto mt-9" aria-label="Aguardando confirmação do pagamento" />
              <div className="mt-16 border-t border-slate-200 pt-6">
                <p className="mx-auto max-w-[470px] text-sm font-medium leading-5 text-slate-400">
                  Não feche nem atualize esta página. A libertação da internet é 100% automática após colocar o PIN.
                </p>
                {message ? <p className="mt-3 text-xs font-bold text-red-500">{message}</p> : null}
              </div>
            </>
          )}

          <form ref={formRef} action={loginUrl} method="post" className="hidden">
            <input type="hidden" name="username" value={state.voucher || ''} readOnly />
            <input type="hidden" name="password" value={loginPassword} readOnly />
            <input type="hidden" name="dst" value={linkorig} readOnly />
            <input type="hidden" name="popup" value="true" readOnly />
          </form>
        </section>
      </main>
    </div>
  );
}

function AdminPage() {
  const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
  const [password, setPassword] = useState('');
  const [summary, setSummary] = useState(null);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationResult, setGenerationResult] = useState(null);
  const [voucherForm, setVoucherForm] = useState({
    pacoteId: '',
    quantity: 10,
    prefix: 'VCH'
  });
  const today = new Date().toISOString().slice(0, 10);
  const [inicio, setInicio] = useState(today);
  const [fim, setFim] = useState(today);

  useEffect(() => {
    if (!token) return;
    refreshSummary(token);
    getPlans()
      .then((data) => {
        const loadedPlans = data.plans || [];
        setPlans(loadedPlans);
        setVoucherForm((current) => ({
          ...current,
          pacoteId: current.pacoteId || String(loadedPlans[0]?.id || '')
        }));
      })
      .catch((err) => setError(err.message));
  }, [token]);

  async function login(event) {
    event.preventDefault();
    setError('');

    try {
      const data = await adminLogin(password);
      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function refreshSummary(authToken = token) {
    setLoading(true);
    setError('');

    try {
      setSummary(await getAdminSummary(authToken));
    } catch (err) {
      setError(err.message);
      localStorage.removeItem('adminToken');
      setToken('');
    } finally {
      setLoading(false);
    }
  }

  async function exportCsv() {
    try {
      const blob = await downloadAdminCsv(token, inicio, fim);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `relatorio_vendas_${inicio}_a_${fim}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  }

  async function submitVoucherGeneration(event) {
    event.preventDefault();
    setGenerating(true);
    setError('');
    setGenerationResult(null);

    try {
      const result = await generateVouchers(token, {
        pacoteId: Number(voucherForm.pacoteId),
        quantity: Number(voucherForm.quantity),
        prefix: voucherForm.prefix
      });

      setGenerationResult(result);
      await refreshSummary();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function logout() {
    localStorage.removeItem('adminToken');
    setToken('');
    setSummary(null);
  }

  if (!token) {
    return (
      <Shell>
        <main className="flex min-h-screen items-center justify-center px-4">
          <form onSubmit={login} className="w-full max-w-[340px] rounded-lg bg-white p-7 text-center shadow-soft">
            <LockKeyhole className="mx-auto text-primary" size={38} />
            <h1 className="mt-4 text-2xl font-black">Painel Wi-Fi</h1>
            <p className="mt-2 text-sm font-semibold text-slate-500">Introduza a senha administrativa.</p>
            {error ? <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm font-bold text-red-700">{error}</p> : null}
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-5 h-12 w-full rounded-md border border-slate-200 px-4 text-center font-bold outline-none focus:border-primary"
              placeholder="Senha"
              required
            />
            <button type="submit" className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-mpesa font-black text-white">
              Entrar
            </button>
          </form>
        </main>
      </Shell>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 font-hotspot text-ink">
      <main className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-5 py-4 shadow-sm">
          <div>
            <h1 className="text-2xl font-black">Painel de Faturacao</h1>
            <p className="text-sm font-semibold text-slate-500">Vendas, stock e historico dos vouchers.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refreshSummary()} className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 font-bold text-white">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Atualizar
            </button>
            <button onClick={logout} className="inline-flex items-center gap-2 rounded-md bg-slate-700 px-4 py-2 font-bold text-white">
              <LogOut size={16} />
              Sair
            </button>
          </div>
        </header>

        {error ? <p className="mt-4 rounded-md bg-red-50 px-4 py-3 font-bold text-red-700">{error}</p> : null}

        <section className="mt-5 grid gap-4 md:grid-cols-6">
          <Metric label="Faturacao total" value={`${money(summary?.metrics?.faturamento || 0)} MT`} icon={<CreditCard size={20} />} />
          <Metric label="Vouchers vendidos" value={summary?.metrics?.vendas || 0} icon={<ShieldCheck size={20} />} />
          <Metric label="Conversao" value={`${summary?.metrics?.conversao || 0}%`} icon={<CheckCircle2 size={20} />} />
          <Metric label="Disponiveis" value={summary?.metrics?.disponiveis || 0} icon={<Wifi size={20} />} />
          <Metric label="Pendentes" value={summary?.metrics?.pendentes || 0} icon={<Loader2 size={20} />} />
          <Metric label="Testes gratis" value={summary?.metrics?.testesGratisAtivos || 0} icon={<Gift size={20} />} />
        </section>

        <section className="mt-5 rounded-lg bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black">Gerar vouchers no MikroTik</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                Cria usuários no MikroTik e só depois grava os vouchers como disponíveis no MySQL.
              </p>
            </div>
          </div>

          <form onSubmit={submitVoucherGeneration} className="mt-4 grid gap-3 md:grid-cols-[1.5fr_0.7fr_0.7fr_auto]">
            <label className="block">
              <span className="text-xs font-black uppercase text-slate-500">Pacote</span>
              <select
                value={voucherForm.pacoteId}
                onChange={(event) => setVoucherForm((current) => ({ ...current, pacoteId: event.target.value }))}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-primary"
                required
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nome} - {plan.tempo} - {money(plan.preco)} MT
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-500">Quantidade</span>
              <input
                type="number"
                min="1"
                max="100"
                value={voucherForm.quantity}
                onChange={(event) => setVoucherForm((current) => ({ ...current, quantity: event.target.value }))}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-primary"
                required
              />
            </label>

            <label className="block">
              <span className="text-xs font-black uppercase text-slate-500">Prefixo</span>
              <input
                value={voucherForm.prefix}
                onChange={(event) => setVoucherForm((current) => ({ ...current, prefix: event.target.value.toUpperCase() }))}
                className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 font-bold outline-none focus:border-primary"
                maxLength={8}
                required
              />
            </label>

            <button
              type="submit"
              disabled={generating || plans.length === 0}
              className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
              Gerar
            </button>
          </form>

          {generationResult ? (
            <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap gap-3 text-sm font-black">
                <span>Solicitados: {generationResult.requested}</span>
                <span className="text-green-700">Criados: {generationResult.created}</span>
                <span className={generationResult.failed > 0 ? 'text-red-700' : 'text-slate-500'}>
                  Falhas: {generationResult.failed}
                </span>
              </div>

              {generationResult.vouchers?.length > 0 ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-xs uppercase text-slate-500">
                      <tr>
                        <th className="py-2 pr-4">Voucher</th>
                        <th className="py-2 pr-4">Senha</th>
                        <th className="py-2 pr-4">Perfil MikroTik</th>
                      </tr>
                    </thead>
                    <tbody>
                      {generationResult.vouchers.map((voucher) => (
                        <tr key={voucher.username} className="border-t border-slate-200">
                          <td className="py-2 pr-4 font-mono font-black">{voucher.username}</td>
                          <td className="py-2 pr-4 font-mono font-black">{voucher.password}</td>
                          <td className="py-2 pr-4 font-semibold">{voucher.profile}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}

              {generationResult.failures?.length > 0 ? (
                <div className="mt-4 rounded-md bg-red-50 p-3 text-sm font-bold text-red-700">
                  {generationResult.failures.slice(0, 3).map((failure) => (
                    <p key={`${failure.username}-${failure.message}`}>
                      {failure.username}: {failure.message}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <section className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={inicio} onChange={(event) => setInicio(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 font-bold" />
            <span className="text-sm font-bold text-slate-500">ate</span>
            <input type="date" value={fim} onChange={(event) => setFim(event.target.value)} className="rounded-md border border-slate-200 px-3 py-2 font-bold" />
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-md bg-green-700 px-4 py-2 font-bold text-white">
            <Download size={16} />
            Exportar CSV
          </button>
        </section>

        <section className="mt-5 overflow-hidden rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3">Referencia</th>
                  <th className="px-4 py-3">Telefone</th>
                  <th className="px-4 py-3">Pacote</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Voucher</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {(summary?.history || []).map((item) => (
                  <tr key={`${item.transacao_id || item.codigo_voucher}-${item.data_criacao}`} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold">{formatDate(item.data_criacao)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-500">{item.transacao_id || '-'}</td>
                    <td className="px-4 py-3">{item.telefone_cliente || '-'}</td>
                    <td className="px-4 py-3">{item.pacote_nome}</td>
                    <td className="px-4 py-3 font-black">{money(item.preco)} MT</td>
                    <td className="px-4 py-3 font-mono font-black">{item.codigo_voucher}</td>
                    <td className="px-4 py-3">
                      <span className={`status-badge ${item.status}`}>{item.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

function Metric({ label, value, icon }) {
  return (
    <article className="rounded-lg border-t-4 border-primary bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between text-primary">
        <span className="text-xs font-black uppercase text-slate-500">{label}</span>
        {icon}
      </div>
      <strong className="text-2xl font-black">{value}</strong>
    </article>
  );
}

function LoadingBlock({ label }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-md bg-white px-4 py-5 text-sm font-bold text-slate-500">
      <Loader2 size={18} className="animate-spin" />
      {label}
    </div>
  );
}

function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 9);
}

function cleanHotspotParam(value, fallback = '') {
  const text = String(value || '').trim();

  if (!text || text.includes('$(')) {
    return fallback;
  }

  return text;
}

function detectProvider(phone) {
  const normalized = normalizePhone(phone);

  if (/^(84|85)\d{7}$/.test(normalized)) return 'mpesa';
  if (/^(86|87)\d{7}$/.test(normalized)) return 'emola';
  return null;
}

function buttonLabel(provider, submitting) {
  if (submitting) return 'A processar';
  if (provider === 'mpesa') return 'Pagar com M-Pesa';
  if (provider === 'emola') return 'So M-Pesa disponivel';
  return 'Introduza numero valido';
}

function money(value) {
  return Number(value || 0).toFixed(2);
}

function formatDate(value) {
  if (!value) return '-';
  return new Date(value).toLocaleString('pt-MZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default App;
