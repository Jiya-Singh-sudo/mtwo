// const sendNotification = async () => {
//   const res = await fetch("http://localhost:3000/notifications/send", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json"
//     },
//     body: JSON.stringify({
//       recipientContact: phoneNumber, // from UI
//       channel: "WHATSAPP",
//       message: messageText
//     })
//   });

//   const data = await res.json();
//   console.log(data);
// };