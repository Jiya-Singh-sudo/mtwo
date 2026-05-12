import apiClient from "./apiClient";

// export const getDashboardOverview = async () => {
//   const res = await apiClient.get("/dashboard/overview");
//   return res.data;
// };

// export const getLiveDashboard = async () => {
//   const res = await apiClient.get("/dashboard/live-full");
//   return res.data;
// };
export const getDashboardOverview = async (from?: string, to?: string) => {
  const res = await apiClient.get("/dashboard/overview", {
    params: {
      from,
      to,
    },
  });
  return res.data;
};

export const getLiveDashboard = async (from?: string, to?: string) => {
  const res = await apiClient.get("/dashboard/live-full", {
    params: {
      from,
      to,
    },
  });
  return res.data;
};