--
-- PostgreSQL database dump
--

\restrict gCpdljd75CfeQAr0TXetoQS5fKAYQ4kJKDwtfyTNPnuPuRzJEUOsms1qlUFmlqV

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: battle_pass_seasons; Type: TABLE DATA; Schema: public; Owner: terra_user
--

INSERT INTO public.battle_pass_seasons VALUES (1, 1, 'Conquête Galactique', 'La première saison de Terra Dominus - Dominez la galaxie!', '2025-11-30 11:12:39.712929+01', '2026-02-28 11:12:39.712929+01', true, 100, 1000, 5000, '2025-11-30 11:12:39.712929+01', '2025-11-30 11:12:39.712929+01');


--
-- Data for Name: blueprints; Type: TABLE DATA; Schema: public; Owner: terra_user
--



--
-- Data for Name: entities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.entities VALUES (1, 'building', 'Mine d''or');
INSERT INTO public.entities VALUES (2, 'building', 'Mine de métal');
INSERT INTO public.entities VALUES (3, 'building', 'Extracteur');
INSERT INTO public.entities VALUES (4, 'building', 'Centrale électrique');
INSERT INTO public.entities VALUES (5, 'building', 'Hangar');
INSERT INTO public.entities VALUES (6, 'building', 'Réservoir');
INSERT INTO public.entities VALUES (9, 'facility', 'Terrain d''Entrainement');
INSERT INTO public.entities VALUES (10, 'facility', 'Centre de Recherche');
INSERT INTO public.entities VALUES (18, 'defense', 'Tourelle a laser');
INSERT INTO public.entities VALUES (20, 'defense', 'Generateur de champ de force');
INSERT INTO public.entities VALUES (23, 'defense', 'Systeme de brouillage EM');
INSERT INTO public.entities VALUES (25, 'defense', 'Lance-charge electromagnetique');
INSERT INTO public.entities VALUES (29, 'research', 'Systemes des Armes Railgun');
INSERT INTO public.entities VALUES (30, 'research', 'Deploiement de Champs de Force');
INSERT INTO public.entities VALUES (31, 'research', 'Guidage Avance de Missiles');
INSERT INTO public.entities VALUES (33, 'research', 'Ingenierie des Contre-mesures EM');
INSERT INTO public.entities VALUES (35, 'research', 'Impulsion EM Avancee');
INSERT INTO public.entities VALUES (36, 'research', 'Nanotechnologie AutoReplicante');
INSERT INTO public.entities VALUES (37, 'research', 'Reseau de Detection Quantique');
INSERT INTO public.entities VALUES (1037, 'unit', 'Militia');
INSERT INTO public.entities VALUES (1038, 'unit', 'Infantry');
INSERT INTO public.entities VALUES (1039, 'unit', 'Archer');
INSERT INTO public.entities VALUES (1040, 'unit', 'Cavalry');
INSERT INTO public.entities VALUES (1041, 'unit', 'Spearmen');
INSERT INTO public.entities VALUES (1042, 'unit', 'Artillery');
INSERT INTO public.entities VALUES (1043, 'unit', 'Combat Engineer');
INSERT INTO public.entities VALUES (1044, 'unit', 'Tanks');
INSERT INTO public.entities VALUES (1045, 'unit', 'Anti-Tank Infantry');
INSERT INTO public.entities VALUES (1046, 'unit', 'Fighter Aircraft');
INSERT INTO public.entities VALUES (1047, 'unit', 'Anti-Air Battery');
INSERT INTO public.entities VALUES (1048, 'unit', 'Battle Mech');
INSERT INTO public.entities VALUES (1049, 'unit', 'Stealth Bomber');
INSERT INTO public.entities VALUES (1050, 'unit', 'Spy');


--
-- Data for Name: factions; Type: TABLE DATA; Schema: public; Owner: terra_user
--

