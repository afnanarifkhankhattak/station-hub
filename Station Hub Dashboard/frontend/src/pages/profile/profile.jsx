
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/api";
import { useTheme } from "../../context/theme.Context";

// ── SVG Icons ─────────────────────────────────────────────
const IconUser = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
    />
  </svg>
);
const IconMail = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
    />
  </svg>
);
const IconPhone = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
    />
  </svg>
);
const IconCalendar = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const IconLock = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
    />
  </svg>
);
const IconEye = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);
const IconEyeOff = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
    />
  </svg>
);
const IconCamera = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
    />
  </svg>
);
const IconLogout = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);
const IconCheck = () => (
  <svg
    className="w-3 h-3"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);
const IconWarning = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
    />
  </svg>
);
const IconUpload = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
    />
  </svg>
);

// ── Feedback message ──────────────────────────────────────
const Msg = ({ msg }) => {
  if (!msg) return null;
  const isOk = msg.startsWith("ok:");
  return (
    <p
      className={`text-xs font-medium mt-1 ${isOk ? "text-green-500" : "text-red-500"}`}
    >
      {isOk ? "✓ " : "✕ "}
      {msg.slice(3)}
    </p>
  );
};

// ── Sub-components OUTSIDE Profile to prevent re-render focus loss ──
const InputWrap = ({
  label,
  icon,
  disabled,
  children,
  inpDis,
  inp,
  lbl,
  iconClr,
}) => (
  <div>
    <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>{label}</label>
    <div
      className={`flex items-center gap-2 border rounded-xl px-3 h-10 transition-all ${disabled ? inpDis : inp}`}
    >
      <span className={`flex-shrink-0 ${iconClr}`}>{icon}</span>
      {children}
    </div>
  </div>
);

