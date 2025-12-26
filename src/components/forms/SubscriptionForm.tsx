import { useState } from 'react';
import { Building2, Users } from 'lucide-react';
import { EnterpriseSubscriptionForm } from './EnterpriseSubscriptionForm';
import { FamilySubscriptionForm } from './FamilySubscriptionForm';

interface SubscriptionFormProps {
  onClose: () => void;
}

export function SubscriptionForm({ onClose }: SubscriptionFormProps) {
  const [contractType, setContractType] = useState<'entreprise' | 'famille' | null>(null);

  if (contractType === 'entreprise') {
    return <EnterpriseSubscriptionForm onClose={onClose} />;
  }

  if (contractType === 'famille') {
    return <FamilySubscriptionForm onClose={onClose} />;
  }

  // Type selection screen
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Nouvelle Souscription
        </h2>
        <p className="text-muted-foreground">
          Sélectionnez le type de contrat à créer
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Enterprise Contract Card */}
        <button
          type="button"
          onClick={() => setContractType('entreprise')}
          className="group relative p-6 border-2 border-border rounded-xl hover:border-primary transition-all duration-200 bg-card hover:bg-primary/5 text-left"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Contrat Entreprise
              </h3>
              <p className="text-sm text-muted-foreground">
                Assurance groupe pour les employés d'une entreprise ou organisation
              </p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mt-2">
              <li>• Couverture pour tous les employés</li>
              <li>• Tarifs groupés avantageux</li>
              <li>• Gestion centralisée</li>
            </ul>
          </div>
        </button>

        {/* Family Contract Card */}
        <button
          type="button"
          onClick={() => setContractType('famille')}
          className="group relative p-6 border-2 border-border rounded-xl hover:border-primary transition-all duration-200 bg-card hover:bg-primary/5 text-left"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center group-hover:bg-green-500/20 transition-colors">
              <Users className="w-8 h-8 text-green-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Contrat Famille
              </h3>
              <p className="text-sm text-muted-foreground">
                Assurance individuelle couvrant l'assuré principal et sa famille
              </p>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 mt-2">
              <li>• Assuré principal + conjoint</li>
              <li>• Enfants et personnes à charge</li>
              <li>• Déclaration de santé individuelle</li>
            </ul>
          </div>
        </button>
      </div>

      <div className="flex justify-end pt-4 border-t border-border">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
