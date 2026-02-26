import { useState, useMemo, useEffect, useCallback } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { supabase } from "./supabase";

const BRANCHES = ["AJA", "IDIMU", "KETU"];

const RIDERS = {
  AJA: ["Emeka", "Tunde", "Chidi", "Bello"],
  IDIMU: ["Segun", "Lanre", "Femi", "Yusuf"],
  KETU: ["Dele", "Musa", "Kehinde", "Adewale"],
};

const USERS = [
  { username: "boss", password: "boss1234", role: "boss", name: "MD / Boss", branch: null },
  { username: "aja_mgr", password: "aja1234", role: "manager", name: "AJA Manager", branch: "AJA" },
  { username: "idimu_mgr", password: "idimu1234", role: "manager", name: "IDIMU Manager", branch: "IDIMU" },
  { username: "ketu_mgr", password: "ketu1234", role: "manager", name: "KETU Manager", branch: "KETU" },
];

const today = new Date();
const formatDate = (d) => d.toISOString().split("T")[0];
const fmt = (n) => `₦${Number(n || 0).toLocaleString()}`;
const isNear15 = today.getDate() >= 13 && today.getDate() <= 17;

// ─── LOGIN ───────────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);

  const handleLogin = () => {
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) { setError(""); onLogin(user); }
    else setError("Invalid username or password");
  };

  if (!user) return <LoginScreen onLogin={handleLogin} />;

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .fi{background:#0a0a0f;border:1px solid #333;border-radius:2px;padding:12px 14px;font-family:inherit;font-size:13px;color:#e8e4d9;width:100%;outline:none;transition:border-color .2s;}
        .fi:focus{border-color:#ff6b2b;}
        .lb{background:#ff6b2b;border:none;border-radius:2px;padding:13px 32px;font-family:inherit;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#0a0a0f;font-weight:bold;cursor:pointer;width:100%;transition:background .2s;}
        .lb:hover{background:#ff8c55;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
      `}</style>
      <div style={{ width: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 8, height: 8, background: "#ff6b2b", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, letterSpacing: 3, color: "#e8e4d9" }}>LOGIX<span style={{ color: "#ff6b2b" }}>NG</span></span>
          </div>
          <div style={{ fontSize: 11, color: "#444", letterSpacing: 2 }}>LAGOS OPERATIONS PORTAL</div>
        </div>
        <div style={{ background: "#13131a", border: "1px solid #222230", borderRadius: 4, padding: 28, display: "grid", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Username</div>
            <input className="fi" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Password</div>
            <div style={{ position: "relative" }}>
              <input className="fi" type={show ? "text" : "password"} placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ paddingRight: 44 }} />
              <button onClick={() => setShow(s => !s)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>{show ? "hide" : "show"}</button>
            </div>
          </div>
          {error && <div style={{ fontSize: 11, color: "#f87171", letterSpacing: 1 }}>✗ {error}</div>}
          <button className="lb" onClick={handleLogin}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("dashboard");
  const [selectedBranch, setSelectedBranch] = useState("ALL");
  const [form, setForm] = useState({ date: formatDate(today), branch: "AJA", rider: RIDERS.AJA[0], deliveries: "", collected: "", expenses: "", bonus: "" });
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fetch entries from Supabase
  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .limit(500);
    if (!error && data) setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) fetchEntries();
  }, [user, fetchEntries]);

  // Login handler
  const handleLogin = (u) => {
    setUser(u);
    setView(u.role === "boss" ? "dashboard" : "entry");
    if (u.branch) setForm(f => ({ ...f, branch: u.branch, rider: RIDERS[u.branch][0] }));
  };

  // Submit entry to Supabase
  const handleSubmit = async () => {
    const { date, branch, rider, deliveries, collected, expenses, bonus } = form;
    if (!deliveries || !collected || !expenses) { setSaveError("Please fill all required fields."); return; }
    setSaving(true); setSaveError("");
    const c = parseFloat(collected), ex = parseFloat(expenses), b = parseFloat(bonus || 0);
    const { error } = await supabase.from("entries").insert([{
      date, branch, rider,
      deliveries: parseInt(deliveries),
      collected: c, expenses: ex, bonus: b,
      remittance: c - ex
    }]);
    if (error) { setSaveError("Failed to save. Please try again."); }
    else {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
      setForm(f => ({ ...f, deliveries: "", collected: "", expenses: "", bonus: "" }));
      fetchEntries();
    }
    setSaving(false);
  };

  // ── Computed values ──
  const filtered = useMemo(() =>
    selectedBranch === "ALL" ? entries : entries.filter(e => e.branch === selectedBranch),
    [entries, selectedBranch]);

  const totals = useMemo(() => ({
    collected: filtered.reduce((s, e) => s + Number(e.collected), 0),
    expenses: filtered.reduce((s, e) => s + Number(e.expenses), 0),
    remittance: filtered.reduce((s, e) => s + Number(e.remittance), 0),
    deliveries: filtered.reduce((s, e) => s + Number(e.deliveries), 0),
    bonus: filtered.reduce((s, e) => s + Number(e.bonus), 0),
  }), [filtered]);

  const branchTotals = useMemo(() => BRANCHES.map(b => {
    const be = entries.filter(e => e.branch === b);
    return {
      branch: b,
      collected: be.reduce((s, e) => s + Number(e.collected), 0),
      expenses: be.reduce((s, e) => s + Number(e.expenses), 0),
      remittance: be.reduce((s, e) => s + Number(e.remittance), 0),
      deliveries: be.reduce((s, e) => s + Number(e.deliveries), 0),
    };
  }), [entries]);

  const dailyChart = useMemo(() => {
    const grouped = {};
    filtered.forEach(e => {
      if (!grouped[e.date]) grouped[e.date] = { date: e.date.slice(5), collected: 0, expenses: 0, remittance: 0 };
      grouped[e.date].collected += Number(e.collected);
      grouped[e.date].expenses += Number(e.expenses);
      grouped[e.date].remittance += Number(e.remittance);
    });
    return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
  }, [filtered]);

  const riderSummary = useMemo(() => {
    const grouped = {};
    filtered.forEach(e => {
      const key = `${e.branch}-${e.rider}`;
      if (!grouped[key]) grouped[key] = { rider: e.rider, branch: e.branch, deliveries: 0, collected: 0, expenses: 0, remittance: 0, bonus: 0, days: 0 };
      grouped[key].deliveries += Number(e.deliveries);
      grouped[key].collected += Number(e.collected);
      grouped[key].expenses += Number(e.expenses);
      grouped[key].remittance += Number(e.remittance);
      grouped[key].bonus += Number(e.bonus);
      grouped[key].days += 1;
    });
    return Object.values(grouped).sort((a, b) => b.remittance - a.remittance);
  }, [filtered]);

  return (
    <div style={{ fontFamily: "'DM Mono','Courier New',monospace", background: "#0a0a0f", minHeight: "100vh", color: "#e8e4d9" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-track{background:#0a0a0f;} ::-webkit-scrollbar-thumb{background:#ff6b2b;}
        .card{background:#13131a;border:1px solid #222230;border-radius:4px;padding:20px;}
        .stat-card{background:#13131a;border:1px solid #222230;border-radius:4px;padding:20px 24px;transition:border-color .2s;}
        .stat-card:hover{border-color:#ff6b2b;}
        .nav-btn{background:none;border:none;cursor:pointer;padding:8px 18px;font-family:inherit;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#666;transition:all .2s;border-bottom:2px solid transparent;}
        .nav-btn.active{color:#ff6b2b;border-bottom-color:#ff6b2b;}
        .nav-btn:hover{color:#e8e4d9;}
        .bb{background:none;border:1px solid #333;border-radius:2px;cursor:pointer;padding:6px 14px;font-family:inherit;font-size:11px;letter-spacing:2px;color:#666;transition:all .2s;}
        .bb.active{background:#ff6b2b;border-color:#ff6b2b;color:#0a0a0f;font-weight:bold;}
        .bb:hover:not(.active){border-color:#ff6b2b;color:#ff6b2b;}
        .fi{background:#0a0a0f;border:1px solid #333;border-radius:2px;padding:10px 14px;font-family:inherit;font-size:13px;color:#e8e4d9;width:100%;outline:none;transition:border-color .2s;}
        .fi:focus{border-color:#ff6b2b;}
        .fs{background:#0a0a0f;border:1px solid #333;border-radius:2px;padding:10px 14px;font-family:inherit;font-size:13px;color:#e8e4d9;width:100%;outline:none;cursor:pointer;}
        .sb{background:#ff6b2b;border:none;border-radius:2px;padding:12px 32px;font-family:inherit;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#0a0a0f;font-weight:bold;cursor:pointer;transition:all .2s;}
        .sb:hover:not(:disabled){background:#ff8c55;}
        .sb:disabled{opacity:.5;cursor:not-allowed;}
        table{width:100%;border-collapse:collapse;font-size:12px;}
        th{text-align:left;padding:10px 12px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;border-bottom:1px solid #1e1e2a;}
        td{padding:11px 12px;border-bottom:1px solid #16161f;}
        tr:hover td{background:#16161f;}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
      `}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #1a1a25", padding: "0 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 8, height: 8, background: "#ff6b2b", borderRadius: "50%", animation: "pulse 2s infinite" }} />
            <span style={{ fontFamily: "Syne,sans-serif", fontSize: 16, fontWeight: 800, letterSpacing: 3 }}>LOGIX<span style={{ color: "#ff6b2b" }}>NG</span></span>
            <span style={{ color: "#333" }}>|</span>
            <span style={{ fontSize: 11, color: "#555", letterSpacing: 1 }}>LAGOS OPS</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {user.role === "boss"
              ? ["dashboard", "riders"].map(v => (
                  <button key={v} className={`nav-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
                    {v === "dashboard" ? "Overview" : "Riders"}
                  </button>
                ))
              : <span style={{ fontSize: 11, color: "#ff6b2b", letterSpacing: 2 }}>DATA ENTRY</span>
            }
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 16, marginLeft: 8, borderLeft: "1px solid #1e1e2a" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: user.role === "boss" ? "#ff6b2b22" : "#60a5fa22", border: `1px solid ${user.role === "boss" ? "#ff6b2b44" : "#60a5fa44"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: user.role === "boss" ? "#ff6b2b" : "#60a5fa", fontWeight: "bold" }}>
                {user.name[0]}
              </div>
              <div style={{ display: "none" }}>
                <div style={{ fontSize: 11, color: "#e8e4d9" }}>{user.name}</div>
              </div>
              <button onClick={() => setUser(null)} style={{ background: "none", border: "1px solid #333", borderRadius: 2, padding: "4px 10px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, color: "#555", letterSpacing: 1 }}>OUT</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>

        {/* Bonus Alert */}
        {isNear15 && user.role === "boss" && (
          <div style={{ background: "#1a1400", border: "1px solid #ff6b2b", borderRadius: 4, padding: "12px 20px", marginBottom: 24, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ color: "#ff6b2b" }}>⚡</span>
            <span style={{ fontSize: 12, letterSpacing: 1 }}>BONUS PAYMENT DUE — 15th of the month. Review rider bonuses in the Riders tab.</span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#555", fontSize: 12, letterSpacing: 2 }}>
            <div style={{ width: 24, height: 24, border: "2px solid #333", borderTopColor: "#ff6b2b", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
            LOADING DATA...
          </div>
        )}

        {/* ── OVERVIEW ── */}
        {!loading && view === "dashboard" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 28, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginRight: 8 }}>BRANCH</span>
              {["ALL", ...BRANCHES].map(b => (
                <button key={b} className={`bb ${selectedBranch === b ? "active" : ""}`} onClick={() => setSelectedBranch(b)}>{b}</button>
              ))}
              <button onClick={fetchEntries} style={{ marginLeft: "auto", background: "none", border: "1px solid #333", borderRadius: 2, padding: "6px 12px", cursor: "pointer", fontFamily: "inherit", fontSize: 10, color: "#555", letterSpacing: 1 }}>↻ REFRESH</button>
            </div>

            {entries.length === 0 ? (
              <div style={{ textAlign: "center", padding: 80, color: "#555" }}>
                <div style={{ fontSize: 32, marginBottom: 16 }}>📭</div>
                <div style={{ fontSize: 13, letterSpacing: 1 }}>No data yet. Branch managers need to enter daily records.</div>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 28 }}>
                  {[
                    { label: "Total Collected", value: fmt(totals.collected), color: "#4ade80" },
                    { label: "Total Expenses", value: fmt(totals.expenses), color: "#f87171" },
                    { label: "Net Remittance", value: fmt(totals.remittance), color: "#ff6b2b" },
                    { label: "Deliveries", value: totals.deliveries.toLocaleString(), color: "#60a5fa" },
                    { label: "Bonuses", value: fmt(totals.bonus), color: "#c084fc" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="stat-card">
                      <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 10 }}>{label}</div>
                      <div style={{ fontSize: 20, fontFamily: "Syne,sans-serif", fontWeight: 800, color }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 16, marginBottom: 16 }}>
                  <div className="card">
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Daily Cash Flow</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={dailyChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" />
                        <XAxis dataKey="date" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                        <Tooltip contentStyle={{ background: "#13131a", border: "1px solid #333", borderRadius: 4, fontFamily: "DM Mono" }} formatter={v => fmt(v)} />
                        <Legend wrapperStyle={{ fontSize: 11, color: "#666" }} />
                        <Line type="monotone" dataKey="collected" stroke="#4ade80" strokeWidth={2} dot={false} name="Collected" />
                        <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} dot={false} name="Expenses" />
                        <Line type="monotone" dataKey="remittance" stroke="#ff6b2b" strokeWidth={2} dot={false} name="Remittance" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card">
                    <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 20 }}>Branch Performance</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={branchTotals} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" horizontal={false} />
                        <XAxis type="number" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="branch" tick={{ fill: "#e8e4d9", fontSize: 12, fontWeight: "bold" }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#13131a", border: "1px solid #333", borderRadius: 4, fontFamily: "DM Mono" }} formatter={v => fmt(v)} />
                        <Bar dataKey="collected" fill="#4ade8033" stroke="#4ade80" strokeWidth={1} name="Collected" radius={2} />
                        <Bar dataKey="remittance" fill="#ff6b2b" name="Remittance" radius={2} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Branch Table */}
                <div className="card">
                  <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Branch Summary</div>
                  <table>
                    <thead><tr><th>Branch</th><th>Deliveries</th><th>Collected</th><th>Expenses</th><th>Remittance</th><th>Efficiency</th></tr></thead>
                    <tbody>
                      {branchTotals.map(b => {
                        const pct = b.collected > 0 ? Math.round((b.remittance / b.collected) * 100) : 0;
                        return (
                          <tr key={b.branch}>
                            <td><span style={{ fontFamily: "Syne", fontWeight: 800, color: "#ff6b2b", fontSize: 14 }}>{b.branch}</span></td>
                            <td>{b.deliveries.toLocaleString()}</td>
                            <td style={{ color: "#4ade80" }}>{fmt(b.collected)}</td>
                            <td style={{ color: "#f87171" }}>{fmt(b.expenses)}</td>
                            <td style={{ color: "#ff6b2b", fontWeight: "bold" }}>{fmt(b.remittance)}</td>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ width: 80, height: 4, background: "#1e1e2a", borderRadius: 2 }}>
                                  <div style={{ width: `${pct}%`, height: "100%", background: pct > 70 ? "#4ade80" : pct > 50 ? "#ff6b2b" : "#f87171", borderRadius: 2 }} />
                                </div>
                                <span style={{ fontSize: 11, color: "#666" }}>{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── RIDERS ── */}
        {!loading && view === "riders" && (
          <div>
            <div style={{ display: "flex", gap: 8, marginBottom: 24, alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#555", letterSpacing: 2, marginRight: 8 }}>BRANCH</span>
              {["ALL", ...BRANCHES].map(b => (
                <button key={b} className={`bb ${selectedBranch === b ? "active" : ""}`} onClick={() => setSelectedBranch(b)}>{b}</button>
              ))}
            </div>
            <div className="card">
              <div style={{ fontSize: 11, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 16 }}>Rider Performance</div>
              {riderSummary.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40, color: "#555", fontSize: 12 }}>No rider data yet.</div>
              ) : (
                <table>
                  <thead><tr><th>Rider</th><th>Branch</th><th>Days</th><th>Deliveries</th><th>Collected</th><th>Expenses</th><th>Remittance</th><th>Bonus</th></tr></thead>
                  <tbody>
                    {riderSummary.map((r, i) => (
                      <tr key={i}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#ff6b2b22", border: "1px solid #ff6b2b44", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#ff6b2b", fontWeight: "bold" }}>{r.rider[0]}</div>
                            {r.rider}
                          </div>
                        </td>
                        <td><span style={{ background: "#ff6b2b22", color: "#ff6b2b", padding: "2px 8px", borderRadius: 2, fontSize: 10, letterSpacing: 1 }}>{r.branch}</span></td>
                        <td>{r.days}</td>
                        <td>{r.deliveries}</td>
                        <td style={{ color: "#4ade80" }}>{fmt(r.collected)}</td>
                        <td style={{ color: "#f87171" }}>{fmt(r.expenses)}</td>
                        <td style={{ color: "#ff6b2b", fontWeight: "bold" }}>{fmt(r.remittance)}</td>
                        <td>{r.bonus > 0 ? <span style={{ color: "#c084fc" }}>{fmt(r.bonus)}</span> : <span style={{ color: "#333" }}>—</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ── ENTRY ── */}
        {view === "entry" && (
          <div style={{ maxWidth: 560 }}>
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontFamily: "Syne,sans-serif", fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Daily Entry</div>
              <div style={{ fontSize: 12, color: "#555" }}>Log today's rider report for <span style={{ color: "#ff6b2b" }}>{user.branch}</span> branch</div>
            </div>

            {submitted && (
              <div style={{ background: "#0d1f14", border: "1px solid #4ade80", borderRadius: 4, padding: "12px 20px", marginBottom: 20, fontSize: 12, color: "#4ade80", letterSpacing: 1 }}>
                ✓ ENTRY SAVED TO DATABASE
              </div>
            )}
            {saveError && (
              <div style={{ background: "#1f0d0d", border: "1px solid #f87171", borderRadius: 4, padding: "12px 20px", marginBottom: 20, fontSize: 12, color: "#f87171", letterSpacing: 1 }}>
                ✗ {saveError}
              </div>
            )}

            <div className="card" style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Date</div>
                  <input type="date" className="fi" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Branch</div>
                  <div style={{ padding: "10px 14px", background: "#0a0a0f", border: "1px solid #222", borderRadius: 2, fontSize: 13, color: "#ff6b2b", fontFamily: "Syne,sans-serif", fontWeight: 800 }}>{user.branch}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Rider</div>
                <select className="fs" value={form.rider} onChange={e => setForm(f => ({ ...f, rider: e.target.value }))}>
                  {RIDERS[user.branch].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Deliveries</div>
                  <input type="number" className="fi" placeholder="0" value={form.deliveries} onChange={e => setForm(f => ({ ...f, deliveries: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Cash Collected (₦)</div>
                  <input type="number" className="fi" placeholder="0.00" value={form.collected} onChange={e => setForm(f => ({ ...f, collected: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Expenses (₦)</div>
                  <input type="number" className="fi" placeholder="0.00" value={form.expenses} onChange={e => setForm(f => ({ ...f, expenses: e.target.value }))} />
                </div>
                <div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Bonus (₦) <span style={{ color: "#444" }}>15th only</span></div>
                  <input type="number" className="fi" placeholder="0.00" value={form.bonus} onChange={e => setForm(f => ({ ...f, bonus: e.target.value }))} />
                </div>
              </div>

              {form.collected && form.expenses && (
                <div style={{ background: "#0d1300", border: "1px solid #ff6b2b33", borderRadius: 4, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#666" }}>REMITTANCE</span>
                  <span style={{ color: "#ff6b2b", fontFamily: "Syne", fontWeight: 800, fontSize: 20 }}>{fmt((parseFloat(form.collected) || 0) - (parseFloat(form.expenses) || 0))}</span>
                </div>
              )}

              <button className="sb" onClick={handleSubmit} disabled={saving}>
                {saving ? "SAVING..." : "SAVE ENTRY"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
