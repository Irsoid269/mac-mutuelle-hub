import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TABLES_TO_BACKUP = [
  'contracts',
  'insured',
  'beneficiaries',
  'contributions',
  'contribution_payments',
  'contribution_formulas',
  'reimbursements',
  'reimbursement_ceilings',
  'healthcare_providers',
  'care_authorizations',
  'health_declarations',
  'documents',
  'settings',
  'profiles',
  'user_roles',
]

interface BackupData {
  version: string
  created_at: string
  created_by: string
  type: 'manual' | 'scheduled'
  tables: Record<string, unknown[]>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting scheduled backup...')

    const backupData: BackupData = {
      version: '1.0',
      created_at: new Date().toISOString(),
      created_by: 'Système (Backup Automatique)',
      type: 'scheduled',
      tables: {}
    }

    let totalRows = 0

    // Fetch data from each table
    for (const tableName of TABLES_TO_BACKUP) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')

        if (error) {
          console.warn(`Error exporting ${tableName}:`, error.message)
          backupData.tables[tableName] = []
        } else {
          backupData.tables[tableName] = data || []
          totalRows += (data || []).length
        }
      } catch (err) {
        console.warn(`Table ${tableName} not accessible:`, err)
        backupData.tables[tableName] = []
      }
    }

    // Convert backup to JSON string
    const backupJson = JSON.stringify(backupData, null, 2)
    const backupSize = new Blob([backupJson]).size

    // Store backup metadata in database
    const { data: historyEntry, error: historyError } = await supabase
      .from('backup_history')
      .insert({
        backup_type: 'scheduled',
        status: 'completed',
        tables_count: Object.keys(backupData.tables).length,
        total_rows: totalRows,
        file_size: backupSize,
        backup_data: backupData,
        created_by: null // System backup
      })
      .select()
      .single()

    if (historyError) {
      console.error('Error saving backup history:', historyError)
    } else {
      console.log('Backup history saved:', historyEntry.id)
    }

    console.log(`Backup completed: ${Object.keys(backupData.tables).length} tables, ${totalRows} rows, ${backupSize} bytes`)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup completed successfully',
        tables_count: Object.keys(backupData.tables).length,
        total_rows: totalRows,
        file_size: backupSize,
        backup_id: historyEntry?.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Backup error:', errorMessage)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
