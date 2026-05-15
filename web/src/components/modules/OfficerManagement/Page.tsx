import { useState, useEffect } from 'react';
import { Plus, Eye, Edit2, Trash2, UserCog } from 'lucide-react';
// import { v4 as uuidv4 } from 'uuid';
import './OfficerManagement.css';
import {
  getLiasoningOfficers,
  createLiasoningOfficer,
  updateLiasoningOfficer,
  softDeleteLiasoningOfficer,
} from "../../../api/liasoning-officer.api";
import {
  getMedicalEmergencyServices,
  createMedicalEmergencyService,
  updateMedicalEmergencyService,
  softDeleteMedicalEmergencyService,
} from "../../../api/medicalEmergencyService.api";
// import { validateSingleField } from '@/utils/validateSingleField';
// import { FieldError } from '@/components/ui/FieldError';
// import { useError } from "@/context/ErrorContext";
import { useTableQuery } from '@/hooks/useTableQuery';
import { Column, DataTable } from '@/components/ui/DataTable';
import { PageLayout } from "@/components/layout/PageLayout";
import { PageToolbar } from "@/components/layout/PageToolbar";
// import { Button } from "@/components/ui/button";

// interface Officer {
//   id: string;
//   name: string;
//   phoneNo: string;
//   addedDate: string;
// }

