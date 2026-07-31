import React, { useState, useEffect, useRef, useMemo } from "react";
import * as Icons from "lucide-react";


const BASE_URL = "https://dangi-traders-5ozw.onrender.com";

const FERTILIZER_TYPES = ["Urea", "DAP", "NPK", "SSP"];
const COMPANIES = ["IFFCO", "KRIBHCO", "Chambal", "IPL", "NSC", "Others"];

const RATE_PER_BAG = {
  Urea: 266.5,
  DAP: 1350,
  NPK: 1470,
  SSP: 505,
};

function classNames(...c) {
  return c.filter(Boolean).join(" ");
}

function formatCurrency(n) {
  const value = Number(n) || 0;
  return value.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });
}

function todayStamp() {
  const d = new Date();
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAadhaar(v) {
  if (!v || v.length < 4) return v || "—";
  return `XXXX-XXXX-${v.slice(-4)}`;
}

/* ----------------------------------------------------------------------- */
/* Shared UI Components                                                    */
/* ----------------------------------------------------------------------- */

function GlassCard({ className = "", children, ...rest }) {
  return (
    <div
      className={classNames(
        "bg-slate-900 border border-slate-800 shadow-xl shadow-black/50 rounded-2xl",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

function FieldLabel({ icon: Icon, children }) {
  return (
    <label className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-200 mb-1.5">
      {Icon && <Icon size={13} className="text-emerald-400" />}
      {children}
    </label>
  );
}

function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div
      className={classNames(
        "fixed top-5 right-5 z-[100] flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl max-w-sm animate-[fadeIn_0.2s_ease-out]",
        isError
          ? "bg-rose-950 border-rose-500/40 text-rose-100"
          : "bg-emerald-950 border-emerald-500/40 text-emerald-100"
      )}
    >
      {isError ? (
        <Icons.AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-400" />
      ) : (
        <Icons.CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-400" />
      )}
      <div className="text-sm leading-snug">{toast.message}</div>
      <button
        onClick={onClose}
        className="ml-auto text-slate-400 hover:text-white transition-colors"
      >
        <Icons.X size={15} />
      </button>
    </div>
  );
}

function ModalShell({ title, children, onClose, wide = false }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div
        className={classNames(
          "w-full bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]",
          wide ? "max-w-3xl" : "max-w-md"
        )}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 shrink-0">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <Icons.X size={16} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Login Screen                                                            */
/* ----------------------------------------------------------------------- */

function LoginScreen({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!username || !password) {
      setError("Enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const body = new URLSearchParams();
      body.append("username", username);
      body.append("password", password);

      const res = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 400
            ? "Invalid username or password."
            : `Login failed (status ${res.status}).`
        );
      }

      const data = await res.json();
      if (!data.access_token) {
        throw new Error("No access token returned by server.");
      }
      localStorage.setItem("access_token", data.access_token);
      onLogin(data.access_token);
    } catch (err) {
      setError(err.message || "Unable to reach server. Is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 relative flex items-center justify-center">
      <GlassCard className="relative z-10 w-full max-w-sm mx-4 p-8">
        <div className="flex flex-col items-center text-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-900/40 mb-4">
            <Icons.Sprout size={28} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Dangi Traders ERP
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Multi-Category Business &amp; Khata Management
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <FieldLabel icon={Icons.User}>Username</FieldLabel>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. subhash"
              autoComplete="username"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <FieldLabel icon={Icons.KeyRound}>Password</FieldLabel>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
              />
              <Icons.Lock
                size={14}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-950/40 border border-rose-500/20 rounded-lg px-3 py-2 text-xs text-rose-300">
              <Icons.AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-bold text-sm py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950 mt-2"
          >
            {loading ? (
              <>
                <Icons.Loader2 size={16} className="animate-spin" /> Signing in…
              </>
            ) : (
              <>
                <Icons.Lock size={15} /> Sign In
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[11px] text-slate-500 mt-6">
          Connected to {BASE_URL}
        </p>
      </GlassCard>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Top Bar                                                                 */
/* ----------------------------------------------------------------------- */

function TopBar({ online, onLogout }) {
  return (
    <div className="sticky top-0 z-40 bg-slate-900/95 border-b border-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-md shadow-emerald-900/40">
            <Icons.Sprout size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">
              Dangi Traders ERP
            </h1>
            <p className="text-[10px] text-slate-400 leading-tight">
              Khad • Khal • Kirana • Jama Ledger
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={classNames(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border",
              online
                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/25 text-rose-300"
            )}
          >
            {online ? <Icons.Wifi size={12} /> : <Icons.WifiOff size={12} />}
            {online ? "Online" : "Offline"}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-semibold bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/40 text-slate-300 hover:text-rose-300 transition-all"
          >
            <Icons.LogOut size={13} /> Logout
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Sales & Udhar Analytics Dashboard Panel                                 */
/* ----------------------------------------------------------------------- */

function AnalyticsDashboard({ refreshKey }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/dashboard-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const summary = await res.json();
          setData(summary);
        }
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [refreshKey]);

  if (loading) {
    return (
      <GlassCard className="p-5 flex items-center justify-center">
        <Icons.Loader2 size={24} className="animate-spin text-emerald-400" />
        <span className="text-xs text-slate-400 ml-2">Loading Business Analytics…</span>
      </GlassCard>
    );
  }

  const sales = data?.sales || { today: 0, weekly: 0, monthly: 0, yearly: 0 };
  const udhar = data?.udhar_summary || { total_udhar_given: 0, total_jama_received: 0, net_pending_udhar: 0 };

  return (
    <div className="space-y-4">
      {/* Sales Overview */}
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Icons.TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Bikri Analytics (Sales Summary)</h2>
            <p className="text-[11px] text-slate-400">Daily, Weekly, Monthly &amp; Yearly Turnover</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Aaj Ki Sale</p>
            <p className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(sales.today)}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Is Hafte (Mon-Sun)</p>
            <p className="text-sm font-bold text-emerald-300 mt-1">{formatCurrency(sales.weekly)}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Is Mahine Ki Sale</p>
            <p className="text-sm font-bold text-blue-400 mt-1">{formatCurrency(sales.monthly)}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Is Saal Ki Sale</p>
            <p className="text-sm font-bold text-teal-400 mt-1">{formatCurrency(sales.yearly)}</p>
          </div>
        </div>
      </GlassCard>

      {/* Udhar & Recovery Overview */}
      <GlassCard className="p-5 border-amber-500/20">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <Icons.Wallet size={16} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Udhar &amp; Recovery Analytics</h2>
            <p className="text-[11px] text-slate-400">Market Credit vs Recovery Status</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Udhar Diya</p>
            <p className="text-sm font-bold text-rose-400 mt-1">{formatCurrency(udhar.total_udhar_given)}</p>
          </div>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Total Jama / Recovered</p>
            <p className="text-sm font-bold text-teal-400 mt-1">{formatCurrency(udhar.total_jama_received)}</p>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20">
            <p className="text-[10px] uppercase font-bold text-amber-300">Net Pending Market Udhar</p>
            <p className="text-base font-extrabold text-amber-400 mt-0.5">{formatCurrency(udhar.net_pending_udhar)}</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Dynamic Billing & Payment Form                                          */
/* ----------------------------------------------------------------------- */

const EMPTY_FORM = {
  name: "",
  phone: "",
  aadhaar_no: "",
  category: "KHAD", // KHAD, KHAL, KIRANA, JAMA
  fertilizer_type: "",
  company_name: "",
  item_name: "",
  quantity: "1",
  rate_per_unit: "",
  total_amount: "",
  payment_status: "CASH",
};

function BillingForm({ onSuccess, pushToast, setOnline, triggerRefresh }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  function handleFertilizerChange(e) {
    const selectedType = e.target.value;
    const suggestedRate = RATE_PER_BAG[selectedType] || "";
    setForm((f) => ({
      ...f,
      fertilizer_type: selectedType,
      rate_per_unit: suggestedRate ? String(suggestedRate) : f.rate_per_unit,
    }));
  }

  // Dynamic Auto Calculation
  useEffect(() => {
    if (form.category === "JAMA") return;
    const qty = Number(form.quantity) || 0;
    const rate = Number(form.rate_per_unit) || 0;
    if (qty > 0 && rate > 0) {
      setForm((f) => ({ ...f, total_amount: (qty * rate).toFixed(2) }));
    }
  }, [form.quantity, form.rate_per_unit, form.category]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function validate() {
    if (!form.name.trim()) return "Customer name is required.";
    if (!/^\d{10}$/.test(form.phone)) return "Mobile number must be 10 digits.";

    if (form.category === "KHAD") {
      if (!form.fertilizer_type) return "Select a fertilizer type.";
      if (!form.company_name) return "Select a fertilizer company.";
      if (!form.aadhaar_no || !/^\d{12}$/.test(form.aadhaar_no)) return "Aadhaar number (12 digits) is required for Khad.";
    } else if (form.category !== "JAMA") {
      if (!form.item_name.trim()) return "Enter item description.";
    }

    if (!form.total_amount || Number(form.total_amount) <= 0) return "Enter a valid amount (> 0).";
    return "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const err = validate();
    if (err) {
      pushToast(err, "error");
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("access_token");
      const payload = {
        name: form.name.trim(),
        phone: form.phone.trim(),
        aadhaar_no: form.aadhaar_no.trim() || null,
        category: form.category,
        fertilizer_type: form.category === "KHAD" ? form.fertilizer_type : null,
        company_name: form.category === "KHAD" ? form.company_name : null,
        item_name: form.category === "JAMA" ? "Udhar Jama / Payment" : (form.category !== "KHAD" ? form.item_name.trim() : form.fertilizer_type),
        quantity: form.category === "JAMA" ? 1 : Number(form.quantity),
        rate_per_unit: form.category === "JAMA" ? Number(form.total_amount) : (Number(form.rate_per_unit) || null),
        bags_quantity: form.category === "KHAD" ? Number(form.quantity) : null,
        total_amount: Number(form.total_amount),
        payment_status: form.category === "JAMA" ? "CASH" : form.payment_status,
      };

      const res = await fetch(`${BASE_URL}/create-transaction/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setOnline(true);

      if (res.status === 401) {
        pushToast("Session expired. Please sign in again.", "error");
        localStorage.removeItem("access_token");
        setTimeout(() => window.location.reload(), 900);
        return;
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || `Server error (${res.status}).`);
      }

      const data = await res.json().catch(() => ({}));

      const receiptData = {
        ...form,
        customer_id: data.customer_id || data.id || null,
        token_no: data.id || null,
        timestamp: todayStamp(),
      };

      pushToast(form.category === "JAMA" ? "Paise Jama Ho Gaye & Khata Updated!" : `${form.category} Billing Saved!`, "success");
      onSuccess(receiptData);
      setForm({ ...EMPTY_FORM, category: form.category });
      if (triggerRefresh) triggerRefresh();
    } catch (err) {
      setOnline(false);
      pushToast(err.message || "Could not reach server.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <GlassCard className="p-5 sm:p-6">
      {/* Category Tabs Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-6 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...EMPTY_FORM, category: "KHAD", name: f.name, phone: f.phone }))}
            className={classNames(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              form.category === "KHAD"
                ? "bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-950"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            )}
          >
            🌾 Khad (Fertilizer)
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...EMPTY_FORM, category: "KHAL", name: f.name, phone: f.phone }))}
            className={classNames(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              form.category === "KHAL"
                ? "bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-950"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            )}
          >
            🐄 Khal &amp; Pashu Aahar
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...EMPTY_FORM, category: "KIRANA", name: f.name, phone: f.phone }))}
            className={classNames(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              form.category === "KIRANA"
                ? "bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-950"
                : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
            )}
          >
            🛒 Kirana Store
          </button>
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...EMPTY_FORM, category: "JAMA", name: f.name, phone: f.phone }))}
            className={classNames(
              "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border",
              form.category === "JAMA"
                ? "bg-teal-500 text-white border-teal-400 shadow-lg shadow-teal-950"
                : "bg-slate-800 text-teal-400 border-teal-500/30 hover:bg-slate-700"
            )}
          >
            💵 Payment-jama
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <FieldLabel icon={Icons.User}>Customer Name</FieldLabel>
            <input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Ramesh Patel"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <FieldLabel icon={Icons.Phone}>Mobile Number</FieldLabel>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              placeholder="9876543210"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          <div>
            <FieldLabel icon={Icons.Fingerprint}>
              Aadhaar Number {form.category !== "KHAD" && <span className="text-[10px] text-slate-500 normal-case">(Optional)</span>}
            </FieldLabel>
            <input
              value={form.aadhaar_no}
              onChange={(e) => update("aadhaar_no", e.target.value.replace(/\D/g, "").slice(0, 12))}
              inputMode="numeric"
              placeholder="123456789012"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        </div>

        {/* Dynamic Category Inputs */}
        {form.category === "KHAD" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel icon={Icons.Wheat}>Fertilizer Type</FieldLabel>
              <select
                value={form.fertilizer_type}
                onChange={handleFertilizerChange}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium outline-none focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900">Select fertilizer</option>
                {FERTILIZER_TYPES.map((f) => (
                  <option key={f} value={f} className="bg-slate-900">{f}</option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel icon={Icons.Building2}>Company</FieldLabel>
              <select
                value={form.company_name}
                onChange={(e) => update("company_name", e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium outline-none focus:border-emerald-500 transition-all appearance-none"
              >
                <option value="" className="bg-slate-900">Select company</option>
                {COMPANIES.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">{c}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {(form.category === "KHAL" || form.category === "KIRANA") && (
          <div>
            <FieldLabel icon={Icons.PackageSearch}>
              {form.category === "KHAL" ? "Khal / Feed Description" : "Kirana Item Description"}
            </FieldLabel>
            <input
              value={form.item_name}
              onChange={(e) => update("item_name", e.target.value)}
              placeholder={form.category === "KHAL" ? "e.g. Kapas Khal / Mustard Churi" : "e.g. Sugar 5kg + Refined Oil"}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
            />
          </div>
        )}

        {/* Amount Inputs */}
        {form.category === "JAMA" ? (
          <div className="bg-teal-950/40 border border-teal-500/30 rounded-2xl p-4">
            <FieldLabel icon={Icons.IndianRupee}>Kitne Paise Jama Kiye? (₹ Amount)</FieldLabel>
            <input
              value={form.total_amount}
              onChange={(e) => update("total_amount", e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="e.g. 5000"
              className="w-full bg-slate-950 border border-teal-500/50 rounded-xl px-4 py-3 text-lg font-bold text-teal-300 placeholder-slate-600 outline-none focus:ring-2 focus:ring-teal-500/40 transition-all"
            />
            <p className="text-[11px] text-teal-400 mt-2">
              ✓ Ye amount customer ke purane Udhar Balance me se **Minus (-)** ho jayega.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel icon={Icons.Package}>Quantity / Bags</FieldLabel>
              <input
                value={form.quantity}
                onChange={(e) => update("quantity", e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="10"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <FieldLabel icon={Icons.Tag}>Rate / Unit (₹)</FieldLabel>
              <input
                value={form.rate_per_unit}
                onChange={(e) => update("rate_per_unit", e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="1350"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
            <div>
              <FieldLabel icon={Icons.IndianRupee}>Total Amount (₹)</FieldLabel>
              <input
                value={form.total_amount}
                onChange={(e) => update("total_amount", e.target.value.replace(/[^\d.]/g, ""))}
                inputMode="decimal"
                placeholder="13500.00"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        )}

        {/* Payment Buttons */}
        {form.category !== "JAMA" && (
          <div>
            <FieldLabel icon={Icons.BadgePercent}>Payment Status</FieldLabel>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => update("payment_status", "CASH")}
                className={classNames(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                  form.payment_status === "CASH"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <Icons.Banknote size={15} /> CASH
              </button>
              <button
                type="button"
                onClick={() => update("payment_status", "UDHAR")}
                className={classNames(
                  "flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold border transition-all",
                  form.payment_status === "UDHAR"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500"
                    : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600"
                )}
              >
                <Icons.BadgePercent size={15} /> UDHAR
              </button>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className={classNames(
            "w-full flex items-center justify-center gap-2 text-white font-bold text-sm py-3 rounded-xl transition-all shadow-lg mt-1 disabled:opacity-60",
            form.category === "JAMA"
              ? "bg-teal-600 hover:bg-teal-500 shadow-teal-950"
              : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950"
          )}
        >
          {submitting ? (
            <>
              <Icons.Loader2 size={16} className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Icons.Sparkles size={15} />
              {form.category === "JAMA" ? "Save & Minus Udhar Balance" : `Save & Sync ${form.category} Entry`}
            </>
          )}
        </button>
      </form>
    </GlassCard>
  );
}

/* ----------------------------------------------------------------------- */
/* Token Import                                                            */
/* ----------------------------------------------------------------------- */

function TokenImportPanel({ pushToast }) {
  const [scanOpen, setScanOpen] = useState(false);
  const [govOpen, setGovOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const fileRef = useRef(null);

  function simulateScan(file) {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      pushToast(`Simulated scan complete for "${file.name}".`, "success");
    }, 1400);
  }

  return (
    <>
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Icons.ScanLine size={15} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Token Import</h2>
            <p className="text-[11px] text-slate-400">Scan token or visit portal</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            onClick={() => setScanOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Icons.ScanLine size={17} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Scan Token / PDF</p>
              <p className="text-[11px] text-slate-400">Upload document photo</p>
            </div>
          </button>

          <button
            onClick={() => setGovOpen(true)}
            className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Icons.Landmark size={17} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Open e-Vikas Portal</p>
              <p className="text-[11px] text-slate-400">MP Fertilizer Subsidy Portal</p>
            </div>
          </button>
        </div>
      </GlassCard>

      {scanOpen && (
        <ModalShell onClose={() => setScanOpen(false)} title="Scan Existing Token / PDF">
          <div
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-500/25 rounded-2xl py-10 px-6 cursor-pointer hover:border-emerald-500/50 transition-all"
          >
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) simulateScan(f);
              }}
            />
            {scanning ? (
              <Icons.Loader2 size={30} className="text-emerald-400 animate-spin" />
            ) : (
              <Icons.Upload size={30} className="text-emerald-400/60" />
            )}
            <p className="text-sm font-semibold text-white">
              {scanning ? "Reading document..." : "Tap to capture photo or upload PDF"}
            </p>
          </div>
        </ModalShell>
      )}

      {govOpen && (
        <ModalShell onClose={() => setGovOpen(false)} title="MP e-Vikas Govt. Portal" wide>
          <div className="rounded-xl border border-slate-700 bg-slate-950 h-[50vh] flex flex-col items-center justify-center gap-4 text-center px-6">
            <Icons.Landmark size={32} className="text-emerald-400/50" />
            <p className="text-sm font-semibold text-white">Open Official MP e-Vikas Portal in a new tab</p>
            <a
              href="https://evikas.mpkrishi.mp.gov.in/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg"
            >
              <Icons.ExternalLink size={15} /> Open MP e-Vikas Portal
            </a>
          </div>
        </ModalShell>
      )}
    </>
  );
}

/* ----------------------------------------------------------------------- */
/* Customer Ledger Modal                                                   */
/* ----------------------------------------------------------------------- */

function CustomerLedgerModal({ customer, onClose, pushToast }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLedger() {
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/customers/${customer.id}/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setHistory(data.transactions || []);
        }
      } catch (err) {
        pushToast("Could not load customer ledger history.", "error");
      } finally {
        setLoading(false);
      }
    }
    if (customer?.id) fetchLedger();
  }, [customer]);

  async function downloadExcel() {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${BASE_URL}/download-excel/${customer.phone}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Khata_${customer.name}.xlsx`;
        a.click();
        pushToast("Excel Khata Downloaded!", "success");
      }
    } catch (e) {
      pushToast("Export failed.", "error");
    }
  }

  return (
    <ModalShell title={`Combined Khata Ledger: ${customer.name}`} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs">
          <div>
            <p className="text-slate-400">Mobile</p>
            <p className="font-semibold text-white">{customer.phone}</p>
          </div>
          <div>
            <p className="text-slate-400">Aadhaar</p>
            <p className="font-semibold text-white">{maskAadhaar(customer.aadhaar_no)}</p>
          </div>
          <div>
            <p className="text-slate-400">Total Entries</p>
            <p className="font-semibold text-white">{history.length} Transactions</p>
          </div>
          <div>
            <p className="text-slate-400">Net Udhar Balance</p>
            <p className={classNames(
              "font-bold text-sm",
              (customer.current_balance || 0) > 0 ? "text-amber-400" : "text-emerald-400"
            )}>
              {formatCurrency(customer.current_balance || 0)}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Icons.Loader2 className="animate-spin text-emerald-400" size={24} />
          </div>
        ) : history.length === 0 ? (
          <p className="text-center text-slate-500 py-6 text-xs">No transactions found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Details</th>
                  <th className="p-2.5">Qty</th>
                  <th className="p-2.5">Amount</th>
                  <th className="p-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {history.map((tx, idx) => {
                  const isJama = tx.category === "JAMA";
                  return (
                    <tr key={idx} className={classNames("hover:bg-slate-800/40", isJama ? "bg-teal-950/20" : "")}>
                      <td className="p-2.5 text-slate-400">
                        {tx.created_at ? new Date(tx.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="p-2.5 font-bold">
                        <span className={classNames(
                          "px-2 py-0.5 rounded text-[10px]",
                          tx.category === "KHAD" ? "bg-emerald-500/20 text-emerald-300" :
                          tx.category === "KHAL" ? "bg-amber-500/20 text-amber-300" :
                          tx.category === "KIRANA" ? "bg-blue-500/20 text-blue-300" : "bg-teal-500/20 text-teal-300"
                        )}>
                          {tx.category || "KHAD"}
                        </span>
                      </td>
                      <td className="p-2.5 font-medium">
                        {tx.item_name || tx.fertilizer_type} {tx.company_name ? `(${tx.company_name})` : ""}
                      </td>
                      <td className="p-2.5">{isJama ? "—" : (tx.quantity || tx.bags_quantity)}</td>
                      <td className={classNames("p-2.5 font-bold", isJama ? "text-teal-400" : "text-white")}>
                        {isJama ? `- ${formatCurrency(tx.total_amount)}` : `+ ${formatCurrency(tx.total_amount)}`}
                      </td>
                      <td className="p-2.5">
                        <span className={classNames(
                          "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                          isJama ? "bg-teal-500/20 text-teal-300" :
                          tx.payment_status === "UDHAR" ? "bg-amber-500/20 text-amber-300" : "bg-emerald-500/20 text-emerald-300"
                        )}>
                          {isJama ? "JAMA (CREDIT)" : tx.payment_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={downloadExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-950"
          >
            <Icons.FileSpreadsheet size={15} /> Export Complete Khata to Excel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ----------------------------------------------------------------------- */
/* Customer Directory Section                                              */
/* ----------------------------------------------------------------------- */

function CustomerSearchPanel({ pushToast, setOnline, refreshKey }) {
  const [query, setQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  useEffect(() => {
    async function loadCustomers() {
      setLoading(true);
      try {
        const token = localStorage.getItem("access_token");
        const res = await fetch(`${BASE_URL}/customers`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data || []);
        }
      } catch (e) {
        setOnline(false);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, [refreshKey]);

  const filteredCustomers = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q)
    );
  }, [query, customers]);

  return (
    <>
      <GlassCard className="p-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Icons.FileSpreadsheet size={15} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Master Khata Directory</h2>
              <p className="text-[11px] text-slate-400">Unified accounts for Khad, Khal, Kirana &amp; Payments</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {customers.length} Accounts
          </span>
        </div>

        <div className="relative mb-4">
          <Icons.Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer by name or phone..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white font-medium placeholder-slate-500 outline-none focus:border-emerald-500 transition-all"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Icons.Loader2 size={22} className="animate-spin text-emerald-400" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <p className="text-center text-slate-500 py-6 text-xs">No matching customer accounts found.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3">Pending Udhar Balance</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/50 transition-all">
                    <td className="p-3 font-semibold text-white">{c.name}</td>
                    <td className="p-3 text-slate-400">{c.phone}</td>
                    <td className="p-3 font-bold">
                      <span className={(c.current_balance || 0) > 0 ? "text-amber-400" : "text-emerald-400"}>
                        {formatCurrency(c.current_balance || 0)}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => setSelectedCustomer(c)}
                        className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-emerald-600/30 text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all"
                      >
                        <Icons.Eye size={13} /> View Khata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {selectedCustomer && (
        <CustomerLedgerModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          pushToast={pushToast}
        />
      )}
    </>
  );
}

/* ----------------------------------------------------------------------- */
/* Receipt Modal                                                           */
/* ----------------------------------------------------------------------- */

function ReceiptModal({ data, onClose }) {
  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm print:bg-white print:p-0">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden print:border-0 print:shadow-none print:rounded-none print:max-w-full">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700 print:hidden">
          <div className="flex items-center gap-2">
            <Icons.CheckCircle2 size={16} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Entry Saved</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white transition-all">
            <Icons.X size={16} />
          </button>
        </div>

        <div id="thermal-receipt" className="p-6 font-mono text-[13px] text-white print:text-black bg-slate-950 print:bg-white">
          <div className="text-center mb-3">
            <p className="font-bold text-base tracking-wide">DANGI TRADERS</p>
            <p className="text-[10px] text-slate-400 print:text-black">
              {data.category === "JAMA" ? "Payment Receipt Slip" : "Multi-Store Retail Slip"}
            </p>
            <p className="text-[10px] text-slate-400 print:text-black">{data.timestamp}</p>
          </div>
          <div className="border-t border-dashed border-slate-700 print:border-black my-2" />
          <Row label="Customer" value={data.name} />
          <Row label="Mobile" value={data.phone} />
          <Row label="Category" value={data.category || "KHAD"} />
          <div className="border-t border-dashed border-slate-700 print:border-black my-2" />
          <Row label="Details" value={data.category === "JAMA" ? "Udhar Payment Jama" : (data.item_name || data.fertilizer_type)} />
          {data.category !== "JAMA" && <Row label="Qty" value={String(data.quantity || data.bags_quantity)} />}
          <div className="border-t border-dashed border-slate-700 print:border-black my-2" />
          <Row label="Amount" value={formatCurrency(data.total_amount)} bold />
          <Row label="Type" value={data.category === "JAMA" ? "CREDIT (JAMA)" : data.payment_status} highlight={data.payment_status === "UDHAR"} />
          <div className="border-t border-dashed border-slate-700 print:border-black my-3" />
          <p className="text-center text-[10px] text-slate-400 print:text-black">Thank you for your business</p>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-slate-700 print:hidden">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-slate-800 border border-slate-700 text-slate-300 transition-all">Close</button>
          <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-lg">
            <Icons.Printer size={15} /> Print Slip
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-slate-400 print:text-black text-[11px]">{label}</span>
      <span className={classNames("text-[13px]", bold ? "font-bold" : "font-medium", highlight ? "text-amber-400 print:text-black" : "")}>{value}</span>
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Dashboard Main Container                                                */
/* ----------------------------------------------------------------------- */

function Dashboard({ onLogout }) {
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState(null);
  const [receipt, setReceipt] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const toastTimer = useRef(null);

  function pushToast(message, type = "success") {
    setToast({ message, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }

  function triggerRefresh() {
    setRefreshKey((k) => k + 1);
  }

  useEffect(() => () => toastTimer.current && clearTimeout(toastTimer.current), []);

  return (
    <div className="min-h-screen w-full bg-slate-950 relative">
      <div className="relative z-10">
        <TopBar online={online} onLogout={onLogout} />

        <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
          {/* Top Analytics Summary Panel */}
          <AnalyticsDashboard refreshKey={refreshKey} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <BillingForm
                onSuccess={setReceipt}
                pushToast={pushToast}
                setOnline={setOnline}
                triggerRefresh={triggerRefresh}
              />
            </div>
            <div className="space-y-6">
              <TokenImportPanel pushToast={pushToast} />
            </div>
          </div>

          <CustomerSearchPanel pushToast={pushToast} setOnline={setOnline} refreshKey={refreshKey} />
        </div>
      </div>

      <Toast toast={toast} onClose={() => setToast(null)} />
      <ReceiptModal data={receipt} onClose={() => setReceipt(null)} />
    </div>
  );
}

/* ----------------------------------------------------------------------- */
/* Root App                                                                */
/* ----------------------------------------------------------------------- */

export default function App() {
  const [token, setToken] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem("access_token"));
    setChecked(true);
  }, []);

  function handleLogout() {
    localStorage.removeItem("access_token");
    setToken(null);
  }

  if (!checked) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @media print {
          body * { visibility: hidden; }
          #thermal-receipt, #thermal-receipt * { visibility: visible; }
          #thermal-receipt { position: fixed; top: 0; left: 0; width: 100%; }
        }
      `}</style>
      {token ? (
        <Dashboard onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={(t) => setToken(t)} />
      )}
    </>
  );
}
