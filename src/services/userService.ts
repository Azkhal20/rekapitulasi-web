export interface User {
  username: string;
  password?: string;
  role: "super_admin" | "admin" | "viewer" | "operator";
  fullName: string;
  id?: number | string; // Row ID in spreadsheet
}

const APPS_SCRIPT_URL_UMUM = process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM || "";

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL_UMUM}?action=getUsers`);
      if (!response.ok) throw new Error("Gagal mengambil data user");
      const data = await response.json();
      
      // Map GAS fields to frontend User interface (handling potential uppercase keys)
      return data.map((u: Record<string, any>) => ({
        username: u.username || u.USERNAME || "",
        fullName: u.fullName || u.NAMA_LENGKAP || u.FULLNAME || "",
        role: u.role || u.ROLE || "admin",
        password: u.password || u.PASSWORD || "",
        id: u.id || u.ID || "",
      }));
    } catch (error) {
      console.error("Error fetching users:", error);
      return [];
    }
  },

  async addUser(user: User): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${APPS_SCRIPT_URL_UMUM}?action=saveUser`, {
      method: "POST",
      body: JSON.stringify(user),
    });
    return response.json();
  },

  async updateUser(user: User): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${APPS_SCRIPT_URL_UMUM}?action=saveUser`, {
      method: "POST",
      body: JSON.stringify(user),
    });
    return response.json();
  },

  async deleteUser(id: number | string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`${APPS_SCRIPT_URL_UMUM}?action=deleteUser`, {
      method: "POST",
      body: JSON.stringify({ id }),
    });
    return response.json();
  },
};