INSERT INTO public.factions VALUES ('TERRAN_FEDERATION', 'Terran Federation', 'Defenders of humanity through science and order', '#0066FF', 50, 50, '{"defense": 1.15, "shield_regen": 1.2, "tech_cost_reduction": 0.95, "building_speed_research": 1.1}', 'Shield_Guardian', '{"hp": 150, "speed": 0.8, "attack": 80, "defense": 120}', 'Science and order protect humanity.', '2025-11-30 14:53:35.316+01');
INSERT INTO public.factions VALUES ('NOMAD_RAIDERS', 'Nomad Raiders', 'Desert warriors valuing speed and strength', '#FF3333', 150, 50, '{"attack": 1.2, "raid_loot": 1.1, "movement_speed": 1.15, "training_speed_military": 1.1}', 'Desert_Raider', '{"hp": 80, "speed": 1.3, "attack": 100, "defense": 60}', 'Speed and strength are the only laws.', '2025-11-30 14:53:35.316+01');
INSERT INTO public.factions VALUES ('INDUSTRIAL_SYNDICATE', 'Industrial Syndicate', 'Economic powerhouse controlling trade routes', '#FFD700', 100, 150, '{"production": 1.25, "construction_cost": 0.95, "trade_tax_reduction": 0.5, "market_fee_reduction": 0.7}', 'Corporate_Enforcer', '{"hp": 100, "speed": 1, "attack": 90, "defense": 90}', 'Gold builds empires more surely than steel.', '2025-11-30 14:53:35.316+01');


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public.resources VALUES (52, 13, 'energie', 1150, '2025-11-30 18:51:01.547', 0);
INSERT INTO public.resources VALUES (56, 14, 'energie', 1150, '2025-11-30 18:51:01.554', 0);
INSERT INTO public.resources VALUES (64, 16, 'energie', 1150, '2025-11-30 18:51:01.564', 0);
INSERT INTO public.resources VALUES (68, 17, 'energie', 1150, '2025-11-30 18:51:01.568', 0);
INSERT INTO public.resources VALUES (142, 36, 'metal', 2000, '2025-11-30 18:50:21.345', 0);
INSERT INTO public.resources VALUES (188, 47, 'energie', 1150, '2025-11-30 18:50:21.392', 0);
INSERT INTO public.resources VALUES (193, 49, 'or', 1000, '2025-11-30 18:50:21.4', 0);
INSERT INTO public.resources VALUES (285, 72, 'or', 870, '2025-11-30 18:50:21.489', 2);
INSERT INTO public.resources VALUES (16, 4, 'energie', 0, '2025-11-30 18:51:01.525', 0);
INSERT INTO public.resources VALUES (20, 5, 'energie', 1150, '2025-11-30 18:51:01.53', 0);
INSERT INTO public.resources VALUES (140, 35, 'energie', 1150, '2025-11-30 18:50:21.34', 0);
INSERT INTO public.resources VALUES (24, 6, 'energie', 1150, '2025-11-30 18:51:01.536', 0);
INSERT INTO public.resources VALUES (48, 12, 'energie', 1150, '2025-11-30 18:51:01.542', 0);
INSERT INTO public.resources VALUES (53, 14, 'or', 1000, '2025-11-30 18:51:01.554', 0);
INSERT INTO public.resources VALUES (63, 16, 'carburant', 0, '2025-11-30 18:51:01.564', 0);
INSERT INTO public.resources VALUES (60, 15, 'energie', 1150, '2025-11-30 18:51:01.559', 0);
INSERT INTO public.resources VALUES (57, 15, 'or', 1000, '2025-11-30 18:51:01.559', 0);
INSERT INTO public.resources VALUES (72, 18, 'energie', 1150, '2025-11-30 18:51:01.573', 0);
INSERT INTO public.resources VALUES (69, 18, 'or', 1000, '2025-11-30 18:51:01.573', 0);
INSERT INTO public.resources VALUES (76, 19, 'energie', 1150, '2025-11-30 18:51:01.577', 0);
INSERT INTO public.resources VALUES (73, 19, 'or', 1000, '2025-11-30 18:51:01.577', 0);
INSERT INTO public.resources VALUES (80, 20, 'energie', 1150, '2025-11-30 18:51:01.582', 0);
INSERT INTO public.resources VALUES (77, 20, 'or', 1000, '2025-11-30 18:51:01.582', 0);
INSERT INTO public.resources VALUES (84, 21, 'energie', 1150, '2025-11-30 18:51:01.585', 0);
INSERT INTO public.resources VALUES (83, 21, 'carburant', 0, '2025-11-30 18:51:01.585', 0);
INSERT INTO public.resources VALUES (88, 22, 'energie', 1150, '2025-11-30 18:51:01.589', 0);
INSERT INTO public.resources VALUES (85, 22, 'or', 1000, '2025-11-30 18:51:01.589', 0);
INSERT INTO public.resources VALUES (92, 23, 'energie', 1150, '2025-11-30 18:51:01.594', 0);
INSERT INTO public.resources VALUES (89, 23, 'or', 1000, '2025-11-30 18:51:01.594', 0);
INSERT INTO public.resources VALUES (96, 24, 'energie', 1150, '2025-11-30 18:51:01.598', 0);
INSERT INTO public.resources VALUES (100, 25, 'energie', 1150, '2025-11-30 18:51:01.601', 0);
INSERT INTO public.resources VALUES (97, 25, 'or', 1000, '2025-11-30 18:51:01.601', 0);
INSERT INTO public.resources VALUES (108, 27, 'energie', 1150, '2025-11-30 18:51:01.612', 0);
INSERT INTO public.resources VALUES (105, 27, 'or', 1000, '2025-11-30 18:51:01.612', 0);
INSERT INTO public.resources VALUES (104, 26, 'energie', 1150, '2025-11-30 18:51:01.607', 0);
INSERT INTO public.resources VALUES (101, 26, 'or', 1000, '2025-11-30 18:51:01.607', 0);
INSERT INTO public.resources VALUES (112, 28, 'energie', 1150, '2025-11-30 18:51:01.617', 0);
INSERT INTO public.resources VALUES (109, 28, 'or', 1000, '2025-11-30 18:51:01.617', 0);
INSERT INTO public.resources VALUES (116, 29, 'energie', 1150, '2025-11-30 18:51:01.624', 0);
INSERT INTO public.resources VALUES (113, 29, 'or', 1000, '2025-11-30 18:51:01.624', 0);
INSERT INTO public.resources VALUES (120, 30, 'energie', 1150, '2025-11-30 18:51:01.63', 0);
INSERT INTO public.resources VALUES (117, 30, 'or', 1000, '2025-11-30 18:51:01.63', 0);
INSERT INTO public.resources VALUES (124, 31, 'energie', 1150, '2025-11-30 18:51:01.636', 0);
INSERT INTO public.resources VALUES (121, 31, 'or', 1000, '2025-11-30 18:51:01.636', 0);
INSERT INTO public.resources VALUES (128, 32, 'energie', 1150, '2025-11-30 18:51:01.644', 0);
INSERT INTO public.resources VALUES (125, 32, 'or', 1000, '2025-11-30 18:51:01.644', 0);
INSERT INTO public.resources VALUES (132, 33, 'energie', 1150, '2025-11-30 18:50:21.331', 0);
INSERT INTO public.resources VALUES (129, 33, 'or', 1000, '2025-11-30 18:50:21.331', 0);
INSERT INTO public.resources VALUES (133, 34, 'or', 1000, '2025-11-30 18:50:21.335', 0);
INSERT INTO public.resources VALUES (134, 34, 'metal', 2000, '2025-11-30 18:50:21.335', 0);
INSERT INTO public.resources VALUES (137, 35, 'or', 1000, '2025-11-30 18:50:21.34', 0);
INSERT INTO public.resources VALUES (143, 36, 'carburant', 0, '2025-11-30 18:50:21.345', 0);
INSERT INTO public.resources VALUES (185, 47, 'or', 1000, '2025-11-30 18:50:21.392', 0);
INSERT INTO public.resources VALUES (194, 49, 'metal', 2000, '2025-11-30 18:50:21.4', 0);
INSERT INTO public.resources VALUES (13, 4, 'or', 1000, '2025-11-30 18:51:01.525', 0);
INSERT INTO public.resources VALUES (17, 5, 'or', 1000, '2025-11-30 18:51:01.53', 0);
INSERT INTO public.resources VALUES (23, 6, 'carburant', 0, '2025-11-30 18:51:01.536', 0);
INSERT INTO public.resources VALUES (45, 12, 'or', 1000, '2025-11-30 18:51:01.542', 0);
INSERT INTO public.resources VALUES (293, 74, 'gold', 50000, '2025-11-30 12:00:15.792', 0);
INSERT INTO public.resources VALUES (295, 74, 'fuel', 20000, '2025-11-30 12:00:15.796', 0);
INSERT INTO public.resources VALUES (49, 13, 'or', 1000, '2025-11-30 18:51:01.547', 0);
INSERT INTO public.resources VALUES (65, 17, 'or', 1000, '2025-11-30 18:51:01.568', 0);
INSERT INTO public.resources VALUES (93, 24, 'or', 1000, '2025-11-30 18:51:01.598', 0);
INSERT INTO public.resources VALUES (114, 29, 'metal', 2000, '2025-11-30 18:51:01.624', 0);
INSERT INTO public.resources VALUES (118, 30, 'metal', 2000, '2025-11-30 18:51:01.63', 0);
INSERT INTO public.resources VALUES (74, 19, 'metal', 2000, '2025-11-30 18:51:01.577', 0);
INSERT INTO public.resources VALUES (78, 20, 'metal', 2000, '2025-11-30 18:51:01.582', 0);
INSERT INTO public.resources VALUES (86, 22, 'metal', 2000, '2025-11-30 18:51:01.589', 0);
INSERT INTO public.resources VALUES (90, 23, 'metal', 2000, '2025-11-30 18:51:01.594', 0);
INSERT INTO public.resources VALUES (94, 24, 'metal', 2000, '2025-11-30 18:51:01.598', 0);
INSERT INTO public.resources VALUES (98, 25, 'metal', 2000, '2025-11-30 18:51:01.601', 0);
INSERT INTO public.resources VALUES (102, 26, 'metal', 2000, '2025-11-30 18:51:01.607', 0);
INSERT INTO public.resources VALUES (106, 27, 'metal', 2000, '2025-11-30 18:51:01.612', 0);
INSERT INTO public.resources VALUES (110, 28, 'metal', 2000, '2025-11-30 18:51:01.617', 0);
INSERT INTO public.resources VALUES (122, 31, 'metal', 2000, '2025-11-30 18:51:01.636', 0);
INSERT INTO public.resources VALUES (126, 32, 'metal', 2000, '2025-11-30 18:51:01.644', 0);
INSERT INTO public.resources VALUES (130, 33, 'metal', 2000, '2025-11-30 18:50:21.331', 0);
INSERT INTO public.resources VALUES (186, 47, 'metal', 2000, '2025-11-30 18:50:21.392', 0);
INSERT INTO public.resources VALUES (195, 49, 'carburant', 0, '2025-11-30 18:50:21.4', 0);
INSERT INTO public.resources VALUES (18, 5, 'metal', 2000, '2025-11-30 18:51:01.53', 0);
INSERT INTO public.resources VALUES (21, 6, 'or', 1000, '2025-11-30 18:51:01.536', 0);
INSERT INTO public.resources VALUES (46, 12, 'metal', 2000, '2025-11-30 18:51:01.542', 0);
INSERT INTO public.resources VALUES (50, 13, 'metal', 2000, '2025-11-30 18:51:01.547', 0);
INSERT INTO public.resources VALUES (54, 14, 'metal', 2000, '2025-11-30 18:51:01.554', 0);
INSERT INTO public.resources VALUES (58, 15, 'metal', 2000, '2025-11-30 18:51:01.559', 0);
INSERT INTO public.resources VALUES (61, 16, 'or', 1000, '2025-11-30 18:51:01.564', 0);
INSERT INTO public.resources VALUES (66, 17, 'metal', 2000, '2025-11-30 18:51:01.568', 0);
INSERT INTO public.resources VALUES (81, 21, 'or', 1000, '2025-11-30 18:51:01.585', 0);
INSERT INTO public.resources VALUES (62, 16, 'metal', 2000, '2025-11-30 18:51:01.564', 0);
INSERT INTO public.resources VALUES (67, 17, 'carburant', 0, '2025-11-30 18:51:01.568', 0);
INSERT INTO public.resources VALUES (55, 14, 'carburant', 0, '2025-11-30 18:51:01.554', 0);
INSERT INTO public.resources VALUES (70, 18, 'metal', 2000, '2025-11-30 18:51:01.573', 0);
INSERT INTO public.resources VALUES (71, 18, 'carburant', 0, '2025-11-30 18:51:01.573', 0);
INSERT INTO public.resources VALUES (82, 21, 'metal', 2000, '2025-11-30 18:51:01.585', 0);
INSERT INTO public.resources VALUES (87, 22, 'carburant', 0, '2025-11-30 18:51:01.589', 0);
INSERT INTO public.resources VALUES (91, 23, 'carburant', 0, '2025-11-30 18:51:01.594', 0);
INSERT INTO public.resources VALUES (95, 24, 'carburant', 0, '2025-11-30 18:51:01.598', 0);
INSERT INTO public.resources VALUES (99, 25, 'carburant', 0, '2025-11-30 18:51:01.601', 0);
INSERT INTO public.resources VALUES (103, 26, 'carburant', 0, '2025-11-30 18:51:01.607', 0);
INSERT INTO public.resources VALUES (107, 27, 'carburant', 0, '2025-11-30 18:51:01.612', 0);
INSERT INTO public.resources VALUES (111, 28, 'carburant', 0, '2025-11-30 18:51:01.617', 0);
INSERT INTO public.resources VALUES (115, 29, 'carburant', 0, '2025-11-30 18:51:01.624', 0);
INSERT INTO public.resources VALUES (119, 30, 'carburant', 0, '2025-11-30 18:51:01.63', 0);
INSERT INTO public.resources VALUES (123, 31, 'carburant', 0, '2025-11-30 18:51:01.636', 0);
INSERT INTO public.resources VALUES (127, 32, 'carburant', 0, '2025-11-30 18:51:01.644', 0);
INSERT INTO public.resources VALUES (131, 33, 'carburant', 0, '2025-11-30 18:50:21.331', 0);
INSERT INTO public.resources VALUES (19, 5, 'carburant', 0, '2025-11-30 18:51:01.53', 0);
INSERT INTO public.resources VALUES (59, 15, 'carburant', 0, '2025-11-30 18:51:01.559', 0);
INSERT INTO public.resources VALUES (22, 6, 'metal', 2000, '2025-11-30 18:51:01.536', 0);
INSERT INTO public.resources VALUES (47, 12, 'carburant', 0, '2025-11-30 18:51:01.542', 0);
INSERT INTO public.resources VALUES (51, 13, 'carburant', 0, '2025-11-30 18:51:01.547', 0);
INSERT INTO public.resources VALUES (75, 19, 'carburant', 0, '2025-11-30 18:51:01.577', 0);
INSERT INTO public.resources VALUES (79, 20, 'carburant', 0, '2025-11-30 18:51:01.582', 0);
INSERT INTO public.resources VALUES (164, 41, 'energie', 1150, '2025-11-30 18:50:21.366', 0);
INSERT INTO public.resources VALUES (168, 42, 'energie', 1150, '2025-11-30 18:50:21.371', 0);
INSERT INTO public.resources VALUES (236, 59, 'energie', 1150, '2025-11-30 18:50:21.441', 0);
INSERT INTO public.resources VALUES (172, 43, 'energie', 1150, '2025-11-30 18:50:21.376', 0);
INSERT INTO public.resources VALUES (176, 44, 'energie', 1150, '2025-11-30 18:50:21.38', 0);
INSERT INTO public.resources VALUES (240, 60, 'energie', 1150, '2025-11-30 18:50:21.445', 0);
INSERT INTO public.resources VALUES (244, 61, 'energie', 1150, '2025-11-30 18:50:21.448', 0);
INSERT INTO public.resources VALUES (248, 62, 'energie', 1150, '2025-11-30 18:50:21.452', 0);
INSERT INTO public.resources VALUES (252, 63, 'energie', 1150, '2025-11-30 18:50:21.455', 0);
INSERT INTO public.resources VALUES (180, 45, 'energie', 1150, '2025-11-30 18:50:21.384', 0);
INSERT INTO public.resources VALUES (184, 46, 'energie', 1150, '2025-11-30 18:50:21.388', 0);
INSERT INTO public.resources VALUES (256, 64, 'energie', 1150, '2025-11-30 18:50:21.46', 0);
INSERT INTO public.resources VALUES (257, 65, 'or', 1000, '2025-11-30 18:50:21.464', 0);
INSERT INTO public.resources VALUES (192, 48, 'energie', 1150, '2025-11-30 18:50:21.396', 0);
INSERT INTO public.resources VALUES (264, 66, 'energie', 1150, '2025-11-30 18:50:21.468', 0);
INSERT INTO public.resources VALUES (268, 67, 'energie', 1150, '2025-11-30 18:50:21.471', 0);
INSERT INTO public.resources VALUES (265, 67, 'or', 1000, '2025-11-30 18:50:21.471', 0);
INSERT INTO public.resources VALUES (200, 50, 'energie', 1150, '2025-11-30 18:50:21.404', 0);
INSERT INTO public.resources VALUES (204, 51, 'energie', 1150, '2025-11-30 18:50:21.407', 0);
INSERT INTO public.resources VALUES (296, 74, 'energy', 10000, '2025-11-30 12:00:15.798', 0);
INSERT INTO public.resources VALUES (208, 52, 'energie', 1150, '2025-11-30 18:50:21.411', 0);
INSERT INTO public.resources VALUES (205, 52, 'or', 1000, '2025-11-30 18:50:21.411', 0);
INSERT INTO public.resources VALUES (212, 53, 'energie', 1150, '2025-11-30 18:50:21.415', 0);
INSERT INTO public.resources VALUES (220, 55, 'energie', 1150, '2025-11-30 18:50:21.424', 0);
INSERT INTO public.resources VALUES (224, 56, 'energie', 1150, '2025-11-30 18:50:21.428', 0);
INSERT INTO public.resources VALUES (228, 57, 'energie', 1150, '2025-11-30 18:50:21.433', 0);
INSERT INTO public.resources VALUES (232, 58, 'energie', 1150, '2025-11-30 18:50:21.437', 0);
INSERT INTO public.resources VALUES (261, 66, 'or', 1000, '2025-11-30 18:50:21.468', 0);
INSERT INTO public.resources VALUES (144, 36, 'energie', 1150, '2025-11-30 18:50:21.345', 0);
INSERT INTO public.resources VALUES (141, 36, 'or', 1000, '2025-11-30 18:50:21.345', 0);
INSERT INTO public.resources VALUES (148, 37, 'energie', 1150, '2025-11-30 18:50:21.35', 0);
INSERT INTO public.resources VALUES (145, 37, 'or', 1000, '2025-11-30 18:50:21.35', 0);
INSERT INTO public.resources VALUES (152, 38, 'energie', 1150, '2025-11-30 18:50:21.354', 0);
INSERT INTO public.resources VALUES (149, 38, 'or', 1000, '2025-11-30 18:50:21.354', 0);
INSERT INTO public.resources VALUES (150, 38, 'metal', 2000, '2025-11-30 18:50:21.354', 0);
INSERT INTO public.resources VALUES (156, 39, 'energie', 1150, '2025-11-30 18:50:21.358', 0);
INSERT INTO public.resources VALUES (153, 39, 'or', 1000, '2025-11-30 18:50:21.358', 0);
INSERT INTO public.resources VALUES (160, 40, 'energie', 1150, '2025-11-30 18:50:21.362', 0);
INSERT INTO public.resources VALUES (157, 40, 'or', 1000, '2025-11-30 18:50:21.362', 0);
INSERT INTO public.resources VALUES (161, 41, 'or', 1000, '2025-11-30 18:50:21.366', 0);
INSERT INTO public.resources VALUES (165, 42, 'or', 1000, '2025-11-30 18:50:21.371', 0);
INSERT INTO public.resources VALUES (169, 43, 'or', 1000, '2025-11-30 18:50:21.376', 0);
INSERT INTO public.resources VALUES (189, 48, 'or', 1000, '2025-11-30 18:50:21.396', 0);
INSERT INTO public.resources VALUES (196, 49, 'energie', 1150, '2025-11-30 18:50:21.4', 0);
INSERT INTO public.resources VALUES (209, 53, 'or', 1000, '2025-11-30 18:50:21.415', 0);
INSERT INTO public.resources VALUES (210, 53, 'metal', 2000, '2025-11-30 18:50:21.415', 0);
INSERT INTO public.resources VALUES (217, 55, 'or', 1000, '2025-11-30 18:50:21.424', 0);
INSERT INTO public.resources VALUES (218, 55, 'metal', 2000, '2025-11-30 18:50:21.424', 0);
INSERT INTO public.resources VALUES (221, 56, 'or', 1000, '2025-11-30 18:50:21.428', 0);
INSERT INTO public.resources VALUES (222, 56, 'metal', 2000, '2025-11-30 18:50:21.428', 0);
INSERT INTO public.resources VALUES (225, 57, 'or', 1000, '2025-11-30 18:50:21.433', 0);
INSERT INTO public.resources VALUES (226, 57, 'metal', 2000, '2025-11-30 18:50:21.433', 0);
INSERT INTO public.resources VALUES (229, 58, 'or', 1000, '2025-11-30 18:50:21.437', 0);
INSERT INTO public.resources VALUES (230, 58, 'metal', 2000, '2025-11-30 18:50:21.437', 0);
INSERT INTO public.resources VALUES (233, 59, 'or', 1000, '2025-11-30 18:50:21.441', 0);
INSERT INTO public.resources VALUES (234, 59, 'metal', 2000, '2025-11-30 18:50:21.441', 0);
INSERT INTO public.resources VALUES (237, 60, 'or', 1000, '2025-11-30 18:50:21.445', 0);
INSERT INTO public.resources VALUES (238, 60, 'metal', 2000, '2025-11-30 18:50:21.445', 0);
INSERT INTO public.resources VALUES (241, 61, 'or', 1000, '2025-11-30 18:50:21.448', 0);
INSERT INTO public.resources VALUES (242, 61, 'metal', 2000, '2025-11-30 18:50:21.448', 0);
INSERT INTO public.resources VALUES (245, 62, 'or', 1000, '2025-11-30 18:50:21.452', 0);
INSERT INTO public.resources VALUES (246, 62, 'metal', 2000, '2025-11-30 18:50:21.452', 0);
INSERT INTO public.resources VALUES (247, 62, 'carburant', 0, '2025-11-30 18:50:21.452', 0);
INSERT INTO public.resources VALUES (249, 63, 'or', 1000, '2025-11-30 18:50:21.455', 0);
INSERT INTO public.resources VALUES (250, 63, 'metal', 2000, '2025-11-30 18:50:21.455', 0);
INSERT INTO public.resources VALUES (251, 63, 'carburant', 0, '2025-11-30 18:50:21.455', 0);
INSERT INTO public.resources VALUES (253, 64, 'or', 1000, '2025-11-30 18:50:21.46', 0);
INSERT INTO public.resources VALUES (254, 64, 'metal', 2000, '2025-11-30 18:50:21.46', 0);
INSERT INTO public.resources VALUES (262, 66, 'metal', 2000, '2025-11-30 18:50:21.468', 0);
INSERT INTO public.resources VALUES (263, 66, 'carburant', 0, '2025-11-30 18:50:21.468', 0);
INSERT INTO public.resources VALUES (266, 67, 'metal', 2000, '2025-11-30 18:50:21.471', 0);
INSERT INTO public.resources VALUES (146, 37, 'metal', 2000, '2025-11-30 18:50:21.35', 0);
INSERT INTO public.resources VALUES (154, 39, 'metal', 2000, '2025-11-30 18:50:21.358', 0);
INSERT INTO public.resources VALUES (158, 40, 'metal', 2000, '2025-11-30 18:50:21.362', 0);
INSERT INTO public.resources VALUES (162, 41, 'metal', 2000, '2025-11-30 18:50:21.366', 0);
INSERT INTO public.resources VALUES (166, 42, 'metal', 2000, '2025-11-30 18:50:21.371', 0);
INSERT INTO public.resources VALUES (170, 43, 'metal', 2000, '2025-11-30 18:50:21.376', 0);
INSERT INTO public.resources VALUES (173, 44, 'or', 1000, '2025-11-30 18:50:21.38', 0);
INSERT INTO public.resources VALUES (174, 44, 'metal', 2000, '2025-11-30 18:50:21.38', 0);
INSERT INTO public.resources VALUES (177, 45, 'or', 1000, '2025-11-30 18:50:21.384', 0);
INSERT INTO public.resources VALUES (178, 45, 'metal', 2000, '2025-11-30 18:50:21.384', 0);
INSERT INTO public.resources VALUES (181, 46, 'or', 1000, '2025-11-30 18:50:21.388', 0);
INSERT INTO public.resources VALUES (182, 46, 'metal', 2000, '2025-11-30 18:50:21.388', 0);
INSERT INTO public.resources VALUES (190, 48, 'metal', 2000, '2025-11-30 18:50:21.396', 0);
INSERT INTO public.resources VALUES (197, 50, 'or', 1000, '2025-11-30 18:50:21.404', 0);
INSERT INTO public.resources VALUES (198, 50, 'metal', 2000, '2025-11-30 18:50:21.404', 0);
INSERT INTO public.resources VALUES (267, 67, 'carburant', 0, '2025-11-30 18:50:21.471', 0);
INSERT INTO public.resources VALUES (151, 38, 'carburant', 0, '2025-11-30 18:50:21.354', 0);
INSERT INTO public.resources VALUES (159, 40, 'carburant', 0, '2025-11-30 18:50:21.362', 0);
INSERT INTO public.resources VALUES (163, 41, 'carburant', 0, '2025-11-30 18:50:21.366', 0);
INSERT INTO public.resources VALUES (167, 42, 'carburant', 0, '2025-11-30 18:50:21.371', 0);
INSERT INTO public.resources VALUES (302, 75, 'essence', 0, '2025-11-30 12:00:47.781', 0);
INSERT INTO public.resources VALUES (175, 44, 'carburant', 0, '2025-11-30 18:50:21.38', 0);
INSERT INTO public.resources VALUES (179, 45, 'carburant', 0, '2025-11-30 18:50:21.384', 0);
INSERT INTO public.resources VALUES (183, 46, 'carburant', 0, '2025-11-30 18:50:21.388', 0);
INSERT INTO public.resources VALUES (191, 48, 'carburant', 0, '2025-11-30 18:50:21.396', 0);
INSERT INTO public.resources VALUES (199, 50, 'carburant', 0, '2025-11-30 18:50:21.404', 0);
INSERT INTO public.resources VALUES (201, 51, 'or', 1000, '2025-11-30 18:50:21.407', 0);
INSERT INTO public.resources VALUES (202, 51, 'metal', 2000, '2025-11-30 18:50:21.407', 0);
INSERT INTO public.resources VALUES (203, 51, 'carburant', 0, '2025-11-30 18:50:21.407', 0);
INSERT INTO public.resources VALUES (206, 52, 'metal', 2000, '2025-11-30 18:50:21.411', 0);
INSERT INTO public.resources VALUES (211, 53, 'carburant', 0, '2025-11-30 18:50:21.415', 0);
INSERT INTO public.resources VALUES (219, 55, 'carburant', 0, '2025-11-30 18:50:21.424', 0);
INSERT INTO public.resources VALUES (227, 57, 'carburant', 0, '2025-11-30 18:50:21.433', 0);
INSERT INTO public.resources VALUES (231, 58, 'carburant', 0, '2025-11-30 18:50:21.437', 0);
INSERT INTO public.resources VALUES (243, 61, 'carburant', 0, '2025-11-30 18:50:21.448', 0);
INSERT INTO public.resources VALUES (303, 75, 'energie', 0, '2025-11-30 12:00:47.782', 0);
INSERT INTO public.resources VALUES (300, 75, 'or', 6000, '2025-11-30 12:01:25.912', 3);
INSERT INTO public.resources VALUES (301, 75, 'metal', 3000, '2025-11-30 12:01:25.914', 3);
INSERT INTO public.resources VALUES (304, 76, 'or', 10000, '2025-11-30 17:26:25.027', 0);
INSERT INTO public.resources VALUES (305, 76, 'metal', 10000, '2025-11-30 17:26:25.191', 0);
INSERT INTO public.resources VALUES (306, 76, 'carburant', 10000, '2025-11-30 17:26:25.193', 0);
INSERT INTO public.resources VALUES (136, 34, 'energie', 1150, '2025-11-30 18:50:21.335', 0);
INSERT INTO public.resources VALUES (135, 34, 'carburant', 0, '2025-11-30 18:50:21.335', 0);
INSERT INTO public.resources VALUES (138, 35, 'metal', 2000, '2025-11-30 18:50:21.34', 0);
INSERT INTO public.resources VALUES (139, 35, 'carburant', 0, '2025-11-30 18:50:21.34', 0);
INSERT INTO public.resources VALUES (299, 74, 'energie', 10000, '2025-11-30 12:00:33.315', 0);
INSERT INTO public.resources VALUES (147, 37, 'carburant', 0, '2025-11-30 18:50:21.35', 0);
INSERT INTO public.resources VALUES (155, 39, 'carburant', 0, '2025-11-30 18:50:21.358', 0);
INSERT INTO public.resources VALUES (171, 43, 'carburant', 0, '2025-11-30 18:50:21.376', 0);
INSERT INTO public.resources VALUES (187, 47, 'carburant', 0, '2025-11-30 18:50:21.392', 0);
INSERT INTO public.resources VALUES (207, 52, 'carburant', 0, '2025-11-30 18:50:21.411', 0);
INSERT INTO public.resources VALUES (216, 54, 'energie', 1150, '2025-11-30 18:50:21.42', 0);
INSERT INTO public.resources VALUES (215, 54, 'carburant', 0, '2025-11-30 18:50:21.42', 0);
INSERT INTO public.resources VALUES (213, 54, 'or', 1000, '2025-11-30 18:50:21.42', 0);
INSERT INTO public.resources VALUES (214, 54, 'metal', 2000, '2025-11-30 18:50:21.42', 0);
INSERT INTO public.resources VALUES (223, 56, 'carburant', 0, '2025-11-30 18:50:21.428', 0);
INSERT INTO public.resources VALUES (235, 59, 'carburant', 0, '2025-11-30 18:50:21.441', 0);
INSERT INTO public.resources VALUES (239, 60, 'carburant', 0, '2025-11-30 18:50:21.445', 0);
INSERT INTO public.resources VALUES (297, 74, 'or', 40000, '2025-11-30 12:01:25.876', 4);
INSERT INTO public.resources VALUES (294, 74, 'metal', 25000, '2025-11-30 12:01:25.88', 4);
INSERT INTO public.resources VALUES (298, 74, 'essence', 17000, '2025-11-30 12:01:25.881', 4);
INSERT INTO public.resources VALUES (255, 64, 'carburant', 0, '2025-11-30 18:50:21.46', 0);
INSERT INTO public.resources VALUES (260, 65, 'energie', 1150, '2025-11-30 18:50:21.464', 0);
INSERT INTO public.resources VALUES (259, 65, 'carburant', 0, '2025-11-30 18:50:21.464', 0);
INSERT INTO public.resources VALUES (258, 65, 'metal', 2000, '2025-11-30 18:50:21.464', 0);
INSERT INTO public.resources VALUES (272, 68, 'energie', 1150, '2025-11-30 18:50:21.475', 0);
INSERT INTO public.resources VALUES (269, 68, 'or', 1000, '2025-11-30 18:50:21.475', 0);
INSERT INTO public.resources VALUES (270, 68, 'metal', 2000, '2025-11-30 18:50:21.475', 0);
INSERT INTO public.resources VALUES (271, 68, 'carburant', 0, '2025-11-30 18:50:21.475', 0);
INSERT INTO public.resources VALUES (276, 69, 'energie', 1150, '2025-11-30 18:50:21.478', 0);
INSERT INTO public.resources VALUES (291, 73, 'carburant', 0, '2025-11-30 09:26:39.571', 0);
INSERT INTO public.resources VALUES (292, 73, 'energie', 0, '2025-11-30 09:26:39.571', 0);
INSERT INTO public.resources VALUES (275, 69, 'carburant', 0, '2025-11-30 18:50:21.478', 0);
INSERT INTO public.resources VALUES (289, 73, 'or', 1700, '2025-11-30 09:26:39.571', 0);
INSERT INTO public.resources VALUES (290, 73, 'metal', 1300, '2025-11-30 09:26:39.571', 0);
INSERT INTO public.resources VALUES (273, 69, 'or', 1000, '2025-11-30 18:50:21.478', 0);
INSERT INTO public.resources VALUES (274, 69, 'metal', 2000, '2025-11-30 18:50:21.478', 0);
INSERT INTO public.resources VALUES (280, 70, 'energie', 1150, '2025-11-30 18:50:21.482', 0);
INSERT INTO public.resources VALUES (277, 70, 'or', 1000, '2025-11-30 18:50:21.482', 0);
INSERT INTO public.resources VALUES (278, 70, 'metal', 2000, '2025-11-30 18:50:21.482', 0);
INSERT INTO public.resources VALUES (279, 70, 'carburant', 0, '2025-11-30 18:50:21.482', 0);
INSERT INTO public.resources VALUES (284, 71, 'energie', 1150, '2025-11-30 18:50:21.486', 0);
INSERT INTO public.resources VALUES (283, 71, 'carburant', 0, '2025-11-30 18:50:21.486', 0);
INSERT INTO public.resources VALUES (281, 71, 'or', 1000, '2025-11-30 18:50:21.486', 0);
INSERT INTO public.resources VALUES (282, 71, 'metal', 2000, '2025-11-30 18:50:21.486', 0);
INSERT INTO public.resources VALUES (288, 72, 'energie', 0, '2025-11-30 18:50:21.489', 0);
INSERT INTO public.resources VALUES (287, 72, 'carburant', 0, '2025-11-30 18:50:21.489', 0);
INSERT INTO public.resources VALUES (286, 72, 'metal', 1782, '2025-11-30 18:50:21.489', 2);
INSERT INTO public.resources VALUES (15, 4, 'carburant', 0, '2025-11-30 18:51:01.525', 0);
INSERT INTO public.resources VALUES (14, 4, 'metal', 2000, '2025-11-30 18:51:01.525', 0);


--
-- Name: battle_pass_seasons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: terra_user
--

SELECT pg_catalog.setval('public.battle_pass_seasons_id_seq', 1, true);


--
-- Name: blueprints_id_seq; Type: SEQUENCE SET; Schema: public; Owner: terra_user
--

SELECT pg_catalog.setval('public.blueprints_id_seq', 10, true);


--
-- Name: entities_entity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.entities_entity_id_seq', 37, true);


--
-- Name: resources_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resources_id_seq', 306, true);


--
-- PostgreSQL database dump complete
--

\unrestrict gCpdljd75CfeQAr0TXetoQS5fKAYQ4kJKDwtfyTNPnuPuRzJEUOsms1qlUFmlqV

