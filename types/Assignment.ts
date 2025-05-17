export interface Assignment {
  id: number;
  companyId: number;
  employeeId: number;
  branchId: number;
  serviceId: number;
  startDate: string;
  endDate?: string;
  status: string;
  notes: string;
  createdAt: string;
}
