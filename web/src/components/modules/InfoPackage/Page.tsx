import { useState } from "react";
import {
  FileText,
  Download,
  Send,
  User,
  BedDouble,
  Car,
  Calendar,
  
  X,
} from "lucide-react";

export default function InfoPackage() {
  const [activeGuest, setActiveGuest] = useState<any>(null);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);

  const guestPackages = [
    {
      guestId: "G001",
      name: "Shri Rajesh Kumar",
      designation: "Joint Secretary, MoD",
      category: "VVIP",
      room: "201 (Deluxe Suite)",
      vehicle: "DL-01-AB-1234 (Toyota Innova)",
      driver: "Ram Singh",
      arrival: "2025-12-05",
      departure: "2025-12-08",
      generated: true,
    },
    {
      guestId: "G002",
      name: "Dr. Priya Sharma",
      designation: "Director, MoH",
      category: "VIP",
      room: "Pending",
      vehicle: "Pending",
      driver: null,
      arrival: "2025-12-06",
      departure: "2025-12-09",
      generated: false,
    },
  ];

  function handleGeneratePDF(guest: any) {
    setActiveGuest(guest);
    setShowPdfModal(true);
  }

  function handleSendWhatsApp(guest: any) {
    setActiveGuest(guest);
    setShowWhatsAppModal(true);
  }

  function handleDownload() {
    alert("PDF downloaded successfully");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">Guest Info Package Generator</h2>
        <p className="text-sm text-gray-600">
          सूचना पैकेज जनरेटर - Generate comprehensive guest information packages
        </p>
      </div>

      {/* Guest Cards */}
      <div className="bg-white border rounded-sm">
        <div className="border-b px-6 py-4">
          <h3 className="text-[#00247D]">Select Guest for Info Package</h3>
        </div>

        <div className="p-6 space-y-4">
          {guestPackages.map((guest) => (
            <div
              key={guest.guestId}
              className="border border-gray-200 rounded-sm p-6"
            >
              <div className="flex justify-between mb-4">
                <div>
                  <h4>{guest.name}</h4>
                  <p className="text-sm text-gray-600">
                    {guest.designation}
                  </p>
                </div>
               <span
  className={`guestBadge ${
    guest.category === "VVIP" ? "vvip" : "vip"
  }`}
>
  {guest.category}
</span>

              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm mb-4">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-4 h-4" /> {guest.room}
                </div>
                <div className="flex items-center gap-2">
                  <Car className="w-4 h-4" /> {guest.vehicle}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Arrival: {guest.arrival}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Departure: {guest.departure}
                </div>
                {guest.driver && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Driver: {guest.driver}
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleGeneratePDF(guest)}
                  className="flex-1 bg-[#00247D] text-white py-2 rounded-sm flex items-center justify-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate PDF Package
                </button>

                <button
                  onClick={() => handleSendWhatsApp(guest)}
                  className="flex-1 bg-green-600 text-white py-2 rounded-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>

                {guest.generated && (
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 border rounded-sm flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PDF MODAL */}
      {showPdfModal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3 className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Generate PDF
              </h3>
              <button onClick={() => setShowPdfModal(false)}>
                <X />
              </button>
            </div>
            <p className="text-sm mt-3">
              PDF package for <b>{activeGuest?.name}</b> will be generated.
            </p>
            <div className="nicModalActions">
              <button
                className="saveBtn"
                onClick={() => {
                  alert("PDF Generated Successfully");
                  setShowPdfModal(false);
                }}
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WHATSAPP MODAL */}
      {showWhatsAppModal && (
        <div className="modalOverlay">
          <div className="nicModal">
            <div className="nicModalHeader">
              <h3 className="flex items-center gap-2">
                <Send className="w-5 h-5" /> Send via WhatsApp
              </h3>
              <button onClick={() => setShowWhatsAppModal(false)}>
                <X />
              </button>
            </div>
            <p className="text-sm mt-3">
              Send info package to <b>{activeGuest?.name}</b>?
            </p>
            <div className="nicModalActions">
              <button
                className="saveBtn"
                onClick={() => {
                  alert("WhatsApp sent successfully");
                  setShowWhatsAppModal(false);
                }}
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
