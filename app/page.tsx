"use client";

import {
  Activity, AlarmClock, ArrowRight, Bell, CalendarDays, CheckCircle2,
  ChevronRight, ClipboardCheck, Clock3, CreditCard, FileHeart, HeartPulse,
  IdCard, LayoutDashboard, LogOut, Menu, MessageSquareText,
  Pill, Plus, ReceiptText, Search, ShieldCheck, Stethoscope, Trash2, UserRound,
  UsersRound, WalletCards, X, Zap,
} from "lucide-react";
import { FormEvent, ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import type {
  Appointment, BootstrapData, MedicalRecord, Patient, PrescriptionItem, Role,
} from "@/lib/hms-types";

const today = new Date().toISOString().slice(0, 10);
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const currency = (value: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`));

const statusMeta: Record<string, { label: string; className: string }> = {
  INITIATED: { label: "Khởi tạo", className: "bg-slate-100 text-slate-700" },
  INSURANCE_VERIFIED: { label: "Đã xác thực BHYT", className: "bg-cyan-50 text-cyan-700" },
  CONFIRMED: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-700" },
  IN_CONSULTATION: { label: "Đang khám", className: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Hoàn tất", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-rose-50 text-rose-700" },
  PAID: { label: "Đã thanh toán", className: "bg-emerald-50 text-emerald-700" },
  PENDING: { label: "Chờ thanh toán", className: "bg-amber-50 text-amber-700" },
  AT_HOSPITAL: { label: "Thanh toán tại viện", className: "bg-violet-50 text-violet-700" },
};

type ApiResult<T> = { ok: boolean; data?: T; message?: string };

async function api<T>(token: string | null, action?: string, payload: Record<string, unknown> = {}) {
  const response = await fetch("/api/hms", {
    method: action ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(action ? { body: JSON.stringify({ action, ...payload }) } : {}),
  });
  const result = await response.json() as ApiResult<T>;
  if (!response.ok || !result.ok) throw new Error(result.message ?? "Không thể kết nối hệ thống");
  return result.data as T;
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${light ? "bg-white/15" : "bg-blue-600"}`}>
        <HeartPulse className="h-6 w-6 text-white" strokeWidth={2.4} />
      </span>
      <div>
        <p className={`text-[19px] font-extrabold tracking-tight ${light ? "text-white" : "text-slate-950"}`}>VibeCare</p>
        <p className={`text-[10px] font-bold uppercase tracking-[0.22em] ${light ? "text-blue-100" : "text-blue-600"}`}>Hospital System</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status] ?? { label: status, className: "bg-slate-100 text-slate-700" };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${meta.className}`}>{meta.label}</span>;
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-slate-200/80 bg-white shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}>{children}</section>;
}

function EmptyState({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-500">{icon}</span>
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>
    </div>
  );
}

// Login is intentionally role-first. This prevents a patient from accidentally
// entering the doctor's workflow and demonstrates RBAC clearly during the demo.
function LoginPage({ onLogin }: { onLogin: (role: Role, email: string, password: string) => Promise<void> }) {
  const [role, setRole] = useState<Role>("PATIENT");
  const [email, setEmail] = useState("patient@hms.vn");
  const [password, setPassword] = useState("Patient@123");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const chooseRole = (next: Role) => {
    setRole(next);
    setEmail(next === "PATIENT" ? "patient@hms.vn" : "doctor@hms.vn");
    setPassword(next === "PATIENT" ? "Patient@123" : "Doctor@123");
    setError("");
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try { await onLogin(role, email, password); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Đăng nhập thất bại"); }
    finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-[#f6f9ff] p-3 sm:p-5">
      <div className="mx-auto grid min-h-[calc(100vh-24px)] max-w-[1460px] overflow-hidden rounded-[30px] bg-white shadow-[0_30px_90px_rgba(30,64,175,0.14)] lg:min-h-[calc(100vh-40px)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-gradient-to-br from-[#0756d8] via-[#1268e7] to-[#43a6ff] p-12 text-white lg:flex lg:flex-col">
          <div className="absolute -right-36 -top-36 h-[460px] w-[460px] rounded-full border-[90px] border-white/5" />
          <div className="absolute -bottom-32 -left-24 h-[400px] w-[400px] rounded-full bg-cyan-300/10 blur-3xl" />
          <Logo light />
          <div className="relative z-10 my-auto max-w-xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold backdrop-blur">
              <ShieldCheck className="h-4 w-4" /> Nền tảng quản lý y tế số an toàn
            </span>
            <h1 className="text-5xl font-extrabold leading-[1.07] tracking-[-0.04em] xl:text-6xl">Chăm sóc tốt hơn,<br />kết nối thông minh hơn.</h1>
            <p className="mt-6 max-w-lg text-[17px] leading-7 text-blue-100">Một hành trình liền mạch từ đặt lịch, xác thực BHYT, khám bệnh đến nhận đơn thuốc và lịch tái khám.</p>

            <div className="relative mt-12 h-[310px]">
              <div className="absolute left-1/2 top-5 h-64 w-64 -translate-x-1/2 rounded-full bg-white/10 ring-1 ring-white/15" />
              <div className="absolute left-1/2 top-16 grid h-48 w-48 -translate-x-1/2 place-items-center rounded-[58px] bg-white/15 shadow-2xl backdrop-blur-lg">
                <Stethoscope className="h-24 w-24 text-white" strokeWidth={1.45} />
              </div>
              <div className="absolute left-3 top-36 w-48 rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900 shadow-2xl">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100"><CheckCircle2 className="text-emerald-600" /></span><div><p className="text-xs text-slate-500">Lịch hẹn</p><p className="text-sm font-extrabold">Đã xác nhận</p></div></div>
              </div>
              <div className="absolute right-2 top-4 w-52 rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900 shadow-2xl">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100"><ShieldCheck className="text-blue-600" /></span><div><p className="text-xs text-slate-500">Bảo hiểm y tế</p><p className="text-sm font-extrabold">Hỗ trợ 65%</p></div></div>
              </div>
              <div className="absolute bottom-2 right-12 w-48 rounded-2xl border border-white/20 bg-white/95 p-4 text-slate-900 shadow-2xl">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100"><Pill className="text-violet-600" /></span><div><p className="text-xs text-slate-500">Đơn thuốc</p><p className="text-sm font-extrabold">Đã phát hành</p></div></div>
              </div>
            </div>
          </div>
          <p className="relative z-10 text-xs font-semibold text-blue-100">© 2026 VibeCoding Team · UEF Software Technology</p>
        </section>

        <section className="flex items-center justify-center px-6 py-10 sm:px-12 lg:px-16 xl:px-24">
          <div className="w-full max-w-[470px]">
            <div className="mb-10 lg:hidden"><Logo /></div>
            <p className="text-sm font-extrabold uppercase tracking-[0.18em] text-blue-600">Chào mừng trở lại</p>
            <h2 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] text-slate-950">Đăng nhập hệ thống</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">Chọn đúng vai trò để hệ thống phân luồng vào giao diện phù hợp.</p>

            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-slate-100 p-1.5">
              {(["PATIENT", "DOCTOR"] as Role[]).map((item) => (
                <button key={item} type="button" onClick={() => chooseRole(item)} className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-extrabold transition ${role === item ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                  {item === "PATIENT" ? <UserRound className="h-4 w-4" /> : <Stethoscope className="h-4 w-4" />}
                  {item === "PATIENT" ? "Bệnh nhân" : "Bác sĩ"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} className="mt-7 space-y-5">
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Email đăng nhập</span><div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"><MessageSquareText className="h-4 w-4 text-slate-400" /><input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="h-13 w-full bg-transparent px-3 text-sm outline-none" required /></div></label>
              <label className="block"><span className="mb-2 block text-sm font-bold text-slate-700">Mật khẩu</span><div className="flex items-center rounded-xl border border-slate-200 bg-white px-4 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100"><ShieldCheck className="h-4 w-4 text-slate-400" /><input value={password} onChange={(e) => setPassword(e.target.value)} type={showPassword ? "text" : "password"} className="h-13 w-full bg-transparent px-3 text-sm outline-none" required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="text-xs font-bold text-blue-600">{showPassword ? "Ẩn" : "Hiện"}</button></div></label>
              {error && <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
              <button disabled={loading} className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:opacity-60">{loading ? "Đang xác thực..." : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}</button>
            </form>

            <div className="mt-7 rounded-2xl border border-blue-100 bg-blue-50/70 p-4">
              <div className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-blue-600"><Zap className="h-4 w-4" /></span><div><p className="text-xs font-extrabold text-blue-900">Tài khoản demo đã được điền sẵn</p><p className="mt-1 text-xs leading-5 text-blue-700">Chọn Bệnh nhân hoặc Bác sĩ rồi bấm Đăng nhập để xem hai luồng chức năng độc lập.</p></div></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

const patientNav = [
  ["dashboard", "Tổng quan", LayoutDashboard], ["booking", "Đặt lịch khám", CalendarDays],
  ["appointments", "Lịch khám của tôi", Clock3], ["prescriptions", "Hồ sơ & đơn thuốc", FileHeart],
  ["invoices", "Hóa đơn", ReceiptText], ["profile", "Hồ sơ cá nhân", UserRound],
] as const;
const doctorNav = [
  ["dashboard", "Tổng quan", LayoutDashboard], ["schedule", "Lịch khám", CalendarDays],
  ["consultation", "Khám bệnh", Stethoscope], ["patients", "Bệnh nhân", UsersRound],
] as const;

function AppShell({ data, token, refresh, onLogout, notify }: { data: BootstrapData; token: string; refresh: () => Promise<void>; onLogout: () => void; notify: (message: string, kind?: "success" | "error") => void }) {
  const isPatient = data.user.role === "PATIENT";
  const nav = isPatient ? patientNav : doctorNav;
  const [active, setActive] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const unread = data.notifications.filter((item) => !item.isRead).length;

  const mutate = async (action: string, payload: Record<string, unknown>, message: string) => {
    try {
      await api(token, action, payload);
      await refresh();
      notify(message);
      return true;
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Thao tác thất bại", "error");
      return false;
    }
  };

  const openConsultation = async (appointment: Appointment) => {
    if (appointment.status === "CONFIRMED") {
      const success = await mutate("startConsultation", { appointmentId: appointment.id }, "Đã bắt đầu buổi khám");
      if (!success) return;
    }
    setSelectedAppointmentId(appointment.id);
    setActive("consultation");
  };

  const titles: Record<string, string> = {
    dashboard: isPatient ? "Tổng quan sức khỏe" : "Trung tâm điều hành khám",
    booking: "Đặt lịch khám", appointments: "Lịch khám của tôi", prescriptions: "Hồ sơ và đơn thuốc",
    invoices: "Hóa đơn y tế", profile: "Hồ sơ cá nhân", schedule: "Lịch khám bệnh nhân",
    consultation: "Không gian khám bệnh", patients: "Danh sách bệnh nhân",
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-slate-900">
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-[274px] flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${mobileMenu ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between"><Logo /><button className="lg:hidden" onClick={() => setMobileMenu(false)}><X className="h-5 w-5" /></button></div>
        <nav className="mt-10 space-y-1.5">
          <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">Không gian làm việc</p>
          {nav.map(([key, label, Icon]) => (
            <button key={key} onClick={() => { setActive(key); setMobileMenu(false); }} className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold transition ${active === key ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-500 hover:bg-slate-100 hover:text-slate-950"}`}>
              <Icon className={`h-[19px] w-[19px] ${active === key ? "text-white" : "text-slate-400 group-hover:text-blue-600"}`} />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-4 text-white">
          <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /><p className="text-xs font-extrabold">Dữ liệu demo an toàn</p></div>
          <p className="mt-2 text-[11px] leading-5 text-blue-50">Mọi thao tác được phân quyền và lưu nhật ký phục vụ thuyết trình.</p>
        </div>
        <button onClick={onLogout} className="mt-4 flex items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" />Đăng xuất</button>
      </aside>

      {mobileMenu && <button aria-label="Đóng menu" onClick={() => setMobileMenu(false)} className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-sm lg:hidden" />}

      <section className="min-h-screen lg:pl-[274px]">
        <header className="sticky top-0 z-30 flex h-[82px] items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-xl sm:px-8">
          <div className="flex items-center gap-3"><button onClick={() => setMobileMenu(true)} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 lg:hidden"><Menu className="h-5 w-5" /></button><div><p className="text-[11px] font-bold uppercase tracking-[0.16em] text-blue-600">VibeCare HMS</p><h1 className="text-lg font-extrabold tracking-tight sm:text-xl">{titles[active]}</h1></div></div>
          <div className="flex items-center gap-2 sm:gap-4">
            <label className="hidden items-center gap-2 rounded-xl bg-slate-100 px-3.5 md:flex"><Search className="h-4 w-4 text-slate-400" /><input className="h-10 w-44 bg-transparent text-xs outline-none" placeholder="Tìm nhanh..." /></label>
            <div className="relative"><button onClick={async () => { setNotificationsOpen((value) => !value); if (unread) { await api(token, "readNotifications"); await refresh(); } }} className="relative grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600"><Bell className="h-[18px] w-[18px]" />{unread > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white">{unread}</span>}</button>
              {notificationsOpen && <Panel className="absolute right-0 top-13 w-[min(360px,calc(100vw-24px))] overflow-hidden"><div className="border-b border-slate-100 p-4"><p className="font-extrabold">Thông báo</p><p className="text-xs text-slate-500">Cập nhật mới nhất từ hệ thống</p></div><div className="max-h-96 overflow-y-auto">{data.notifications.length ? data.notifications.map((item) => <div key={item.id} className="border-b border-slate-100 p-4 last:border-0"><div className="flex gap-3"><span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600"><Bell className="h-4 w-4" /></span><div><p className="text-sm font-bold">{item.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{item.message}</p></div></div></div>) : <EmptyState icon={<Bell />} title="Chưa có thông báo" text="Thông báo sẽ xuất hiện tại đây." />}</div></Panel>}
            </div>
            <div className="hidden h-9 w-px bg-slate-200 sm:block" />
            <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-sm font-extrabold text-white">{data.user.fullName.split(" ").slice(-1)[0][0]}</span><div className="hidden sm:block"><p className="text-xs font-extrabold">{data.user.fullName}</p><p className="mt-0.5 text-[10px] font-semibold text-slate-400">{isPatient ? "Bệnh nhân" : "Bác sĩ"}</p></div></div>
          </div>
        </header>

        <div className="mx-auto max-w-[1540px] p-4 sm:p-6 xl:p-8">
          {isPatient && active === "dashboard" && <PatientDashboard data={data} setActive={setActive} mutate={mutate} />}
          {isPatient && active === "booking" && <BookingPage data={data} mutate={mutate} onDone={() => setActive("appointments")} />}
          {isPatient && active === "appointments" && <PatientAppointments data={data} mutate={mutate} />}
          {isPatient && active === "prescriptions" && <PrescriptionPage records={data.records} />}
          {isPatient && active === "invoices" && <InvoicePage data={data} mutate={mutate} />}
          {isPatient && active === "profile" && <PatientProfile profile={data.profile as Patient} userEmail={data.user.email} />}
          {!isPatient && active === "dashboard" && <DoctorDashboard data={data} openConsultation={openConsultation} setActive={setActive} />}
          {!isPatient && active === "schedule" && <DoctorSchedule data={data} mutate={mutate} openConsultation={openConsultation} />}
          {!isPatient && active === "consultation" && <ConsultationWorkspace data={data} selectedId={selectedAppointmentId} setSelectedId={setSelectedAppointmentId} mutate={mutate} />}
          {!isPatient && active === "patients" && <DoctorPatients data={data} openConsultation={openConsultation} />}
        </div>
      </section>
    </main>
  );
}

function MetricCard({ icon, value, label, tone }: { icon: ReactNode; value: string | number; label: string; tone: string }) {
  return <Panel className="p-5"><div className="flex items-center justify-between"><span className={`grid h-12 w-12 place-items-center rounded-2xl ${tone}`}>{icon}</span><ChevronRight className="h-4 w-4 text-slate-300" /></div><p className="mt-4 text-2xl font-extrabold tracking-tight">{value}</p><p className="mt-1 text-xs font-semibold text-slate-500">{label}</p></Panel>;
}

function PatientDashboard({ data, setActive, mutate }: { data: BootstrapData; setActive: (value: string) => void; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const profile = data.profile as Patient;
  const activeAppointments = data.appointments.filter((item) => !["COMPLETED", "CANCELLED"].includes(item.status)).sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`));
  const upcoming = activeAppointments[0];
  const completed = data.appointments.filter((item) => item.status === "COMPLETED").length;
  const unpaid = data.invoices.filter((item) => item.status === "PENDING").length;

  return <div className="space-y-6">
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0756d8] via-[#1976ed] to-[#3ba9fa] p-6 text-white sm:p-8">
      <div className="absolute right-0 top-0 h-full w-1/2 opacity-30 medical-grid" /><div className="absolute -right-16 -top-20 h-72 w-72 rounded-full bg-white/10" />
      <div className="relative z-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-center"><div><p className="text-sm font-bold text-blue-100">Xin chào, {profile.fullName.split(" ").slice(-2).join(" ")} 👋</p><h2 className="mt-2 max-w-xl text-3xl font-extrabold tracking-[-0.035em] sm:text-4xl">Hôm nay bạn cảm thấy thế nào?</h2><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100">Chủ động quản lý lịch khám, hàng đợi và hồ sơ sức khỏe ngay trên một giao diện.</p><button onClick={() => setActive("booking")} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-blue-700 shadow-xl shadow-blue-900/10"><Plus className="h-4 w-4" />Đặt lịch mới</button></div><div className="grid min-w-[280px] grid-cols-2 gap-3"><div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-xs text-blue-100">Mã bệnh nhân</p><p className="mt-1 font-extrabold">{profile.patientCode}</p></div><div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur"><p className="text-xs text-blue-100">BHYT hỗ trợ</p><p className="mt-1 font-extrabold">{profile.insuranceLevel}%</p></div></div></div>
    </section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={<CalendarDays className="text-blue-600" />} value={activeAppointments.length} label="Lịch khám sắp tới" tone="bg-blue-50" /><MetricCard icon={<FileHeart className="text-emerald-600" />} value={completed} label="Hồ sơ khám bệnh" tone="bg-emerald-50" /><MetricCard icon={<Pill className="text-violet-600" />} value={data.records.reduce((sum, record) => sum + record.items.length, 0)} label="Thuốc trong đơn" tone="bg-violet-50" /><MetricCard icon={<WalletCards className="text-amber-600" />} value={unpaid} label="Hóa đơn chờ xử lý" tone="bg-amber-50" /></div>
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5 sm:p-6"><div><h3 className="font-extrabold">Lịch khám gần nhất</h3><p className="mt-1 text-xs text-slate-500">Thông tin đã đồng bộ với hệ thống bệnh viện</p></div><button onClick={() => setActive("appointments")} className="text-xs font-extrabold text-blue-600">Xem tất cả</button></div>{upcoming ? <div className="p-5 sm:p-6"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-blue-50 text-blue-700"><div className="text-center"><p className="text-2xl font-black leading-none">{new Date(`${upcoming.scheduledDate}T00:00:00`).getDate()}</p><p className="mt-1 text-[10px] font-extrabold uppercase">Tháng {new Date(`${upcoming.scheduledDate}T00:00:00`).getMonth() + 1}</p></div></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="font-extrabold">{upcoming.doctorName}</h4><StatusBadge status={upcoming.status} /></div><p className="mt-1 text-sm text-slate-500">{upcoming.specialty} · {upcoming.room}</p><div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-600"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-blue-600" />{upcoming.scheduledTime}</span><span className="flex items-center gap-1.5"><IdCard className="h-4 w-4 text-blue-600" />{upcoming.appointmentCode}</span>{upcoming.queueToken && <span className="flex items-center gap-1.5 text-emerald-700"><AlarmClock className="h-4 w-4" />Số {upcoming.queueToken}</span>}</div></div><div className="flex gap-2">{!upcoming.queueToken && <button onClick={() => mutate("checkIn", { appointmentId: upcoming.id }, "Check-in thành công")} className="rounded-xl border border-blue-200 px-4 py-2.5 text-xs font-extrabold text-blue-700 hover:bg-blue-50">Check-in</button>}</div></div></div> : <EmptyState icon={<CalendarDays />} title="Chưa có lịch khám" text="Đặt lịch mới để được bác sĩ tư vấn." />}</Panel>
      <Panel className="p-5 sm:p-6"><h3 className="font-extrabold">Tiện ích nhanh</h3><p className="mt-1 text-xs text-slate-500">Truy cập chức năng thường dùng</p><div className="mt-5 grid grid-cols-2 gap-3">{[["booking", "Đặt lịch", CalendarDays, "bg-blue-50 text-blue-600"], ["prescriptions", "Đơn thuốc", Pill, "bg-violet-50 text-violet-600"], ["invoices", "Thanh toán", CreditCard, "bg-emerald-50 text-emerald-600"], ["profile", "BHYT", ShieldCheck, "bg-cyan-50 text-cyan-600"]].map(([key, label, Icon, tone]) => <button key={String(key)} onClick={() => setActive(String(key))} className="rounded-2xl border border-slate-100 p-4 text-left transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"><span className={`grid h-10 w-10 place-items-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span><p className="mt-3 text-xs font-extrabold">{String(label)}</p></button>)}</div></Panel>
    </div>
  </div>;
}

function BookingPage({ data, mutate, onDone }: { data: BootstrapData; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean>; onDone: () => void }) {
  const profile = data.profile as Patient;
  const specialties = [...new Set(data.doctors.map((doctor) => doctor.specialty))];
  const [specialty, setSpecialty] = useState(specialties[0]);
  const availableDoctors = data.doctors.filter((doctor) => doctor.specialty === specialty);
  const [doctorId, setDoctorId] = useState(availableDoctors[0]?.id ?? "");
  const [scheduledDate, setScheduledDate] = useState(tomorrow);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [reason, setReason] = useState("");
  const [useInsurance, setUseInsurance] = useState(true);
  const [paymentChoice, setPaymentChoice] = useState("AT_HOSPITAL");
  const [loading, setLoading] = useState(false);
  const doctor = data.doctors.find((item) => item.id === doctorId) ?? availableDoctors[0];
  const payable = doctor ? Math.round(doctor.consultationFee * (100 - (useInsurance ? profile.insuranceLevel : 0)) / 100) : 0;

  useEffect(() => { if (!availableDoctors.some((item) => item.id === doctorId)) setDoctorId(availableDoctors[0]?.id ?? ""); }, [specialty, doctorId, availableDoctors]);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setLoading(true);
    const success = await mutate("createAppointment", { doctorId, scheduledDate, scheduledTime, reason, insuranceNumber: useInsurance ? profile.insuranceNumber : "", paymentChoice }, "Đặt lịch khám thành công");
    setLoading(false); if (success) onDone();
  };

  return <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
    <Panel className="p-5 sm:p-7"><div className="mb-7"><span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-blue-700"><CalendarDays className="h-3.5 w-3.5" />Quy trình đặt lịch trực tuyến</span><h2 className="mt-3 text-2xl font-extrabold tracking-tight">Chọn bác sĩ và thời gian phù hợp</h2><p className="mt-2 text-sm text-slate-500">Hệ thống tự kiểm tra khung giờ và quyền lợi BHYT trước khi xác nhận.</p></div>
      <form onSubmit={submit} className="space-y-7">
        <div><label className="mb-3 block text-sm font-extrabold">1. Chọn chuyên khoa</label><div className="flex flex-wrap gap-2">{specialties.map((item) => <button type="button" key={item} onClick={() => setSpecialty(item)} className={`rounded-xl border px-4 py-2.5 text-xs font-bold ${specialty === item ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300"}`}>{item}</button>)}</div></div>
        <div><label className="mb-3 block text-sm font-extrabold">2. Chọn bác sĩ</label><div className="grid gap-3 sm:grid-cols-2">{availableDoctors.map((item) => <button type="button" key={item.id} onClick={() => setDoctorId(item.id)} className={`flex items-center gap-4 rounded-2xl border p-4 text-left ${doctorId === item.id ? "border-blue-500 bg-blue-50/70 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-200"}`}><span style={{ backgroundColor: item.avatarColor }} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-sm font-extrabold text-white">{item.fullName.split(" ").slice(-1)[0][0]}</span><div><p className="text-sm font-extrabold">{item.fullName}</p><p className="mt-1 text-xs text-slate-500">{item.degree} · {item.room}</p><p className="mt-1 text-xs font-bold text-blue-700">{currency(item.consultationFee)}</p></div>{doctorId === item.id && <CheckCircle2 className="ml-auto h-5 w-5 text-blue-600" />}</button>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-sm font-extrabold">3. Ngày khám</span><input type="date" min={today} value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" required /></label><label><span className="mb-2 block text-sm font-extrabold">4. Giờ khám</span><select value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500">{["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00"].map((time) => <option key={time}>{time}</option>)}</select></label></div>
        <label className="block"><span className="mb-2 block text-sm font-extrabold">5. Lý do khám</span><textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Mô tả triệu chứng hoặc nhu cầu khám..." className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50" required /></label>
        <div><p className="mb-3 text-sm font-extrabold">6. Bảo hiểm và thanh toán</p><label className={`flex cursor-pointer items-center gap-4 rounded-2xl border p-4 ${useInsurance ? "border-cyan-300 bg-cyan-50/60" : "border-slate-200"}`}><input type="checkbox" checked={useInsurance} onChange={(e) => setUseInsurance(e.target.checked)} className="h-4 w-4 accent-cyan-600" /><span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-cyan-600"><ShieldCheck className="h-5 w-5" /></span><div className="flex-1"><p className="text-sm font-extrabold">Áp dụng thẻ BHYT</p><p className="mt-1 text-xs text-slate-500">{profile.insuranceNumber} · Quyền lợi {profile.insuranceLevel}%</p></div>{useInsurance && <span className="rounded-full bg-cyan-600 px-3 py-1 text-[10px] font-extrabold text-white">Sẽ xác thực</span>}</label><div className="mt-3 grid gap-3 sm:grid-cols-2">{[["AT_HOSPITAL", "Thanh toán tại viện", "Thanh toán khi đến khám"], ["ONLINE", "Thanh toán trực tuyến", "QR/Ngân hàng sau khi đặt"]].map(([value, label, sub]) => <label key={value} className={`cursor-pointer rounded-2xl border p-4 ${paymentChoice === value ? "border-blue-500 bg-blue-50/60" : "border-slate-200"}`}><input type="radio" className="mr-2 accent-blue-600" checked={paymentChoice === value} onChange={() => setPaymentChoice(value)} /><span className="text-sm font-extrabold">{label}</span><p className="ml-5 mt-1 text-xs text-slate-500">{sub}</p></label>)}</div></div>
        <button disabled={loading || !doctorId} className="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold text-white shadow-lg shadow-blue-100 hover:bg-blue-700 disabled:opacity-50">{loading ? "Đang kiểm tra lịch..." : <>Xác nhận đặt lịch <ArrowRight className="h-4 w-4" /></>}</button>
      </form>
    </Panel>
    <div className="space-y-5"><Panel className="sticky top-[106px] overflow-hidden"><div className="bg-slate-950 p-5 text-white"><p className="text-xs font-bold text-slate-400">TÓM TẮT LỊCH KHÁM</p><h3 className="mt-1 font-extrabold">Chi phí dự kiến</h3></div><div className="space-y-4 p-5"><div className="flex justify-between text-sm"><span className="text-slate-500">Phí khám</span><span className="font-bold">{currency(doctor?.consultationFee ?? 0)}</span></div><div className="flex justify-between text-sm"><span className="text-slate-500">BHYT chi trả</span><span className="font-bold text-emerald-600">- {currency((doctor?.consultationFee ?? 0) - payable)}</span></div><div className="h-px bg-slate-200" /><div className="flex items-end justify-between"><span className="text-sm font-extrabold">Cần thanh toán</span><span className="text-2xl font-black text-blue-700">{currency(payable)}</span></div><div className="rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800">Chi phí thuốc và xét nghiệm (nếu có) sẽ được cập nhật sau buổi khám.</div></div></Panel></div>
  </div>;
}

function PatientAppointments({ data, mutate }: { data: BootstrapData; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const [filter, setFilter] = useState("ALL");
  const appointments = filter === "ALL" ? data.appointments : data.appointments.filter((item) => item.status === filter);
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-extrabold tracking-tight">Lịch khám của tôi</h2><p className="mt-1 text-sm text-slate-500">Theo dõi đầy đủ vòng đời lịch hẹn và thanh toán.</p></div><div className="flex gap-2 overflow-x-auto">{[["ALL", "Tất cả"], ["CONFIRMED", "Sắp tới"], ["COMPLETED", "Hoàn tất"], ["CANCELLED", "Đã hủy"]].map(([value, label]) => <button key={value} onClick={() => setFilter(value)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-xs font-extrabold ${filter === value ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-600"}`}>{label}</button>)}</div></div>
    <div className="grid gap-4">{appointments.length ? appointments.map((item) => <Panel key={item.id} className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><div className="flex flex-1 gap-4"><div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-blue-50 text-center text-blue-700"><div><p className="text-xl font-black leading-none">{new Date(`${item.scheduledDate}T00:00:00`).getDate()}</p><p className="mt-1 text-[9px] font-extrabold">TH {new Date(`${item.scheduledDate}T00:00:00`).getMonth() + 1}</p></div></div><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">{item.doctorName}</h3><StatusBadge status={item.status} /><StatusBadge status={item.paymentStatus} /></div><p className="mt-1 text-sm text-slate-500">{item.specialty} · {item.room}</p><p className="mt-2 text-xs text-slate-500">{item.reason}</p><div className="mt-3 flex flex-wrap gap-4 text-xs font-bold text-slate-600"><span className="flex items-center gap-1.5"><Clock3 className="h-4 w-4 text-blue-600" />{item.scheduledTime}</span><span>{item.appointmentCode}</span>{item.queueToken && <span className="font-extrabold text-emerald-700">Số chờ {item.queueToken}</span>}</div></div></div><div className="flex flex-wrap gap-2 lg:justify-end">{item.paymentStatus === "PENDING" && <button onClick={() => mutate("payAppointment", { appointmentId: item.id, method: "BANK" }, "Thanh toán mô phỏng thành công")} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white">Thanh toán ngay</button>}{item.status === "CONFIRMED" && !item.queueToken && <button onClick={() => mutate("checkIn", { appointmentId: item.id }, "Check-in thành công")} className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-extrabold text-white">Check-in</button>}{item.status === "CONFIRMED" && <button onClick={() => mutate("cancelAppointment", { appointmentId: item.id, reason: "Bệnh nhân chủ động hủy" }, "Đã hủy lịch hẹn")} className="rounded-xl border border-rose-200 px-4 py-2.5 text-xs font-extrabold text-rose-600 hover:bg-rose-50">Hủy lịch</button>}</div></div></Panel>) : <Panel><EmptyState icon={<CalendarDays />} title="Không có lịch phù hợp" text="Thử chọn một trạng thái khác." /></Panel>}</div>
  </div>;
}

function PrescriptionPage({ records }: { records: MedicalRecord[] }) {
  return <div className="space-y-5"><div><h2 className="text-2xl font-extrabold tracking-tight">Hồ sơ và đơn thuốc</h2><p className="mt-1 text-sm text-slate-500">Lịch sử chẩn đoán và hướng dẫn sử dụng thuốc từ bác sĩ.</p></div>{records.length ? records.map((record) => <Panel key={record.id} className="overflow-hidden"><div className="flex flex-col justify-between gap-3 border-b border-slate-100 bg-slate-50/70 p-5 sm:flex-row sm:items-center"><div><p className="text-xs font-bold text-blue-600">NGÀY KHÁM {formatDate(record.visitDate)}</p><h3 className="mt-1 font-extrabold">{record.diagnosis}</h3><p className="mt-1 text-xs text-slate-500">Bác sĩ: {record.doctorName}</p></div><StatusBadge status={record.prescriptionStatus ?? "COMPLETED"} /></div><div className="grid gap-6 p-5 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Ghi chú lâm sàng</p><p className="mt-3 text-sm leading-6 text-slate-600">{record.notes}</p>{record.reExamDate && <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs font-bold text-blue-800"><CalendarDays className="mr-2 inline h-4 w-4" />Tái khám: {formatDate(record.reExamDate)}</div>}</div><div><p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-slate-400">Thuốc được kê</p><div className="space-y-2">{record.items.map((item, index) => <div key={item.id ?? index} className="flex gap-3 rounded-xl border border-slate-100 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-violet-50 text-violet-600"><Pill className="h-4 w-4" /></span><div><p className="text-sm font-extrabold">{item.medicineName} · {item.dosage}</p><p className="mt-1 text-xs text-slate-500">{item.frequency} trong {item.durationDays} ngày · {item.instruction}</p></div></div>)}</div></div></div></Panel>) : <Panel><EmptyState icon={<FileHeart />} title="Chưa có hồ sơ khám" text="Hồ sơ sẽ được tạo sau khi bác sĩ hoàn tất buổi khám." /></Panel>}</div>;
}

function InvoicePage({ data, mutate }: { data: BootstrapData; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean> }) {
  return <div className="space-y-5"><div><h2 className="text-2xl font-extrabold tracking-tight">Hóa đơn y tế</h2><p className="mt-1 text-sm text-slate-500">Chi tiết phí khám, thuốc và phần BHYT hỗ trợ.</p></div><div className="grid gap-4">{data.invoices.map((invoice) => <Panel key={invoice.id} className="p-5 sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-center"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><ReceiptText className="h-6 w-6" /></span><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-extrabold">Hóa đơn {invoice.appointmentCode}</h3><StatusBadge status={invoice.status} /></div><div className="mt-3 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-2 text-xs sm:grid-cols-4"><div><p className="text-slate-400">Phí khám</p><p className="mt-1 font-bold">{currency(invoice.serviceFee)}</p></div><div><p className="text-slate-400">Tiền thuốc</p><p className="mt-1 font-bold">{currency(invoice.medicineFee)}</p></div><div><p className="text-slate-400">BHYT giảm</p><p className="mt-1 font-bold text-emerald-600">-{currency(invoice.insuranceDiscount)}</p></div><div><p className="text-slate-400">Tổng cộng</p><p className="mt-1 font-extrabold text-blue-700">{currency(invoice.total)}</p></div></div></div>{invoice.status === "PENDING" && <button onClick={() => mutate("payAppointment", { appointmentId: invoice.appointmentId, method: "BANK" }, "Thanh toán mô phỏng thành công")} className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-extrabold text-white">Thanh toán</button>}</div></Panel>)}</div></div>;
}

function PatientProfile({ profile, userEmail }: { profile: Patient; userEmail: string }) {
  const fields = [["Mã bệnh nhân", profile.patientCode], ["Email", userEmail], ["Số điện thoại", profile.phone], ["Ngày sinh", formatDate(profile.dateOfBirth)], ["Giới tính", profile.gender], ["Nhóm máu", profile.bloodType], ["Địa chỉ", profile.address], ["Liên hệ khẩn cấp", profile.emergencyContact]];
  return <div className="grid gap-6 xl:grid-cols-[340px_1fr]"><Panel className="p-6 text-center"><span className="mx-auto grid h-24 w-24 place-items-center rounded-[28px] bg-gradient-to-br from-blue-600 to-cyan-400 text-3xl font-black text-white">{profile.fullName.split(" ").slice(-1)[0][0]}</span><h2 className="mt-4 text-xl font-extrabold">{profile.fullName}</h2><p className="mt-1 text-sm text-slate-500">Bệnh nhân · {profile.patientCode}</p><div className="mt-6 rounded-2xl bg-cyan-50 p-4 text-left"><div className="flex items-center gap-2 text-cyan-700"><ShieldCheck className="h-5 w-5" /><p className="text-sm font-extrabold">Bảo hiểm y tế</p></div><p className="mt-3 text-sm font-bold">{profile.insuranceNumber}</p><p className="mt-1 text-xs text-cyan-700">Mức hưởng hiện tại: {profile.insuranceLevel}%</p></div></Panel><Panel className="p-6"><h3 className="font-extrabold">Thông tin cá nhân</h3><p className="mt-1 text-xs text-slate-500">Thông tin dùng cho hồ sơ khám bệnh điện tử.</p><div className="mt-6 grid gap-5 sm:grid-cols-2">{fields.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"><p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-sm font-bold">{value}</p></div>)}</div></Panel></div>;
}

function DoctorDashboard({ data, openConsultation, setActive }: { data: BootstrapData; openConsultation: (appointment: Appointment) => Promise<void>; setActive: (value: string) => void }) {
  const appointments = data.appointments.filter((item) => item.scheduledDate === today && item.status !== "CANCELLED").sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  const waiting = appointments.filter((item) => item.status === "CONFIRMED").length;
  const completed = appointments.filter((item) => item.status === "COMPLETED").length;
  const current = appointments.find((item) => item.status === "IN_CONSULTATION");
  return <div className="space-y-6"><section className="flex flex-col justify-between gap-5 rounded-[28px] bg-slate-950 p-6 text-white sm:p-8 lg:flex-row lg:items-center"><div><p className="text-sm font-bold text-blue-300">Chào buổi làm việc, {data.user.fullName}</p><h2 className="mt-2 text-3xl font-extrabold tracking-tight">Hôm nay có {appointments.length} lịch khám</h2><p className="mt-2 text-sm text-slate-400">Danh sách được cập nhật trực tiếp từ cơ sở dữ liệu bệnh viện.</p></div><button onClick={() => setActive("schedule")} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-extrabold hover:bg-blue-500"><CalendarDays className="h-4 w-4" />Xem lịch khám</button></section>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard icon={<UsersRound className="text-blue-600" />} value={appointments.length} label="Bệnh nhân hôm nay" tone="bg-blue-50" /><MetricCard icon={<AlarmClock className="text-amber-600" />} value={waiting} label="Đang chờ khám" tone="bg-amber-50" /><MetricCard icon={<Stethoscope className="text-violet-600" />} value={current ? 1 : 0} label="Đang khám" tone="bg-violet-50" /><MetricCard icon={<CheckCircle2 className="text-emerald-600" />} value={completed} label="Đã hoàn tất" tone="bg-emerald-50" /></div>
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]"><Panel className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-5"><div><h3 className="font-extrabold">Hàng đợi hôm nay</h3><p className="mt-1 text-xs text-slate-500">Ưu tiên theo khung giờ đã đặt</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[11px] font-extrabold text-blue-700">{waiting} đang chờ</span></div><div className="divide-y divide-slate-100">{appointments.slice(0, 5).map((item) => <div key={item.id} className="flex items-center gap-4 p-4 sm:p-5"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-extrabold">{item.patientName.split(" ").slice(-1)[0][0]}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-extrabold">{item.patientName}</p><p className="mt-1 text-xs text-slate-500">{item.scheduledTime} · {item.patientCode} · {item.reason}</p></div>{item.queueToken && <span className="hidden text-xs font-extrabold text-blue-700 sm:inline">{item.queueToken}</span>}<StatusBadge status={item.status} />{["CONFIRMED", "IN_CONSULTATION"].includes(item.status) && <button onClick={() => openConsultation(item)} className="rounded-xl bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white">{item.status === "IN_CONSULTATION" ? "Tiếp tục" : "Khám"}</button>}</div>)}</div></Panel><Panel className="p-5"><h3 className="font-extrabold">Tiến độ trong ngày</h3><p className="mt-1 text-xs text-slate-500">Tổng quan năng suất buổi khám</p><div className="mt-6 flex justify-center"><div className="relative grid h-44 w-44 place-items-center rounded-full" style={{ background: `conic-gradient(#2563eb ${appointments.length ? (completed / appointments.length) * 360 : 0}deg, #e8eef8 0deg)` }}><div className="grid h-32 w-32 place-items-center rounded-full bg-white text-center"><div><p className="text-3xl font-black">{appointments.length ? Math.round(completed / appointments.length * 100) : 0}%</p><p className="text-xs font-bold text-slate-400">Hoàn tất</p></div></div></div></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-3"><p className="text-lg font-black text-emerald-700">{completed}</p><p className="text-[10px] font-bold text-emerald-700">Đã khám</p></div><div className="rounded-xl bg-amber-50 p-3"><p className="text-lg font-black text-amber-700">{waiting}</p><p className="text-[10px] font-bold text-amber-700">Chờ khám</p></div></div></Panel></div>
  </div>;
}

function DoctorSchedule({ data, mutate, openConsultation }: { data: BootstrapData; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean>; openConsultation: (appointment: Appointment) => Promise<void> }) {
  const [date, setDate] = useState(today);
  const appointments = data.appointments.filter((item) => item.scheduledDate === date).sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-extrabold tracking-tight">Lịch khám bệnh nhân</h2><p className="mt-1 text-sm text-slate-500">Bắt đầu khám hoặc báo lịch công tác đột xuất.</p></div><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-blue-500" /></div><Panel className="overflow-hidden">{appointments.length ? <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-[10px] font-extrabold uppercase tracking-wider text-slate-400"><tr><th className="px-5 py-4">Thời gian</th><th className="px-5 py-4">Bệnh nhân</th><th className="px-5 py-4">Lý do khám</th><th className="px-5 py-4">BHYT / Thanh toán</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-slate-100">{appointments.map((item) => <tr key={item.id} className="hover:bg-blue-50/30"><td className="px-5 py-4"><p className="font-extrabold">{item.scheduledTime}</p><p className="mt-1 text-xs text-slate-400">{item.queueToken ?? "Chưa check-in"}</p></td><td className="px-5 py-4"><p className="text-sm font-extrabold">{item.patientName}</p><p className="mt-1 text-xs text-slate-500">{item.patientCode} · {item.patientPhone}</p></td><td className="max-w-[240px] px-5 py-4 text-sm text-slate-600">{item.reason}</td><td className="px-5 py-4"><p className="text-xs font-bold text-cyan-700">BHYT {item.insuranceCoverage}%</p><p className="mt-1 text-xs text-slate-500">{currency(item.feePayable)}</p></td><td className="px-5 py-4"><StatusBadge status={item.status} /></td><td className="px-5 py-4"><div className="flex justify-end gap-2">{["CONFIRMED", "IN_CONSULTATION"].includes(item.status) && <button onClick={() => openConsultation(item)} className="rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-extrabold text-white">{item.status === "IN_CONSULTATION" ? "Tiếp tục khám" : "Bắt đầu khám"}</button>}{item.status === "CONFIRMED" && <button onClick={() => mutate("doctorEmergency", { appointmentId: item.id, reason: "Lịch công tác đột xuất" }, "Đã gửi thông báo đổi lịch cho bệnh nhân")} className="rounded-lg border border-amber-200 px-3 py-2 text-[11px] font-extrabold text-amber-700">Báo bận</button>}</div></td></tr>)}</tbody></table></div> : <EmptyState icon={<CalendarDays />} title="Không có lịch khám" text="Chọn ngày khác để xem lịch." />}</Panel></div>;
}

function ConsultationWorkspace({ data, selectedId, setSelectedId, mutate }: { data: BootstrapData; selectedId: string | null; setSelectedId: (value: string | null) => void; mutate: (action: string, payload: Record<string, unknown>, message: string) => Promise<boolean> }) {
  const candidates = data.appointments.filter((item) => item.status === "IN_CONSULTATION");
  const appointment = data.appointments.find((item) => item.id === selectedId && item.status === "IN_CONSULTATION") ?? candidates[0];
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [reExamDate, setReExamDate] = useState("");
  const [medicines, setMedicines] = useState<PrescriptionItem[]>([{ medicineName: "", dosage: "1 viên", frequency: "2 lần/ngày", durationDays: 7, instruction: "Uống sau ăn", unitPrice: 50000 }]);
  const history = appointment ? data.records.filter((record) => record.patientId === appointment.patientId) : [];

  if (!appointment) return <Panel><EmptyState icon={<Stethoscope />} title="Chưa có buổi khám đang diễn ra" text="Vào Lịch khám và bấm Bắt đầu khám cho một bệnh nhân." /></Panel>;
  const updateMedicine = (index: number, key: keyof PrescriptionItem, value: string | number) => setMedicines((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const complete = async (event: FormEvent) => {
    event.preventDefault();
    const success = await mutate("completeConsultation", { appointmentId: appointment.id, diagnosis, notes, reExamDate, medicines }, "Hoàn tất khám và phát hành đơn thuốc");
    if (success) { setSelectedId(null); setDiagnosis(""); setNotes(""); setReExamDate(""); setMedicines([{ medicineName: "", dosage: "1 viên", frequency: "2 lần/ngày", durationDays: 7, instruction: "Uống sau ăn", unitPrice: 50000 }]); }
  };

  return <div className="space-y-5"><div className="flex flex-col justify-between gap-4 rounded-2xl bg-amber-50 p-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-500 text-white"><Activity className="h-5 w-5" /></span><div><p className="text-sm font-extrabold text-amber-950">Đang khám: {appointment.patientName}</p><p className="mt-1 text-xs text-amber-700">{appointment.patientCode} · {appointment.reason}</p></div></div><StatusBadge status="IN_CONSULTATION" /></div>
    <form onSubmit={complete} className="grid gap-5 xl:grid-cols-[0.78fr_1.22fr]"><div className="space-y-5"><Panel className="p-5"><div className="flex items-center gap-4"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-blue-600 text-xl font-black text-white">{appointment.patientName.split(" ").slice(-1)[0][0]}</span><div><h3 className="font-extrabold">{appointment.patientName}</h3><p className="mt-1 text-xs text-slate-500">{appointment.patientCode} · {appointment.patientPhone}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400">BHYT</p><p className="mt-1 text-sm font-extrabold">{appointment.insuranceCoverage}%</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold text-slate-400">PHÒNG KHÁM</p><p className="mt-1 text-sm font-extrabold">{appointment.room}</p></div></div></Panel><Panel className="overflow-hidden"><div className="border-b border-slate-100 p-5"><h3 className="font-extrabold">Lịch sử khám</h3><p className="mt-1 text-xs text-slate-500">Đơn thuốc và chẩn đoán trước đây</p></div>{history.length ? history.map((record) => <div key={record.id} className="border-b border-slate-100 p-5 last:border-0"><p className="text-[10px] font-extrabold text-blue-600">{formatDate(record.visitDate)}</p><p className="mt-1 text-sm font-extrabold">{record.diagnosis}</p><p className="mt-2 text-xs leading-5 text-slate-500">{record.notes}</p><div className="mt-3 space-y-1">{record.items.map((item, index) => <p key={item.id ?? index} className="text-xs font-bold text-violet-700">• {item.medicineName} — {item.dosage}</p>)}</div></div>) : <EmptyState icon={<FileHeart />} title="Chưa có tiền sử" text="Đây là lần khám đầu tiên." />}</Panel></div>
      <Panel className="p-5 sm:p-6"><div className="mb-6"><h3 className="text-lg font-extrabold">Kết quả khám và kê đơn</h3><p className="mt-1 text-xs text-slate-500">Dữ liệu được lưu vào hồ sơ bệnh án sau khi hoàn tất.</p></div><div className="grid gap-4 sm:grid-cols-2"><label><span className="mb-2 block text-xs font-extrabold">Chẩn đoán *</span><input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Ví dụ: Tăng huyết áp độ 1" className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500" required /></label><label><span className="mb-2 block text-xs font-extrabold">Ngày tái khám</span><input type="date" min={tomorrow} value={reExamDate} onChange={(e) => setReExamDate(e.target.value)} className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-blue-500" /></label></div><label className="mt-4 block"><span className="mb-2 block text-xs font-extrabold">Ghi chú lâm sàng *</span><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} placeholder="Triệu chứng, chỉ số và hướng dẫn theo dõi..." className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-blue-500" required /></label><div className="mt-6 flex items-center justify-between"><div><p className="text-sm font-extrabold">Đơn thuốc điện tử</p><p className="mt-1 text-xs text-slate-500">Có thể thêm nhiều loại thuốc</p></div><button type="button" onClick={() => setMedicines((current) => [...current, { medicineName: "", dosage: "1 viên", frequency: "1 lần/ngày", durationDays: 7, instruction: "Uống sau ăn", unitPrice: 0 }])} className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2 text-xs font-extrabold text-violet-700"><Plus className="h-4 w-4" />Thêm thuốc</button></div><div className="mt-4 space-y-3">{medicines.map((medicine, index) => <div key={index} className="rounded-2xl border border-slate-200 p-4"><div className="mb-3 flex items-center justify-between"><p className="text-xs font-extrabold text-violet-700">THUỐC {index + 1}</p>{medicines.length > 1 && <button type="button" onClick={() => setMedicines((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="text-rose-500"><Trash2 className="h-4 w-4" /></button>}</div><div className="grid gap-3 sm:grid-cols-2"><input value={medicine.medicineName} onChange={(e) => updateMedicine(index, "medicineName", e.target.value)} placeholder="Tên thuốc và hàm lượng" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /><input value={medicine.dosage} onChange={(e) => updateMedicine(index, "dosage", e.target.value)} placeholder="Liều dùng" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /><input value={medicine.frequency} onChange={(e) => updateMedicine(index, "frequency", e.target.value)} placeholder="Tần suất" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /><input type="number" min="1" value={medicine.durationDays} onChange={(e) => updateMedicine(index, "durationDays", Number(e.target.value))} placeholder="Số ngày" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /><input value={medicine.instruction} onChange={(e) => updateMedicine(index, "instruction", e.target.value)} placeholder="Hướng dẫn dùng" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /><input type="number" min="0" step="1000" value={medicine.unitPrice} onChange={(e) => updateMedicine(index, "unitPrice", Number(e.target.value))} placeholder="Giá thuốc" className="h-11 rounded-xl bg-slate-50 px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200" required /></div></div>)}</div><div className="mt-6 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500"><ShieldCheck className="mr-1 inline h-4 w-4 text-emerald-600" />Hoàn tất sẽ tạo đơn thuốc, hóa đơn và lịch tái khám.</p><button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-emerald-700"><ClipboardCheck className="h-4 w-4" />Hoàn tất khám</button></div></Panel></form>
  </div>;
}

function DoctorPatients({ data, openConsultation }: { data: BootstrapData; openConsultation: (appointment: Appointment) => Promise<void> }) {
  const patients = useMemo(() => {
    const map = new Map<string, Appointment>();
    data.appointments.forEach((item) => { if (!map.has(item.patientId)) map.set(item.patientId, item); });
    return [...map.values()];
  }, [data.appointments]);
  return <div className="space-y-5"><div><h2 className="text-2xl font-extrabold tracking-tight">Danh sách bệnh nhân</h2><p className="mt-1 text-sm text-slate-500">Bệnh nhân đã có lịch hoặc hồ sơ với bác sĩ.</p></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{patients.map((patient) => { const records = data.records.filter((record) => record.patientId === patient.patientId); const active = data.appointments.find((item) => item.patientId === patient.patientId && ["CONFIRMED", "IN_CONSULTATION"].includes(item.status)); return <Panel key={patient.patientId} className="p-5"><div className="flex items-center gap-4"><span className="grid h-13 w-13 place-items-center rounded-2xl bg-blue-50 text-lg font-black text-blue-700">{patient.patientName.split(" ").slice(-1)[0][0]}</span><div><h3 className="font-extrabold">{patient.patientName}</h3><p className="mt-1 text-xs text-slate-500">{patient.patientCode} · {patient.patientPhone}</p></div></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">HỒ SƠ KHÁM</p><p className="mt-1 font-extrabold">{records.length}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">LỊCH GẦN NHẤT</p><p className="mt-1 text-xs font-extrabold">{formatDate(patient.scheduledDate)}</p></div></div>{active && <button onClick={() => openConsultation(active)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-extrabold text-white"><Stethoscope className="h-4 w-4" />{active.status === "IN_CONSULTATION" ? "Tiếp tục khám" : "Bắt đầu khám"}</button>}</Panel>; })}</div></div>;
}

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const [data, setData] = useState<BootstrapData | null>(null);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState<{ message: string; kind: "success" | "error" } | null>(null);

  const notify = (message: string, kind: "success" | "error" = "success") => {
    setToast({ message, kind });
    window.setTimeout(() => setToast(null), 3200);
  };

  const refresh = useCallback(async (activeToken?: string) => {
    const current = activeToken ?? token;
    if (!current) return;
    try { setData(await api<BootstrapData>(current)); }
    catch { localStorage.removeItem("hms_token"); setToken(null); setData(null); }
  }, [token]);

  useEffect(() => {
    const stored = localStorage.getItem("hms_token");
    if (stored) { setToken(stored); api<BootstrapData>(stored).then(setData).catch(() => { localStorage.removeItem("hms_token"); setToken(null); }).finally(() => setReady(true)); }
    else setReady(true);
  }, []);

  const login = async (role: Role, email: string, password: string) => {
    const result = await api<{ token: string }>(null, "login", { role, email, password });
    localStorage.setItem("hms_token", result.token);
    setToken(result.token);
    setData(await api<BootstrapData>(result.token));
  };

  const logout = async () => {
    if (token) await api(token, "logout").catch(() => undefined);
    localStorage.removeItem("hms_token"); setToken(null); setData(null);
  };

  if (!ready || (token && !data)) return <main className="grid min-h-screen place-items-center bg-[#f5f8fc]"><div className="text-center"><span className="mx-auto grid h-16 w-16 animate-pulse place-items-center rounded-2xl bg-blue-600"><HeartPulse className="h-8 w-8 text-white" /></span><p className="mt-4 text-sm font-bold text-slate-500">Đang tải dữ liệu bệnh viện...</p></div></main>;

  return <>{token && data ? <AppShell data={data} token={token} refresh={() => refresh()} onLogout={logout} notify={notify} /> : <LoginPage onLogin={login} />}{toast && <div className={`fixed bottom-5 right-5 z-[100] flex max-w-sm items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold text-white shadow-2xl ${toast.kind === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>{toast.kind === "success" ? <CheckCircle2 className="h-5 w-5" /> : <X className="h-5 w-5" />}{toast.message}</div>}</>;
}
