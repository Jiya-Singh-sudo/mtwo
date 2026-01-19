export function infoPackageTemplate(data: any) {
  const { guest, stay, transport, meta } = data;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      margin: 30px;
      color: #000;
    }
    h1 {
      text-align: center;
      margin-bottom: 5px;
    }
    h2 {
      margin-top: 30px;
      border-bottom: 1px solid #333;
      padding-bottom: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    td {
      padding: 6px;
      border: 1px solid #444;
    }
    .label {
      width: 30%;
      font-weight: bold;
      background: #f2f2f2;
    }
    footer {
      position: fixed;
      bottom: 20px;
      width: 100%;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>

<h1>Guest Information Package</h1>
<p style="text-align:center;">Raj Bhavan</p>

<h2>Guest Details</h2>
<table>
  <tr><td class="label">Name</td><td>${guest.name}</td></tr>
  <tr><td class="label">Designation</td><td>${guest.designation || '-'}</td></tr>
  <tr><td class="label">Department</td><td>${guest.department || '-'}</td></tr>
  <tr><td class="label">VIP Type</td><td>${guest.vipType || '-'}</td></tr>
</table>

<h2>Stay Details</h2>
<table>
  <tr><td class="label">Room No</td><td>${stay.roomNo || '-'}</td></tr>
  <tr><td class="label">Room Type</td><td>${stay.roomType || '-'}</td></tr>
  <tr><td class="label">Check-In</td><td>${stay.arrivalDate}</td></tr>
  <tr><td class="label">Check-Out</td><td>${stay.departureDate}</td></tr>
</table>

<h2>Transport Details</h2>
<table>
  <tr><td class="label">Vehicle No</td><td>${transport.vehicleNo || '-'}</td></tr>
  <tr><td class="label">Vehicle</td><td>${transport.vehicleName || '-'}</td></tr>
  <tr><td class="label">Driver</td><td>${transport.driverName || '-'}</td></tr>
  <tr><td class="label">Driver Contact</td><td>${transport.driverContact || '-'}</td></tr>
</table>

<footer>
  Generated on ${meta.generatedAt}
</footer>

</body>
</html>
`;
}
