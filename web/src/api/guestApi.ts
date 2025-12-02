const BASE_URL = "http://localhost:3000";

export const createGuest = async (data: any) => {
  const res = await fetch(`${BASE_URL}/guest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return res.json();
};

export const getGuests = async () => {
  const res = await fetch(`${BASE_URL}/guest`);
  return res.json();
};
