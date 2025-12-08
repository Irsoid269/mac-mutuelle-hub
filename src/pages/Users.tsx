import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Search, UserCog, Shield, ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

type AppRole = 'admin' | 'agent' | 'medecin' | 'comptabilite' | 'dirigeant';

interface UserWithProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  roles: AppRole[];
}

const roleLabels: Record<AppRole, string> = {
  admin: 'Administrateur',
  agent: 'Agent',
  medecin: 'Médecin-conseil',
  comptabilite: 'Comptabilité',
  dirigeant: 'Dirigeant',
};

const roleColors: Record<AppRole, string> = {
  admin: 'bg-destructive/10 text-destructive border-destructive/20',
  agent: 'bg-primary/10 text-primary border-primary/20',
  medecin: 'bg-info/10 text-info border-info/20',
  comptabilite: 'bg-success/10 text-success border-success/20',
  dirigeant: 'bg-warning/10 text-warning border-warning/20',
};

export default function Users() {
  const { isAdmin, user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      // Fetch all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch all roles
      const { data: allRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine profiles with their roles
      const usersWithRoles: UserWithProfile[] = (profiles || []).map(profile => ({
        ...profile,
        roles: (allRoles || [])
          .filter(r => r.user_id === profile.user_id)
          .map(r => r.role as AppRole),
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const channel = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, fetchUsers)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAddRole = async () => {
    if (!selectedUser || !selectedRole) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: selectedRole,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Cet utilisateur a déjà ce rôle');
        } else {
          throw error;
        }
      } else {
        // Log the action
        await supabase.from('audit_logs').insert({
          action: 'CREATE',
          entity_type: 'user_role',
          entity_id: selectedUser.user_id,
          details: `Attribution du rôle ${roleLabels[selectedRole]} à ${selectedUser.first_name} ${selectedUser.last_name}`,
          user_id: currentUser?.id,
          user_name: 'Admin',
        });

        toast.success(`Rôle ${roleLabels[selectedRole]} attribué avec succès`);
        setIsDialogOpen(false);
        setSelectedRole('');
        fetchUsers();
      }
    } catch (error) {
      console.error('Error adding role:', error);
      toast.error("Erreur lors de l'attribution du rôle");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveRole = async (userId: string, role: AppRole) => {
    const userToUpdate = users.find(u => u.user_id === userId);
    if (!userToUpdate) return;

    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        action: 'DELETE',
        entity_type: 'user_role',
        entity_id: userId,
        details: `Retrait du rôle ${roleLabels[role]} de ${userToUpdate.first_name} ${userToUpdate.last_name}`,
        user_id: currentUser?.id,
        user_name: 'Admin',
      });

      toast.success(`Rôle ${roleLabels[role]} retiré avec succès`);
      fetchUsers();
    } catch (error) {
      console.error('Error removing role:', error);
      toast.error('Erreur lors du retrait du rôle');
    }
  };

  const filteredUsers = users.filter(user =>
    user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-4 p-8 bg-card rounded-xl border border-border max-w-md">
          <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Accès restreint</h2>
          <p className="text-muted-foreground">
            Seuls les administrateurs peuvent accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Gestion des Utilisateurs</h1>
          <p className="page-subtitle">
            Attribuez et gérez les droits d'accès des utilisateurs
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(roleLabels).map(([role, label]) => {
          const count = users.filter(u => u.roles.includes(role as AppRole)).length;
          return (
            <div key={role} className="bg-card p-4 rounded-xl border border-border">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', roleColors[role as AppRole].split(' ').slice(0, 2).join(' '))}>
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search */}
      <div className="bg-card p-4 rounded-xl border border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <UserCog className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground">Aucun utilisateur</h3>
            <p className="text-muted-foreground">
              Les utilisateurs apparaîtront ici après leur inscription
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Inscrit</TableHead>
                <TableHead>Rôles</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">
                          {user.first_name[0]}{user.last_name[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: fr })}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.length === 0 ? (
                        <Badge variant="outline" className="text-warning border-warning/30 bg-warning/10">
                          Sans rôle
                        </Badge>
                      ) : (
                        user.roles.map((role) => (
                          <Badge
                            key={role}
                            variant="outline"
                            className={cn('cursor-pointer hover:opacity-70', roleColors[role])}
                            onClick={() => {
                              if (user.user_id !== currentUser?.id) {
                                handleRemoveRole(user.user_id, role);
                              }
                            }}
                            title={user.user_id !== currentUser?.id ? 'Cliquer pour retirer' : 'Vous ne pouvez pas retirer votre propre rôle'}
                          >
                            {roleLabels[role]}
                            {user.user_id !== currentUser?.id && ' ×'}
                          </Badge>
                        ))
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setIsDialogOpen(true);
                      }}
                      className="gap-2"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      Attribuer un rôle
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Role Assignment Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un rôle</DialogTitle>
            <DialogDescription>
              Sélectionnez le rôle à attribuer à {selectedUser?.first_name} {selectedUser?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as AppRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabels).map(([role, label]) => (
                  <SelectItem
                    key={role}
                    value={role}
                    disabled={selectedUser?.roles.includes(role as AppRole)}
                  >
                    {label}
                    {selectedUser?.roles.includes(role as AppRole) && ' (déjà attribué)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button onClick={handleAddRole} disabled={!selectedRole || isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Attribuer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
