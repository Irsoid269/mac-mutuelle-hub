import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import macLogo from '@/assets/mac-logo.png';

interface SidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

import {
  LayoutDashboard,
  FileText,
  Users,
  UserPlus,
  CreditCard,
  FolderOpen,
  Settings,
  LogOut,
  ChevronLeft,
  Bell,
  Shield,
  Wallet,
  UserCog,
} from 'lucide-react';

type AppRole = 'admin' | 'agent' | 'medecin' | 'comptabilite' | 'dirigeant';

interface NavItem {
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  allowedRoles?: AppRole[];
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', icon: LayoutDashboard, label: 'Tableau de bord' },
  { path: '/subscriptions', icon: FileText, label: 'Souscriptions', allowedRoles: ['admin', 'agent', 'dirigeant'] },
  { path: '/insured', icon: Users, label: 'Assurés', allowedRoles: ['admin', 'agent', 'dirigeant'] },
  { path: '/contributions', icon: Wallet, label: 'Cotisations', allowedRoles: ['admin', 'comptabilite', 'dirigeant'] },
  { path: '/beneficiaries', icon: UserPlus, label: 'Ayants droit', allowedRoles: ['admin', 'agent', 'dirigeant'] },
  { path: '/reimbursements', icon: CreditCard, label: 'Remboursements', allowedRoles: ['admin', 'medecin', 'comptabilite', 'dirigeant'] },
  { path: '/documents', icon: FolderOpen, label: 'Documents' },
];

const adminItems: NavItem[] = [
  { path: '/users', icon: UserCog, label: 'Utilisateurs', adminOnly: true },
  { path: '/audit', icon: Shield, label: 'Audit Log', allowedRoles: ['admin', 'dirigeant'] },
  { path: '/settings', icon: Settings, label: 'Paramètres', adminOnly: true },
];

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const location = useLocation();
  const { profile, roles, isAdmin, signOut } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Helper function to check if user has access to an item
  const hasAccessToItem = (item: NavItem) => {
    if (isAdmin) return true;
    if (item.adminOnly) return false;
    if (!item.allowedRoles) return true;
    return item.allowedRoles.some(role => roles.includes(role));
  };

  const filteredNavItems = navItems.filter(hasAccessToItem);
  const filteredAdminItems = adminItems.filter(hasAccessToItem);

  const userInitials = profile 
    ? `${profile.first_name[0] || ''}${profile.last_name[0] || ''}`.toUpperCase() 
    : 'U';
  const userName = profile 
    ? `${profile.first_name} ${profile.last_name}` 
    : 'Utilisateur';
  const userRole = isAdmin 
    ? 'Administrateur' 
    : roles.length > 0 
      ? roles[0].charAt(0).toUpperCase() + roles[0].slice(1) 
      : 'Sans rôle';

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-sidebar border-r border-sidebar-border',
        collapsed ? 'w-20' : 'w-64'
      )}
      style={{ background: 'var(--gradient-sidebar)' }}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center w-full')}>
          <img 
            src={macLogo} 
            alt="MAC Assurances" 
            className={cn('transition-all duration-300', collapsed ? 'w-10 h-10' : 'w-12 h-12')}
          />
          {!collapsed && (
            <div className="animate-fade-in">
              <h1 className="text-sm font-bold text-sidebar-foreground">MAC ASSURANCES</h1>
              <p className="text-xs text-sidebar-foreground/60">Système de Gestion</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground/70" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        <div className={cn('mb-2 px-3', collapsed && 'px-0 text-center')}>
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {collapsed ? '•••' : 'Menu Principal'}
          </span>
        </div>

        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn('w-5 h-5 flex-shrink-0', collapsed && 'w-6 h-6')} />
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}

        <div className={cn('mt-6 mb-2 px-3', collapsed && 'px-0 text-center')}>
          <span className="text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
            {collapsed ? '•••' : 'Administration'}
          </span>
        </div>

        {filteredAdminItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-item',
                isActive && 'active',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className={cn('w-5 h-5 flex-shrink-0', collapsed && 'w-6 h-6')} />
            {!collapsed && <span className="animate-fade-in">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <div className={cn(
          'flex items-center gap-3 rounded-lg p-2 bg-sidebar-accent/50',
          collapsed && 'justify-center'
        )}>
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-foreground">{userInitials}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">{userRole}</p>
            </div>
          )}
          {!collapsed && (
            <button 
              onClick={signOut}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
              title="Se déconnecter"
            >
              <LogOut className="w-4 h-4 text-sidebar-foreground/70" />
            </button>
          )}
        </div>
      </div>

      {/* Collapsed toggle button */}
      {collapsed && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:shadow-glow transition-shadow"
        >
          <ChevronLeft className="w-4 h-4 rotate-180" />
        </button>
      )}
    </aside>
  );
}
