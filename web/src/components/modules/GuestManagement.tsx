// src/pages/Guests/GuestManagement.tsx
'use client';
import { useEffect, useState } from "react";
import type { Guest } from "../../types/guests";
import { getActiveGuests, createGuest, updateGuest, softDeleteGuest } from "../../api/guest.api";
import { guestSchema } from "../../validation/guest.validation";
import { Search, Plus, Eye, Edit } from 'lucide-react';
import toast from "react-hot-toast"; // optional - if you have it

export function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getActiveGuests()
      .then((data) => {
        // backend returns list of guest objects; map if needed
        setGuests(data || []);
      })
      .catch((err) => {
        console.error("Failed to load guests:", err);
        alert("Failed to load guests"); // you already had this
      })
      .finally(() => setLoading(false));
  }, []);

  // Example: Add new guest (show form UI on your side; this is just an example function)
  async function handleCreateGuest(formValues: any) {
    try {
      // Validate with zod first
      const validated = guestSchema.parse(formValues);
      await createGuest(validated, "frontend_user");
      // reload
      const newList = await getActiveGuests();
      setGuests(newList || []);
      toast?.success?.("Guest created");
    } catch (err: any) {
      console.error("create failed:", err);
      if (err?.issues) {
        // zod error
        alert("Validation error: " + JSON.stringify(err.issues));
      } else {
        alert("Create failed");
      }
    }
  }

  async function handleUpdateGuest(guestName: string, updatedFields: any) {
    try {
      const validated = guestSchema.parse({ ...updatedFields, guest_name: guestName });
      await updateGuest(guestName, validated, "frontend_user");
      const newList = await getActiveGuests();
      setGuests(newList || []);
      toast?.success?.("Guest updated");
    } catch (err: any) {
      console.error("update failed:", err);
      alert("Update failed");
    }
  }

  async function handleSoftDeleteGuest(guestName: string) {
    if (!confirm(`Soft-delete guest "${guestName}"?`)) return;
    try {
      await softDeleteGuest(guestName, "frontend_user");
      setGuests((prev) => prev.filter((g) => g.guest_name !== guestName));
      toast?.success?.("Guest removed");
    } catch (err) {
      console.error("delete failed:", err);
      alert("Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">Guest Management</h2>
          <p className="text-sm text-gray-600">अतिथि प्रबंधन - Manage all guest information and visits</p>
        </div>
        <button
          className="px-6 py-3 bg-[#00247D] text-white rounded-sm hover:bg-blue-900 transition-colors flex items-center gap-2"
          // you'll wire this to open a create modal / form
          onClick={() => {
            // demo: open a prompt to create a minimal guest
            const name = prompt("Guest name (demo) - try 'Test Guest'");
            if (!name) return;
            handleCreateGuest({ guest_name: name });
          }}
        >
          <Plus className="w-5 h-5" />
          Add New Guest
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white border border-gray-200 rounded-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-gray-700 mb-2">Search Guest</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, department, or ID..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]"
                onChange={(e) => {
                  const q = e.target.value.trim().toLowerCase();
                  if (!q) {
                    // reload from backend or keep current list
                    getActiveGuests().then((d) => setGuests(d || []));
                    return;
                  }
                  setGuests((prev) =>
                    prev.filter((g) =>
                      (g.guest_name || "").toLowerCase().includes(q) ||
                      (g.guest_id || "").toLowerCase().includes(q) ||
                      (g.guest_mobile || "").includes(q)
                    )
                  );
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-2">Status</label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:outline-none focus:border-[#00247D]">
              <option>All Status</option>
              <option>Upcoming</option>
              <option>Checked In</option>
              <option>Checked Out</option>
            </select>
          </div>

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

      {/* Guest list table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#F5A623] to-[#E09612] border-b border-[#D4951C]">
              <tr>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Guest ID</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Name</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Mobile</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Email</th>
                <th className="px-6 py-3 text-left text-sm text-[#00247D]">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {guests.map((g) => (
                <tr key={g.guest_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{g.guest_id}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{g.guest_name}</p>
                    <p className="text-xs text-gray-500">{g.guest_name_local_language}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{g.guest_mobile}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{g.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View">
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-green-600 hover:bg-green-50 rounded"
                        title="Edit"
                        onClick={() => {
                          const newName = prompt("Change guest name", g.guest_name);
                          if (!newName) return;
                          handleUpdateGuest(g.guest_name, { ...g, guest_name: newName });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                        title="Soft delete"
                        onClick={() => handleSoftDeleteGuest(g.guest_name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {guests.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    {loading ? "Loading..." : "No guests found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">Showing {guests.length} guests</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">Previous</button>
            <button className="px-4 py-2 bg-[#00247D] text-white rounded-sm text-sm">1</button>
            <button className="px-4 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">2</button>
            <button className="px-4 py-2 border border-gray-300 rounded-sm text-sm hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
