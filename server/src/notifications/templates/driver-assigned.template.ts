export const driverAssignedTemplate = (data: {
  guestName: string;
  driverName: string;
  vehicle: string;
  pickupTime: string;
}) => {
  const title = `Driver Assigned — ${data.pickupTime}`;

  const text = 
    `Guest: ${data.guestName}\n` +
    `Driver: ${data.driverName}\n` +
    `Vehicle: ${data.vehicle}\n` +
    `Pickup Time: ${data.pickupTime}`;

  const html = `
    <h2>Driver Assignment</h2>
    <p><strong>Guest:</strong> ${data.guestName}</p>
    <p><strong>Driver:</strong> ${data.driverName}</p>
    <p><strong>Vehicle:</strong> ${data.vehicle}</p>
    <p><strong>Pickup Time:</strong> ${data.pickupTime}</p>
  `;

  return { title, text, html };
};
