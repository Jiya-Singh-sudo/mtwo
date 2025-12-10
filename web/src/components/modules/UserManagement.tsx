import { useState } from 'react';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
[{
	"resource": "/c:/Users/ayij3/Desktop/JiyaProjects/MTWO/web/src/components/modules/RoomManagement.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'isLoading'.",
	"source": "ts",
	"startLineNumber": 195,
	"startColumn": 93,
	"endLineNumber": 195,
	"endColumn": 102,
	"origin": "extHost1"
},{
	"resource": "/c:/Users/ayij3/Desktop/JiyaProjects/MTWO/web/src/components/modules/RoomManagement.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'isLoading'.",
	"source": "ts",
	"startLineNumber": 196,
	"startColumn": 115,
	"endLineNumber": 196,
	"endColumn": 124,
	"origin": "extHost1"
},{
	"resource": "/c:/Users/ayij3/Desktop/JiyaProjects/MTWO/web/src/components/modules/RoomManagement.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'isLoading'.",
	"source": "ts",
	"startLineNumber": 197,
	"startColumn": 16,
	"endLineNumber": 197,
	"endColumn": 25,
	"origin": "extHost1"
},{
	"resource": "/c:/Users/ayij3/Desktop/JiyaProjects/MTWO/web/src/components/modules/RoomManagement.tsx",
	"owner": "typescript",
	"code": "2304",
	"severity": 8,
	"message": "Cannot find name 'Loader2'.",
	"source": "ts",
	"startLineNumber": 197,
	"startColumn": 31,
	"endLineNumber": 197,
	"endColumn": 38,
	"origin": "extHost1"
}]
interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Dept Head' | 'Officer' | 'Staff';
  department: string;
}

export function UserManagement() {
  // --- 1. STATE MANAGEMENT ---
  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      userId: 'USR001',
      name: 'Ramesh Sharma',
      email: 'ramesh.sharma@rajbhavan.gov.in',
      role: 'Admin',
      department: 'Administration'
    },
    {
      id: '2',
      userId: 'USR002',
      name: 'Priya Kulkarni',
      email: 'priya.kulkarni@rajbhavan.gov.in',
      role: 'Dept Head',
      department: 'Guest Services'
    }
  ]);

  // Modal visibility states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Selection and Loading states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form Data State
  const [formData, setFormData] = useState({
    userId: '',
    name: '',
    email: '',
    role: 'Staff' as User['role'],
    department: ''
  });

  // --- 2. HELPER FUNCTIONS ---
  const resetForm = () => {
    setFormData({
      userId: '',
      name: '',
      email: '',
      role: 'Staff',
      department: ''
    });
  };

  const validateForm = () => {
    if (!formData.userId || !formData.name || !formData.email || !formData.department) {
      alert("Please fill in all required fields.");
      return false;
    }
    return true;
  };

  // --- 3. ACTION HANDLERS (LOGIC) ---

  // Handle Adding a New User
  const handleAddUser = async () => {
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      // Simulate API call delay (1 second)
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newUser: User = {
        id: Date.now().toString(),
        ...formData
      };

      setUsers([...users, newUser]); // Update list
      setIsAddModalOpen(false);      // Close modal
      resetForm();                   // Clear form
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Editing an Existing User
  const handleEditUser = async () => {
    if (!selectedUser) return;
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(users.map(u => u.id === selectedUser.id ? { ...selectedUser, ...formData } : u));
      setIsEditModalOpen(false);
      setSelectedUser(null);
      resetForm();
    } catch (error) {
      console.error("Error editing user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Deleting a User
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUsers(users.filter(u => u.id !== selectedUser.id));
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Error deleting user:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Open Edit Modal and Pre-fill Data
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setFormData({
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    });
    setIsEditModalOpen(true);
  };

  // Open Delete Dialog
  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-purple-100 text-purple-800';
      case 'Dept Head': return 'bg-blue-100 text-blue-800';
      case 'Officer': return 'bg-green-100 text-green-800';
      case 'Staff': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // --- 4. RENDER (JSX) ---
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D]">User Management</h2>
          <p className="text-gray-600 text-sm mt-1">Manage system users and roles | उपयोगकर्ता प्रबंधन</p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsAddModalOpen(true); }}
          className="bg-[#00247D] hover:bg-[#003399] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New User
        </Button>
      </div>

      {/* User List Table */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F5A623] text-white">
                <th className="px-4 py-3 text-left text-sm">User ID</th>
                <th className="px-4 py-3 text-left text-sm">Name & Email</th>
                <th className="px-4 py-3 text-left text-sm">Role</th>
                <th className="px-4 py-3 text-left text-sm">Department</th>
                <th className="px-4 py-3 text-left text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-900">
                    {user.userId}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <span className={`inline-block px-2 py-1 rounded-sm text-xs ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200 text-sm text-gray-700">
                    {user.department}
                  </td>
                  <td className="px-4 py-3 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(user)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDialog(user)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Add New User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="userId">User ID *</Label>
              <Input
                id="userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                placeholder="USR001"
              />
            </div>
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@rajbhavan.gov.in"
              />
            </div>
            <div>
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Dept Head">Dept Head</SelectItem>
                  <SelectItem value="Officer">Officer</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="department">Department *</Label>
              <Input
                id="department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                placeholder="Enter department"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsAddModalOpen(false); resetForm(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} className="bg-[#00247D] hover:bg-[#003399] text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-[#00247D]">Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-userId">User ID *</Label>
              <Input
                id="edit-userId"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-email">Email *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Dept Head">Dept Head</SelectItem>
                  <SelectItem value="Officer">Officer</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-department">Department *</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditModalOpen(false); resetForm(); }} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleEditUser} className="bg-[#00247D] hover:bg-[#003399] text-white" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete user <strong>{selectedUser?.name}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={(e: any) => { e.preventDefault(); handleDeleteUser(); }} className="bg-red-600 hover:bg-red-700" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...</> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}