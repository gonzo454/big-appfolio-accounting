import type { UserRole } from "./session";

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const users: User[] = [
  {
    id: "emp-001",
    name: "Mike Wagner",
    email: "mike@blackdeerig.com",
    password: "BIG2025!",
    role: "employee",
  },
  {
    id: "emp-002",
    name: "BIG Admin",
    email: "admin@blackdeerig.com",
    password: "BIGadmin2025!",
    role: "employee",
  },
  {
    id: "inv-001",
    name: "Investor Portal",
    email: "investor@blackdeerig.com",
    password: "BIGinvestor2025!",
    role: "investor",
  },
];

export function findUser(email: string, password: string): User | null {
  const user = users.find(
    (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  return user || null;
}
