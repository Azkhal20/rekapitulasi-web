
export interface User {
  id?: number;
  username: string;
  role: 'super_admin' | 'admin' | 'operator' | 'viewer';
  fullName: string;
  password?: string; // Optional for updates
}

class UserService {
  private getBaseUrl(): string {
    return process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL_UMUM || '';
  }

  private checkUrl(baseUrl: string) {
    if (!baseUrl || baseUrl.includes('YOUR_DEPLOYMENT_ID')) {
      throw new Error('URL Apps Script belum dikonfigurasi di .env.local');
    }
  }

  private async parseResponse(response: Response, action: string) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('text/html')) {
      const text = await response.text();
      console.error('HTML Response:', text.substring(0, 200));
      throw new Error('Apps Script error (HTML response). Cek deployment.');
    }
    
    try {
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON response for action: ${action}`);
      }
      throw error;
    }
  }

  // GET ALL USERS (POST method because defined in doPost)
  async getUsers(): Promise<User[]> {
    try {
      const baseUrl = this.getBaseUrl();
      this.checkUrl(baseUrl);
      
      const payload = {}; // Action is in query param, data empty
      
      const response = await fetch(`${baseUrl}?action=getUsers`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'getUsers');
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // SAVE USER (ADD/UPDATE)
  async saveUser(user: User): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = this.getBaseUrl();
      this.checkUrl(baseUrl);
      
      const payload = { ...user };
      
      const response = await fetch(`${baseUrl}?action=saveUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'saveUser');
    } catch (error) {
      console.error('Error saving user:', error);
      throw error;
    }
  }

  // DELETE USER
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    try {
      const baseUrl = this.getBaseUrl();
      this.checkUrl(baseUrl);
      
      const payload = { id };
      
      const response = await fetch(`${baseUrl}?action=deleteUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await this.parseResponse(response, 'deleteUser');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}

export const userService = new UserService();
