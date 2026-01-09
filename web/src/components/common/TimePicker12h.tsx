import { useState, useEffect } from "react";

interface TimePicker12hProps {
  label?: string;
  value?: string; // HH:mm or HH:mm:ss
  onChange: (value: string) => void;
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ["00", "15", "30", "45"];

export default function TimePicker12h({
  label,
  value,
  onChange,
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
    let h = hour % 12;
    if (meridiem === "PM") h += 12;

    const result = `${String(h).padStart(2, "0")}:${minute}`;
    onChange(result);
  }, [hour, minute, meridiem]);

  return (
    <div className="timePicker12h">
      {label && <label className="timeLabel">{label}</label>}

      <div className="timeRow">
        <select
          className="nicInput"
          value={hour}
          onChange={(e) => setHour(Number(e.target.value))}
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>

        <select
          className="nicInput"
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          className="nicInput"
          value={meridiem}
          onChange={(e) => setMeridiem(e.target.value as "AM" | "PM")}
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
