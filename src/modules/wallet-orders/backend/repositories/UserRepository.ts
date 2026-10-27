import {
  IUser,
  UserRole,
  INITIAL_USERS,
  MASTER_ADMIN_CREDENTIALS,
  DEFAULT_USER_FEATURE_PERMISSIONS,
  IUserFeaturePermissions,
} from '@/backend/domain/user';
import { SystemModuleKey, DEFAULT_MODULE_PERMISSIONS } from '@/backend/domain/config';
import { IPaymentTransaction } from '@/backend/domain/payment';
import { supabaseCloudService } from '@/backend/db/supabaseClient';

class UserRepository {
  private users: IUser[] = [...INITIAL_USERS];
  private activeUserId: string = ''; // Mặc định chưa đăng nhập (Guest) cho đến khi đăng nhập bằng tài khoản
  private hydratedFromCloud = false;
  private transactions: IPaymentTransaction[] = [
    {
      id: 'tx-init-1',
      userId: 'usr-customer-1',
      amountVnd: 250000,
      method: 'vietqr',
      type: 'deposit',
      status: 'completed',
      description: 'Nạp tiền ví qua VietQR Napas 24/7',
      createdAt: '2026-03-10T10:30:00.000Z',
      updatedAt: '2026-03-10T10:30:30.000Z',
    },
    {
      id: 'tx-init-2',
      userId: 'usr-admin-1',
      amountVnd: 50000000,
      method: 'wallet',
      type: 'deposit',
      status: 'completed',
      description: 'Khởi tạo số dư hệ thống quản trị HLCAI Admin',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  constructor() {
    this.ensureMasterAdmin();
    this.hydrateFromSupabase();
  }

  private ensureMasterAdmin() {
    const masterTemplate = INITIAL_USERS[0];
    const existingIdx = this.users.findIndex(
      (u) => u.id === MASTER_ADMIN_CREDENTIALS.id || u.username === MASTER_ADMIN_CREDENTIALS.username
    );
    if (existingIdx === -1) {
      this.users.unshift({ ...masterTemplate });
    } else {
      this.users[existingIdx] = {
        ...this.users[existingIdx],
        id: MASTER_ADMIN_CREDENTIALS.id,
        username: MASTER_ADMIN_CREDENTIALS.username,
        password: MASTER_ADMIN_CREDENTIALS.password,
        role: 'admin',
        status: 'active',
        allowedModules: { ...masterTemplate.allowedModules },
        allowedFeatures: { ...masterTemplate.allowedFeatures },
      };
    }

    // Đảm bảo tất cả user đều có username, allowedModules và allowedFeatures hợp lệ
    for (const u of this.users) {
      if (!u.username) {
        u.username = u.email ? u.email.split('@')[0] : u.id;
      }
      if (!u.allowedFeatures) {
        u.allowedFeatures = {
          ...(DEFAULT_USER_FEATURE_PERMISSIONS[u.role] || DEFAULT_USER_FEATURE_PERMISSIONS.user),
        };
      }
      if (!u.allowedModules) {
        const defaultMods: Partial<Record<SystemModuleKey, boolean>> = {};
        (Object.keys(DEFAULT_MODULE_PERMISSIONS) as SystemModuleKey[]).forEach((modKey) => {
          defaultMods[modKey] = DEFAULT_MODULE_PERMISSIONS[modKey][u.role] ?? true;
        });
        u.allowedModules = defaultMods;
      }
    }
  }

  private hydrateFromSupabase() {
    if (this.hydratedFromCloud) return;
    this.hydratedFromCloud = true;
    supabaseCloudService
      .loadKvState<{ users?: IUser[]; transactions?: IPaymentTransaction[] }>('laymor_users_state')
      .then((saved) => {
        if (saved?.users && Array.isArray(saved.users) && saved.users.length > 0) {
          this.users = saved.users;
          this.ensureMasterAdmin();
        }
        if (saved?.transactions && Array.isArray(saved.transactions) && saved.transactions.length > 0) {
          this.transactions = saved.transactions;
        }
      })
      .catch(() => {});
  }

  private persistUsersToSupabase(targetUser?: IUser) {
    this.ensureMasterAdmin();
    supabaseCloudService
      .saveKvState('laymor_users_state', {
        users: this.users,
        transactions: this.transactions,
      })
      .catch(() => {});

    if (targetUser) {
      supabaseCloudService
        .upsertTable('laymor_users', [
          {
            id: targetUser.id,
            name: targetUser.name,
            email: targetUser.email,
            role: targetUser.role || 'user',
            avatar: targetUser.avatar || '',
            wallet_balance_vnd: Number(targetUser.walletBalanceVnd || 0),
            updated_at: new Date().toISOString(),
          },
        ])
        .catch(() => {});
    }
  }

  getAllUsers(): IUser[] {
    this.ensureMasterAdmin();
    return this.users;
  }

  getUserById(id: string): IUser | undefined {
    this.ensureMasterAdmin();
    return this.users.find((u) => u.id === id || u.username === id);
  }

  getAuthenticatedUser(cookieUid?: string): IUser | null {
    this.ensureMasterAdmin();
    const targetId = cookieUid !== undefined ? cookieUid : this.activeUserId;
    if (!targetId) return null;
    const user = this.getUserById(targetId);
    if (!user || user.status === 'suspended') {
      return null;
    }
    return user;
  }

  getActiveUser(cookieUid?: string): IUser {
    const authUser = this.getAuthenticatedUser(cookieUid);
    if (authUser) return authUser;
    const fallbackCustomer = this.users.find((u) => u.role === 'user' && u.status === 'active');
    return fallbackCustomer || this.users[this.users.length - 1] || INITIAL_USERS[INITIAL_USERS.length - 1];
  }

  authenticate(identifier: string, password: string): { user?: IUser; error?: string } {
    this.ensureMasterAdmin();
    const cleanId = (identifier || '').trim();
    const cleanLower = cleanId.toLowerCase();
    const rawPass = password || '';

    // 1. Hardcoded Master Admin check (ID: hlcai_admin / Pass: hlcai_2026.!@#)
    if (
      cleanLower === MASTER_ADMIN_CREDENTIALS.username.toLowerCase() &&
      rawPass === MASTER_ADMIN_CREDENTIALS.password
    ) {
      const adminUser = this.getUserById(MASTER_ADMIN_CREDENTIALS.id)!;
      this.activeUserId = adminUser.id;
      return { user: adminUser };
    }

    // 2. Check all registered accounts by username, id, or email
    const found = this.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanLower) ||
        u.id.toLowerCase() === cleanLower ||
        u.email.toLowerCase() === cleanLower
    );

    if (!found) {
      return { error: 'Không tìm thấy tài khoản với ID / Username hoặc Email này.' };
    }

    if (found.status === 'suspended') {
      return { error: 'Tài khoản này đang bị tạm khóa bởi Quản trị viên.' };
    }

    if (found.password !== rawPass) {
      return { error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!' };
    }

    this.activeUserId = found.id;
    return { user: found };
  }

  logout(): void {
    this.activeUserId = '';
  }

  switchActiveUser(id: string): IUser | undefined {
    const user = this.getUserById(id);
    if (user) {
      this.activeUserId = user.id;
      return user;
    }
    return undefined;
  }

  updateBalance(id: string, deltaVnd: number): number {
    const user = this.getUserById(id);
    if (!user) return 0;
    user.walletBalanceVnd = Math.max(0, user.walletBalanceVnd + deltaVnd);
    this.persistUsersToSupabase(user);
    return user.walletBalanceVnd;
  }

  addSellerPendingBalance(id: string, deltaVnd: number): number {
    const user = this.getUserById(id);
    if (!user) return 0;
    user.sellerPendingBalanceVnd = Math.max(0, (user.sellerPendingBalanceVnd || 0) + deltaVnd);
    this.persistUsersToSupabase(user);
    return user.sellerPendingBalanceVnd;
  }

  addTransaction(tx: Omit<IPaymentTransaction, 'id' | 'createdAt' | 'updatedAt'>): IPaymentTransaction {
    const newTx: IPaymentTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.transactions.unshift(newTx);
    this.persistUsersToSupabase();
    return newTx;
  }

  getTransactionsByUser(userId: string): IPaymentTransaction[] {
    return this.transactions.filter((t) => t.userId === userId);
  }

  updateRole(id: string, newRole: UserRole): boolean {
    if (id === MASTER_ADMIN_CREDENTIALS.id || id === MASTER_ADMIN_CREDENTIALS.username) {
      return false; // Không hạ quyền Master Admin
    }
    const user = this.getUserById(id);
    if (!user) return false;
    user.role = newRole;
    this.persistUsersToSupabase(user);
    return true;
  }

  toggleUserStatus(id: string): IUser | undefined {
    if (id === MASTER_ADMIN_CREDENTIALS.id || id === MASTER_ADMIN_CREDENTIALS.username) {
      return undefined; // Không khóa Master Admin
    }
    const user = this.getUserById(id);
    if (!user) return undefined;
    user.status = user.status === 'active' ? 'suspended' : 'active';
    this.persistUsersToSupabase(user);
    return user;
  }

  updateUser(id: string, updates: Partial<IUser>): IUser | undefined {
    const user = this.getUserById(id);
    if (!user) return undefined;
    // Bảo vệ thông tin cốt lõi của tài khoản Master Admin
    if (user.id === MASTER_ADMIN_CREDENTIALS.id) {
      updates.username = MASTER_ADMIN_CREDENTIALS.username;
      updates.password = MASTER_ADMIN_CREDENTIALS.password;
      updates.role = 'admin';
      updates.status = 'active';
    }
    Object.assign(user, updates);
    this.persistUsersToSupabase(user);
    return user;
  }

  deleteUser(id: string): boolean {
    if (
      id === this.activeUserId ||
      id === MASTER_ADMIN_CREDENTIALS.id ||
      id === MASTER_ADMIN_CREDENTIALS.username
    ) {
      return false;
    }
    const idx = this.users.findIndex((u) => u.id === id || u.username === id);
    if (idx !== -1) {
      this.users.splice(idx, 1);
      this.persistUsersToSupabase();
      return true;
    }
    return false;
  }

  getUserByEmail(email: string): IUser | undefined {
    return this.users.find((u) => u.email.trim().toLowerCase() === email.trim().toLowerCase());
  }

  getUserByUsername(username: string): IUser | undefined {
    return this.users.find((u) => u.username.trim().toLowerCase() === username.trim().toLowerCase());
  }

  createUser(
    name: string,
    email: string,
    role: UserRole = 'user',
    avatar?: string,
    options?: {
      username?: string;
      password?: string;
      phone?: string;
      walletBalanceVnd?: number;
      allowedModules?: Partial<Record<SystemModuleKey, boolean>>;
      allowedFeatures?: Partial<IUserFeaturePermissions>;
    }
  ): IUser {
    const cleanUsername = (options?.username || email.split('@')[0] || `user_${Date.now()}`).trim();
    const existingByUsername = this.getUserByUsername(cleanUsername);
    if (existingByUsername) {
      return existingByUsername;
    }

    const defaultMods: Partial<Record<SystemModuleKey, boolean>> = {};
    (Object.keys(DEFAULT_MODULE_PERMISSIONS) as SystemModuleKey[]).forEach((modKey) => {
      defaultMods[modKey] = DEFAULT_MODULE_PERMISSIONS[modKey][role] ?? true;
    });

    const newUser: IUser = {
      id: `usr-${Date.now()}`,
      username: cleanUsername,
      password: options?.password || '123456',
      name,
      email: email || `${cleanUsername}@laymor3d.com`,
      role,
      phone: options?.phone || '',
      avatar:
        avatar ||
        `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || cleanUsername)}`,
      walletBalanceVnd: options?.walletBalanceVnd ?? 100000,
      createdAt: new Date().toISOString(),
      status: 'active',
      allowedModules: {
        ...defaultMods,
        ...(options?.allowedModules || {}),
      },
      allowedFeatures: {
        ...(DEFAULT_USER_FEATURE_PERMISSIONS[role] || DEFAULT_USER_FEATURE_PERMISSIONS.user),
        ...(options?.allowedFeatures || {}),
      },
    };
    this.users.push(newUser);
    this.persistUsersToSupabase(newUser);
    return newUser;
  }

  getAllTransactions(): IPaymentTransaction[] {
    return this.transactions;
  }
}

export const userRepository = new UserRepository();
