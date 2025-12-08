import { FileText, Download, Send, User, BedDouble, Car, Calendar, Utensils } from 'lucide-react';

export function InfoPackage() {
  const guestPackages = [
    {
      guestId: 'G001',
      name: 'Shri Rajesh Kumar',
      designation: 'Joint Secretary, MoD',
      category: 'VVIP',
      room: '201 (Deluxe Suite)',
      vehicle: 'DL-01-AB-1234 (Toyota Innova)',
      driver: 'Ram Singh',
      arrival: '2025-12-05',
      departure: '2025-12-08',
      generated: true
    },
    {
      guestId: 'G002',
      name: 'Dr. Priya Sharma',
      designation: 'Director, MoH',
      category: 'VIP',
      room: 'Pending',
      vehicle: 'Pending',
      driver: null,
      arrival: '2025-12-06',
      departure: '2025-12-09',
      generated: false
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#00247D]">Guest Info Package Generator</h2>
        <p className="text-sm text-gray-600">सूचना पैकेज जनरेटर - Generate comprehensive guest information packages</p>
      </div>

      {/* Guest Selection */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Select Guest for Info Package</h3>
        </div>
        <div className="p-6 space-y-4">
          {guestPackages.map((guest) => (
            <div key={guest.guestId} className="border border-gray-200 rounded-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-gray-900">{guest.name}</h4>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      guest.category === 'VVIP' ? 'bg-red-100 text-red-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {guest.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{guest.designation}</p>
                </div>
                {guest.generated && (
                  <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    Package Generated
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <BedDouble className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Room:</span>
                    <span className="text-gray-900">{guest.room}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Vehicle:</span>
                    <span className="text-gray-900">{guest.vehicle}</span>
                  </div>
                  {guest.driver && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600">Driver:</span>
                      <span className="text-gray-900">{guest.driver}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Arrival:</span>
                    <span className="text-gray-900">{guest.arrival}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">Departure:</span>
                    <span className="text-gray-900">{guest.departure}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center justify-center gap-2">
                  <FileText className="w-4 h-4" />
                  Generate PDF Package
                </button>
                <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded-sm hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                  <Send className="w-4 h-4" />
                  Send via WhatsApp
                </button>
                {guest.generated && (
                  <button className="px-4 py-2 border border-gray-300 rounded-sm hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Package Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Package Contents */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Package Contents</h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {[
                { icon: User, label: 'Guest Basic Details', included: true },
                { icon: BedDouble, label: 'Room Information & Amenities', included: true },
                { icon: Car, label: 'Vehicle & Driver Details', included: true },
                { icon: Calendar, label: 'Visit Schedule & Itinerary', included: true },
                { icon: Utensils, label: 'Meal Preferences & Timings', included: true },
                { icon: User, label: 'Assigned Officers & Contact', included: true },
                { icon: FileText, label: 'Contact Directory', included: true },
                { icon: FileText, label: 'Emergency Protocol', included: true },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-sm">
                  <div className={`w-8 h-8 ${
                    item.included ? 'bg-green-100' : 'bg-gray-100'
                  } rounded-sm flex items-center justify-center`}>
                    <item.icon className={`w-4 h-4 ${
                      item.included ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <span className={`flex-1 text-sm ${
                    item.included ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    {item.label}
                  </span>
                  {item.included && (
                    <span className="text-xs text-green-600">✓ Included</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Template Preview */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="border-b border-gray-200 px-6 py-4">
            <h3 className="text-[#00247D]">Template Preview</h3>
          </div>
          <div className="p-6">
            <div className="border-2 border-gray-300 rounded-sm p-6 bg-gray-50">
              {/* Mock PDF Preview */}
              <div className="text-center mb-4">
                <div className="inline-block bg-gradient-to-r from-[#FF9933] via-white to-[#138808] h-2 w-full mb-4 rounded" />
                <h4 className="text-[#00247D]">Guest Information Package</h4>
                <p className="text-sm text-gray-600 mt-1">Government Guest House</p>
                <p className="text-xs text-gray-500">Government of India</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Guest Name</p>
                  <p className="text-gray-900">Shri Rajesh Kumar</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Designation</p>
                  <p className="text-gray-900">Joint Secretary</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Room Allocated</p>
                  <p className="text-gray-900">Room 201 - Deluxe Suite</p>
                </div>
                <div className="bg-white p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Vehicle Assigned</p>
                  <p className="text-gray-900">DL-01-AB-1234 (Toyota Innova)</p>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-xs text-gray-500">Emergency Contact: +91-XXXX-XXXX</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-Send Options */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-sm">
        <h4 className="text-blue-900 mb-2">Auto-Notification Settings</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm text-blue-800">
            <input type="checkbox" className="rounded" defaultChecked />
            Send package to guest via WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm text-blue-800">
            <input type="checkbox" className="rounded" defaultChecked />
            Send to assigned duty officers
          </label>
          <label className="flex items-center gap-2 text-sm text-blue-800">
            <input type="checkbox" className="rounded" defaultChecked />
            Send to driver
          </label>
          <label className="flex items-center gap-2 text-sm text-blue-800">
            <input type="checkbox" className="rounded" />
            Send to department head
          </label>
        </div>
      </div>
    </div>
  );
}
