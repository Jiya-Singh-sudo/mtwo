import { User, LogOut } from "lucide-react";

type Props = {
  name: string;
  role: string;
  onLogout: () => void;
};
export default function HeaderUserChip({ name, role, onLogout }: Props) {
  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-xl shadow-sm border border-gray-200">
      
      {/* Avatar */}
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-600">
        <User size={18} />
      </div>

      {/* Text */}
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold text-gray-800">{name}</span>
        <span className="text-xs text-gray-500">{role}</span>
      </div>

      {/* Logout */}
      <button
        onClick={onLogout}
        className="ml-2 p-2 rounded-lg hover:bg-red-50 transition"
      >
        <LogOut size={18} className="text-gray-500 hover:text-red-500" />
      </button>
    </div>
  );
}
// export default function HeaderUserChip({ name, role, onLogout }: Props) {
//   return (
//     <div className="headerUserBox">
//       <div className="headerUserIcon">
//         <User size={18} />
//       </div>

//       <div className="headerUserText">
//         <span className="headerUserName">{name}</span>
//         <span className="headerUserRole">{role}</span>
//       </div>

//       <button className="headerLogoutBtn" onClick={onLogout} aria-label="Logout">
//         <LogOut size={18} />
//       </button>
//     </div>
//   );
// }
