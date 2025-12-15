-- Create storage bucket for reimbursement documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('reimbursement-documents', 'reimbursement-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to view documents
CREATE POLICY "Authenticated users can view reimbursement documents"
ON storage.objects
FOR SELECT
USING (bucket_id = 'reimbursement-documents' AND auth.role() = 'authenticated');

-- Policy to allow authenticated users to upload documents
CREATE POLICY "Authenticated users can upload reimbursement documents"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'reimbursement-documents' AND auth.role() = 'authenticated');

-- Policy to allow authenticated users to delete their documents
CREATE POLICY "Authenticated users can delete reimbursement documents"
ON storage.objects
FOR DELETE
USING (bucket_id = 'reimbursement-documents' AND auth.role() = 'authenticated');