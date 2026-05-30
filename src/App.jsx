import { useState, useEffect, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Home, Utensils, Activity, Camera, Plus, Trash2, ChevronRight, Droplets, Sun, Moon, Zap, TrendingDown, Heart, Leaf, BarChart2, CheckCircle2, Circle, Star, Smile, Meh, Frown, ChevronUp, ChevronDown, X } from "lucide-react";

// ── ダミーデータ ──────────────────────────────────────────────────────
const MEAL_PRESETS = [
  { name: "鶏ささみのフォー", cal: 320, p: 28, f: 4, c: 42, time: "昼食", emoji: "🍜" },
  { name: "ブロッコリーの辛子明太子和え", cal: 85, p: 6, f: 3, c: 8, time: "昼食", emoji: "🥦" },
  { name: "ヨーグルト（無糖）", cal: 62, p: 5, f: 3, c: 5, time: "朝食", emoji: "🥛" },
  { name: "バナナ", cal: 86, p: 1, f: 0, c: 22, time: "朝食", emoji: "🍌" },
  { name: "サラダチキン", cal: 114, p: 24, f: 1, c: 0, time: "昼食", emoji: "🐔" },
  { name: "ミネストローネ", cal: 130, p: 5, f: 4, c: 18, time: "朝食", emoji: "🍲" },
  { name: "ベーグル（1個）", cal: 245, p: 9, f: 1, c: 49, time: "朝食", emoji: "🥯" },
  { name: "フルーツ盛り合わせ", cal: 90, p: 1, f: 0, c: 22, time: "間食", emoji: "🍓" },
  { name: "グリルサーモン", cal: 208, p: 29, f: 9, c: 0, time: "夕食", emoji: "🐟" },
  { name: "玄米ご飯（小）", cal: 156, p: 3, f: 1, c: 33, time: "夕食", emoji: "🍚" },
];

const INITIAL_BODY_DATA = [
  { date: "5/12", weight: 57.8, fat: 27.2, muscle: 40.1, water: 52.0, bmr: 1180 },
  { date: "5/13", weight: 57.6, fat: 27.0, muscle: 40.2, water: 52.1, bmr: 1182 },
  { date: "5/14", weight: 57.9, fat: 27.3, muscle: 40.1, water: 51.8, bmr: 1179 },
  { date: "5/15", weight: 57.5, fat: 26.9, muscle: 40.3, water: 52.3, bmr: 1184 },
  { date: "5/16", weight: 57.3, fat: 26.7, muscle: 40.4, water: 52.5, bmr: 1186 },
  { date: "5/17", weight: 57.2, fat: 26.5, muscle: 40.5, water: 52.6, bmr: 1188 },
  { date: "5/18", weight: 57.0, fat: 26.3, muscle: 40.6, water: 52.8, bmr: 1190 },
];

const STOOL_TYPES = [
  { id: 1, label: "コロコロ", emoji: "⚫", desc: "硬い小塊", score: 1 },
  { id: 2, label: "硬め", emoji: "🟤", desc: "ソーセージ状・硬い", score: 2 },
  { id: 3, label: "ひび割れ", emoji: "🟫", desc: "ひび割れあり", score: 3 },
  { id: 4, label: "バナナ状", emoji: "🍌", desc: "なめらか（理想！）", score: 4 },
  { id: 5, label: "柔らかめ", emoji: "🟡", desc: "軟らかい塊", score: 5 },
  { id: 6, label: "泥状", emoji: "🟠", desc: "ふわふわした塊", score: 6 },
  { id: 7, label: "水様", emoji: "💧", desc: "液状", score: 7 },
];

const COACHES = [
  { trigger: (d) => d.calToday < 1200, msg: "今日のカロリーが少なめです。筋肉を守るために、良質なたんぱく質を意識して摂りましょう💪", type: "warning" },
  { trigger: (d) => d.calToday > 1700, msg: "今日のカロリーが目標を超えそうです。夜は軽めの食事にすると◎🌿", type: "warning" },
  { trigger: (d) => d.pToday < 50, msg: "たんぱく質が少なめ。サラダチキンや豆腐を追加してみて！筋肉量UPの近道です✨", type: "tip" },
  { trigger: (d) => d.stoolOk, msg: "今日の排便は良好！腸が元気に動いている証拠です🌸 この調子で腸活を続けましょう", type: "good" },
  { trigger: (d) => d.weightDown, getMsg: (d) => `体重が昨日より ${d.weightDiff}kg減！着実に目標に近づいています🎉 継続が力なりです`, type: "good" },
  { trigger: () => true, msg: "水分補給は十分ですか？ 1日1.5〜2Lの水を飲むと代謝UP＆腸活にも効果的です💧", type: "tip" },
];

