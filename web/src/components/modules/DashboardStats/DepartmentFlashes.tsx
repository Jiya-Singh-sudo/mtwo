import { useState, useEffect } from 'react';
import { Users, Building2, Car, UserCog, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
import "./DashboardStats.css";
import { getLiveDashboard } from "@/api/dashboard.api";

interface DepartmentUpdate {
  id: string;
  name: string;
  icon: React.ReactNode;
  stats: {
    label: string;
    value: string | number;
    color: string;
  }[];
}

interface DepartmentFlashesProps {
  startDate: string;
  endDate: string;
}

export function DepartmentFlashes({ startDate, endDate }: DepartmentFlashesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [liveData, setLiveData] = useState<any>(null);
  const generateDepartments = (): DepartmentUpdate[] => {
    const getSimpleColor = (value: number) => {
      if (value === 0) return "text-gray-400";
      if (value < 5) return "text-yellow-500";
      return "text-green-600";
    };

    return [
      {
        id: "guest",
        name: "Guest Management",
        icon: <Users className="w-6 h-6" />,
        stats: [
          {
            label: "Scheduled Check-ins Today",
            value: liveData?.guest?.scheduledCheckins ?? 0,
            color: "",
          },
          {
            label: "Current Guests",
            value: liveData?.guest?.currentGuests ?? 0,
            color: getSimpleColor(liveData?.guest?.currentGuests ?? 0),
          },
          {
            label: "Check-outs Today",
            value: liveData?.guest?.checkoutsToday ?? 0,
            color: "",
          },
          {
            label: "VVIP Guests",
            value: liveData?.guest?.vvipGuests ?? 0,
            color: "",
          },
        ],
      },

      {
        id: "room",
        name: "Room & Housekeeping",
        icon: <Building2 className="w-6 h-6" />,
        stats: [
          {
            label: "Occupied Rooms",
            value: `${liveData?.room?.occupied ?? 0}`,
            color: "",
          },
          {
            label: "Deluxe Suites Occupied",
            value: `${liveData?.room?.deluxe ?? 0}`,
            color: "",
          },
          {
            label: "Standard Rooms Occupied",
            value: `${liveData?.room?.standard ?? 0}`,
            color: "",
          },
          {
            label: "Cleaning in Progress",
            value: liveData?.room?.cleaning ?? 0,
            color: "",
          },
        ],
      },

      {
        id: "transport",
        name: "Transport & Drivers",
        icon: <Car className="w-6 h-6" />,
        stats: [
          {
            label: "Vehicles on Duty",
            value: liveData?.transport?.vehicles ?? 0,
            color: getSimpleColor(liveData?.transport?.vehicles ?? 0),
          },
          {
            label: "Drivers Assigned Today",
            value: liveData?.transport?.drivers ?? 0,
            color: "",
          },
          {
            label: "Scheduled Pickups",
            value: liveData?.transport?.pickups ?? 0,
            color: "",
          },
          {
            label: "Active Routes",
            value: liveData?.transport?.routes ?? 0,
            color: "",
          },
        ],
      },

      {
        id: "staff",
        name: "Room Boy & Butler Service",
        icon: <UserCog className="w-6 h-6" />,
        stats: [
          {
            label: "Room Boys on Duty",
            value: liveData?.staff?.roomBoys ?? 0,
            color: getSimpleColor(liveData?.staff?.roomBoys ?? 0),
          },
          {
            label: "Butlers Assigned",
            value: liveData?.staff?.butlers ?? 0,
            color: "",
          },
          {
            label: "Service Requests Today",
            value: liveData?.staff?.requests ?? 0,
            color: "",
          },
          {
            label: "Tasks Completed",
            value: liveData?.staff?.tasks ?? 0,
            color: "",
          },
        ],
      },

      {
        id: "food",
        name: "Food Service",
        icon: <Utensils className="w-6 h-6" />,
        stats: [
          {
            label: "Breakfast Orders",
            value: liveData?.food?.breakfast ?? 0,
            color: getSimpleColor(liveData?.food?.breakfast ?? 0),
          },
          {
            label: "Lunch Scheduled",
            value: liveData?.food?.lunch ?? 0,
            color: "",
          },
          {
            label: "Dinner Reservations",
            value: liveData?.food?.dinner ?? 0,
            color: "",
          },
          {
            label: "Special Dietary Requests",
            value: liveData?.food?.diet ?? 0,
            color: "",
          },
        ],
      },
    ];
  };
  // const today = new Date().toISOString().split("T")[0];

  // const [startDate, setStartDate] = useState(today);
  // const [endDate, setEndDate] = useState(today);
  const [departments, setDepartments] = useState<DepartmentUpdate[]>(generateDepartments());

  useEffect(() => {
    setDepartments(generateDepartments());
  }, []);


  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % departments.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [isPaused, departments.length]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getLiveDashboard(startDate, endDate);
        console.log(data); // debug
        setLiveData(data);
      } catch (e) {
        console.error(e);
      }
    };

    fetchData();
  }, []);
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + departments.length) % departments.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % departments.length);
  };

  const currentDept = departments[currentIndex];

  return (
    // ✅ Use the CSS class "today-overview" — NOT inline Tailwind gradient
    <div className="today-overview">

      {/* Header row */}
      <div className="today-header" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Icon badge */}
          <span style={{
            background: '#ffcc66',
            color: '#00247D',
            padding: '8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
          }}>
            {currentDept.icon}
          </span>
          <span>Today's Overview: {currentDept.name}</span>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handlePrevious}
            aria-label="Previous department"
            style={{
              padding: '6px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronLeft size={18} />
          </button>

          {/* Dot indicators */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            {departments.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to department ${idx + 1}`}
                style={{
                  width: idx === currentIndex ? '20px' : '8px',
                  height: '8px',
                  borderRadius: '9999px',
                  background: idx === currentIndex ? '#F5A623' : 'rgba(255,255,255,0.4)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0
                }}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            aria-label="Next department"
            style={{
              padding: '6px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronRight size={18} />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            style={{
              marginLeft: '8px',
              padding: '4px 12px',
              fontSize: '12px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '6px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            {isPaused ? 'Resume' : 'Pause'}
          </button>
        </div>
      </div>

      {/* ✅ Stat cards — using CSS class "today-cards" and "today-card" */}
      <div className="today-cards">
        {currentDept.stats.map((stat, idx) => (
          <div key={idx} className="today-card">
            <div className="today-value">{stat.value}</div>
            <div className="today-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="today-footer" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
        <span style={{
          width: '8px', height: '8px',
          background: '#4ade80',
          borderRadius: '50%',
          display: 'inline-block',
          animation: 'pulse 2s infinite'
        }} />
        <span>
          Live updates · Refreshes every 4 seconds · Period:{' '}
          {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' – '}
          {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>
    </div>
  );
}
// import { useState, useEffect } from 'react';
// import { Users, Building2, Car, UserCog, Utensils, ChevronLeft, ChevronRight } from 'lucide-react';
// import "./DashboardStats.css";

// interface DepartmentUpdate {
//   id: string;
//   name: string;
//   icon: React.ReactNode;
//   stats: {
//     label: string;
//     value: string | number;
//     color: string;
//   }[];
// }

// interface DepartmentFlashesProps {
//   startDate: string;
//   endDate: string;
// }

// export function DepartmentFlashes({ startDate, endDate }: DepartmentFlashesProps) {
//   const [currentIndex, setCurrentIndex] = useState(0);
//   const [isPaused, setIsPaused] = useState(false);

//   const generateDepartments = (start: string, end: string): DepartmentUpdate[] => {
//     const isToday = start === end && start === new Date().toISOString().split('T')[0];

//     const checkins = isToday ? 8 : Math.floor(Math.random() * 10 + 5);
//     const currentGuests = isToday ? 12 : Math.floor(Math.random() * 15 + 8);
//     const checkouts = isToday ? 5 : Math.floor(Math.random() * 8 + 3);
//     const vvipGuests = isToday ? 2 : Math.floor(Math.random() * 3 + 1);

//     return [
//       {
//         id: 'guest',
//         name: 'Guest Management',
//         icon: <Users className="w-6 h-6" />,
//         stats: [
//           { label: isToday ? 'Scheduled Check-ins Today' : 'Check-ins in Period', value: checkins, color: 'text-green-600' },
//           { label: 'Current Guests', value: currentGuests, color: 'text-blue-600' },
//           { label: isToday ? 'Check-outs Today' : 'Check-outs in Period', value: checkouts, color: 'text-orange-600' },
//           { label: 'VVIP Guests', value: vvipGuests, color: 'text-purple-600' }
//         ]
//       },
//       {
//         id: 'room',
//         name: 'Room & Housekeeping',
//         icon: <Building2 className="w-6 h-6" />,
//         stats: [
//           { label: 'Occupied Rooms', value: isToday ? '12/25' : `${Math.floor(Math.random() * 10 + 8)}/25`, color: 'text-blue-600' },
//           { label: 'Deluxe Suites Occupied', value: isToday ? '3/5' : `${Math.floor(Math.random() * 3 + 2)}/5`, color: 'text-purple-600' },
//           { label: 'Standard Rooms Occupied', value: isToday ? '9/20' : `${Math.floor(Math.random() * 8 + 6)}/20`, color: 'text-green-600' },
//           { label: 'Cleaning in Progress', value: isToday ? 4 : Math.floor(Math.random() * 5 + 2), color: 'text-orange-600' }
//         ]
//       },
//       {
//         id: 'transport',
//         name: 'Transport & Drivers',
//         icon: <Car className="w-6 h-6" />,
//         stats: [
//           { label: 'Vehicles on Duty', value: isToday ? '6/10' : `${Math.floor(Math.random() * 4 + 4)}/10`, color: 'text-blue-600' },
//           { label: isToday ? 'Drivers Assigned Today' : 'Drivers Assigned', value: isToday ? 6 : Math.floor(Math.random() * 4 + 4), color: 'text-green-600' },
//           { label: 'Scheduled Pickups', value: isToday ? 3 : Math.floor(Math.random() * 5 + 2), color: 'text-orange-600' },
//           { label: 'Active Routes', value: isToday ? 4 : Math.floor(Math.random() * 5 + 2), color: 'text-purple-600' }
//         ]
//       },
//       {
//         id: 'staff',
//         name: 'Room Boy & Butler Service',
//         icon: <UserCog className="w-6 h-6" />,
//         stats: [
//           { label: 'Room Boys on Duty', value: isToday ? '8/12' : `${Math.floor(Math.random() * 5 + 6)}/12`, color: 'text-blue-600' },
//           { label: 'Butlers Assigned', value: isToday ? '4/6' : `${Math.floor(Math.random() * 3 + 3)}/6`, color: 'text-purple-600' },
//           { label: isToday ? 'Service Requests Today' : 'Service Requests', value: isToday ? 15 : Math.floor(Math.random() * 20 + 10), color: 'text-orange-600' },
//           { label: 'Tasks Completed', value: isToday ? 12 : Math.floor(Math.random() * 15 + 8), color: 'text-green-600' }
//         ]
//       },
//       {
//         id: 'food',
//         name: 'Food Service',
//         icon: <Utensils className="w-6 h-6" />,
//         stats: [
//           { label: 'Breakfast Orders', value: isToday ? 12 : Math.floor(Math.random() * 15 + 8), color: 'text-orange-600' },
//           { label: 'Lunch Scheduled', value: isToday ? 15 : Math.floor(Math.random() * 18 + 10), color: 'text-blue-600' },
//           { label: 'Dinner Reservations', value: isToday ? 10 : Math.floor(Math.random() * 12 + 8), color: 'text-purple-600' },
//           { label: 'Special Dietary Requests', value: isToday ? 3 : Math.floor(Math.random() * 5 + 2), color: 'text-green-600' }
//         ]
//       }
//     ];
//   };

//   const [departments, setDepartments] = useState<DepartmentUpdate[]>(generateDepartments(startDate, endDate));

//   useEffect(() => {
//     setDepartments(generateDepartments(startDate, endDate));
//   }, [startDate, endDate]);

//   useEffect(() => {
//     if (!isPaused) {
//       const interval = setInterval(() => {
//         setCurrentIndex((prev) => (prev + 1) % departments.length);
//       }, 4000);

//       return () => clearInterval(interval);
//     }
//   }, [isPaused, departments.length]);

//   const handlePrevious = () => {
//     setCurrentIndex((prev) => (prev - 1 + departments.length) % departments.length);
//   };

//   const handleNext = () => {
//     setCurrentIndex((prev) => (prev + 1) % departments.length);
//   };

//   const currentDept = departments[currentIndex];

//   return (
//     <div className="bg-[linear-gradient(135deg,#0b3d91_0%,#0a2e6e_60%,#08245c_100%)]
//       shadow-[inset_0_0_40px_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.2)] rounded-lg shadow-lg p-6 text-white">
//       <div className="flex items-center justify-between mb-4">
//         <h3 className="font-semibold text-[15px] tracking-wide flex items-center gap-2">
//           <span className="bg-[#ffcc66] shadow-inner text-[#00247D] p-2 rounded-md shadow-sm">
//             {currentDept.icon}
//           </span>
//           Today's Overview: {currentDept.name}
//         </h3>

//         <div className="flex items-center gap-2">
//           <button
//             onClick={handlePrevious}
//             className="p-1.5 hover:bg-white/20 bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition-all"
//             aria-label="Previous department"
//           >
//             <ChevronLeft className="w-5 h-5" />
//           </button>

//           <div className="flex gap-1">
//             {departments.map((_, idx) => (
//               <button
//                 key={idx}
//                 onClick={() => setCurrentIndex(idx)}
//                 className={`w-2 h-2 rounded-full transition-all ${
//                   idx === currentIndex 
//                     ? 'bg-[#F5A623] w-5 h-2 rounded-full' 
//                     : 'bg-white/40 w-2 h-2'
//                 }`}
//                 aria-label={`Go to department ${idx + 1}`}
//               />
//             ))}
//           </div>

//           <button
//             onClick={handleNext}
//             className="p-1 hover:bg-white/10 rounded transition-colors"
//             aria-label="Next department"
//           >
//             <ChevronRight className="w-5 h-5" />
//           </button>

//           <button
//             onClick={() => setIsPaused(!isPaused)}
//             className="ml-2 px-3 py-1 text-xs bg-white/10 hover:bg-white/20 border border-white/20 rounded-md transition-all"
//           >
//             {isPaused ? 'Resume' : 'Pause'}
//           </button>
//         </div>
//       </div>

//       <div className="grid grid-cols-4 gap-3">
//         {currentDept.stats.map((stat, idx) => (
//           <div
//             key={idx}
//             className="bg-white/10 backdrop-blur-md rounded-lg p-3 border border-white/20 shadow-inner hover:bg-white/15 transition-all"
//           >
//             <div className="text-3xl font-bold text-[#ffcc66] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] tracking-wide mb-1">
//               {stat.value}
//             </div>
//             <div className="text-xs text-white/80 tracking-wide">
//               {stat.label}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-white/70 tracking-wide">
//         <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//         <span>Live updates • Refreshes every 4 seconds • Period: {new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} - {new Date(endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
//       </div>
//     </div>
//   );
// }