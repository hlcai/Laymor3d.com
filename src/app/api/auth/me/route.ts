import { NextRequest, NextResponse } from 'next/server';
import { userRepository } from '@/backend/repositories/UserRepository';
import { ROLE_PERMISSIONS, UserRole } from '@/backend/domain/user';

const SESSION_COOKIE_NAME = 'laymor_uid';

export async function GET(req: NextRequest) {
  const cookieUid = req.cookies.get(SESSION_COOKIE_NAME)?.value || '';
  const headerUid = req.headers.get('x-laymor-uid') || '';
  const targetUid = cookieUid || headerUid;

  const user = targetUid ? userRepository.getAuthenticatedUser(targetUid) : userRepository.getAuthenticatedUser();
  const permissions = user ? ROLE_PERMISSIONS[user.role] : ROLE_PERMISSIONS.user;
  const allUsers = userRepository.getAllUsers();

  return NextResponse.json({
    success: true,
    user,
    permissions,
    allUsers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action,
      userId,
      username,
      password,
      identifier,
      role,
      name,
      email,
      phone,
      avatar,
      amount,
      allowedModules,
      allowedFeatures,
    } = body;

    // 1. Đăng nhập hệ thống bằng ID / Username + Password (bao gồm hlcai_admin / hlcai_2026.!@#)
    if (action === 'login') {
      const loginId = identifier || username || email || '';
      const result = userRepository.authenticate(loginId, password || '');
      if (result.error || !result.user) {
        return NextResponse.json(
          { success: false, error: result.error || 'Sai thông tin đăng nhập' },
          { status: 401 }
        );
      }

      const loggedInUser = result.user;
      const res = NextResponse.json({
        success: true,
        user: loggedInUser,
        permissions: ROLE_PERMISSIONS[loggedInUser.role],
        allUsers: userRepository.getAllUsers(),
        message: `Đăng nhập thành công: ${loggedInUser.name} (${loggedInUser.username})`,
      });
      res.cookies.set(SESSION_COOKIE_NAME, loggedInUser.id, {
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
        sameSite: 'lax',
      });
      return res;
    }

    // 2. Đăng xuất tài khoản
    if (action === 'logout') {
      userRepository.logout();
      const res = NextResponse.json({
        success: true,
        user: null,
        permissions: ROLE_PERMISSIONS.user,
        message: 'Đã đăng xuất khỏi hệ thống.',
      });
      res.cookies.delete(SESSION_COOKIE_NAME);
      return res;
    }

    // 3. Đổi role của user (dành cho Admin)
    if (action === 'switch_role') {
      if (!userId) {
        return NextResponse.json({ error: 'Thiếu userId cần cập nhật vai trò' }, { status: 400 });
      }
      userRepository.updateRole(userId, role as UserRole);
      const updated = userRepository.getUserById(userId);
      return NextResponse.json({
        success: true,
        user: updated,
        allUsers: userRepository.getAllUsers(),
        message: `Đã cập nhật vai trò sang: ${String(role).toUpperCase()}`,
      });
    }

    // 4. Tạo tài khoản mới từ Admin (kèm ID đăng nhập, mật khẩu, phân vùng hiển thị & quyền chức năng)
    if (action === 'create_user' || action === 'register') {
      if (!username && !email) {
        return NextResponse.json(
          { error: 'Vui lòng nhập ID đăng nhập (Username) cho tài khoản mới!' },
          { status: 400 }
        );
      }
      const existing = username ? userRepository.getUserByUsername(username) : undefined;
      if (existing) {
        return NextResponse.json(
          { error: `ID đăng nhập "${username}" đã tồn tại trong hệ thống!` },
          { status: 400 }
        );
      }

      const newUser = userRepository.createUser(
        name || username || 'Thành Viên Trải Nghiệm',
        email || `${username}@laymor3d.com`,
        (role as UserRole) || 'user',
        avatar,
        {
          username: username || email?.split('@')[0],
          password: password || '123456',
          phone: phone || '',
          walletBalanceVnd: amount !== undefined ? Number(amount) : 100000,
          allowedModules,
          allowedFeatures,
        }
      );

      return NextResponse.json({
        success: true,
        user: newUser,
        allUsers: userRepository.getAllUsers(),
        permissions: ROLE_PERMISSIONS[newUser.role],
        message: `Tạo tài khoản "${newUser.username}" thành công!`,
      });
    }

    // 5. Cập nhật phân quyền Vùng Hiển Thị (allowedModules) & Chức Năng Sử Dụng (allowedFeatures) cho 1 User
    if (action === 'update_user_permissions') {
      if (!userId) {
        return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
      }
      const existing = userRepository.getUserById(userId);
      if (!existing) {
        return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 });
      }

      const updated = userRepository.updateUser(userId, {
        allowedModules: allowedModules
          ? { ...(existing.allowedModules || {}), ...allowedModules }
          : existing.allowedModules,
        allowedFeatures: allowedFeatures
          ? { ...(existing.allowedFeatures || {}), ...allowedFeatures }
          : existing.allowedFeatures,
        ...(password ? { password } : {}),
        ...(username ? { username } : {}),
        ...(role ? { role } : {}),
      });

      return NextResponse.json({
        success: true,
        user: updated,
        allUsers: userRepository.getAllUsers(),
        message: `Đã lưu cấu hình vùng hiển thị & quyền chức năng cho tài khoản ${updated?.username}!`,
      });
    }

    // 6. Nạp / điều chỉnh số dư ví từ Admin
    if (action === 'adjust_balance') {
      if (!userId) {
        return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
      }
      const delta = Number(amount) || 0;
      const newBal = userRepository.updateBalance(userId, delta);
      userRepository.addTransaction({
        userId,
        amountVnd: Math.abs(delta),
        method: 'wallet',
        type: delta >= 0 ? 'deposit' : 'withdraw',
        status: 'completed',
        description:
          body.description ||
          `Điều chỉnh số dư ví quản trị: ${delta >= 0 ? '+' : '-'}${Math.abs(delta).toLocaleString('vi-VN')} đ`,
      });
      return NextResponse.json({
        success: true,
        balanceVnd: newBal,
        allUsers: userRepository.getAllUsers(),
        message: `Đã điều chỉnh ${delta >= 0 ? '+' : ''}${delta.toLocaleString('vi-VN')} đ`,
      });
    }

    // 7. Khóa / Mở khóa tài khoản (Toggle Status)
    if (action === 'toggle_status') {
      if (!userId) {
        return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
      }
      const updated = userRepository.toggleUserStatus(userId);
      if (!updated) {
        return NextResponse.json({ error: 'Không thể khóa tài khoản Quản trị viên tối cao' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        user: updated,
        allUsers: userRepository.getAllUsers(),
        message: `Tài khoản ${updated.name} hiện đang: ${updated.status === 'active' ? 'Đang hoạt động' : 'Đã tạm khóa'}`,
      });
    }

    // 8. Cập nhật thông tin người dùng
    if (action === 'update_user') {
      if (!userId) {
        return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
      }
      const updated = userRepository.updateUser(userId, {
        name: body.name,
        username: body.username,
        password: body.password,
        email: body.email,
        phone: body.phone,
        role: body.role,
        status: body.status,
        allowedModules: body.allowedModules,
        allowedFeatures: body.allowedFeatures,
      });
      if (!updated) {
        return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        user: updated,
        allUsers: userRepository.getAllUsers(),
        message: `Đã cập nhật thông tin cho ${updated.name}`,
      });
    }

    // 9. Xóa tài khoản
    if (action === 'delete_user') {
      if (!userId) {
        return NextResponse.json({ error: 'userId là bắt buộc' }, { status: 400 });
      }
      const deleted = userRepository.deleteUser(userId);
      if (!deleted) {
        return NextResponse.json({ error: 'Không thể xóa tài khoản này' }, { status: 400 });
      }
      return NextResponse.json({
        success: true,
        allUsers: userRepository.getAllUsers(),
        message: 'Đã xóa tài khoản thành công',
      });
    }

    return NextResponse.json({ error: 'Action không hợp lệ' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
