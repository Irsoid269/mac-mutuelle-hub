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

        <PopoverContent className="w-72" align="end">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">État de synchronisation</h4>
              {online ? (
                <Wifi className="h-4 w-4 text-emerald-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-destructive" />
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Connexion</span>
                <span className={online ? 'text-emerald-500' : 'text-destructive'}>
                  {online ? 'En ligne' : 'Hors ligne'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Modifications en attente</span>
                <span className={pendingCount > 0 ? 'text-amber-500 font-medium' : ''}>
                  {pendingCount}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Statut</span>
                <span className={cn(
                  syncing && 'text-primary',
                  !online && 'text-destructive'
                )}>
                  {syncing ? 'Synchronisation...' : online ? 'Prêt' : 'En attente de connexion'}
                </span>
              </div>
            </div>

            {!online && pendingCount > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-600">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  Vos modifications seront synchronisées automatiquement dès que vous serez connecté à Internet.
                </span>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={forceSync}
                disabled={!online || syncing}
              >
                <RefreshCw className={cn('h-3 w-3 mr-2', syncing && 'animate-spin')} />
                Synchroniser
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={forceFullSync}
                disabled={!online || syncing}
              >
                <Cloud className="h-3 w-3 mr-2" />
                Tout recharger
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Les données sont stockées localement et synchronisées avec le serveur.
            </p>
          </div>
        </PopoverContent>
      </Popover>
    </TooltipProvider>
  );
}