const GOAL_WEIGHT = 51;
const GOAL_CAL = 1600;
const PFC_COLORS = ["#6BAE91", "#A8C4B8", "#D4A5A5"];
const TABS = [
  { id: "dashboard", label: "ホーム", icon: Home },
  { id: "meal", label: "食事", icon: Utensils },
  { id: "stool", label: "腸活", icon: Leaf },
  { id: "body", label: "体組成", icon: Activity },
];

// ── ユーティリティ ────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10);
const fmtDate = (d) => new Date(d).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });

function useLocalStorage(key, init) {
  const [val, setVal] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : init; }
    catch { return init; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal];
}

// ── メインアプリ ──────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [meals, setMeals] = useLocalStorage("hd_meals", []);
  const [stoolLogs, setStoolLogs] = useLocalStorage("hd_stool", []);
  const [bodyData, setBodyData] = useLocalStorage("hd_body", INITIAL_BODY_DATA);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showStoolModal, setShowStoolModal] = useState(false);
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [analyzeState, setAnalyzeState] = useState("idle"); // idle | analyzing | done

  const todayMeals = meals.filter(m => m.date === today());
  const calToday = todayMeals.reduce((s, m) => s + m.cal, 0);
  const pToday = todayMeals.reduce((s, m) => s + m.p, 0);
  const fToday = todayMeals.reduce((s, m) => s + m.f, 0);
  const cToday = todayMeals.reduce((s, m) => s + m.c, 0);

  const todayStool = stoolLogs.filter(s => s.date === today());
  const latestBody = bodyData[bodyData.length - 1] || {};
  const prevBody = bodyData[bodyData.length - 2] || {};
  const weightDiff = prevBody.weight ? Math.abs((latestBody.weight - prevBody.weight).toFixed(1)) : 0;
  const weightDown = prevBody.weight && latestBody.weight < prevBody.weight;

  const coachData = { calToday, pToday, stoolOk: todayStool.some(s => s.type === 4), weightDown, weightDiff };
  const _coach = COACHES.find(c => c.trigger(coachData)) || COACHES[COACHES.length - 1];
  const coachMsg = { ..._coach, msg: _coach.getMsg ? _coach.getMsg(coachData) : _coach.msg };

  const addMeal = (meal) => {
    setMeals(prev => [...prev, { ...meal, id: Date.now(), date: today(), time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }) }]);
  };
  const removeMeal = (id) => setMeals(prev => prev.filter(m => m.id !== id));
  const addStool = (log) => setStoolLogs(prev => [...prev, { ...log, id: Date.now(), date: today() }]);
  const addBody = (entry) => {
    const d = new Date();
    const dateLabel = `${d.getMonth()+1}/${d.getDate()}`;
    setBodyData(prev => {
      const filtered = prev.filter(b => b.date !== dateLabel);
      return [...filtered, { ...entry, date: dateLabel }].slice(-30);
    });
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans" style={{ fontFamily: "'Noto Sans JP', 'Hiragino Sans', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Serif+Display:ital@0;1&display=swap');
        .serif { font-family: 'DM Serif Display', serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulse-soft { 0%,100%{opacity:1} 50%{opacity:.6} }
        @keyframes spin-slow { to { transform:rotate(360deg); } }
        .fade-up { animation: fadeUp .4s ease both; }
        .pulse-soft { animation: pulse-soft 1.5s ease infinite; }
        .spin-slow { animation: spin-slow 1.2s linear infinite; }
        .glass { backdrop-filter: blur(12px); background: rgba(255,255,255,0.72); }
      `}</style>

      {/* ヘッダー */}
      <header className="glass sticky top-0 z-30 border-b border-stone-100 px-5 py-3 flex items-center justify-between">
        <div>
          <span className="serif text-lg text-stone-700 italic">Karada</span>
          <span className="serif text-lg text-emerald-600 italic ml-1">Note</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs text-stone-400">{new Date().toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" })}</div>
          <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
            <span className="text-sm">🌿</span>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="pb-24 max-w-lg mx-auto">
        {tab === "dashboard" && <Dashboard calToday={calToday} pToday={pToday} fToday={fToday} cToday={cToday} latestBody={latestBody} coachMsg={coachMsg} todayStool={todayStool} setTab={setTab} setShowMealModal={setShowMealModal} setShowStoolModal={setShowStoolModal} />}
        {tab === "meal" && <MealTab meals={meals} todayMeals={todayMeals} calToday={calToday} pToday={pToday} fToday={fToday} cToday={cToday} setShowMealModal={setShowMealModal} removeMeal={removeMeal} analyzeState={analyzeState} setAnalyzeState={setAnalyzeState} addMeal={addMeal} />}
        {tab === "stool" && <StoolTab stoolLogs={stoolLogs} todayStool={todayStool} setShowStoolModal={setShowStoolModal} />}
        {tab === "body" && <BodyTab bodyData={bodyData} latestBody={latestBody} setShowBodyModal={setShowBodyModal} coachMsg={coachMsg} coachData={coachData} />}
      </main>

      {/* ボトムナビ */}
      <nav className="glass fixed bottom-0 left-0 right-0 z-30 border-t border-stone-100">
        <div className="max-w-lg mx-auto flex">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all ${active ? "text-emerald-600" : "text-stone-400"}`}>
                <Icon size={20} strokeWidth={active ? 2.2 : 1.6} />
                <span className="text-[10px] font-medium">{t.label}</span>
                {active && <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* モーダル */}
      {showMealModal && <MealModal onAdd={addMeal} onClose={() => setShowMealModal(false)} />}
      {showStoolModal && <StoolModal onAdd={addStool} onClose={() => setShowStoolModal(false)} />}
      {showBodyModal && <BodyModal onAdd={addBody} latest={latestBody} onClose={() => setShowBodyModal(false)} />}
    </div>
  );
}

