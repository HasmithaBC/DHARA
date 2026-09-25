-- Seed Provinces
INSERT INTO provinces (name) VALUES 
('Western'), ('Central'), ('Southern'), ('Northern'), ('Eastern'), 
('North Western'), ('North Central'), ('Uva'), ('Sabaragamuwa')
ON CONFLICT DO NOTHING;

-- Seed Districts
-- Western Province (ID 1)
INSERT INTO districts (province_id, name) VALUES 
(1, 'Colombo'), (1, 'Gampaha'), (1, 'Kalutara'),
-- Central Province (ID 2)
(2, 'Kandy'), (2, 'Matale'), (2, 'Nuwara Eliya'),
-- Southern Province (ID 3)
(3, 'Galle'), (3, 'Matara'), (3, 'Hambantota'),
-- Northern Province (ID 4)
(4, 'Jaffna'), (4, 'Kilinochchi'), (4, 'Mannar'), (4, 'Vavuniya'), (4, 'Mullaitivu'),
-- Eastern Province (ID 5)
(5, 'Batticaloa'), (5, 'Ampara'), (5, 'Trincomalee'),
-- North Western Province (ID 6)
(6, 'Kurunegala'), (6, 'Puttalam'),
-- North Central Province (ID 7)
(7, 'Anuradhapura'), (7, 'Polonnaruwa'),
-- Uva Province (ID 8)
(8, 'Badulla'), (8, 'Moneragala'),
-- Sabaragamuwa Province (ID 9)
(9, 'Ratnapura'), (9, 'Kegalle')
ON CONFLICT DO NOTHING;