export function OfficerManagement() {
  const [activeTab, setActiveTab] =
    useState<"medical" | "liaisoning">("medical");
  // const [showAddForm, setShowAddForm] = useState(false);
  // const [showViewModal, setShowViewModal] = useState(false);
  // const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  // const [isEditing, setIsEditing] = useState(false);

  // const [showAddModal, setShowAddModal] = useState(false);
  // const [showEditModal, setShowEditModal] = useState(false);
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // const [viewOfficer, setViewOfficer] = useState<any | null>(null);
  // const [selectedOfficer, setSelectedOfficer] = useState<any | null>(null);

  const medicalTable = useTableQuery({
    prefix: "medical",
    sortBy: "service_provider_name",
    sortOrder: "asc",
    limit: 10,
  });

  const liaisoningTable = useTableQuery({
    prefix: "liaisoning",
    sortBy: "officer_name",
    sortOrder: "asc",
    limit: 10,
  });

  const [medicalServices, setMedicalServices] = useState<any[]>([]);
  const [liaisoningOfficers, setLiaisoningOfficers] = useState<any[]>([]);

  const [showAddMedicalModal, setShowAddMedicalModal] = useState(false);
  const [showEditMedicalModal, setShowEditMedicalModal] = useState(false);
  const [showAddLiaisoningModal, setShowAddLiaisoningModal] = useState(false);
  const [showEditLiaisoningModal, setShowEditLiaisoningModal] = useState(false);
  // const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // const [viewOfficer, setViewOfficer] = useState<any | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<any | null>(null);
  const [viewMedicalService, setViewMedicalService] = useState<any | null>(null);
  const [viewLiaisoningOfficer, setViewLiaisoningOfficer] = useState<any | null>(null);
  const [deleteMedicalService, setDeleteMedicalService] = useState<any | null>(null);
  const [deleteLiaisoningOfficer, setDeleteLiaisoningOfficer] = useState<any | null>(null);

  const [medicalFormData, setMedicalFormData] = useState({
    service_provider_name: '',
    service_provider_name_local_language: '',
    service_type: '',
    mobile: '',
    alternate_mobile: '',
    distance_from_guest_house: '',
  });
  const [liaisoningFormData, setLiaisoningFormData] = useState({
    officer_name: '',
    officer_name_local_language: '',
    mobile: '',
    alternate_mobile: '',
    role_id: '',
    department: '',
  });
  const openViewMedicalModal = (row: any) => {
    setViewMedicalService(row);
  };

  const openViewLiaisoningModal = (row: any) => {
    setViewLiaisoningOfficer(row);
  };
  const openDeleteMedicalModal = (row: any) => {
    setDeleteMedicalService(row);
  };

  const openDeleteLiaisoningModal = (row: any) => {
    setDeleteLiaisoningOfficer(row);
  };
  const openEditMedicalModal = (row: any) => {

    setSelectedOfficer(row);

    setMedicalFormData({
      service_provider_name:
        row.service_provider_name || '',

      service_provider_name_local_language:
        row.service_provider_name_local_language || '',

      service_type:
        row.service_type || '',

      mobile:
        row.mobile || '',

      alternate_mobile:
        row.alternate_mobile || '',

      distance_from_guest_house:
        row.distance_from_guest_house || '',
    });

    setShowEditMedicalModal(true);
  };

  const openEditLiaisoningModal = (row: any) => {

    setSelectedOfficer(row);

    setLiaisoningFormData({
      officer_name:
        row.officer_name || '',

      officer_name_local_language:
        row.officer_name_local_language || '',

      mobile:
        row.mobile || '',

      alternate_mobile:
        row.alternate_mobile || '',

      role_id:
        row.role_id || '',

      department:
        row.department || '',
    });

    setShowEditLiaisoningModal(true);
  };
  // const currentOfficers = activeTab === 'medical' ? medicalTable.data : liaisoningTable.data;
  // const setCurrentOfficers = activeTab === 'medical' ? medicalTable.setData : liaisoningTable.setData;

  async function loadLiaisoningOfficers() {
    try {
      liaisoningTable.setLoading(true);

      const res = await getLiasoningOfficers({
        page: liaisoningTable.query.page,
        limit: liaisoningTable.query.limit,
        search: liaisoningTable.query.search,
        sortBy: liaisoningTable.query.sortBy,
        sortOrder: liaisoningTable.query.sortOrder,
      });

      setLiaisoningOfficers(res.data);

      liaisoningTable.setTotal(res.totalCount);

    } catch (err) {
      console.error("Failed to load liaisoning officers", err);
    } finally {
      liaisoningTable.setLoading(false);
    }
  }
  async function loadMedicalServices() {
    try {
      medicalTable.setLoading(true);

      const res = await getMedicalEmergencyServices({
        page: medicalTable.query.page,
        limit: medicalTable.query.limit,
        search: medicalTable.query.search,
        sortBy: medicalTable.query.sortBy,
        sortOrder: medicalTable.query.sortOrder,
      });

      setMedicalServices(res.data);

      medicalTable.setTotal(res.totalCount);

    } catch (err) {
      console.error("Failed to load medical services", err);
    } finally {
      medicalTable.setLoading(false);
    }
  }
  useEffect(() => {
    loadMedicalServices();
  }, [medicalTable.query]);
  useEffect(() => {
    loadLiaisoningOfficers();
  }, [liaisoningTable.query]);

  const medicalColumns: Column<any>[] = [

    {
      header: "Provider Name",
      accessor: "service_provider_name",
      sortable: true,
      sortKey: "service_provider_name",
    },

    {
      header: "Service Type",
      accessor: "service_type",
    },

    {
      header: "Mobile",
      accessor: "mobile",
    },

    {
      header: "Distance",
      accessor: "distance_from_guest_house",
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">

          <button
            onClick={() =>
              openViewMedicalModal(row)
            }
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() =>
              openEditMedicalModal(row)
            }
          >
            <Edit2 className="w-4 h-4 text-green-600" />
          </button>

          <button
            onClick={() =>
              openDeleteMedicalModal(row)
            }
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>

        </div>
      ),
    }
  ];
  const liaisoningColumns: Column<any>[] = [

    {
      header: "Officer Name",
      accessor: "officer_name",
      sortable: true,
      sortKey: "officer_name",
    },

    {
      header: "Mobile",
      accessor: "mobile",
    },

    {
      header: "Department",
      accessor: "department",
    },

    {
      header: "Role ID",
      accessor: "role_id",
    },

    {
      header: "Actions",
      render: (row) => (
        <div className="flex items-center gap-2">

          <button
            onClick={() =>
              openViewLiaisoningModal(row)
            }
          >
            <Eye className="w-4 h-4 text-blue-600" />
          </button>

          <button
            onClick={() =>
              openEditLiaisoningModal(row)
            }
          >
            <Edit2 className="w-4 h-4 text-green-600" />
          </button>

          <button
            onClick={() =>
              openDeleteLiaisoningModal(row)
            }
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>

        </div>
      ),
    }
  ];

  const handleAddLiaisoningOfficer = async () => {
    try {

      await createLiasoningOfficer({

        officer_name:
          liaisoningFormData.officer_name,

        // officer_name_local_language:
        //   liaisoningFormData.officer_name_local_language,

        mobile:
          liaisoningFormData.mobile,

        alternate_mobile:
          liaisoningFormData.alternate_mobile,

        // role_id:
        //   liaisoningFormData.role_id,

        // department:
        //   liaisoningFormData.department,
      });

      // setShowAddModal(false);
      setShowAddLiaisoningModal(false);

      await loadLiaisoningOfficers();

    } catch (err) {
      console.error(err);
    }
  };
  const handleEditLiaisoningOfficer = async () => {

    if (!selectedOfficer) return;

    try {

      await updateLiasoningOfficer(
        selectedOfficer.officer_id,
        {
          officer_name:
            liaisoningFormData.officer_name,

          // officer_name_local_language:
          //   liaisoningFormData.officer_name_local_language,

          mobile:
            liaisoningFormData.mobile,

          alternate_mobile:
            liaisoningFormData.alternate_mobile,

          // role_id:
          //   liaisoningFormData.role_id,

          // department:
          //   liaisoningFormData.department,
        }
      );

      // setShowEditModal(false);
      setShowEditLiaisoningModal(false);

      await loadLiaisoningOfficers();

    } catch (err) {
      console.error(err);
    }
  }

  const handleAddMedicalService = async () => {
    try {

      await createMedicalEmergencyService({
        service_provider_name:
          medicalFormData.service_provider_name,

        mobile:
          medicalFormData.mobile,

        alternate_mobile:
          medicalFormData.alternate_mobile,

      });

      if (activeTab === "medical") {
        setShowAddMedicalModal(false);
      } else {
        setShowAddLiaisoningModal(false);
      }

      await loadMedicalServices();

    } catch (err) {
      console.error(err);
    }
  };
  const handleEditMedicalService = async () => {

    if (!selectedOfficer) return;

    try {

      await updateMedicalEmergencyService(
        selectedOfficer.service_id,
        {
          service_provider_name:
            medicalFormData.service_provider_name,

          // service_provider_name_local_language:
          //   medicalFormData.service_provider_name_local_language,

          // service_type:
          //   medicalFormData.service_type,

          mobile:
            medicalFormData.mobile,

          alternate_mobile:
            medicalFormData.alternate_mobile,

          // distance_from_guest_house:
          //   medicalFormData.distance_from_guest_house,
        }
      );

      // setShowEditModal(false);
      setShowEditMedicalModal(false);
      await loadMedicalServices();

    } catch (err) {
      console.error(err);
    }
  }

  // const handleCloseForm = () => {
  //   // setShowAddForm(false);
  //   // setIsEditing(false);
  //   setSelectedOfficer(null);
  //   // setFormData({ name: '', phoneNo: '' });
  // };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[#00247D] flex items-center gap-2">
            <UserCog className="w-6 h-6" />
            Officer Management | अधिकारी प्रबंधन
          </h2>
          <p className="text-gray-600 text-sm mt-1">Manage Medical and Liaising Officers</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-sm overflow-hidden">
        <div className="nicTabs">

          <button
            className={`nicTab ${
              activeTab === "medical" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("medical");
              medicalTable.setPage(1);
            }}
          >
            Medical Services
          </button>

          <button
            className={`nicTab ${
              activeTab === "liaisoning" ? "active" : ""
            }`}
            onClick={() => {
              setActiveTab("liaisoning");
              liaisoningTable.setPage(1);
            }}
          >
            Liaisoning Officers
          </button>

        </div>

        {/* Content */}
        <div className="p-6">
          {/* Add Button */}
          <div className="mb-4">
            <button
              onClick={() => {

                if (activeTab === "medical") {
                  setShowAddMedicalModal(true);
                } else {
                  setShowAddLiaisoningModal(true);
                }

              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-[#003a9e] transition-colors"
            >
              <Plus className="w-4 h-4" />
                {activeTab === "medical"
                  ? "Add Medical Service"
                  : "Add Liaisoning Officer"}
              </button>
          </div>
          {activeTab === "medical" && (
            <PageLayout
              title=""
              subtitle=""
              toolbar={
                <PageToolbar
                  left={
                    <input
                      className="nicInput"
                      placeholder="Search medical services..."
                      value={medicalTable.searchInput}
                      onChange={(e) =>
                        medicalTable.setSearchInput(e.target.value)
                      }
                    />
                  }
                />
              }
            >
              <DataTable
                data={medicalServices}
                columns={medicalColumns}
                keyField="service_id"
                page={medicalTable.query.page}
                limit={medicalTable.query.limit}
                totalCount={medicalTable.total}
                sortBy={medicalTable.query.sortBy}
                sortOrder={medicalTable.query.sortOrder}
                loading={medicalTable.loading}
                onPageChange={medicalTable.setPage}
                onLimitChange={medicalTable.setLimit}
                onSortChange={medicalTable.setSort}
              />
            </PageLayout>
          )}
          {activeTab === "liaisoning" && (
            <PageLayout
              title=""
              subtitle=""
              toolbar={
                <PageToolbar
                  left={
                    <input
                      className="nicInput"
                      placeholder="Search liaisoning officers..."
                      value={liaisoningTable.searchInput}
                      onChange={(e) =>
                        liaisoningTable.setSearchInput(e.target.value)
                      }
                    />
                  }
                />
              }
            >
              <DataTable
                data={liaisoningOfficers}
                columns={liaisoningColumns}
                keyField="officer_id"
                page={liaisoningTable.query.page}
                limit={liaisoningTable.query.limit}
                totalCount={liaisoningTable.total}
                sortBy={liaisoningTable.query.sortBy}
                sortOrder={liaisoningTable.query.sortOrder}
                loading={liaisoningTable.loading}
                onPageChange={liaisoningTable.setPage}
                onLimitChange={liaisoningTable.setLimit}
                onSortChange={liaisoningTable.setSort}
              />
            </PageLayout>
          )}

          {/* Officers Table */}
          {/* <div className="overflow-x-auto">
            <DataTable
              data={officers}
              columns={officerColumns}
              keyField="officer_id"
              page={officerTable.query.page}
              limit={officerTable.query.limit}
              totalCount={officerTable.total}
              sortBy={officerTable.query.sortBy}
              sortOrder={officerTable.query.sortOrder}
              loading={officerTable.loading}
              onPageChange={officerTable.setPage}
              onLimitChange={officerTable.setLimit}
              onSortChange={officerTable.setSort}
            />
          </div> */}
        </div>
      </div>
          {/* Medical View Modal */}
          {viewMedicalService && (

            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Medical Service Details</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setViewMedicalService(null)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="space-y-3">

                    <p>
                      <b>Provider Name:</b>{" "}
                      {viewMedicalService.service_provider_name}
                    </p>

                    <p>
                      <b>Service Type:</b>{" "}
                      {viewMedicalService.service_type}
                    </p>

                    <p>
                      <b>Mobile:</b>{" "}
                      {viewMedicalService.mobile}
                    </p>

                    <p>
                      <b>Alternate Mobile:</b>{" "}
                      {viewMedicalService.alternate_mobile}
                    </p>

                    <p>
                      <b>Distance:</b>{" "}
                      {viewMedicalService.distance_from_guest_house}
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}
          {/* Liaisoning View Modal */}
          {viewLiaisoningOfficer && (

            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Liaisoning Officer Details</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setViewLiaisoningOfficer(null)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="space-y-3">

                    <p>
                      <b>Officer Name:</b>{" "}
                      {viewLiaisoningOfficer.officer_name}
                    </p>

                    <p>
                      <b>Mobile:</b>{" "}
                      {viewLiaisoningOfficer.mobile}
                    </p>

                    <p>
                      <b>Alternate Mobile:</b>{" "}
                      {viewLiaisoningOfficer.alternate_mobile}
                    </p>

                    <p>
                      <b>Department:</b>{" "}
                      {viewLiaisoningOfficer.department}
                    </p>

                    <p>
                      <b>Role ID:</b>{" "}
                      {viewLiaisoningOfficer.role_id}
                    </p>

                  </div>

                </div>

              </div>

            </div>
          )}
          {/* Medical Delete Modal */}
          {deleteMedicalService && (

            <div className="modalOverlay">

              <div className="modal">

                <h3 className="text-lg font-semibold mb-4">
                  Delete Medical Service
                </h3>

                <p className="mb-6">
                  Are you sure you want to delete this medical service?
                </p>

                <div className="flex justify-end gap-3">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setDeleteMedicalService(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="deleteBtn"
                    onClick={async () => {

                      await softDeleteMedicalEmergencyService(
                        deleteMedicalService.service_id
                      );

                      await loadMedicalServices();

                      setDeleteMedicalService(null);
                    }}
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          )}
          {/* Liaisoning Delete Modal */}
          {deleteLiaisoningOfficer && (

            <div className="modalOverlay">

              <div className="modal">

                <h3 className="text-lg font-semibold mb-4">
                  Delete Liaisoning Officer
                </h3>

                <p className="mb-6">
                  Are you sure you want to delete this officer?
                </p>

                <div className="flex justify-end gap-3">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setDeleteLiaisoningOfficer(null)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="deleteBtn"
                    onClick={async () => {

                      await softDeleteLiasoningOfficer(
                        deleteLiaisoningOfficer.officer_id
                      );

                      await loadLiaisoningOfficers();

                      setDeleteLiaisoningOfficer(null);
                    }}
                  >
                    Delete
                  </button>

                </div>

              </div>

            </div>
          )}
          {/* Add/Edit Form */}
          {/* Add Medical Modal */}
          {showAddMedicalModal && (
            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Add Medical Service</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setShowAddMedicalModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="nicFormGrid">

                    <div>
                      <label className="nicLabel">
                        Medical Officer Name
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.service_provider_name}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            service_provider_name:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* <div>
                      <label className="nicLabel">
                        Service Type
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.service_type}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            service_type:
                              e.target.value,
                          })
                        }
                      />
                    </div> */}

                    <div>
                      <label className="nicLabel">
                        Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.mobile}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="nicLabel">
                        Alternate Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.alternate_mobile}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            alternate_mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                </div>

                <div className="nicModalActions">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setShowAddMedicalModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="saveBtn"
                    onClick={handleAddMedicalService}
                  >
                    Add Service
                  </button>

                </div>

              </div>

            </div>
          )}
          {/* Edit Medical Modal */}
          {showEditMedicalModal && selectedOfficer && (
            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Edit Medical Service</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setShowEditMedicalModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="nicFormGrid">

                    <div>
                      <label className="nicLabel">
                        Medical Officer Name
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.service_provider_name}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            service_provider_name:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    {/* <div>
                      <label className="nicLabel">
                        Service Type
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.service_type}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            service_type:
                              e.target.value,
                          })
                        }
                      />
                    </div> */}
                    <div>
                      <label className="nicLabel">
                        Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.mobile}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="nicLabel">
                        Alternate Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={medicalFormData.alternate_mobile}
                        onChange={(e) =>
                          setMedicalFormData({
                            ...medicalFormData,
                            alternate_mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                </div>

                <div className="nicModalActions">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setShowEditMedicalModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="saveBtn"
                    onClick={handleEditMedicalService}
                  >
                    Save Changes
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* Add Liaisoning Modal */}
          {showAddLiaisoningModal && (
            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Add Liaisoning Officer</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setShowAddLiaisoningModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="nicFormGrid">

                    <div>
                      <label className="nicLabel">
                        Liasoning Officer Name
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.officer_name}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            officer_name:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="nicLabel">
                        Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.mobile}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="nicLabel">
                        Alternate Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.alternate_mobile}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            alternate_mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* <div>
                      <label className="nicLabel">
                        Department
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.department}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            department:
                              e.target.value,
                          })
                        }
                      />
                    </div> */}

                  </div>

                </div>

                <div className="nicModalActions">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setShowAddLiaisoningModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="saveBtn"
                    onClick={handleAddLiaisoningOfficer}
                  >
                    Add Officer
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* Edit Liaisoning Modal */}
          {showEditLiaisoningModal && selectedOfficer && (
            <div className="modalOverlay">

              <div className="nicModal">

                <div className="nicModalHeader">

                  <h2>Edit Liaisoning Officer</h2>

                  <button
                    className="closeBtn"
                    onClick={() =>
                      setShowEditLiaisoningModal(false)
                    }
                  >
                    ✕
                  </button>

                </div>

                <div className="nicModalBody">

                  <div className="nicFormGrid">

                    <div>
                      <label className="nicLabel">
                        Liaisoning Officer Name
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.officer_name}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            officer_name:
                              e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="nicLabel">
                        Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.mobile}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="nicLabel">
                        Alternate Mobile
                      </label>

                      <input
                        className="nicInput"
                        value={liaisoningFormData.alternate_mobile}
                        onChange={(e) =>
                          setLiaisoningFormData({
                            ...liaisoningFormData,
                            alternate_mobile:
                              e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                </div>

                <div className="nicModalActions">

                  <button
                    className="cancelBtn"
                    onClick={() =>
                      setShowEditLiaisoningModal(false)
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="saveBtn"
                    onClick={handleEditLiaisoningOfficer}
                  >
                    Save Changes
                  </button>

                </div>

              </div>

            </div>
          )}

      {/* View Modal */}
      {/* {showViewModal && selectedOfficer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-sm p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[#00247D] font-semibold text-lg">Officer Details</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="p-1 hover:bg-gray-200 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Officer Name</p>
                <p className="font-semibold text-gray-900">{selectedOfficer?.officer_name}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Phone Number</p>
                <p className="font-semibold text-gray-900">{selectedOfficer?.mobile}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Added Date</p>
                <p className="font-semibold text-gray-900">
                  {new Date(selectedOfficer.addedDate).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Officer Type</p>
                <p className="font-semibold text-gray-900">
                  {activeTab === 'medical' ? 'Medical Officer' : 'Liaising Officer'}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowViewModal(false)}
                className="w-full px-4 py-2 bg-[#00247D] text-white rounded-sm hover:bg-[#003a9e] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}

