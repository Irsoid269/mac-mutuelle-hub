import { Bell, Search, Menu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { SyncStatusIndicator } from './SyncStatusIndicator';

interface HeaderProps {
  onMenuClick?: () => void;
  title?: string;
}

export function Header({ onMenuClick, title }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    
    // Navigate to the relevant page based on entity type
    if (notification.entityType === 'reimbursements') {
      navigate('/reimbursements');
    } else if (notification.entityType === 'contracts') {
      navigate('/subscriptions');
    } else if (notification.entityType === 'insured') {
      navigate('/insured');
    } else if (notification.entityType === 'contributions') {
      navigate('/contributions');
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          {title && (
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          )}
        </div>

        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher un assuré, contrat..."
              className="pl-10 bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <SyncStatusIndicator />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium animate-pulse-soft">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Aucune notification
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'flex flex-col items-start gap-1 p-3 cursor-pointer',
                      !notification.read && 'bg-muted/50'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span
                        className={cn(
                          'w-2 h-2 rounded-full flex-shrink-0',
                          notification.type === 'warning' && 'bg-warning',
                          notification.type === 'info' && 'bg-info',
                          notification.type === 'success' && 'bg-success',
                          notification.type === 'error' && 'bg-destructive'
                        )}
                      />
                      <span className="font-medium text-sm flex-1">{notification.title}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground/70 pl-4">
                      {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: fr })}
                    </p>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={markAllAsRead}
                    className="justify-center text-primary font-medium"
                  >
                    Marquer tout comme lu
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
