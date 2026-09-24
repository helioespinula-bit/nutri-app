import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  ArrowDown,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Clock3,
  Droplets,
  Flame,
  Home,
  LogIn,
  LogOut,
  MessageCircle,
  Plus,
  Scale,
  Send,
  Utensils,
  Weight,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import "./styles.css";

type Tab =
  | "home"
  | "meals"
  | "weight"
  | "history"
  | "chat"
  | "login";

type Meal = {
  id: number;
  time: string;
  type: string;
  foods: string;
  carbs: number;
  protein: number;
  fat: number;
  calories: number;
};

const demoMeals: Meal[] = [
  {
    id: 1,
    time: "07:30",
    type: "Café da manhã",
    foods: "2 ovos mexidos, queijo minas e café sem açúcar",
    carbs: 2,
    protein: 19,
    fat: 17,
    calories: 235,
  },
  {
    id: 2,
    time: "12:30",
    type: "Almoço",
    foods: "Salada, frango grelhado, abobrinha e azeite",
    carbs: 7,
    protein: 42,
    fat: 24,
    calories: 410,
  },
];

const demoWeights = [
  { date: "14/09", value: 104.2 },
  { date: "18/09", value: 101.8 },
  { date: "19/09", value: 101.8 },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [session, setSession] = useState<any>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authMessage, setAuthMessage] = useState("");
  const [authError, setAuthError] = useState("");

  const [chatMessage, setChatMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<
    { from: "nutri" | "user"; text: string }[]
  >([
    {
      from: "nutri",
      text: "Oi! Eu sou a NuTri. Quando quiser, me conte o que comeu ou me pergunte sobre sua alimentação.",
    },
  ]);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(session);
        setLoadingAuth(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (mounted) {
        setSession(newSession);
        setLoadingAuth(false);

        if (newSession) {
          setActiveTab("home");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleAuth(event: React.FormEvent) {
    event.preventDefault();

    setAuthError("");
    setAuthMessage("");

    if (!email.trim() || !password) {
      setAuthError("Informe seu e-mail e sua senha.");
      return;
    }

    setLoadingAuth(true);

    try {
      if (authMode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(getAuthErrorMessage(error.message));
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) {
          setAuthError(getAuthErrorMessage(error.message));
        } else if (!data.session) {
          setAuthMessage(
            "Cadastro realizado. Verifique seu e-mail para confirmar a conta."
          );
        } else {
          setAuthMessage("Conta criada com sucesso.");
        }
      }
    } catch {
      setAuthError(
        "Não foi possível concluir a operação. Tente novamente."
      );
    } finally {
      setLoadingAuth(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setActiveTab("login");
  }

  function getAuthErrorMessage(message: string) {
    const lower = message.toLowerCase();

    if (lower.includes("invalid login credentials")) {
      return "E-mail ou senha incorretos.";
    }

    if (lower.includes("email not confirmed")) {
      return "Seu e-mail ainda não foi confirmado.";
    }

    if (lower.includes("user already registered")) {
      return "Este e-mail já está cadastrado.";
    }

    if (lower.includes("password")) {
      return "A senha não atende aos requisitos do cadastro.";
    }

    return "Não foi possível realizar a operação. Verifique os dados e tente novamente.";
  }

  function navigate(tab: Tab) {
    if (tab === "login") {
      setActiveTab("login");
      return;
    }

    setActiveTab(tab);
  }

  function sendChatMessage() {
    const text = chatMessage.trim();

    if (!text) return;

    setChatMessages((current) => [
      ...current,
      { from: "user", text },
      {
        from: "nutri",
        text: "Recebi sua mensagem. Nesta primeira etapa, o chat ainda está funcionando apenas como interface. A integração com o histórico será conectada depois.",
      },
    ]);

    setChatMessage("");
  }

  if (loadingAuth) {
    return (
      <div className="app-loading">
        <div className="loading-card">
          <div className="brand-mark">N</div>
          <h1>NuTri</h1>
          <p>Carregando seu espaço...</p>
        </div>
      </div>
    );
  }

  const showLogin = !session || activeTab === "login";

  if (showLogin) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark">N</div>
            <div>
              <h1>NuTri</h1>
              <span>Nutri Cetogênico Pessoal</span>
            </div>
          </div>

          <div className="login-intro">
            <h2>
              {authMode === "login"
                ? "Que bom ter você de volta."
                : "Vamos começar sua jornada."}
            </h2>
            <p>
              {authMode === "login"
                ? "Entre para continuar acompanhando sua evolução."
                : "Crie sua conta para acessar seu espaço pessoal."}
            </p>
          </div>

          <form onSubmit={handleAuth} className="auth-form">
            <label>
              E-mail
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Sua senha"
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
              />
            </label>

            {authError && <div className="auth-error">{authError}</div>}

            {authMessage && (
              <div className="auth-success">{authMessage}</div>
            )}

            <button
              type="submit"
              className="primary-button full-width"
              disabled={loadingAuth}
            >
              <LogIn size={18} />
              {loadingAuth
                ? "Aguarde..."
                : authMode === "login"
                  ? "Entrar"
                  : "Criar conta"}
            </button>
          </form>

          <button
            className="link-button"
            onClick={() => {
              setAuthMode(authMode === "login" ? "signup" : "login");
              setAuthError("");
              setAuthMessage("");
            }}
          >
            {authMode === "login"
              ? "Ainda não tenho uma conta"
              : "Já tenho uma conta"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="desktop-sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">N</div>
          <div>
            <strong>NuTri</strong>
            <span>Seu acompanhamento</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <NavButton
            icon={<Home size={20} />}
            label="Início"
            active={activeTab === "home"}
            onClick={() => navigate("home")}
          />
          <NavButton
            icon={<Utensils size={20} />}
            label="Refeições"
            active={activeTab === "meals"}
            onClick={() => navigate("meals")}
          />
          <NavButton
            icon={<Scale size={20} />}
            label="Peso e evolução"
            active={activeTab === "weight"}
            onClick={() => navigate("weight")}
          />
          <NavButton
            icon={<CalendarDays size={20} />}
            label="Histórico"
            active={activeTab === "history"}
            onClick={() => navigate("history")}
          />
          <NavButton
            icon={<MessageCircle size={20} />}
            label="Chat NuTri"
            active={activeTab === "chat"}
            onClick={() => navigate("chat")}
          />
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <CircleUserRound size={22} />
            <div>
              <strong>Minha conta</strong>
              <span>{session.user?.email}</span>
            </div>
          </div>

          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <span className="eyebrow">NuTri</span>
            <h1>{getPageTitle(activeTab)}</h1>
          </div>

          <div className="topbar-user">
            <CircleUserRound size={22} />
          </div>
        </header>

        {activeTab === "home" && <Dashboard navigate={navigate} />}
        {activeTab === "meals" && <MealsScreen />}
        {activeTab === "weight" && <WeightScreen />}
        {activeTab === "history" && <HistoryScreen />}
        {activeTab === "chat" && (
          <ChatScreen
            messages={chatMessages}
            value={chatMessage}
            onChange={setChatMessage}
            onSend={sendChatMessage}
          />
        )}
      </main>

      <nav className="mobile-nav">
        <MobileNavButton
          icon={<Home size={21} />}
          label="Início"
          active={activeTab === "home"}
          onClick={() => navigate("home")}
        />
        <MobileNavButton
          icon={<Utensils size={21} />}
          label="Refeições"
          active={activeTab === "meals"}
          onClick={() => navigate("meals")}
        />
        <MobileNavButton
          icon={<Scale size={21} />}
          label="Peso"
          active={activeTab === "weight"}
          onClick={() => navigate("weight")}
        />
        <MobileNavButton
          icon={<CalendarDays size={21} />}
          label="Histórico"
          active={activeTab === "history"}
          onClick={() => navigate("history")}
        />
        <MobileNavButton
          icon={<MessageCircle size={21} />}
          label="Chat"
          active={activeTab === "chat"}
          onClick={() => navigate("chat")}
        />
      </nav>
    </div>
  );
}

function Dashboard({ navigate }: { navigate: (tab: Tab) => void }) {
  const totalCarbs = demoMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalProtein = demoMeals.reduce(
    (sum, meal) => sum + meal.protein,
    0
  );
  const totalFat = demoMeals.reduce((sum, meal) => sum + meal.fat, 0);
  const totalCalories = demoMeals.reduce(
    (sum, meal) => sum + meal.calories,
    0
  );

  const carbPercentage = Math.min((totalCarbs / 30) * 100, 100);

  return (
    <div className="page-content">
      <section className="welcome-card">
        <div>
          <span className="eyebrow">Hoje</span>
          <h2>Vamos cuidar do seu dia.</h2>
          <p>
            Consistência > perfeição. O importante é seguir acompanhando.
          </p>
        </div>

        <div className="welcome-icon">
          <Activity size={28} />
        </div>
      </section>

      <section className="stats-grid">
        <StatCard
          label="Carboidratos"
          value={`${totalCarbs} g`}
          helper="meta: 30 g/dia"
          icon={<Flame size={21} />}
          highlight
        />
        <StatCard
          label="Proteínas"
          value={`${totalProtein} g`}
          helper="estimado"
          icon={<Activity size={21} />}
        />
        <StatCard
          label="Gorduras"
          value={`${totalFat} g`}
          helper="estimado"
          icon={<Droplets size={21} />}
        />
        <StatCard
          label="Energia"
          value={`${totalCalories} kcal`}
          helper="estimado"
          icon={<Flame size={21} />}
        />
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Controle de carboidratos</span>
            <h2>Seu dia até agora</h2>
          </div>

          <span className="status-badge green">🟢 Normal</span>
        </div>

        <div className="carb-card">
          <div className="carb-card-top">
            <div>
              <strong>{totalCarbs} g</strong>
              <span>de 30 g</span>
            </div>
            <span>{Math.round(carbPercentage)}%</span>
          </div>

          <div className="progress-track">
            <div
              className="progress-value"
              style={{ width: `${carbPercentage}%` }}
            />
          </div>

          <p>
            Ainda há espaço dentro da meta diária de carboidratos.
          </p>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Alimentação</span>
            <h2>Refeições de hoje</h2>
          </div>

          <button
            className="text-button"
            onClick={() => navigate("meals")}
          >
            Ver todas <ChevronRight size={17} />
          </button>
        </div>

        <div className="meal-list">
          {demoMeals.map((meal) => (
            <MealCard key={meal.id} meal={meal} />
          ))}
        </div>
      </section>

      <section className="quick-actions">
        <button
          className="quick-action primary-action"
          onClick={() => navigate("meals")}
        >
          <Plus size={21} />
          <span>Registrar refeição</span>
        </button>

        <button
          className="quick-action"
          onClick={() => navigate("weight")}
        >
          <Weight size={21} />
          <span>Registrar peso</span>
        </button>
      </section>
    </div>
  );
}

function MealsScreen() {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">Alimentação</span>
        <h2>Suas refeições</h2>
        <p>
          Acompanhe o que foi registrado e observe o conjunto do dia.
        </p>
      </section>

      <button className="primary-button add-meal-button">
        <Plus size={19} />
        Registrar refeição
      </button>

      <section className="meal-list large-list">
        {demoMeals.map((meal) => (
          <MealCard key={meal.id} meal={meal} />
        ))}
      </section>
    </div>
  );
}

function WeightScreen() {
  const start = demoWeights[0].value;
  const current = demoWeights[demoWeights.length - 1].value;
  const difference = current - start;

  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">Evolução</span>
        <h2>Peso</h2>
        <p>
          Tendência importa mais do que um número isolado.
        </p>
      </section>

      <section className="weight-highlight">
        <div>
          <span className="eyebrow">Peso mais recente</span>
          <strong>{current.toFixed(1)} kg</strong>
        </div>

        <div className="weight-change">
          <ArrowDown size={20} />
          <strong>{Math.abs(difference).toFixed(1)} kg</strong>
          <span>desde o início</span>
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Histórico</span>
            <h2>Registros de peso</h2>
          </div>
        </div>

        <div className="weight-list">
          {demoWeights.map((item) => (
            <div className="weight-row" key={item.date}>
              <div>
                <CalendarDays size={18} />
                <span>{item.date}</span>
              </div>
              <strong>{item.value.toFixed(1)} kg</strong>
            </div>
          ))}
        </div>
      </section>

      <button className="primary-button full-width">
        <Plus size={19} />
        Registrar novo peso
      </button>
    </div>
  );
}

function HistoryScreen() {
  return (
    <div className="page-content">
      <section className="page-intro">
        <span className="eyebrow">Histórico</span>
        <h2>Sua jornada</h2>
        <p>
          Um olhar sobre os registros recentes, sem perder a visão do
          conjunto.
        </p>
      </section>

      <div className="history-timeline">
        <HistoryItem
          date="19/09/2026"
          title="Refeições registradas"
          description="Café da manhã, almoço, lanche e jantar."
        />
        <HistoryItem
          date="18/09/2026"
          title="Peso registrado"
          description="101,8 kg."
        />
        <HistoryItem
          date="14/09/2026"
          title="Início do acompanhamento"
          description="Peso inicial: 104,2 kg."
        />
      </div>
    </div>
  );
}

function ChatScreen({
  messages,
  value,
  onChange,
  onSend,
}: {
  messages: { from: "nutri" | "user"; text: string }[];
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}) {
  return (
    <div className="page-content chat-page">
      <section className="chat-header-card">
        <div className="chat-avatar">N</div>
        <div>
          <strong>NuTri</strong>
          <span>Seu acompanhamento pessoal</span>
        </div>
      </section>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`chat-bubble ${
              message.from === "user" ? "user-message" : "nutri-message"
            }`}
          >
            {message.text}
          </div>
        ))}
      </div>

      <div className="chat-input-area">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              onSend();
            }
          }}
          placeholder="Digite uma mensagem..."
        />
        <button onClick={onSend} aria-label="Enviar mensagem">
          <Send size={19} />
        </button>
      </div>
    </div>
  );
}

