import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Notification {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  entityType?: string;
  entityId?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Fetch real-time notifications based on system events
  const { data, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const notifs: Notification[] = [];

      // 1. Subscriptions with medical reserve
      const { data: reserveMedicale } = await supabase
        .from('insured')
        .select('id, matricule, first_name, last_name, created_at')
        .eq('status', 'reserve_medicale')
        .order('created_at', { ascending: false })
        .limit(5);

      reserveMedicale?.forEach((item) => {
        notifs.push({
          id: `reserve-${item.id}`,
          type: 'warning',
          title: 'Réserve médicale',
          message: `L'assuré ${item.first_name} ${item.last_name} (${item.matricule}) nécessite une évaluation médicale.`,
          timestamp: new Date(item.created_at),
          read: false,
          entityType: 'insured',
          entityId: item.id,
        });
      });

      // 2. Pending subscriptions (contracts)
      const { count: pendingSubscriptions } = await supabase
        .from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'en_attente');

      if (pendingSubscriptions && pendingSubscriptions > 0) {
        notifs.push({
          id: 'pending-subscriptions',
          type: 'info',
          title: 'Nouvelle souscription',
          message: `${pendingSubscriptions} nouvelle(s) souscription(s) en attente de validation.`,
          timestamp: new Date(),
          read: false,
          entityType: 'contracts',
        });
      }

      // 3. Recent paid reimbursements
      const { data: paidReimbursements } = await supabase
        .from('reimbursements')
        .select('id, reimbursement_number, paid_at')
        .eq('status', 'paye')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
        .limit(3);

      paidReimbursements?.forEach((item) => {
        notifs.push({
          id: `paid-${item.id}`,
          type: 'success',
          title: 'Remboursement effectué',
          message: `Le remboursement ${item.reimbursement_number} a été payé avec succès.`,
          timestamp: new Date(item.paid_at!),
          read: true,
          entityType: 'reimbursements',
          entityId: item.id,
        });
      });

      // 4. Reimbursements pending validation
      const { data: pendingReimbursements } = await supabase
        .from('reimbursements')
        .select('id, reimbursement_number, created_at')
        .in('status', ['soumis', 'verification'])
        .order('created_at', { ascending: false })
        .limit(3);

      pendingReimbursements?.forEach((item) => {
        notifs.push({
          id: `pending-rmb-${item.id}`,
          type: 'warning',
          title: 'Remboursement en attente',
          message: `Le remboursement ${item.reimbursement_number} est en attente de traitement.`,
          timestamp: new Date(item.created_at),
          read: false,
          entityType: 'reimbursements',
          entityId: item.id,
        });
      });

      // 5. Contributions not paid
      const { count: unpaidContributions } = await supabase
        .from('contributions')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'en_attente');

      if (unpaidContributions && unpaidContributions > 0) {
        notifs.push({
          id: 'unpaid-contributions',
          type: 'error',
          title: 'Cotisations impayées',
          message: `${unpaidContributions} cotisation(s) en attente de paiement.`,
          timestamp: new Date(),
          read: false,
          entityType: 'contributions',
        });
      }

      // Sort by timestamp (most recent first)
      return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (data) {
      setNotifications(data);
    }
  }, [data]);

  // Subscribe to real-time changes
  useEffect(() => {
    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reimbursements' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contracts' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'insured' },
        () => refetch()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'contributions' },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch,
  };
}
