export interface User {
  username: string;
  password?: string;
  role: "super_admin" | "admin" | "viewer" | "operator";
  fullName: string;
  id?: number | string; // Row ID in spreadsheet
}

const APPS_SCRIPT_URL_UMUM = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL_UMUM || "";

export const userService = {
  async getAllUsers(): Promise<User[]> {
    try {
      const response = await fetch(`${APPS_SCRIPT_URL_UMUM}?action=getUsers`);
      if (!response.ok) throw new Error("Gagal mengambil data user");
      return await response.json();
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
