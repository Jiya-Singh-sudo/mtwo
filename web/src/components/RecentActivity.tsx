import { 
  UserPlus, 
  BedDouble, 
  Car, 
  Bell, 
  CheckCircle, 
  AlertCircle,
  Clock 
} from 'lucide-react';

export function RecentActivity() {
  const activities = [
    {
      type: 'guest',
      icon: UserPlus,
      title: 'New Guest Added',
      description: 'Shri Rajesh Kumar (Joint Secretary, MoD) - VVIP Category',
      time: '10 minutes ago',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      type: 'room',
      icon: BedDouble,
      title: 'Room Allocated',
      description: 'Room 201 (Deluxe Suite) assigned to Shri Rajesh Kumar',
      time: '15 minutes ago',
      color: 'text-green-600 bg-green-50'
    },
    {
      type: 'vehicle',
      icon: Car,
      title: 'Vehicle Assigned',
      description: 'Toyota Innova (DL-01-AB-1234) - Driver: Ram Singh',
      time: '25 minutes ago',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      type: 'notification',
      icon: Bell,
      title: 'WhatsApp Notification Sent',
      description: 'Welcome package sent to guest and concerned officers',
      time: '30 minutes ago',
      color: 'text-orange-600 bg-orange-50'
    },
    {
      type: 'checkout',
      icon: CheckCircle,
      title: 'Guest Checked Out',
      description: 'Dr. Sharma (IAS) - Stay completed successfully',
      time: '1 hour ago',
      color: 'text-teal-600 bg-teal-50'
    },
    {
      type: 'alert',
      icon: AlertCircle,
      title: 'Maintenance Alert',
      description: 'Room 305 - AC servicing required',
      time: '2 hours ago',
      color: 'text-red-600 bg-red-50'
    },
  ];

  const upcomingEvents = [
    {
      time: '14:00',
      title: 'VIP Arrival',
      description: 'Secretary, Ministry of Finance',
      category: 'VVIP',
      icon: Clock
    },
    {
      time: '16:30',
      title: 'Guest Departure',
      description: 'Joint Secretary, MoHA',
      category: 'VIP',
      icon: Clock
    },
    {
      time: '18:00',
      title: 'Duty Shift Change',
      description: 'Evening shift officers reporting',
      category: 'Duty',
      icon: Clock
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Recent Activity */}
      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Recent Activity</h3>
          <p className="text-sm text-gray-600">हाल की गतिविधि</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0">
                  <div className={`w-10 h-10 ${activity.color} rounded-sm flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
          
          <button className="w-full mt-4 py-2 text-sm text-[#00247D] border border-[#00247D] rounded-sm hover:bg-blue-50 transition-colors">
            View All Activity
          </button>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white border border-gray-200 rounded-sm">
        <div className="border-b border-gray-200 px-6 py-4">
          <h3 className="text-[#00247D]">Today's Schedule</h3>
          <p className="text-sm text-gray-600">आज का कार्यक्रम</p>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            {upcomingEvents.map((event, index) => {
              const Icon = event.icon;
              return (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0">
                  <div className="text-center flex-shrink-0">
                    <div className="w-12 h-12 bg-[#00247D] bg-opacity-10 rounded-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#00247D]" />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{event.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-gray-900">{event.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.category === 'VVIP' ? 'bg-red-100 text-red-700' :
                        event.category === 'VIP' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {event.category}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <button className="w-full mt-4 py-2 text-sm text-white bg-[#00247D] rounded-sm hover:bg-blue-900 transition-colors">
            View Full Calendar
          </button>
        </div>
      </div>
    </div>
  );
}
