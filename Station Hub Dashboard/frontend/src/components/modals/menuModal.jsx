import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/theme.Context";

export default function UserMenuModal({ isOpen, onClose, position }) {
  const navigate = useNavigate();
  const { dark, toggleTheme } = useTheme();
  const txt = dark ? "text-gray-100" : "text-gray-900";

  if (!isOpen) return null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div
        style={{ top: position.top, left: position.left }}
        className={`absolute flex flex-col items-center justify-center w-47 rounded-lg shadow-lg border py-2 ${
          dark ? "bg-[#1a1d27] border-gray-50" : "bg-white border-gray-300"
        }`}
      >
        <button
          onClick={() => toggleTheme(dark ? "light" : "dark")}
          className={`w-44 text-left px-3 py-2 hover:cursor-pointer hover:bg-gray-500/20 rounded-lg text-sm flex items-center justify-between ${txt}`}
        >
          {dark ? "Dark Mode" : "Light Mode"}
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark ? "white" : "currentColor"} strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={dark ? "white" : "currentColor"} strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          )}
        </button>

        <hr className="border-[#9CA3AF] w-[170px] ml-1 my-2 " />

        <button
          onClick={handleLogout}
          className={`w-44 text-left px-3 py-2 hover:cursor-pointer hover:bg-red-500/40 rounded-lg text-sm flex items-center justify-between ${txt}`}
        >
          Logout
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            className={dark ? "stroke-white" : "stroke-gray-700"}
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
