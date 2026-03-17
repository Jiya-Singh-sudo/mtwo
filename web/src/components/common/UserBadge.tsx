import { User, LogOut } from "lucide-react";

type Props = {
  name: string;
  role: string;
  onLogout: () => void;
};

export default function HeaderUserChip({ name, role, onLogout }: Props) {
  return (
    <div className="headerUserBox">
      <div className="headerUserIcon">
        <User size={18} />
      </div>

      <div className="headerUserText">
        <span className="headerUserName">{name}</span>
        <span className="headerUserRole">{role}</span>
      </div>

      <button className="headerLogoutBtn" onClick={onLogout} aria-label="Logout">
        <LogOut size={18} />
      </button>
    </div>
  );
}
