-- Create storage bucket for plate images
INSERT INTO storage.buckets (id, name, public)
VALUES ('plate-images', 'plate-images', true)
ON CONFLICT (id) DO NOTHING;
