export const guestArrivalTemplate = (data: {
  guestName: string;
  arrivalTime: string;
  room?: string;
}) => {
  const title = `Guest Arrival — ${data.guestName}`;

  const text = 
    `Guest ${data.guestName} has arrived at ${data.arrivalTime}.` +
    ` Room: ${data.room ?? 'Not Assigned Yet'}`;

  const html = `
    <h2>Guest Arrival Notification</h2>
    <p><strong>Guest:</strong> ${data.guestName}</p>
    <p><strong>Arrival Time:</strong> ${data.arrivalTime}</p>
    <p><strong>Room:</strong> ${data.room ?? 'Not Assigned Yet'}</p>
  `;

  return { title, text, html };
};
