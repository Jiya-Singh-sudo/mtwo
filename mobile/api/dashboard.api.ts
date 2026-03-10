import apiClient from "./apiClient";

export const getDashboardOverview = async () => {
  const res = await apiClient.get("/dashboard/overview");
  return res.data;
};
