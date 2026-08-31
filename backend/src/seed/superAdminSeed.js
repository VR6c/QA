import bcrypt from 'bcryptjs';
import Permission from '../models/Permission.js';
import Role from '../models/Role.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import ActivityLog from '../models/ActivityLog.js';

export const seedSuperAdminData = async () => {
  try {
    console.log('🌱 Checking Super Admin Panel seed data...');

    // 1. Seed Permissions
    const permissionsData = [
      { name: 'View Users', code: 'user.view', module: 'User Management', action: 'view', description: 'View user list and profile details' },
      { name: 'Create User', code: 'user.create', module: 'User Management', action: 'create', description: 'Create new user accounts' },
      { name: 'Edit User', code: 'user.edit', module: 'User Management', action: 'edit', description: 'Edit user profiles and roles' },
      { name: 'Delete User', code: 'user.delete', module: 'User Management', action: 'delete', description: 'Soft delete user accounts' },
      { name: 'User Status Toggle', code: 'user.status', module: 'User Management', action: 'status', description: 'Activate, deactivate, or lock users' },
      { name: 'Reset User Password', code: 'user.reset_password', module: 'User Management', action: 'reset_password', description: 'Initiate user password resets' },

      { name: 'View Roles', code: 'role.view', module: 'Role Management', action: 'view', description: 'View role list and user assignments' },
      { name: 'Create Role', code: 'role.create', module: 'Role Management', action: 'create', description: 'Create new custom roles' },
      { name: 'Edit Role', code: 'role.edit', module: 'Role Management', action: 'edit', description: 'Edit role metadata and description' },
      { name: 'Delete Role', code: 'role.delete', module: 'Role Management', action: 'delete', description: 'Delete unused roles' },
      { name: 'Manage Role Permissions', code: 'role.permission', module: 'Role Management', action: 'permission', description: 'Modify role permission matrix' },

      { name: 'View Settings', code: 'setting.view', module: 'System Settings', action: 'view', description: 'View system configurations' },
      { name: 'Edit Settings', code: 'setting.edit', module: 'System Settings', action: 'edit', description: 'Modify setting values' },
      { name: 'Toggle Feature Settings', code: 'setting.toggle', module: 'System Settings', action: 'toggle', description: 'Enable or disable system features' },

      { name: 'View Activity Log', code: 'activity.view', module: 'Activity Log', action: 'view', description: 'View and search audit logs' }
    ];

    for (const p of permissionsData) {
      await Permission.findOneAndUpdate(
        { code: p.code },
        p,
        { upsert: true, new: true }
      );
    }
    console.log('  └─ Permissions updated/seeded.');

    const allPermissionCodes = permissionsData.map(p => p.code);

    // 2. Seed System Roles
    const rolesData = [
      {
        name: 'Super Admin',
        code: 'super_admin',
        description: 'System-level administrator with full control over all modules',
        status: 'Active',
        is_system_role: true,
        permissions: allPermissionCodes
      },
      {
        name: 'Admin',
        code: 'admin',
        description: 'Standard administrator for day-to-day user and operational oversight',
        status: 'Active',
        is_system_role: false,
        permissions: ['user.view', 'user.create', 'user.edit', 'user.status', 'user.reset_password', 'role.view', 'setting.view', 'setting.edit', 'activity.view']
      },
      {
        name: 'Manager',
        code: 'manager',
        description: 'Team lead manager with view-level administrative access',
        status: 'Active',
        is_system_role: false,
        permissions: ['user.view', 'role.view', 'setting.view', 'activity.view']
      },
      {
        name: 'Supervisor',
        code: 'supervisor',
        description: 'Supervisor role for team monitoring',
        status: 'Active',
        is_system_role: false,
        permissions: ['user.view']
      },
      {
        name: 'Employee',
        code: 'employee',
        description: 'Standard system user account',
        status: 'Active',
        is_system_role: false,
        permissions: []
      }
    ];

    const seededRoles = {};
    for (const r of rolesData) {
      const roleDoc = await Role.findOneAndUpdate(
        { code: r.code },
        r,
        { upsert: true, new: true }
      );
      seededRoles[r.name] = roleDoc;
    }
    console.log('  └─ System roles seeded.');

    // 3. Seed Default Super Admin User
    const superAdminName = process.env.ADMIN_NAME || 'System Super Admin';
    const superAdminUsername = (process.env.ADMIN_USERNAME || 'superadmin').trim().toLowerCase();
    const superAdminEmail = (process.env.ADMIN_EMAIL || 'admin@pecc.com').trim().toLowerCase();
    const rawPassword = process.env.ADMIN_PASSWORD || 'Admin@Production2026!';

    let superAdminUser = await User.findOne({ 
      $or: [{ email: superAdminEmail }, { username: superAdminUsername }] 
    });

    if (!superAdminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(rawPassword, salt);

      superAdminUser = new User({
        name: superAdminName,
        username: superAdminUsername,
        email: superAdminEmail,
        password: hashedPassword,
        role: 'Super Admin',
        role_id: seededRoles['Super Admin']._id,
        status: 'Active',
        created_by: 'System Initialization'
      });

      await superAdminUser.save();
      console.log(`  └─ Default Super Admin created: ${superAdminEmail} (Username: ${superAdminUsername})`);
    } else {
      let updated = false;
      if (!superAdminUser.role_id) {
        superAdminUser.role_id = seededRoles['Super Admin']._id;
        updated = true;
      }
      if (!superAdminUser.username) {
        superAdminUser.username = superAdminUsername;
        updated = true;
      }
      if (updated) {
        await superAdminUser.save();
        console.log(`  └─ Super Admin updated with role_id and username.`);
      } else {
        console.log(`  └─ Super Admin account existing & verified (${superAdminUser.email}).`);
      }
    }

    // 4. Seed Standard Settings
    const settingsData = [
      // General Settings
      { key: 'system_name', name: 'System Name', category: 'General', value: 'Enterprise QA Control Center', value_type: 'string', status: 'Enabled', description: 'Global application brand title' },
      { key: 'default_language', name: 'Default Language', category: 'General', value: 'English (US)', value_type: 'string', status: 'Enabled', description: 'Primary interface localization' },
      { key: 'date_format', name: 'Date Format', category: 'General', value: 'DD MMM YYYY', value_type: 'string', status: 'Enabled', description: 'Global date display layout' },
      { key: 'time_zone', name: 'Time Zone', category: 'General', value: 'UTC+07:00 (Indochina Time)', value_type: 'string', status: 'Enabled', description: 'Server time zone standard' },

      // User Settings
      { key: 'allow_profile_edit', name: 'Allow Profile Edit', category: 'User', value: true, value_type: 'boolean', status: 'Enabled', description: 'Permit users to modify their personal name & avatar' },
      { key: 'allow_password_change', name: 'Allow Self Password Change', category: 'User', value: true, value_type: 'boolean', status: 'Enabled', description: 'Allow self-service password updates' },
      { key: 'allow_email_change', name: 'Allow Self Email Change', category: 'User', value: false, value_type: 'boolean', status: 'Disabled', description: 'Require admin approval for email changes' },

      // Security Settings
      { key: 'two_factor_auth', name: 'Two-Factor Authentication (2FA)', category: 'Security', value: true, value_type: 'boolean', status: 'Enabled', description: 'Mandatory 2FA challenge for administrative roles' },
      { key: 'login_attempt_limit', name: 'Login Attempt Limit', category: 'Security', value: 5, value_type: 'number', status: 'Enabled', description: 'Lock account after consecutive failed logins' },
      { key: 'session_timeout', name: 'Session Timeout (Minutes)', category: 'Security', value: 30, value_type: 'number', status: 'Enabled', description: 'Automatic logout duration of inactivity' },

      // Notification Settings
      { key: 'email_notifications', name: 'Email Notifications', category: 'Notification', value: true, value_type: 'boolean', status: 'Enabled', description: 'Send system alert emails to users' },
      { key: 'system_notifications', name: 'In-App System Banners', category: 'Notification', value: true, value_type: 'boolean', status: 'Enabled', description: 'Broadcast administrative alerts in UI' },

      // Feature Settings
      { key: 'qa_kanban_board', name: 'QA Kanban Board Feature', category: 'Feature', value: true, value_type: 'boolean', status: 'Enabled', description: 'Enable 6-swimlane QA Kanban board module' },
      { key: 'attendance_module', name: 'Attendance Management', category: 'Feature', value: true, value_type: 'boolean', status: 'Enabled', description: 'Enable team clock-in & attendance tracking' },
      { key: 'leave_module', name: 'Leave Request Management', category: 'Feature', value: true, value_type: 'boolean', status: 'Enabled', description: 'Enable employee leave approval workflows' },
      { key: 'reports_module', name: 'Executive Analytics & Reports', category: 'Feature', value: true, value_type: 'boolean', status: 'Enabled', description: 'Enable executive KPI reporting views' }
    ];

    for (const s of settingsData) {
      await Setting.findOneAndUpdate(
        { key: s.key },
        s,
        { upsert: true, new: true }
      );
    }
    console.log('  └─ System settings seeded.');

    // 5. Seed Initial Audit Logs if empty
    const activityCount = await ActivityLog.countDocuments();
    if (activityCount === 0) {
      const sampleActivities = [
        {
          activity_id: 'ACT-000001',
          user_id: superAdminUser._id.toString(),
          user_name: superAdminUser.name,
          user_email: superAdminUser.email,
          role_name: 'Super Admin',
          module: 'System Settings',
          action: 'SYSTEM_CONFIGURATION_CHANGED',
          target_type: 'System',
          target_id: 'GLOBAL',
          description: 'Initialized Super Admin Panel default permissions and roles',
          status: 'Success'
        },
        {
          activity_id: 'ACT-000002',
          user_id: superAdminUser._id.toString(),
          user_name: superAdminUser.name,
          user_email: superAdminUser.email,
          role_name: 'Super Admin',
          module: 'Role Management',
          action: 'ROLE_CREATED',
          target_type: 'Role',
          target_id: seededRoles['Super Admin']._id.toString(),
          target_name: 'Super Admin',
          description: 'Created primary Super Admin role with full RBAC matrix permissions',
          status: 'Success'
        },
        {
          activity_id: 'ACT-000003',
          user_id: superAdminUser._id.toString(),
          user_name: superAdminUser.name,
          user_email: superAdminUser.email,
          role_name: 'Super Admin',
          module: 'User Management',
          action: 'USER_CREATED',
          target_type: 'User',
          target_id: superAdminUser._id.toString(),
          target_name: superAdminUser.name,
          description: 'System bootstrapped initial Super Admin account (superadmin@qa.com)',
          status: 'Success'
        }
      ];

      await ActivityLog.insertMany(sampleActivities);
      console.log('  └─ Initial sample activity logs created.');
    }

    console.log('✅ Super Admin Panel seed completed successfully!');
  } catch (error) {
    console.error('❌ Error during Super Admin seed:', error);
  }
};
