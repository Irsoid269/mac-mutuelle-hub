import React from 'react';
import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff, AlertCircle } from 'lucide-react';
import { useSyncStatus } from '@/hooks/useOfflineData';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const { online, syncing, pendingCount, forceSync, forceFullSync } = useSyncStatus();

  const getStatusColor = () => {
    if (!online) return 'text-destructive';
    if (pendingCount > 0) return 'text-amber-500';
    return 'text-emerald-500';
  };

  const getStatusIcon = () => {
    if (syncing) {
      return <RefreshCw className="h-4 w-4 animate-spin" />;
    }
    if (!online) {
      return <WifiOff className="h-4 w-4" />;
    }
    if (pendingCount > 0) {
      return <CloudOff className="h-4 w-4" />;
    }
    return <Cloud className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (syncing) return 'Synchronisation...';
    if (!online) return 'Hors ligne';
    if (pendingCount > 0) return `${pendingCount} en attente`;
    return 'Synchronisé';
  };

  return (
    <TooltipProvider>
      <Popover>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-9 gap-2 px-3',
                  getStatusColor()
                )}
              >
                {getStatusIcon()}
                <span className="hidden sm:inline text-xs font-medium">
                  {getStatusText()}
                </span>
                {pendingCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p>
              {online ? 'Connecté' : 'Hors ligne'} - {getStatusText()}
            </p>
          </TooltipContent>
        </Tooltip>

        <PopoverContent className="w-80 z-50 bg-card border border-border shadow-xl" align="end" sideOffset={8}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-foreground">État de synchronisation</h4>
              {online ? (
                <Wifi className="h-5 w-5 text-emerald-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-destructive" />
              )}
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Connexion</span>
                <span className={cn(
                  "font-medium",
                  online ? 'text-emerald-600' : 'text-destructive'
                )}>
                  {online ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              
              <div className="flex items-center justify-between py-1 border-b border-border/50">
                <span className="text-muted-foreground">Modifications en attente</span>
                <span className={cn(
                  "font-medium",
                  pendingCount > 0 ? 'text-amber-600' : 'text-foreground'
                )}>
                  {pendingCount}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-muted-foreground">Statut</span>
                <span className={cn(
                  "font-medium",
                  syncing && 'text-primary',
                  !online && 'text-destructive',
                  online && !syncing && 'text-emerald-600'
                )}>
                  {syncing ? 'Synchronisation...' : online ? 'Prêt' : 'En attente'}
                </span>
              </div>
            </div>

            {!online && pendingCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 p-3 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Vos modifications seront synchronisées automatiquement dès que vous serez connecté.
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={forceSync}
                disabled={!online || syncing}
                className="w-full"
              >
                <RefreshCw className={cn('h-3 w-3 mr-1.5', syncing && 'animate-spin')} />
                Synchroniser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={forceFullSync}
                disabled={!online || syncing}
                className="w-full"
              >
                <Cloud className="h-3 w-3 mr-1.5" />
                Recharger
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center pt-1">
              Données stockées localement et synchronisées avec le serveur.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
