import { useState, useEffect } from "react";

interface TimePicker12hProps {
  label?: React.ReactNode;
  value?: string; // HH:mm or HH:mm:ss
  name?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

export default function TimePicker12h({
  label,
  value,
  name,
  onChange,
  onBlur,
  disabled,
}: TimePicker12hProps) {
  const [hour, setHour] = useState<number>(1);
  const [minute, setMinute] = useState<string>("00");
  const [meridiem, setMeridiem] = useState<"AM" | "PM">("AM");

  // 🔁 Initialize from existing value (edit mode)
  useEffect(() => {
    if (!value) return;

    const [h, m] = value.split(":").map(Number);
    const isPM = h >= 12;
    const normalizedHour = h % 12 === 0 ? 12 : h % 12;

    setHour(normalizedHour);
    setMinute(String(m).padStart(2, "0"));
    setMeridiem(isPM ? "PM" : "AM");
  }, [value]);

  // 🔄 Convert to 24h and emit
  useEffect(() => {
    if (!value) return;

    const [h, m] = value.split(":").map(Number);
    const isPM = h >= 12;
    const normalizedHour = h % 12 === 0 ? 12 : h % 12;
    const normalizedMinute = String(m).padStart(2, "0");
    const normalizedMeridiem = isPM ? "PM" : "AM";

    setHour((prev) => (prev !== normalizedHour ? normalizedHour : prev));
    setMinute((prev) => (prev !== normalizedMinute ? normalizedMinute : prev));
    setMeridiem((prev) =>
      prev !== normalizedMeridiem ? normalizedMeridiem : prev
    );
  }, [value]);

  const emitChange = (
    newHour = hour,
    newMinute = minute,
    newMeridiem = meridiem
  ) => {
    let h = newHour % 12;
    if (newMeridiem === "PM") h += 12;

    onChange(`${String(h).padStart(2, "0")}:${newMinute}`);
  };

  return (
    <div className="timePicker12h">
      {label && <label className="timeLabel">{label}</label>}

      <div className="timeRow">
        <select
          name={name}                 // ✅ focus anchor
          className="nicInput"
          value={hour}
          disabled={disabled}
          onChange={(e) => {
            const v = Number(e.target.value);
            setHour(v);
            emitChange(v, minute, meridiem);
          }}
          onBlur={onBlur}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <select
          name={name}
          className="nicInput"
          value={minute}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value;
            setMinute(v);
            emitChange(hour, v, meridiem);
          }}
          onBlur={onBlur}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          name={name}
          className="nicInput"
          value={meridiem}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value as "AM" | "PM";
            setMeridiem(v);
            emitChange(hour, minute, v);
          }}
          onBlur={onBlur}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