const PassField = ({
  label,
  value,
  onChange,
  show,
  onToggle,
  inp,
  lbl,
  iconClr,
  inpTxt,
  dark: D,
}) => (
  <InputWrap
    label={label}
    icon={<IconLock />}
    inp={inp}
    lbl={lbl}
    iconClr={iconClr}
  >
    <input
      type={show ? "text" : "password"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="••••••••"
      className={`flex-1 bg-transparent outline-none text-sm placeholder-gray-500 ${inpTxt}`}
    />
    <button
      type="button"
      onClick={onToggle}
      className={`flex-shrink-0 transition-colors ${D ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
    >
      {show ? <IconEyeOff /> : <IconEye />}
    </button>
  </InputWrap>
);

const SaveBtn = ({ onClick, loading: l, label = "Save Changes" }) => (
  <button
    onClick={onClick}
    disabled={l}
    className="text-xs font-semibold bg-orange-500 hover:bg-orange-600 active:scale-95 text-white px-5 py-2 rounded-xl transition-all shadow-sm disabled:opacity-60 cursor-pointer"
  >
    {l ? "Saving…" : label}
  </button>
);

// ── Main Component ────────────────────────────────────────
const Profile = () => {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // ── Theme — read-only here, controlled from Settings ──
  // const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  // Keep in sync if user toggled theme in Settings tab and comes back
  // useEffect(() => {
  //   const sync = () => setDark(localStorage.getItem('theme') === 'dark')
  //   window.addEventListener('storage', sync)
  //   // also sync on focus (switching tabs)
  //   window.addEventListener('focus', sync)
  //   return () => {
  //     window.removeEventListener('storage', sync)
  //     window.removeEventListener('focus', sync)
  //   }
  // }, [])
  const { dark } = useTheme();

  // ── Fetch profile from DB ──────────────────────────────
  const stored = JSON.parse(localStorage.getItem("user") || "{}");
  const [fullName, setFullName] = useState(stored.full_name || "");
  const [phone, setPhone] = useState(stored.phone || "");
  const [dob, setDob] = useState(stored.dob || "");
  const [avatar, setAvatar] = useState(stored.avatar_url || null);
  const [pageLoad, setPageLoad] = useState(true);
  const [profileMsg, setProfileMsg] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = JSON.parse(localStorage.getItem("user") || "{}");
        // console.log("stored.avatar_url:", stored.avatar_url); // ← add this

        const data = await api.get("/profile/");
        const user = data.user || data;
        console.log("api user object:", user);
        setFullName(user.full_name || "");
        setPhone(user.phone || "");
        setDob(user.dob || "");
        const googleAvatar = stored.avatar_url;
        const apiAvatar =
          user.profile_image && user.profile_image !== ""
            ? user.profile_image
            : null;

        setAvatar(apiAvatar || googleAvatar || null);

        localStorage.setItem(
          "user",
          JSON.stringify({
            ...stored,
            ...user,
            avatar_url: apiAvatar || googleAvatar || null,
          }),
        );
      } catch {
        /* use localStorage fallback */
      } finally {
        setPageLoad(false);
      }
    })();
  }, []);

  const initials = fullName
    ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (stored.email || "SJ").slice(0, 2).toUpperCase();

  // ── Save profile ───────────────────────────────────────
  const handleProfileSave = async () => {
    if (!fullName.trim()) {
      setProfileMsg("err:Full name is required");
      return;
    }
    setProfileSaving(true);
    setProfileMsg("");
    try {
      await api.put("/profile/", { full_name: fullName, phone, dob });
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, full_name: fullName, phone, dob }),
      );
      setProfileMsg("ok:Profile saved successfully");
    } catch (e) {
      setProfileMsg("err:" + (e.message || "Save failed"));
    } finally {
      setProfileSaving(false);
    }
  };

  // ── Upload avatar ──────────────────────────────────────
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState("");

  const handleRemoveAvatar = async () => {
    setAvatar(null);
    setAvatarMsg("");
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, avatar_url: null, profile_image: "" }),
      );
      await api.put("/profile/", { profile_image: "" });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg("err:Image must be under 5 MB");
      return;
    }
    setAvatarUploading(true);
    setAvatarMsg("");
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result);
    reader.readAsDataURL(file);
    try {
      const form = new FormData();
      form.append("file", file);
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/profile/upload-avatar`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      setAvatar(data.avatar_url);
      localStorage.setItem(
        "user",
        JSON.stringify({ ...stored, avatar_url: data.avatar_url }),
      );
      setAvatarMsg("ok:Photo updated");
    } catch (e) {
      setAvatarMsg("err:" + (e.message || "Upload failed"));
    } finally {
      setAvatarUploading(false);
    }
  };

  // ── Change password ────────────────────────────────────
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCon, setShowCon] = useState(false);
  const [passMsg, setPassMsg] = useState("");
  const [passSaving, setPassSaving] = useState(false);

  const handlePasswordSave = async () => {
    if (!oldPass || !newPass || !confirmPass) {
      setPassMsg("err:Fill in all fields");
      return;
    }
    if (newPass !== confirmPass) {
      setPassMsg("err:Passwords do not match");
      return;
    }
    if (newPass.length < 6) {
      setPassMsg("err:Minimum 6 characters");
      return;
    }
    if (newPass === oldPass) {
      setPassMsg("err:New password must differ");
      return;
    }
    setPassSaving(true);
    setPassMsg("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/auth/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            old_password: oldPass,
            new_password: newPass,
          }),
        },
      );
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok)
        throw new Error(data.detail || `Request failed: ${res.status}`);
      setPassMsg("ok:Password changed successfully");
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (e) {
      setPassMsg("err:" + (e.message || "Failed"));
    } finally {
      setPassSaving(false);
    }
  };

  // ── Delete account ─────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteConfirm) {
      setDeleteConfirm(true);
      return;
    }
    setDeleting(true);
    setDeleteMsg("");
    try {
      await api.delete("/profile/");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      navigate("/login");
    } catch (e) {
      setDeleteMsg("err:" + (e.message || "Failed"));
      setDeleting(false);
      setDeleteConfirm(false);
    }
  };

  // ── Sign out ───────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // ── Theme tokens ───────────────────────────────────────
  const D = dark;
  const bg = D ? "bg-[#0f1117]" : "bg-gray-50";
  const card = D ? "bg-[#1a1d27] border-[#2a2d3e]" : "bg-white border-gray-100";
  const head = D ? "border-[#2a2d3e]" : "border-gray-100";
  const txt = D ? "text-gray-100" : "text-gray-900";
  const sub = D ? "text-gray-400" : "text-gray-500";
  const lbl = D ? "text-gray-400" : "text-gray-600";
  const hint = D ? "text-gray-600" : "text-gray-400";
  const inp = D
    ? "bg-[#0f1117] border-[#2a2d3e] focus-within:border-orange-500"
    : "bg-gray-50 border-gray-200 focus-within:border-orange-400 focus-within:ring-2 focus-within:ring-orange-100";
  const inpDis = D
    ? "bg-[#0f1117] border-[#2a2d3e]"
    : "bg-gray-100 border-gray-200";
  const inpTxt = D ? "text-gray-100" : "text-gray-700";
  const iconClr = D ? "text-gray-500" : "text-gray-400";

  if (pageLoad)
    return (
      <div
        className={`flex items-center justify-center h-full min-h-[300px] ${bg}`}
      >
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className={`p-6 min-h-full transition-colors duration-300 ${bg}`}>
      {/* ── Header — no theme toggle here, use Settings ── */}
      <div className="mb-6">
        <h1 className={`text-xl font-semibold ${txt}`}>My Profile</h1>
        <p className={`text-sm mt-0.5 ${sub}`}>Manage your personal account</p>
      </div>

      <div className="flex flex-col gap-5 max-w-4xl">
        {/* ══ ROW 1: Profile Info Card ══ */}
        <div className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}>
          <div
            className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${head}`}
          >
            <span className="text-orange-500">
              <IconUser />
            </span>
            <p className={`text-sm font-semibold ${txt}`}>
              Profile Information
            </p>
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Avatar column ── */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                {avatar ? (
                  <img
                    src={avatar}
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover shadow-lg ring-4 ring-orange-500/20"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-orange-500/20">
                    {initials}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center border-2 border-white shadow transition-colors cursor-pointer"
                >
                  <span className="text-white">
                    <IconCamera />
                  </span>
                </button>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />

              <div className="text-center">
                <p className={`text-sm font-semibold ${txt}`}>
                  {fullName || "Your Name"}
                </p>
                <p className={`text-xs mt-0.5 ${sub}`}>{stored.email || ""}</p>
              </div>

              <div className="flex gap-2 w-full">
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarUploading}
                  className={`flex-1 text-xs font-medium border border-orange-200 text-orange-500 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer ${D ? "hover:bg-orange-500/10" : "hover:bg-orange-50"}`}
                >
                  {avatarUploading ? (
                    <>
                      <span className="w-3 h-3 border border-orange-500 border-t-transparent rounded-full animate-spin" />{" "}
                      Uploading…
                    </>
                  ) : (
                    <>
                      <IconUpload /> Upload Photo
                    </>
                  )}
                </button>

                {avatar && (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={avatarUploading}
                    className={`text-xs font-medium border border-red-200 text-red-500 px-4 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 cursor-pointer ${D ? "hover:bg-red-500/10" : "hover:bg-red-50"}`}
                  >
                    <IconTrash />
                  </button>
                )}
              </div>
              <Msg msg={avatarMsg} />

              <div className={`w-full pt-3 border-t space-y-2 ${head}`}>
                <div className="flex items-center justify-between text-xs">
                  <span className={sub}>Status</span>
                  <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <IconCheck /> Active
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className={sub}>Role</span>
                  <span className="text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full">
                    Owner
                  </span>
                </div>
              </div>
            </div>

            {/* ── Fields column ── */}
            <div className="lg:col-span-2 grid grid-cols-2 gap-4 content-start">
              <div className="col-span-2">
                <InputWrap
                  label="Full Name"
                  icon={<IconUser />}
                  inp={inp}
                  lbl={lbl}
                  iconClr={iconClr}
                >
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className={`flex-1 bg-transparent outline-none text-sm ${inpTxt}`}
                  />
                </InputWrap>
              </div>

              <div className="col-span-2">
                <label className={`block text-xs font-medium mb-1.5 ${lbl}`}>
                  Email Address
                </label>
                <div
                  className={`flex items-center gap-2 border rounded-xl px-3 h-10 ${inpDis}`}
                >
                  <span
                    className={`flex-shrink-0 ${D ? "text-gray-600" : "text-gray-400"}`}
                  >
                    <IconMail />
                  </span>
                  <span
                    className={`flex-1 text-sm ${D ? "text-gray-500" : "text-gray-500"}`}
                  >
                    {stored.email || ""}
                  </span>
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                    <IconCheck /> Verified
                  </span>
                </div>
                <p className={`text-xs mt-1 ${hint}`}>
                  Email can only be changed via mobile app
                </p>
              </div>

              <div>
                <InputWrap
                  label="Phone Number"
                  icon={<IconPhone />}
                  inp={inp}
                  lbl={lbl}
                  iconClr={iconClr}
                >
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92-300-0000000"
                    className={`flex-1 bg-transparent outline-none text-sm ${inpTxt}`}
                  />
                </InputWrap>
              </div>

              <div>
                <InputWrap
                  label="Date of Birth"
                  icon={<IconCalendar />}
                  inp={inp}
                  lbl={lbl}
                  iconClr={iconClr}
                >
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={`flex-1 bg-transparent outline-none text-sm ${inpTxt} ${D ? "[color-scheme:dark]" : ""}`}
                  />
                </InputWrap>
              </div>

              <Msg msg={profileMsg} />

              <div
                className={`col-span-2 flex justify-end pt-3 border-t ${head}`}
              >
                <SaveBtn onClick={handleProfileSave} loading={profileSaving} />
              </div>
            </div>
          </div>
        </div>

        {/* ══ ROW 2: Change Password + Danger Zone ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Change Password */}
          <div
            className={`border rounded-2xl shadow-sm overflow-hidden ${card}`}
          >
            <div
              className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${head}`}
            >
              <span className="text-orange-500">
                <IconLock />
              </span>
              <p className={`text-sm font-semibold ${txt}`}>Change Password</p>
            </div>
            <div className="p-5 flex flex-col gap-3.5">
              <PassField
                label="Current Password"
                value={oldPass}
                onChange={setOldPass}
                show={showOld}
                onToggle={() => setShowOld(!showOld)}
                inp={inp}
                lbl={lbl}
                iconClr={iconClr}
                inpTxt={inpTxt}
                dark={D}
              />
              <PassField
                label="New Password"
                value={newPass}
                onChange={setNewPass}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                inp={inp}
                lbl={lbl}
                iconClr={iconClr}
                inpTxt={inpTxt}
                dark={D}
              />
              <PassField
                label="Confirm New Password"
                value={confirmPass}
                onChange={setConfirmPass}
                show={showCon}
                onToggle={() => setShowCon(!showCon)}
                inp={inp}
                lbl={lbl}
                iconClr={iconClr}
                inpTxt={inpTxt}
                dark={D}
              />
              <Msg msg={passMsg} />
              <div className={`flex justify-end pt-3 border-t ${head}`}>
                <SaveBtn
                  onClick={handlePasswordSave}
                  loading={passSaving}
                  label="Update Password"
                />
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div
            className={`border rounded-2xl shadow-sm overflow-hidden ${D ? "bg-[#1a1d27] border-red-900/40" : "bg-white border-red-100"}`}
          >
            <div
              className={`flex items-center gap-2.5 px-5 py-3.5 border-b ${D ? "border-red-900/40 bg-red-900/10" : "border-red-100 bg-red-50/40"}`}
            >
              <span className="text-red-500">
                <IconWarning />
              </span>
              <p className="text-sm font-semibold text-red-500">Danger Zone</p>
            </div>
            <div className="p-5 flex flex-col gap-4">
              {/* Sign Out */}
              <div
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${D ? "bg-[#0f1117] border-[#2a2d3e]" : "bg-gray-50 border-gray-100"}`}
              >
                <div>
                  <p className={`text-sm font-medium ${txt}`}>Sign Out</p>
                  <p className={`text-xs mt-0.5 ${sub}`}>
                    End your current session
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-colors flex-shrink-0 cursor-pointer ${
                    D
                      ? "text-gray-300 border-[#2a2d3e] hover:bg-[#2a2d3e]"
                      : "text-gray-600 border-gray-300 hover:bg-gray-100"
                  }`}
                >
                  <IconLogout /> Sign Out
                </button>
              </div>

              {/* Delete Account */}
              <div
                className={`flex items-center justify-between gap-4 p-4 rounded-xl border ${D ? "bg-red-900/10 border-red-900/30" : "bg-red-50/50 border-red-100"}`}
              >
                <div>
                  <p className={`text-sm font-medium ${txt}`}>Delete Account</p>
                  <p
                    className={`text-xs mt-0.5 ${deleteConfirm ? "text-red-400 font-medium" : sub}`}
                  >
                    {deleteConfirm
                      ? "⚠ Click again to confirm — cannot be undone"
                      : "Permanently remove all your data"}
                  </p>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`text-xs font-semibold flex items-center gap-1.5 px-4 py-2 rounded-xl border transition-all flex-shrink-0 cursor-pointer disabled:opacity-60 ${
                    deleteConfirm
                      ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
                      : "text-red-500 border-red-200 hover:bg-red-50"
                  }`}
                >
                  <IconTrash />{" "}
                  {deleting
                    ? "Deleting…"
                    : deleteConfirm
                      ? "Confirm"
                      : "Delete"}
                </button>
              </div>

              <Msg msg={deleteMsg} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
