import React, { useState, useEffect } from 'react';
import { designationAPI } from '../../config/api';
// Ensure these types are actually exported from your types file
import type { Designation, DesignationFormData } from '../types/Designation';
import styles from './DesignationM.module.css';

const DesignationM: React.FC = () => {
  const [designations, setDesignations] = useState<Designation[]>([]);
  // Use loading state to show a loader if needed
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState<DesignationFormData>({
    designation_name: '',
    department: '',
    description: '',
    status: 'active',
  });

  useEffect(() => {
    fetchDesignations();
  }, []);

  const fetchDesignations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await designationAPI.getAll();
      setDesignations(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch designations. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      designation_name: '',
      department: '',
      description: '',
      status: 'active',
    });
    setShowModal(true);
  };

  const handleEdit = (designation: Designation) => {
    setEditingId(designation.id);
    setFormData({
      designation_name: designation.designation_name,
      department: designation.department,
      description: designation.description,
      status: designation.status,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.designation_name.trim()) {
      setError('Designation name is required');
      return;
    }

    try {
      if (editingId) {
        await designationAPI.update(editingId, formData);
      } else {
        await designationAPI.create(formData);
      }
      handleCloseModal();
      fetchDesignations();
    } catch (err) {
      console.error(err);
      setError('Error saving designation.');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this designation?')) return;
    try {
      await designationAPI.delete(id);
      fetchDesignations();
    } catch (err) {
        console.error(err);
      setError('Failed to delete designation');
    }
  };

  if (loading && designations.length === 0) {
      return <div className={styles.page}>Loading...</div>;
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerCard}>
        <h1>Designation Master</h1>
        <button className={styles.addButton} onClick={handleCreate}>
          + Add Designation
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Department</th>
              <th>Description</th>
              <th>Status</th>
              <th style={{ width: "150px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {designations.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.noData}>
                  No designations found.
                </td>
              </tr>
            ) : (
              designations.map((d) => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td>{d.designation_name}</td>
                  <td>{d.department || '-'}</td>
                  <td>{d.description || '-'}</td>
                  <td>
                    {/* Fixed string interpolation here */}
                    <span className={`${styles.badge} ${styles[d.status]}`}>
                      {d.status}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.editBtn} onClick={() => handleEdit(d)}>
                        Edit
                      </button>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(d.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Designation' : 'Add New Designation'}</h2>

            <form onSubmit={handleSubmit}>
              <label>Designation Name *</label>
              <input
                type="text"
                name="designation_name"
                value={formData.designation_name}
                onChange={handleInputChange}
                required
              />

              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />

              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />

              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DesignationM;