function MealCard({ meal }: { meal: Meal }) {
  return (
    <article className="meal-card">
      <div className="meal-icon">
        <Utensils size={20} />
      </div>

      <div className="meal-main">
        <div className="meal-title-row">
          <div>
            <strong>{meal.type}</strong>
            <span>
              <Clock3 size={14} />
              {meal.time}
            </span>
          </div>

          <span className="carb-pill">{meal.carbs} g carb.</span>
        </div>

        <p>{meal.foods}</p>

        <div className="macro-row">
          <span>P {meal.protein} g</span>
          <span>G {meal.fat} g</span>
          <span>{meal.calories} kcal</span>
        </div>
      </div>
    </article>
  );
}

function StatCard({
  label,
  value,
  helper,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight ? "highlight-card" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{helper}</small>
    </div>
  );
}

function HistoryItem({
  date,
  title,
  description,
}: {
  date: string;
  title: string;
  description: string;
}) {
  return (
    <article className="history-item">
      <div className="timeline-dot" />
      <div>
        <span className="history-date">{date}</span>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
    </article>
  );
}

function NavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`sidebar-nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function MobileNavButton({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`mobile-nav-button ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function getPageTitle(tab: Tab) {
  switch (tab) {
    case "home":
      return "Olá! 👋";
    case "meals":
      return "Refeições";
    case "weight":
      return "Peso e evolução";
    case "history":
      return "Histórico";
    case "chat":
      return "Converse com a NuTri";
    default:
      return "NuTri";
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
