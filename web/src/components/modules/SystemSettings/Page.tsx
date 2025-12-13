import { useState } from "react";
import { Settings, Shield, Globe, X } from "lucide-react";
import "./SystemSettings.css";

type ModalType = "room" | "vehicle" | "duty" | "emergency";

export function SystemSettings() {
  /* ---------- STATE ---------- */

  const [roomCategories, setRoomCategories] = useState<string[]>([
    "Standard",
    "Deluxe",
    "Suite",
    "VIP Suite",
    "VVIP Suite",
  ]);

  const [vehicleTypes, setVehicleTypes] = useState<string[]>([
    "Sedan",
    "SUV",
    "MUV",
    "Luxury Car",
    "Mini Bus",
  ]);

  const [dutyCategories, setDutyCategories] = useState<string[]>([
    "Housekeeping",
    "Security",
    "Kitchen",
    "Front Desk",
    "Maintenance",
    "Transport",
  ]);

  const [emergencyContacts, setEmergencyContacts] = useState<
    { name: string; phone: string }[]
  >([
    { name: "Admin Office", phone: "100" },
    { name: "Security Control", phone: "101" },
    { name: "Medical Emergency", phone: "108" },
  ]);

  const [language, setLanguage] = useState("English");

  const [modal, setModal] = useState<{
    type: ModalType;
    value: string;
    phone?: string;
    index: number | null;
  } | null>(null);

  /* ---------- HELPERS ---------- */

  const openAddModal = (type: ModalType) =>
    setModal({ type, value: "", phone: "", index: null });

  const openEditModal = (
    type: ModalType,
    value: string,
    index: number,
    phone?: string
  ) =>
    setModal({
      type,
      value,
      phone,
      index,
    });

  const removeItem = <T,>(
    index: number,
    list: T[],
    setter: React.Dispatch<React.SetStateAction<T[]>>
  ) => {
    if (!confirm("Are you sure?")) return;
    setter(list.filter((_, i) => i !== index));
  };

  const saveModal = () => {
    if (!modal || !modal.value.trim()) return;

    if (modal.type === "room") {
      const updated = [...roomCategories];
      modal.index !== null
        ? (updated[modal.index] = modal.value)
        : updated.push(modal.value);
      setRoomCategories(updated);
    }

    if (modal.type === "vehicle") {
      const updated = [...vehicleTypes];
      modal.index !== null
        ? (updated[modal.index] = modal.value)
        : updated.push(modal.value);
      setVehicleTypes(updated);
    }

    if (modal.type === "duty") {
      const updated = [...dutyCategories];
      modal.index !== null
        ? (updated[modal.index] = modal.value)
        : updated.push(modal.value);
      setDutyCategories(updated);
    }

    if (modal.type === "emergency") {
      const updated = [...emergencyContacts];
      modal.index !== null
        ? (updated[modal.index] = {
            name: modal.value,
            phone: modal.phone || "",
          })
        : updated.push({
            name: modal.value,
            phone: modal.phone || "",
          });
      setEmergencyContacts(updated);
    }

    setModal(null);
  };

  /* ---------- RENDER LIST ---------- */

  const renderSimpleList = (
    list: string[],
    type: ModalType,
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) =>
    list.map((item, i) => (
      <div
        key={i}
        className="flex items-center justify-between p-3 border rounded-sm"
      >
        <span className="text-sm">{item}</span>
        <div className="flex gap-2">
          <button
            className="text-blue-600"
            onClick={() => openEditModal(type, item, i)}
          >
            Edit
          </button>
          <button
            className="text-red-600"
            onClick={() => removeItem(i, list, setter)}
          >
            Delete
          </button>
        </div>
      </div>
    ));

  /* ---------- UI ---------- */

  return (
    <div className="space-y-6">
      <h2 className="text-[#00247D]">System Settings</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SettingCard
          title="Room Categories"
          icon={<Settings />}
          onAdd={() => openAddModal("room")}
        >
          {renderSimpleList(roomCategories, "room", setRoomCategories)}
        </SettingCard>

        <SettingCard
          title="Vehicle Types"
          icon={<Settings />}
          onAdd={() => openAddModal("vehicle")}
        >
          {renderSimpleList(vehicleTypes, "vehicle", setVehicleTypes)}
        </SettingCard>

        <SettingCard
          title="Duty Categories"
          icon={<Settings />}
          onAdd={() => openAddModal("duty")}
        >
          {renderSimpleList(dutyCategories, "duty", setDutyCategories)}
        </SettingCard>

        <SettingCard
          title="Emergency Contacts"
          icon={<Shield />}
          onAdd={() => openAddModal("emergency")}
        >
          {emergencyContacts.map((c, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border rounded-sm"
            >
              <div>
                <p className="text-sm">{c.name}</p>
                <p className="text-xs text-gray-500">{c.phone}</p>
              </div>
              <div className="flex gap-2">
                <button
                  className="text-blue-600"
                  onClick={() =>
                    openEditModal("emergency", c.name, i, c.phone)
                  }
                >
                  Edit
                </button>
                <button
                  className="text-red-600"
                  onClick={() =>
                    removeItem(i, emergencyContacts, setEmergencyContacts)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </SettingCard>
      </div>

      <div className="bg-white border rounded-sm p-6">
        <h3 className="text-[#00247D] mb-4 flex items-center gap-2">
          <Globe /> Language & Localization
        </h3>

        <select
          className="nicSelect max-w-xs"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option>English</option>
          <option>हिंदी (Hindi)</option>
          <option>Bilingual</option>
        </select>

        <div className="mt-4">
          <button className="nicPrimaryBtn">Save Settings</button>
        </div>
      </div>

      {modal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h2>{modal.index === null ? "Add" : "Edit"}</h2>
              <button onClick={() => setModal(null)}>
                <X />
              </button>
            </div>

            <div className="nicForm space-y-3">
              <input
                className="nicInput"
                placeholder="Name"
                value={modal.value}
                onChange={(e) =>
                  setModal({ ...modal, value: e.target.value })
                }
              />

              {modal.type === "emergency" && (
                <input
                  className="nicInput"
                  placeholder="Phone Number"
                  value={modal.phone}
                  onChange={(e) =>
                    setModal({ ...modal, phone: e.target.value })
                  }
                />
              )}
            </div>

            <div className="nicModalActions">
              <button className="cancelBtn" onClick={() => setModal(null)}>
                Cancel
              </button>
              <button className="saveBtn" onClick={saveModal}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- CARD ---------- */
function SettingCard({
  title,
  icon,
  children,
  onAdd,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onAdd?: () => void;
}) {
  return (
    <div className="bg-white border rounded-sm">
      <div className="border-b px-6 py-4 flex items-center gap-2">
        {icon}
        <h3 className="text-[#00247D]">{title}</h3>
      </div>
      <div className="p-6 space-y-3">
        {children}
        {onAdd && (
          <button
            className="w-full border border-[#00247D] text-[#00247D] py-2 rounded-sm"
            onClick={onAdd}
          >
            Add New
          </button>
        )}
      </div>
    </div>
  );
}
