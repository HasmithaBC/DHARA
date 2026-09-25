-- Seed only the admin user
-- password: ChangeMe123!  (bcrypt cost 12)
INSERT INTO users (name, email, password_hash, role) VALUES
 ('System Administrator', 'admin@dharact.com',
  '$2b$12$IXWk3wqu.GpH7LdGTjd47.zkDa76HE53G2Kv1OLjBnH3xDzYwqc/6', 'ADMINISTRATOR')
ON CONFLICT (email) DO NOTHING;
