-- Create backup_history table
CREATE TABLE public.backup_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  backup_type TEXT NOT NULL DEFAULT 'manual', -- 'manual' or 'scheduled'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  tables_count INTEGER DEFAULT 0,
  total_rows INTEGER DEFAULT 0,
  file_size INTEGER DEFAULT 0,
  backup_data JSONB,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create backup_settings table for scheduling configuration
CREATE TABLE public.backup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  is_enabled BOOLEAN NOT NULL DEFAULT false,
  schedule_time TIME NOT NULL DEFAULT '02:00:00', -- Default 2 AM
  retention_days INTEGER NOT NULL DEFAULT 30,
  last_backup_at TIMESTAMP WITH TIME ZONE,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default backup settings
INSERT INTO public.backup_settings (is_enabled, schedule_time, retention_days)
VALUES (false, '02:00:00', 30);

-- Enable RLS
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for backup_history
CREATE POLICY "Admins can view backup history"
ON public.backup_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert backup history"
ON public.backup_history
FOR INSERT
WITH CHECK (true);

-- RLS Policies for backup_settings
CREATE POLICY "Admins can manage backup settings"
ON public.backup_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view backup settings"
ON public.backup_settings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));