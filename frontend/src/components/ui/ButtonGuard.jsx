import { useApp } from '@/context/AppContext';

/**
 * ButtonGuard - Conditionally renders children based on user action permissions.
 *
 * @param {string} module - The module to check (e.g. 'crm', 'finance', 'hrms')
 * @param {string} action - The action key (e.g. 'canCreate', 'canEdit', 'canDelete', 'canExport', 'canImport', 'canApprove', 'canAssign', 'canArchive')
 */
export default function ButtonGuard({ module, action, children }) {
  const { user } = useApp();

  if (!user) return null;

  // Organization Admin and Super Admin bypass all checks
  if (user.role === 'admin' || user.role_name === 'Organization Admin' || user.role_name === 'Super Admin') {
    return children;
  }

  const normAction = action.replace(/^can([A-Z])/, (match, p1) => p1.toLowerCase()).toLowerCase();
  const camelAction = 'can' + normAction.charAt(0).toUpperCase() + normAction.slice(1);
  
  const modulePerms = user.permissions?.[module];
  if (modulePerms && (modulePerms[normAction] || modulePerms[camelAction])) {
    return children;
  }

  return null;
}


