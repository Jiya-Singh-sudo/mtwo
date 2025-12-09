"use client";

import { useEffect, useState } from "react";
import { getActiveGuests } from "../../api/guest.api";
import {
  Search,
  Plus,
  Eye,
  Edit,
  FileText,
  BedDouble,
  Car,
} from "lucide-react";

import {
  // guestSchema
  type GuestInput,
} from "../../validation/guest.validation";

export function GuestManagement() {
  const [guests, setGuests] = useState<GuestInput[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getActiveGuests();
        setGuests(data);
      } catch (err: any) {
        console.error(err);
        alert("Failed to load guests");
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Guest Management</h2>
          <p className="text-sm text-gray-600">
            अतिथि प्रबंधन - Manage all guest information and visits
          </p>
        </div>
        <button className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add New Guest
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">
              Search Guest
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, department, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Status</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>All Status</option>
              <option>Upcoming</option>
              <option>Checked In</option>
              <option>Checked Out</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm text-gray-700 mb-2">Category</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>All Categories</option>
              <option>VVIP</option>
              <option>VIP</option>
              <option>Official</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guest Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612] border-b border-[#D4951C]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Guest Name
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Stay Period
                </th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {guests.map((guest: GuestInput) => (
                <tr key={guest.name} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {guest.name}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {guest.department}
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                        guest.category === "VVIP"
                          ? "bg-red-100 text-red-700"
                          : guest.category === "VIP"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {guest.category}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 text-xs rounded-full ${
                        guest.status === "Checked In"
                          ? "bg-green-100 text-green-700"
                          : guest.status === "Upcoming"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {guest.status}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-700">
                    {guest.arrival} → {guest.departure}
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-600" />
                      <Edit className="w-4 h-4 text-green-600" />
                      <FileText className="w-4 h-4 text-purple-600" />
                      <BedDouble className="w-4 h-4 text-orange-600" />
                      <Car className="w-4 h-4 text-teal-600" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {guests.length} guests</p>
        </div>
      </div>
    </div>
  );
}