// ── ダッシュボード ─────────────────────────────────────────────────────
function Dashboard({ calToday, pToday, fToday, cToday, latestBody, coachMsg, todayStool, setTab, setShowMealModal, setShowStoolModal }) {
  const calPct = Math.min((calToday / GOAL_CAL) * 100, 100);
  const weightProgress = latestBody.weight
    ? Math.min(((57.8 - latestBody.weight) / (57.8 - GOAL_WEIGHT)) * 100, 100)
    : 0;

  const pieData = [
    { name: "P", value: pToday * 4 || 1 },
    { name: "F", value: fToday * 9 || 1 },
    { name: "C", value: cToday * 4 || 1 },
  ];

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* コーチメッセージ */}
      <div className={`fade-up rounded-2xl p-4 flex gap-3 items-start ${coachMsg.type === "good" ? "bg-emerald-50 border border-emerald-100" : coachMsg.type === "warning" ? "bg-amber-50 border border-amber-100" : "bg-sky-50 border border-sky-100"}`}>
        <span className="text-2xl mt-0.5">
          {coachMsg.type === "good" ? "🌸" : coachMsg.type === "warning" ? "⚠️" : "💡"}
        </span>
        <div>
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">AI コーチより</div>
          <p className="text-sm text-stone-700 leading-relaxed">{coachMsg.msg}</p>
        </div>
      </div>

      {/* カロリー進捗 */}
      <div className="fade-up bg-white rounded-2xl p-5 shadow-sm border border-stone-100" style={{ animationDelay: "0.05s" }}>
        <div className="flex justify-between items-baseline mb-3">
          <div>
            <span className="serif text-3xl text-stone-800">{calToday}</span>
            <span className="text-stone-400 text-sm ml-1">kcal</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-400">目標</span>
            <span className="text-sm font-semibold text-stone-600 ml-1">{GOAL_CAL} kcal</span>
          </div>
        </div>
        <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: `${calPct}%`, background: calPct > 95 ? "linear-gradient(90deg,#f59e0b,#ef4444)" : "linear-gradient(90deg,#6BAE91,#A8D5C2)" }} />
        </div>
        <div className="flex justify-between mt-2 text-xs text-stone-400">
          <span>あと {Math.max(0, GOAL_CAL - calToday)} kcal</span>
          <span>{Math.round(calPct)}%</span>
        </div>

        {/* PFCバー */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {[["P", pToday, 60, "#6BAE91"], ["F", fToday, 55, "#A8C4B8"], ["C", cToday, 200, "#D4A5A5"]].map(([name, val, tgt, color]) => (
            <div key={name} className="text-center">
              <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mb-1">
                <div className="h-full rounded-full" style={{ width: `${Math.min((val/tgt)*100, 100)}%`, background: color }} />
              </div>
              <div className="text-xs font-bold" style={{ color }}>{name}</div>
              <div className="text-xs text-stone-500">{val}g</div>
            </div>
          ))}
        </div>
      </div>

      {/* 2カラム: 体重進捗 + 今日の腸活 */}
      <div className="grid grid-cols-2 gap-3 fade-up" style={{ animationDelay: "0.1s" }}>
        {/* 体重進捗 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider mb-2">体重</div>
          <div className="flex items-baseline gap-1">
            <span className="serif text-2xl text-stone-800">{latestBody.weight || "—"}</span>
            <span className="text-xs text-stone-400">kg</span>
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-[10px] text-stone-400 mb-1">
              <span>現在</span><span>目標 {GOAL_WEIGHT}kg</span>
            </div>
            <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${weightProgress}%` }} />
            </div>
            <div className="text-[10px] text-emerald-600 mt-1 font-medium">あと {latestBody.weight ? (latestBody.weight - GOAL_WEIGHT).toFixed(1) : "—"} kg</div>
          </div>
        </div>

        {/* 腸活 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="text-[11px] text-stone-400 font-medium uppercase tracking-wider mb-2">今日の腸活</div>
          {todayStool.length > 0 ? (
            <div className="space-y-1">
              {todayStool.slice(-2).map(s => {
                const type = STOOL_TYPES.find(t => t.id === s.type);
                return (
                  <div key={s.id} className="flex items-center gap-1.5">
                    <span className="text-lg">{type?.emoji}</span>
                    <div>
                      <div className="text-xs font-medium text-stone-700">{type?.label}</div>
                      <div className="text-[10px] text-stone-400">すっきり度 {s.refresh}/5</div>
                    </div>
                  </div>
                );
              })}
              <div className="text-[10px] text-emerald-600 font-medium mt-1">{todayStool.length}回記録済み ✓</div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-16">
              <span className="text-2xl mb-1">🌿</span>
              <button onClick={() => setShowStoolModal(true)} className="text-[11px] text-emerald-600 font-medium">記録する →</button>
            </div>
          )}
        </div>
      </div>

      {/* 体組成サマリー */}
      {latestBody.fat && (
        <div className="fade-up bg-white rounded-2xl p-4 shadow-sm border border-stone-100 grid grid-cols-3 gap-3 text-center" style={{ animationDelay: "0.15s" }}>
          {[["体脂肪率", `${latestBody.fat}%`, "🔥"], ["筋肉量", `${latestBody.muscle}%`, "💪"], ["基礎代謝", `${latestBody.bmr}`, "⚡"]].map(([lb, val, icon]) => (
            <div key={lb}>
              <div className="text-lg mb-0.5">{icon}</div>
              <div className="serif text-lg text-stone-800">{val}</div>
              <div className="text-[10px] text-stone-400">{lb}</div>
            </div>
          ))}
        </div>
      )}

      {/* クイックアクション */}
      <div className="fade-up grid grid-cols-2 gap-3 pb-2" style={{ animationDelay: "0.2s" }}>
        <button onClick={() => setShowMealModal(true)}
          className="bg-emerald-600 text-white rounded-2xl py-3.5 flex items-center justify-center gap-2 font-medium text-sm shadow-lg shadow-emerald-100 active:scale-95 transition-transform">
          <Plus size={16} /><span>食事を記録</span>
        </button>
        <button onClick={() => setShowStoolModal(true)}
          className="bg-white text-stone-700 rounded-2xl py-3.5 flex items-center justify-center gap-2 font-medium text-sm shadow-sm border border-stone-100 active:scale-95 transition-transform">
          <Leaf size={16} className="text-emerald-500" /><span>腸活を記録</span>
        </button>
      </div>
    </div>
  );
}

