import { useEffect, useState } from "react";
import { getGuests } from "../api/guestApi";

export default function GuestList() {
  const [guests, setGuests] = useState([]);

  useEffect(() => {
    getGuests().then(setGuests);
  }, []);

  return (
    <div>
      <h2>Guest List</h2>
      <ul>
        {guests.map((g: any) => (
          <li key={g.id}>
            {g.guestName} — {g.foodPreferences.join(", ")}
          </li>
        ))}
      </ul>
    </div>
  );
}