// ── 食事タブ ──────────────────────────────────────────────────────────
function MealTab({ meals, todayMeals, calToday, pToday, fToday, cToday, setShowMealModal, removeMeal, analyzeState, setAnalyzeState, addMeal }) {
  const fileRef = useRef(null);

  const simulateAnalyze = () => {
    setAnalyzeState("analyzing");
    const preset = MEAL_PRESETS[Math.floor(Math.random() * MEAL_PRESETS.length)];
    setTimeout(() => {
      addMeal(preset);
      setAnalyzeState("done");
      setTimeout(() => setAnalyzeState("idle"), 2000);
    }, 2200);
  };

  const groupedByTime = ["朝食", "昼食", "夕食", "間食"].map(time => ({
    time,
    items: todayMeals.filter(m => m.meal_time === time || m.time_label === time || (m.time && !["朝食","昼食","夕食","間食"].includes(m.time))),
  })).filter(g => g.items.length > 0);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* 今日のサマリー */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-stone-700">今日の摂取</span>
          <span className="serif text-xl text-emerald-700">{calToday} <span className="text-sm text-stone-400 font-sans">kcal</span></span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[["たんぱく質", pToday, "g", "#6BAE91"], ["脂質", fToday, "g", "#A8C4B8"], ["炭水化物", cToday, "g", "#D4A5A5"]].map(([lb, v, u, c]) => (
            <div key={lb} className="rounded-xl py-2 px-1" style={{ background: c + "22" }}>
              <div className="text-sm font-bold" style={{ color: c }}>{v}{u}</div>
              <div className="text-[10px] text-stone-500 mt-0.5">{lb}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 画像解析 */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 border border-emerald-100">
        <div className="flex items-center gap-2 mb-3">
          <Camera size={16} className="text-emerald-600" />
          <span className="text-sm font-semibold text-stone-700">写真から自動解析</span>
          <span className="text-[10px] bg-emerald-200 text-emerald-700 px-1.5 py-0.5 rounded-full">AI</span>
        </div>
        {analyzeState === "idle" && (
          <button onClick={simulateAnalyze}
            className="w-full border-2 border-dashed border-emerald-200 rounded-xl py-6 flex flex-col items-center gap-2 text-emerald-600 hover:bg-emerald-50 transition-colors active:scale-95">
            <Camera size={24} strokeWidth={1.5} />
            <span className="text-sm font-medium">写真を選ぶ / タップで解析</span>
            <span className="text-xs text-stone-400">PFC・カロリーを自動算出します</span>
          </button>
        )}
        {analyzeState === "analyzing" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-10 h-10 border-3 border-emerald-300 border-t-emerald-600 rounded-full spin-slow" style={{ borderWidth: 3 }} />
            <div className="pulse-soft text-sm text-emerald-700 font-medium">AI解析中…</div>
            <div className="text-xs text-stone-400">メニュー・カロリー・PFCを算出しています</div>
          </div>
        )}
        {analyzeState === "done" && (
          <div className="flex items-center gap-2 py-3 justify-center">
            <CheckCircle2 size={20} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">解析完了！食事リストに追加しました</span>
          </div>
        )}
      </div>

      {/* 食事リスト */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-stone-700">今日の食事</span>
          <button onClick={() => setShowMealModal(true)}
            className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
            <Plus size={14} /> 追加
          </button>
        </div>
        {todayMeals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-stone-100">
            <span className="text-3xl">🍽️</span>
            <p className="text-sm text-stone-400 mt-2">まだ記録がありません</p>
            <button onClick={() => setShowMealModal(true)} className="mt-3 text-emerald-600 text-sm font-medium">食事を追加する →</button>
          </div>
        ) : (
          todayMeals.map(m => (
            <div key={m.id} className="bg-white rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm border border-stone-100 fade-up">
              <span className="text-2xl">{m.emoji || "🍽️"}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-stone-800 truncate">{m.name}</div>
                <div className="text-xs text-stone-400 mt-0.5">
                  <span className="text-emerald-600 font-semibold">{m.cal}kcal</span>
                  <span className="mx-1">·</span>P:{m.p}g F:{m.f}g C:{m.c}g
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-stone-400">{m.time}</span>
                <button onClick={() => removeMeal(m.id)} className="text-stone-300 hover:text-red-400 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── 腸活タブ ──────────────────────────────────────────────────────────
function StoolTab({ stoolLogs, todayStool, setShowStoolModal }) {
  const weekLogs = stoolLogs.slice(-14);
  const avgRefresh = todayStool.length > 0 ? Math.round(todayStool.reduce((s, l) => s + l.refresh, 0) / todayStool.length) : 0;
  const goodDays = [...new Set(stoolLogs.filter(l => l.type === 4 || l.type === 3).map(l => l.date))].length;

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* 今日のサマリー */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[11px] text-stone-400 uppercase tracking-wider">今日の腸活</div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="serif text-3xl text-stone-800">{todayStool.length}</span>
              <span className="text-stone-400 text-sm">回</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-stone-400 mb-1">すっきり度</div>
            <div className="flex gap-0.5">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={14} fill={i <= avgRefresh ? "#6BAE91" : "none"} className={i <= avgRefresh ? "text-emerald-500" : "text-stone-200"} />
              ))}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-stone-400 mb-1">バナナ状の日</div>
            <div className="serif text-2xl text-emerald-600">{goodDays}</div>
          </div>
        </div>

        {todayStool.length > 0 ? (
          <div className="space-y-2">
            {todayStool.map(s => {
              const type = STOOL_TYPES.find(t => t.id === s.type);
              return (
                <div key={s.id} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2">
                  <span className="text-xl">{type?.emoji}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-700">{type?.label}</div>
                    <div className="text-xs text-stone-400">{type?.desc}</div>
                  </div>
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} size={12} fill={i <= s.refresh ? "#6BAE91" : "none"} className={i <= s.refresh ? "text-emerald-500" : "text-stone-200"} />)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-4">
            <span className="text-3xl">🌱</span>
            <p className="text-sm text-stone-400 mt-2">今日はまだ記録がありません</p>
          </div>
        )}

        <button onClick={() => setShowStoolModal(true)}
          className="mt-4 w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-emerald-100">
          <Plus size={16} /> 排便を記録する
        </button>
      </div>

      {/* 腸活アドバイス */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl p-4 border border-teal-100">
        <div className="text-xs font-semibold text-teal-700 mb-2 flex items-center gap-1.5"><Leaf size={12} />腸活ポイント</div>
        <div className="space-y-2 text-sm text-stone-700">
          {[
            ["💧", "水を1.5L以上飲む"],
            ["🥗", "食物繊維を毎食摂る"],
            ["🚶", "食後10分のウォーキング"],
            ["😴", "23時前に就寝する"],
          ].map(([icon, tip]) => (
            <div key={tip} className="flex items-center gap-2">
              <span>{icon}</span><span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 過去の記録 */}
      {stoolLogs.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
          <div className="text-sm font-semibold text-stone-700 mb-3">最近の記録</div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-hide">
            {[...stoolLogs].reverse().slice(0, 10).map(s => {
              const type = STOOL_TYPES.find(t => t.id === s.type);
              return (
                <div key={s.id} className="flex items-center gap-2 text-xs">
                  <span className="text-stone-400 w-12 shrink-0">{fmtDate(s.date)}</span>
                  <span>{type?.emoji}</span>
                  <span className="text-stone-600">{type?.label}</span>
                  <div className="flex gap-0.5 ml-auto">
                    {[1,2,3,4,5].map(i => <Star key={i} size={10} fill={i <= s.refresh ? "#6BAE91" : "none"} className={i <= s.refresh ? "text-emerald-500" : "text-stone-200"} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 体組成タブ ────────────────────────────────────────────────────────
function BodyTab({ bodyData, latestBody, setShowBodyModal, coachMsg, coachData }) {
  const [chartMetric, setChartMetric] = useState("weight");
  const metrics = [
    { key: "weight", label: "体重", unit: "kg", color: "#6BAE91" },
    { key: "fat", label: "体脂肪率", unit: "%", color: "#D4A5A5" },
    { key: "muscle", label: "筋肉量", unit: "%", color: "#A8C4B8" },
  ];
  const current = metrics.find(m => m.key === chartMetric);

  return (
    <div className="px-4 pt-4 space-y-4">
      {/* 最新データ */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-stone-700">最新の体組成</span>
          <button onClick={() => setShowBodyModal(true)}
            className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-xs font-medium">
            <Plus size={12} /> 記録する
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            ["体重", latestBody.weight, "kg", "⚖️", GOAL_WEIGHT],
            ["体脂肪率", latestBody.fat, "%", "🔥", 22],
            ["筋肉量", latestBody.muscle, "%", "💪", 43],
            ["基礎代謝", latestBody.bmr, "kcal", "⚡", 1250],
            ["体水分率", latestBody.water, "%", "💧", 55],
          ].map(([lb, val, unit, icon, goal]) => (
            <div key={lb} className="bg-stone-50 rounded-xl p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-base">{icon}</span>
                <span className="text-[11px] text-stone-400">{lb}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="serif text-xl text-stone-800">{val || "—"}</span>
                <span className="text-xs text-stone-400">{unit}</span>
              </div>
              {val && <div className="text-[10px] text-emerald-600 mt-0.5">目標 {goal}{unit}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* グラフ */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
        <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
          {metrics.map(m => (
            <button key={m.key} onClick={() => setChartMetric(m.key)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${chartMetric === m.key ? "text-white shadow-sm" : "bg-stone-100 text-stone-500"}`}
              style={chartMetric === m.key ? { background: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={bodyData} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0ede9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#a8a29e" }} />
            <YAxis tick={{ fontSize: 10, fill: "#a8a29e" }} domain={["auto", "auto"]} />
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e7e5e4", borderRadius: 12, fontSize: 12 }} />
            <Line type="monotone" dataKey={chartMetric} stroke={current?.color} strokeWidth={2.5} dot={{ r: 3, fill: current?.color }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* AIコーチング */}
      <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-4 border border-rose-100">
        <div className="flex items-center gap-2 mb-3">
          <Star size={14} className="text-rose-400" fill="#f9a8d4" />
          <span className="text-xs font-semibold text-rose-700">今週のAIコーチング</span>
        </div>
        <p className="text-sm text-stone-700 leading-relaxed mb-3">{coachMsg.msg}</p>
        <div className="border-t border-rose-100 pt-3 space-y-2">
          <div className="text-xs font-semibold text-stone-500 mb-2">今週のアドバイス</div>
          {[
            coachData.pToday < 50 && "🥩 たんぱく質を意識して増やしましょう（目標60g/日）",
            !coachData.stoolOk && "🌿 食物繊維・発酵食品を毎日摂ると腸内環境が整います",
            coachData.weightDown ? "✨ 体重が着実に減少中！この調子を維持しましょう" : "⚖️ 体重変動は±1kg以内が健全な目安です",
            "💧 水を1日1.5L以上飲むと代謝・腸活の両方に効果的です",
          ].filter(Boolean).slice(0, 3).map((tip, i) => (
            <div key={i} className="text-xs text-stone-600 flex items-start gap-1.5">
              <span className="shrink-0 mt-0.5">{i+1}.</span><span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 食事追加モーダル ──────────────────────────────────────────────────
function MealModal({ onAdd, onClose }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const filtered = query ? MEAL_PRESETS.filter(m => m.name.includes(query)) : MEAL_PRESETS;

  const handleAdd = () => {
    if (!selected) return;
    onAdd({ ...selected, time: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }), time_label: selected.time });
    onClose();
  };

  return (
    <Modal title="食事を追加" onClose={onClose}>
      <input value={query} onChange={e => setQuery(e.target.value)} placeholder="料理名で検索…"
        className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200 mb-3" />
      <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-hide">
        {filtered.map(m => (
          <button key={m.name} onClick={() => setSelected(m)}
            className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${selected?.name === m.name ? "border-emerald-300 bg-emerald-50" : "border-stone-100 bg-white hover:bg-stone-50"}`}>
            <span className="text-xl">{m.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-stone-800 truncate">{m.name}</div>
              <div className="text-xs text-stone-400">P:{m.p}g F:{m.f}g C:{m.c}g</div>
            </div>
            <span className="text-sm font-semibold text-emerald-700 shrink-0">{m.cal}kcal</span>
          </button>
        ))}
      </div>
      <button onClick={handleAdd} disabled={!selected}
        className="mt-4 w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform shadow-lg shadow-emerald-100">
        追加する
      </button>
    </Modal>
  );
}

// ── 排便記録モーダル ──────────────────────────────────────────────────
function StoolModal({ onAdd, onClose }) {
  const [selectedType, setSelectedType] = useState(null);
  const [refresh, setRefresh] = useState(3);
  const [count, setCount] = useState(1);

  const handleAdd = () => {
    if (!selectedType) return;
    onAdd({ type: selectedType, refresh, count });
    onClose();
  };

  return (
    <Modal title="排便を記録" onClose={onClose}>
      <div className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wider">便の状態（ブリストルスケール）</div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        {STOOL_TYPES.map(t => (
          <button key={t.id} onClick={() => setSelectedType(t.id)}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${selectedType === t.id ? "border-emerald-300 bg-emerald-50" : "border-stone-100 bg-white"}`}>
            <span className="text-xl shrink-0">{t.emoji}</span>
            <div>
              <div className="text-xs font-semibold text-stone-700">{t.label}</div>
              <div className="text-[10px] text-stone-400">{t.desc}</div>
            </div>
            {t.id === 4 && <span className="ml-auto text-emerald-500 text-[10px] font-semibold">理想</span>}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <div className="text-xs text-stone-400 font-medium mb-2 uppercase tracking-wider">すっきり度</div>
        <div className="flex gap-2 justify-center">
          {[1,2,3,4,5].map(i => (
            <button key={i} onClick={() => setRefresh(i)}>
              <Star size={28} fill={i <= refresh ? "#6BAE91" : "none"} className={i <= refresh ? "text-emerald-500" : "text-stone-200"} />
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between bg-stone-50 rounded-xl px-4 py-3">
        <span className="text-sm text-stone-600">回数</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setCount(Math.max(1, count-1))} className="w-7 h-7 bg-white rounded-full border border-stone-200 flex items-center justify-center text-stone-600 text-sm">-</button>
          <span className="serif text-xl text-stone-800 w-6 text-center">{count}</span>
          <button onClick={() => setCount(count+1)} className="w-7 h-7 bg-white rounded-full border border-stone-200 flex items-center justify-center text-stone-600 text-sm">+</button>
        </div>
      </div>

      <button onClick={handleAdd} disabled={!selectedType}
        className="w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40 active:scale-95 transition-transform shadow-lg shadow-emerald-100">
        記録する
      </button>
    </Modal>
  );
}

// ── 体組成入力モーダル ────────────────────────────────────────────────
function BodyModal({ onAdd, latest, onClose }) {
  const [vals, setVals] = useState({
    weight: latest.weight || "", fat: latest.fat || "", muscle: latest.muscle || "",
    water: latest.water || "", bmr: latest.bmr || "",
  });
  const set = (k, v) => setVals(prev => ({ ...prev, [k]: v }));

  const handleAdd = () => {
    const entry = {};
    Object.entries(vals).forEach(([k, v]) => { if (v) entry[k] = parseFloat(v); });
    onAdd(entry);
    onClose();
  };

  return (
    <Modal title="体組成を記録" onClose={onClose}>
      <div className="space-y-3">
        {[["weight","体重","kg","⚖️"],["fat","体脂肪率","%","🔥"],["muscle","筋肉量","%","💪"],["water","体水分率","%","💧"],["bmr","基礎代謝","kcal","⚡"]].map(([k,lb,u,icon]) => (
          <div key={k} className="flex items-center gap-3 bg-stone-50 rounded-xl px-3 py-2.5">
            <span className="text-xl w-7 text-center shrink-0">{icon}</span>
            <label className="text-sm text-stone-600 flex-1">{lb}</label>
            <div className="flex items-center gap-1.5">
              <input type="number" step="0.1" value={vals[k]} onChange={e => set(k, e.target.value)} placeholder="—"
                className="w-20 text-right bg-white border border-stone-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-200" />
              <span className="text-xs text-stone-400 w-6">{u}</span>
            </div>
          </div>
        ))}
      </div>
      <button onClick={handleAdd}
        className="mt-4 w-full bg-emerald-600 text-white rounded-xl py-3 text-sm font-semibold active:scale-95 transition-transform shadow-lg shadow-emerald-100">
        保存する
      </button>
    </Modal>
  );
}

// ── 共通モーダルラッパー ──────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-stone-900/20 backdrop-blur-[2px]" />
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl px-5 pt-5 pb-8 shadow-2xl fade-up max-h-[90vh] overflow-y-auto scrollbar-hide"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-stone-800">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 bg-stone-100 rounded-full flex items-center justify-center text-stone-500 hover:bg-stone-200 transition-colors">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
