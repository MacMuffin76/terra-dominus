--
-- PostgreSQL database dump
--

\restrict EOVD4CQrm7DJEBmQwpywtahgtaCKevTbJiLQHVRTRHVYIYKSnaML6E1dWalziIX

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
-- Name: enum_achievements_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_achievements_category AS ENUM (
    'combat',
    'economy',
    'buildings',
    'research',
    'social',
    'exploration',
    'general'
);


--
-- Name: enum_achievements_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_achievements_tier AS ENUM (
    'bronze',
    'silver',
    'gold',
    'platinum',
    'diamond'
);


--
-- Name: enum_alliance_diplomacy_relation_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_diplomacy_relation_type AS ENUM (
    'neutral',
    'ally',
    'nap',
    'war'
);


--
-- Name: enum_alliance_diplomacy_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_diplomacy_status AS ENUM (
    'pending',
    'active',
    'rejected',
    'cancelled'
);


--
-- Name: enum_alliance_invitations_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_invitations_status AS ENUM (
    'pending',
    'accepted',
    'declined',
    'expired'
);


--
-- Name: enum_alliance_join_requests_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_join_requests_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: enum_alliance_members_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_members_role AS ENUM (
    'leader',
    'officer',
    'member'
);


--
-- Name: enum_alliance_territories_territory_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_territories_territory_type AS ENUM (
    'strategic_point',
    'resource_node',
    'defensive_outpost',
    'trade_hub'
);


--
-- Name: enum_alliance_treasury_logs_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_treasury_logs_resource_type AS ENUM (
    'gold',
    'metal',
    'fuel',
    'energy'
);


--
-- Name: enum_alliance_treasury_logs_transaction_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_treasury_logs_transaction_type AS ENUM (
    'deposit',
    'withdraw',
    'tax',
    'war_loot',
    'territory_income',
    'upgrade_cost'
);


--
-- Name: enum_alliance_war_battles_outcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_war_battles_outcome AS ENUM (
    'attacker_victory',
    'defender_victory',
    'draw'
);


--
-- Name: enum_alliance_wars_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_alliance_wars_status AS ENUM (
    'active',
    'ceasefire',
    'ended'
);


--
-- Name: enum_attacks_attack_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_attacks_attack_type AS ENUM (
    'raid',
    'conquest',
    'siege'
);


--
-- Name: enum_attacks_outcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_attacks_outcome AS ENUM (
    'attacker_victory',
    'defender_victory',
    'draw'
);


--
-- Name: enum_attacks_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_attacks_status AS ENUM (
    'traveling',
    'arrived',
    'completed',
    'failed',
    'cancelled'
);


--
-- Name: enum_battle_pass_rewards_reward_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_battle_pass_rewards_reward_type AS ENUM (
    'resources',
    'units',
    'buildings',
    'boost',
    'cosmetic',
    'blueprint',
    'item',
    'xp',
    'gems'
);


--
-- Name: enum_battle_pass_rewards_track; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_battle_pass_rewards_track AS ENUM (
    'free',
    'premium'
);


--
-- Name: enum_chat_messages_channel_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_chat_messages_channel_type AS ENUM (
    'global',
    'alliance',
    'private',
    'system'
);


--
-- Name: enum_cities_specialization; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_cities_specialization AS ENUM (
    'none',
    'military',
    'economic',
    'industrial',
    'research'
);


--
-- Name: enum_leaderboard_entries_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_leaderboard_entries_category AS ENUM (
    'total_power',
    'economy',
    'combat_victories',
    'buildings',
    'research',
    'resources',
    'portals',
    'achievements',
    'battle_pass'
);


--
-- Name: enum_leaderboard_rewards_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_leaderboard_rewards_category AS ENUM (
    'total_power',
    'economy',
    'combat_victories',
    'buildings',
    'research',
    'resources',
    'portals',
    'achievements',
    'battle_pass'
);


--
-- Name: enum_leaderboard_rewards_reward_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_leaderboard_rewards_reward_type AS ENUM (
    'premium_currency',
    'resources',
    'cosmetic',
    'title',
    'badge',
    'unit',
    'building_skin',
    'boost'
);


--
-- Name: enum_market_orders_order_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_market_orders_order_type AS ENUM (
    'buy',
    'sell'
);


--
-- Name: enum_market_orders_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_market_orders_resource_type AS ENUM (
    'gold',
    'metal',
    'fuel',
    'food'
);


--
-- Name: enum_market_orders_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_market_orders_status AS ENUM (
    'active',
    'completed',
    'cancelled',
    'expired'
);


--
-- Name: enum_market_transactions_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_market_transactions_resource_type AS ENUM (
    'gold',
    'metal',
    'fuel',
    'food'
);


--
-- Name: enum_portal_alliance_raids_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_alliance_raids_status AS ENUM (
    'forming',
    'in_progress',
    'victory',
    'defeat'
);


--
-- Name: enum_portal_attempts_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_attempts_result AS ENUM (
    'victory',
    'defeat',
    'retreat'
);


--
-- Name: enum_portal_attempts_tactic_used; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_attempts_tactic_used AS ENUM (
    'balanced',
    'aggressive',
    'defensive'
);


--
-- Name: enum_portal_boss_attempts_result; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_boss_attempts_result AS ENUM (
    'victory',
    'defeat',
    'phase_cleared'
);


--
-- Name: enum_portal_boss_attempts_tactic_used; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_boss_attempts_tactic_used AS ENUM (
    'balanced',
    'aggressive',
    'defensive'
);


--
-- Name: enum_portal_bosses_boss_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_bosses_boss_type AS ENUM (
    'elite_guardian',
    'ancient_titan',
    'void_reaver',
    'cosmic_emperor'
);


--
-- Name: enum_portal_expeditions_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_expeditions_status AS ENUM (
    'traveling',
    'victory',
    'defeat'
);


--
-- Name: enum_portal_leaderboard_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_leaderboard_tier AS ENUM (
    'grey',
    'green',
    'blue',
    'purple',
    'red',
    'golden'
);


--
-- Name: enum_portal_mastery_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_mastery_tier AS ENUM (
    'grey',
    'green',
    'blue',
    'purple',
    'red',
    'golden'
);


--
-- Name: enum_portal_rewards_config_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portal_rewards_config_tier AS ENUM (
    'grey',
    'green',
    'blue',
    'purple',
    'red',
    'golden'
);


--
-- Name: enum_portals_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portals_status AS ENUM (
    'active',
    'expired',
    'cleared'
);


--
-- Name: enum_portals_tier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_portals_tier AS ENUM (
    'GREY',
    'GREEN',
    'BLUE',
    'PURPLE',
    'RED',
    'GOLD'
);


--
-- Name: enum_quests_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_quests_category AS ENUM (
    'combat',
    'economy',
    'buildings',
    'research',
    'social'
);


--
-- Name: enum_quests_difficulty; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_quests_difficulty AS ENUM (
    'easy',
    'medium',
    'hard',
    'epic'
);


--
-- Name: enum_quests_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_quests_type AS ENUM (
    'daily',
    'weekly',
    'achievement'
);


--
-- Name: enum_resource_conversion_recipes_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_resource_conversion_recipes_resource_type AS ENUM (
    'titanium',
    'plasma',
    'nanotubes'
);


--
-- Name: enum_resource_conversions_resource_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_resource_conversions_resource_type AS ENUM (
    'titanium',
    'plasma',
    'nanotubes'
);


--
-- Name: enum_resource_conversions_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_resource_conversions_status AS ENUM (
    'queued',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: enum_spy_missions_mission_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_spy_missions_mission_type AS ENUM (
    'reconnaissance',
    'military_intel',
    'sabotage'
);


--
-- Name: enum_spy_missions_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_spy_missions_status AS ENUM (
    'traveling',
    'completed',
    'failed',
    'detected',
    'cancelled'
);


--
-- Name: enum_trade_convoys_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_trade_convoys_status AS ENUM (
    'traveling',
    'arrived',
    'intercepted',
    'cancelled'
);


--
-- Name: enum_trade_routes_route_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_trade_routes_route_type AS ENUM (
    'internal',
    'external'
);


--
-- Name: enum_trade_routes_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_trade_routes_status AS ENUM (
    'active',
    'suspended',
    'broken'
);


--
-- Name: enum_user_quests_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.enum_user_quests_status AS ENUM (
    'available',
    'in_progress',
    'completed',
    'claimed'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: SequelizeMeta; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SequelizeMeta" (
    name character varying(255) NOT NULL
);


--
-- Name: achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.achievements (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    category public.enum_achievements_category NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    tier public.enum_achievements_tier DEFAULT 'bronze'::public.enum_achievements_tier NOT NULL,
    objective_type character varying(255) NOT NULL,
    objective_target integer DEFAULT 1 NOT NULL,
    objective_data json,
    reward_or integer DEFAULT 0 NOT NULL,
    reward_metal integer DEFAULT 0 NOT NULL,
    reward_carburant integer DEFAULT 0 NOT NULL,
    reward_xp integer DEFAULT 0 NOT NULL,
    reward_items json,
    reward_title character varying(255),
    points integer DEFAULT 10 NOT NULL,
    is_secret boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    icon character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN achievements.key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.key IS 'Unique identifier for the achievement';


--
-- Name: COLUMN achievements.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.category IS 'Achievement category';


--
-- Name: COLUMN achievements.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.title IS 'Achievement title';


--
-- Name: COLUMN achievements.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.description IS 'Achievement description';


--
-- Name: COLUMN achievements.tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.tier IS 'Achievement tier/rarity';


--
-- Name: COLUMN achievements.objective_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.objective_type IS 'Type of objective (e.g., total_battles_won, total_resources_collected)';


--
-- Name: COLUMN achievements.objective_target; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.objective_target IS 'Target value to unlock achievement';


--
-- Name: COLUMN achievements.objective_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.objective_data IS 'Additional objective data (e.g., specific resource type)';


--
-- Name: COLUMN achievements.reward_or; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_or IS 'Gold reward';


--
-- Name: COLUMN achievements.reward_metal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_metal IS 'Metal reward';


--
-- Name: COLUMN achievements.reward_carburant; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_carburant IS 'Fuel reward';


--
-- Name: COLUMN achievements.reward_xp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_xp IS 'XP reward';


--
-- Name: COLUMN achievements.reward_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_items IS 'Item rewards (JSON array)';


--
-- Name: COLUMN achievements.reward_title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.reward_title IS 'Special title/badge reward';


--
-- Name: COLUMN achievements.points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.points IS 'Achievement points for leaderboard';


--
-- Name: COLUMN achievements.is_secret; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.is_secret IS 'Whether achievement is hidden until unlocked';


--
-- Name: COLUMN achievements.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.is_active IS 'Whether achievement is currently available';


--
-- Name: COLUMN achievements.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.achievements.icon IS 'Icon identifier';


--
-- Name: achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.achievements_id_seq OWNED BY public.achievements.id;


--
-- Name: action_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.action_logs (
    id integer NOT NULL,
    user_id integer NOT NULL,
    log_type character varying(50) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: action_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.action_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: action_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.action_logs_id_seq OWNED BY public.action_logs.id;


--
-- Name: alliance_diplomacy; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_diplomacy (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    target_alliance_id integer NOT NULL,
    relation_type public.enum_alliance_diplomacy_relation_type DEFAULT 'neutral'::public.enum_alliance_diplomacy_relation_type NOT NULL,
    status public.enum_alliance_diplomacy_status DEFAULT 'pending'::public.enum_alliance_diplomacy_status NOT NULL,
    proposed_by integer NOT NULL,
    accepted_by integer,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    terms jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_diplomacy.relation_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_diplomacy.relation_type IS 'neutral=neutre, ally=allié, nap=non-agression, war=guerre';


--
-- Name: COLUMN alliance_diplomacy.starts_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_diplomacy.starts_at IS 'Date de début du traité';


--
-- Name: COLUMN alliance_diplomacy.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_diplomacy.expires_at IS 'Date d''expiration (optionnel)';


--
-- Name: COLUMN alliance_diplomacy.terms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_diplomacy.terms IS 'Termes du traité (tributs, restrictions, etc.)';


--
-- Name: alliance_diplomacy_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_diplomacy_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_diplomacy_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_diplomacy_id_seq OWNED BY public.alliance_diplomacy.id;


--
-- Name: alliance_invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_invitations (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    inviter_id integer NOT NULL,
    invitee_id integer NOT NULL,
    status public.enum_alliance_invitations_status DEFAULT 'pending'::public.enum_alliance_invitations_status NOT NULL,
    message text,
    expires_at timestamp with time zone NOT NULL,
    responded_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_invitations.inviter_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_invitations.inviter_id IS 'Membre qui envoie l''invitation';


--
-- Name: COLUMN alliance_invitations.invitee_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_invitations.invitee_id IS 'Joueur invité';


--
-- Name: COLUMN alliance_invitations.message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_invitations.message IS 'Message d''invitation personnalisé';


--
-- Name: COLUMN alliance_invitations.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_invitations.expires_at IS 'Date d''expiration de l''invitation (7 jours)';


--
-- Name: alliance_invitations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_invitations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_invitations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_invitations_id_seq OWNED BY public.alliance_invitations.id;


--
-- Name: alliance_join_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_join_requests (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    user_id integer NOT NULL,
    status public.enum_alliance_join_requests_status DEFAULT 'pending'::public.enum_alliance_join_requests_status NOT NULL,
    message text,
    reviewed_by integer,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_join_requests.message; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_join_requests.message IS 'Message de candidature';


--
-- Name: alliance_join_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_join_requests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_join_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_join_requests_id_seq OWNED BY public.alliance_join_requests.id;


--
-- Name: alliance_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_members (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    user_id integer NOT NULL,
    role public.enum_alliance_members_role DEFAULT 'member'::public.enum_alliance_members_role NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    contribution bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_members.contribution; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_members.contribution IS 'Contribution totale du membre (ressources, combat, etc.)';


--
-- Name: alliance_members_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_members_id_seq OWNED BY public.alliance_members.id;


--
-- Name: alliance_territories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_territories (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    name character varying(100) NOT NULL,
    territory_type public.enum_alliance_territories_territory_type DEFAULT 'strategic_point'::public.enum_alliance_territories_territory_type NOT NULL,
    coord_x integer NOT NULL,
    coord_y integer NOT NULL,
    radius integer DEFAULT 10 NOT NULL,
    control_points integer DEFAULT 0 NOT NULL,
    bonuses jsonb DEFAULT '{}'::jsonb,
    captured_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_attack timestamp with time zone,
    defense_level integer DEFAULT 1 NOT NULL,
    garrison_strength integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_territories.radius; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_territories.radius IS 'Area of influence radius';


--
-- Name: COLUMN alliance_territories.control_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_territories.control_points IS 'Points needed to maintain control';


--
-- Name: COLUMN alliance_territories.bonuses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_territories.bonuses IS 'Resource production bonuses, defense bonuses, etc.';


--
-- Name: COLUMN alliance_territories.defense_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_territories.defense_level IS 'Upgradeable defense level';


--
-- Name: COLUMN alliance_territories.garrison_strength; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_territories.garrison_strength IS 'Total military power defending the territory';


--
-- Name: alliance_territories_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_territories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_territories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_territories_id_seq OWNED BY public.alliance_territories.id;


--
-- Name: alliance_treasury_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_treasury_logs (
    id integer NOT NULL,
    alliance_id integer NOT NULL,
    user_id integer,
    transaction_type public.enum_alliance_treasury_logs_transaction_type NOT NULL,
    resource_type public.enum_alliance_treasury_logs_resource_type NOT NULL,
    amount bigint NOT NULL,
    balance_before bigint NOT NULL,
    balance_after bigint NOT NULL,
    reason text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: alliance_treasury_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_treasury_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_treasury_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_treasury_logs_id_seq OWNED BY public.alliance_treasury_logs.id;


--
-- Name: alliance_war_battles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_war_battles (
    id integer NOT NULL,
    war_id integer NOT NULL,
    battle_report_id integer,
    attacker_user_id integer NOT NULL,
    defender_user_id integer NOT NULL,
    outcome public.enum_alliance_war_battles_outcome NOT NULL,
    points_awarded integer DEFAULT 0 NOT NULL,
    resources_pillaged jsonb DEFAULT '{}'::jsonb,
    territory_captured integer,
    occurred_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_war_battles.battle_report_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_war_battles.battle_report_id IS 'Link to individual combat battle report (if exists)';


--
-- Name: COLUMN alliance_war_battles.points_awarded; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_war_battles.points_awarded IS 'War points awarded to winner';


--
-- Name: COLUMN alliance_war_battles.territory_captured; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_war_battles.territory_captured IS 'Territory ID if territory changed hands';


--
-- Name: alliance_war_battles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_war_battles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_war_battles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_war_battles_id_seq OWNED BY public.alliance_war_battles.id;


--
-- Name: alliance_wars; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliance_wars (
    id integer NOT NULL,
    attacker_alliance_id integer NOT NULL,
    defender_alliance_id integer NOT NULL,
    declared_by integer NOT NULL,
    status public.enum_alliance_wars_status DEFAULT 'active'::public.enum_alliance_wars_status NOT NULL,
    war_goal character varying(255),
    attacker_score integer DEFAULT 0 NOT NULL,
    defender_score integer DEFAULT 0 NOT NULL,
    attacker_casualties jsonb DEFAULT '{}'::jsonb,
    defender_casualties jsonb DEFAULT '{}'::jsonb,
    territories_contested jsonb DEFAULT '[]'::jsonb,
    war_terms jsonb DEFAULT '{}'::jsonb,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ended_at timestamp with time zone,
    winner_alliance_id integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN alliance_wars.war_goal; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.war_goal IS 'Territory conquest, revenge, resources, etc.';


--
-- Name: COLUMN alliance_wars.attacker_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.attacker_score IS 'War points scored by attacker';


--
-- Name: COLUMN alliance_wars.defender_score; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.defender_score IS 'War points scored by defender';


--
-- Name: COLUMN alliance_wars.attacker_casualties; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.attacker_casualties IS 'Units lost by attacker';


--
-- Name: COLUMN alliance_wars.defender_casualties; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.defender_casualties IS 'Units lost by defender';


--
-- Name: COLUMN alliance_wars.territories_contested; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.territories_contested IS 'List of territory IDs under contention';


--
-- Name: COLUMN alliance_wars.war_terms; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.war_terms IS 'Peace treaty terms, reparations, etc.';


--
-- Name: COLUMN alliance_wars.winner_alliance_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliance_wars.winner_alliance_id IS 'Null if ongoing or draw';


--
-- Name: alliance_wars_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliance_wars_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliance_wars_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliance_wars_id_seq OWNED BY public.alliance_wars.id;


--
-- Name: alliances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.alliances (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    tag character varying(10) NOT NULL,
    leader_id integer NOT NULL,
    description text,
    is_recruiting boolean DEFAULT true,
    min_level_required integer DEFAULT 1,
    member_count integer DEFAULT 1,
    total_power bigint DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    treasury_gold bigint DEFAULT 0 NOT NULL,
    treasury_metal bigint DEFAULT 0 NOT NULL,
    treasury_fuel bigint DEFAULT 0 NOT NULL,
    treasury_energy bigint DEFAULT 0 NOT NULL,
    wars_won integer DEFAULT 0 NOT NULL,
    wars_lost integer DEFAULT 0 NOT NULL,
    territories_controlled integer DEFAULT 0 NOT NULL
);


--
-- Name: COLUMN alliances.tag; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliances.tag IS 'Abréviation de l''alliance (3-10 caractères)';


--
-- Name: COLUMN alliances.is_recruiting; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliances.is_recruiting IS 'Alliance accepte de nouveaux membres';


--
-- Name: COLUMN alliances.min_level_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliances.min_level_required IS 'Niveau minimum requis pour rejoindre';


--
-- Name: COLUMN alliances.member_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliances.member_count IS 'Nombre de membres (dénormalisé pour perfs)';


--
-- Name: COLUMN alliances.total_power; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.alliances.total_power IS 'Puissance totale de l''alliance';


--
-- Name: alliances_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.alliances_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: alliances_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.alliances_id_seq OWNED BY public.alliances.id;


--
-- Name: attack_waves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attack_waves (
    id integer NOT NULL,
    attack_id integer NOT NULL,
    unit_entity_id integer NOT NULL,
    quantity integer NOT NULL,
    survivors integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN attack_waves.survivors; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attack_waves.survivors IS 'Nombre de survivants après combat';


--
-- Name: attack_waves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attack_waves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attack_waves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attack_waves_id_seq OWNED BY public.attack_waves.id;


--
-- Name: attacks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attacks (
    id integer NOT NULL,
    attacker_user_id integer NOT NULL,
    attacker_city_id integer NOT NULL,
    defender_user_id integer NOT NULL,
    defender_city_id integer NOT NULL,
    attack_type public.enum_attacks_attack_type DEFAULT 'raid'::public.enum_attacks_attack_type NOT NULL,
    status public.enum_attacks_status DEFAULT 'traveling'::public.enum_attacks_status NOT NULL,
    departure_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    distance double precision NOT NULL,
    outcome public.enum_attacks_outcome,
    loot_gold integer DEFAULT 0 NOT NULL,
    loot_metal integer DEFAULT 0 NOT NULL,
    loot_fuel integer DEFAULT 0 NOT NULL,
    attacker_losses jsonb,
    defender_losses jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


--
-- Name: COLUMN attacks.attack_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.attack_type IS 'raid=pillage rapide, conquest=conquête totale, siege=siège prolongé';


--
-- Name: COLUMN attacks.distance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.distance IS 'Distance en tiles';


--
-- Name: COLUMN attacks.outcome; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.outcome IS 'Résultat du combat (rempli après bataille)';


--
-- Name: COLUMN attacks.attacker_losses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.attacker_losses IS 'JSON { unit_type_id: quantity_lost }';


--
-- Name: COLUMN attacks.defender_losses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.defender_losses IS 'JSON { unit_type_id: quantity_lost }';


--
-- Name: COLUMN attacks.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.attacks.metadata IS 'PvP balancing metadata (power, cost/reward multipliers)';


--
-- Name: attacks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attacks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attacks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attacks_id_seq OWNED BY public.attacks.id;


--
-- Name: battle_pass_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.battle_pass_rewards (
    id integer NOT NULL,
    season_id integer NOT NULL,
    tier integer NOT NULL,
    track public.enum_battle_pass_rewards_track NOT NULL,
    reward_type public.enum_battle_pass_rewards_reward_type NOT NULL,
    reward_data jsonb NOT NULL,
    display_name character varying(100) NOT NULL,
    display_icon character varying(50),
    is_highlight boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN battle_pass_rewards.season_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.season_id IS 'Foreign key to battle_pass_seasons';


--
-- Name: COLUMN battle_pass_rewards.tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.tier IS 'Tier level (1-100)';


--
-- Name: COLUMN battle_pass_rewards.track; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.track IS 'Free or premium track';


--
-- Name: COLUMN battle_pass_rewards.reward_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.reward_type IS 'Type of reward';


--
-- Name: COLUMN battle_pass_rewards.reward_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.reward_data IS 'Reward details (type-specific data)';


--
-- Name: COLUMN battle_pass_rewards.display_name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.display_name IS 'Display name for the reward';


--
-- Name: COLUMN battle_pass_rewards.display_icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.display_icon IS 'Icon/emoji for display';


--
-- Name: COLUMN battle_pass_rewards.is_highlight; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_rewards.is_highlight IS 'Whether this reward should be highlighted';


--
-- Name: battle_pass_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.battle_pass_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: battle_pass_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.battle_pass_rewards_id_seq OWNED BY public.battle_pass_rewards.id;


--
-- Name: battle_pass_seasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.battle_pass_seasons (
    id integer NOT NULL,
    season_number integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    max_tier integer DEFAULT 100 NOT NULL,
    xp_per_tier integer DEFAULT 1000 NOT NULL,
    premium_price integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN battle_pass_seasons.season_number; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.season_number IS 'Season number (1, 2, 3, etc.)';


--
-- Name: COLUMN battle_pass_seasons.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.name IS 'Season name/theme';


--
-- Name: COLUMN battle_pass_seasons.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.description IS 'Season description';


--
-- Name: COLUMN battle_pass_seasons.start_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.start_date IS 'Season start date';


--
-- Name: COLUMN battle_pass_seasons.end_date; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.end_date IS 'Season end date';


--
-- Name: COLUMN battle_pass_seasons.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.is_active IS 'Whether this season is currently active';


--
-- Name: COLUMN battle_pass_seasons.max_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.max_tier IS 'Maximum tier level in this season';


--
-- Name: COLUMN battle_pass_seasons.xp_per_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.xp_per_tier IS 'XP required per tier';


--
-- Name: COLUMN battle_pass_seasons.premium_price; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.battle_pass_seasons.premium_price IS 'Cost in gems/premium currency for premium pass';


--
-- Name: battle_pass_seasons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.battle_pass_seasons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: battle_pass_seasons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.battle_pass_seasons_id_seq OWNED BY public.battle_pass_seasons.id;


--
-- Name: blueprints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.blueprints (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    category character varying(30) NOT NULL,
    rarity character varying(20) NOT NULL,
    crafting_station_level_min integer DEFAULT 1,
    unlock_requirements jsonb DEFAULT '{}'::jsonb,
    inputs jsonb NOT NULL,
    outputs jsonb NOT NULL,
    duration_seconds integer NOT NULL,
    experience_reward integer DEFAULT 0,
    description text,
    icon_url character varying(255),
    is_active boolean DEFAULT true,
    is_tradeable boolean DEFAULT true,
    is_alliance_craft boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN blueprints.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.category IS 'unit, building, consumable, cosmetic, alliance_building';


--
-- Name: COLUMN blueprints.rarity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.rarity IS 'common, rare, epic, legendary, mythic';


--
-- Name: COLUMN blueprints.unlock_requirements; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.unlock_requirements IS 'Research, building, alliance tech requirements';


--
-- Name: COLUMN blueprints.inputs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.inputs IS 'Resources T1/T2, units, items, premium currency needed';


--
-- Name: COLUMN blueprints.outputs; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.outputs IS 'What is produced (unit, building, item, cosmetic)';


--
-- Name: COLUMN blueprints.experience_reward; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.experience_reward IS 'Crafting XP awarded on completion';


--
-- Name: COLUMN blueprints.is_tradeable; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.blueprints.is_tradeable IS 'Can be sold on market';


--
-- Name: blueprints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.blueprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: blueprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.blueprints_id_seq OWNED BY public.blueprints.id;


--
-- Name: buildings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.buildings (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(255) NOT NULL,
    level integer DEFAULT 0 NOT NULL,
    capacite integer DEFAULT 0 NOT NULL,
    description character varying(1500),
    build_start timestamp without time zone,
    build_duration integer,
    building_type_id integer,
    version integer DEFAULT 0 NOT NULL,
    CONSTRAINT buildings_capacite_check CHECK ((capacite >= 0)),
    CONSTRAINT buildings_level_check CHECK ((level >= 0))
);


--
-- Name: buildings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.buildings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: buildings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.buildings_id_seq OWNED BY public.buildings.id;


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id integer NOT NULL,
    user_id integer NOT NULL,
    channel_type public.enum_chat_messages_channel_type DEFAULT 'global'::public.enum_chat_messages_channel_type NOT NULL,
    channel_id integer,
    message text NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_deleted boolean DEFAULT false NOT NULL,
    edited_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN chat_messages.channel_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chat_messages.channel_id IS 'Alliance ID for alliance channel, NULL for global';


--
-- Name: COLUMN chat_messages.metadata; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.chat_messages.metadata IS 'Attachments, mentions, formatting, etc.';


--
-- Name: chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.chat_messages_id_seq OWNED BY public.chat_messages.id;


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    is_capital boolean DEFAULT false NOT NULL,
    coord_x integer,
    coord_y integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    vision_range integer DEFAULT 3 NOT NULL,
    founded_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    specialization public.enum_cities_specialization DEFAULT 'none'::public.enum_cities_specialization NOT NULL,
    specialized_at timestamp with time zone
);


--
-- Name: COLUMN cities.vision_range; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cities.vision_range IS 'Portée de vision de la ville en tiles';


--
-- Name: COLUMN cities.founded_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cities.founded_at IS 'Date de fondation de la ville';


--
-- Name: COLUMN cities.specialization; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cities.specialization IS 'City specialization type providing specific bonuses';


--
-- Name: COLUMN cities.specialized_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.cities.specialized_at IS 'Timestamp when the city was specialized';


--
-- Name: cities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cities_id_seq OWNED BY public.cities.id;


--
-- Name: city_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_slots (
    id integer NOT NULL,
    grid_id integer NOT NULL,
    status character varying(20) DEFAULT 'free'::character varying NOT NULL,
    city_id integer,
    quality integer DEFAULT 1 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN city_slots.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.city_slots.status IS 'Status: free, occupied, ruins, reserved';


--
-- Name: COLUMN city_slots.quality; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.city_slots.quality IS 'Qualité de l''emplacement (1-5): affecte bonus ressources';


--
-- Name: city_slots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.city_slots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: city_slots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.city_slots_id_seq OWNED BY public.city_slots.id;


--
-- Name: colonization_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.colonization_missions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    departure_city_id integer NOT NULL,
    target_slot_id integer NOT NULL,
    colonist_count integer DEFAULT 1 NOT NULL,
    status character varying(20) DEFAULT 'traveling'::character varying NOT NULL,
    departure_at timestamp with time zone NOT NULL,
    arrival_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN colonization_missions.colonist_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colonization_missions.colonist_count IS 'Nombre de colons envoyés';


--
-- Name: COLUMN colonization_missions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.colonization_missions.status IS 'Status: traveling, arrived, completed, failed, cancelled';


--
-- Name: colonization_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.colonization_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: colonization_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.colonization_missions_id_seq OWNED BY public.colonization_missions.id;


--
-- Name: combat_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.combat_logs (
    id integer NOT NULL,
    attacker_id integer,
    defender_id integer,
    summary text NOT NULL,
    details text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: combat_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.combat_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: combat_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.combat_logs_id_seq OWNED BY public.combat_logs.id;


--
-- Name: control_zones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.control_zones (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    center_x integer NOT NULL,
    center_y integer NOT NULL,
    radius integer DEFAULT 30 NOT NULL,
    current_controller character varying(50),
    control_threshold integer DEFAULT 1000 NOT NULL,
    captured_at timestamp with time zone,
    bonuses jsonb DEFAULT '{}'::jsonb NOT NULL,
    strategic_value integer DEFAULT 3 NOT NULL,
    status character varying(20) DEFAULT 'neutral'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN control_zones.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.name IS 'Zone name (Central Highlands, Titanium Crater, etc.)';


--
-- Name: COLUMN control_zones.center_x; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.center_x IS 'X coordinate of zone center';


--
-- Name: COLUMN control_zones.center_y; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.center_y IS 'Y coordinate of zone center';


--
-- Name: COLUMN control_zones.radius; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.radius IS 'Zone radius in tiles';


--
-- Name: COLUMN control_zones.current_controller; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.current_controller IS 'Faction ID controlling this zone (NULL = neutral)';


--
-- Name: COLUMN control_zones.control_threshold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.control_threshold IS 'Control points needed to capture zone';


--
-- Name: COLUMN control_zones.captured_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.captured_at IS 'Timestamp when zone was captured';


--
-- Name: COLUMN control_zones.bonuses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.bonuses IS 'Bonuses granted by controlling this zone { metal: 1.15, defense: 1.10 }';


--
-- Name: COLUMN control_zones.strategic_value; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.strategic_value IS 'Importance rating 1-5';


--
-- Name: COLUMN control_zones.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.control_zones.status IS 'neutral, contested, or controlled';


--
-- Name: control_zones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.control_zones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: control_zones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.control_zones_id_seq OWNED BY public.control_zones.id;


--
-- Name: crafting_queue; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.crafting_queue (
    id integer NOT NULL,
    user_id integer NOT NULL,
    blueprint_id integer NOT NULL,
    quantity_target integer DEFAULT 1,
    resources_consumed jsonb NOT NULL,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp with time zone NOT NULL,
    collected_at timestamp with time zone,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    output_items jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN crafting_queue.quantity_target; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.quantity_target IS 'For mass craft future feature';


--
-- Name: COLUMN crafting_queue.resources_consumed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.resources_consumed IS 'Snapshot of inputs at craft start';


--
-- Name: COLUMN crafting_queue.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.completed_at IS 'When craft will be ready';


--
-- Name: COLUMN crafting_queue.collected_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.collected_at IS 'When user collected the output';


--
-- Name: COLUMN crafting_queue.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.status IS 'in_progress, completed, cancelled, collected';


--
-- Name: COLUMN crafting_queue.output_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.crafting_queue.output_items IS 'What was crafted with exact quantities';


--
-- Name: crafting_queue_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.crafting_queue_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: crafting_queue_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.crafting_queue_id_seq OWNED BY public.crafting_queue.id;


--
-- Name: daily_quest_rotation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_quest_rotation (
    rotation_id integer NOT NULL,
    date date NOT NULL,
    quest_ids integer[] NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN daily_quest_rotation.quest_ids; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.daily_quest_rotation.quest_ids IS 'Array of 3 quest IDs';


--
-- Name: daily_quest_rotation_rotation_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.daily_quest_rotation_rotation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: daily_quest_rotation_rotation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.daily_quest_rotation_rotation_id_seq OWNED BY public.daily_quest_rotation.rotation_id;


--
-- Name: defense; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.defense (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1500),
    quantity integer DEFAULT 1 NOT NULL,
    cost integer NOT NULL,
    date_creation timestamp without time zone DEFAULT now() NOT NULL,
    date_modification timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT defense_cost_check CHECK ((cost >= 0)),
    CONSTRAINT defense_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: defense_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.defense_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: defense_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.defense_id_seq OWNED BY public.defense.id;


--
-- Name: defense_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.defense_reports (
    id integer NOT NULL,
    attack_id integer NOT NULL,
    combat_rounds integer DEFAULT 1 NOT NULL,
    combat_log jsonb,
    initial_attacker_strength double precision NOT NULL,
    initial_defender_strength double precision NOT NULL,
    final_attacker_strength double precision NOT NULL,
    final_defender_strength double precision NOT NULL,
    defender_walls_bonus double precision DEFAULT '0'::double precision NOT NULL,
    attacker_tech_bonus double precision DEFAULT '0'::double precision NOT NULL,
    defender_tech_bonus double precision DEFAULT '0'::double precision NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN defense_reports.combat_rounds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.combat_rounds IS 'Nombre de rounds de combat';


--
-- Name: COLUMN defense_reports.combat_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.combat_log IS 'Log détaillé des rounds de combat';


--
-- Name: COLUMN defense_reports.initial_attacker_strength; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.initial_attacker_strength IS 'Force initiale attaquant';


--
-- Name: COLUMN defense_reports.initial_defender_strength; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.initial_defender_strength IS 'Force initiale défenseur';


--
-- Name: COLUMN defense_reports.final_attacker_strength; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.final_attacker_strength IS 'Force finale attaquant';


--
-- Name: COLUMN defense_reports.final_defender_strength; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.final_defender_strength IS 'Force finale défenseur';


--
-- Name: COLUMN defense_reports.defender_walls_bonus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.defender_walls_bonus IS 'Bonus défensif des murailles';


--
-- Name: COLUMN defense_reports.attacker_tech_bonus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.attacker_tech_bonus IS 'Bonus technologiques attaquant';


--
-- Name: COLUMN defense_reports.defender_tech_bonus; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.defense_reports.defender_tech_bonus IS 'Bonus technologiques défenseur';


--
-- Name: defense_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.defense_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: defense_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.defense_reports_id_seq OWNED BY public.defense_reports.id;


--
-- Name: entities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entities (
    entity_id integer NOT NULL,
    entity_type character varying(255) NOT NULL,
    entity_name character varying(255) NOT NULL
);


--
-- Name: entities_entity_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.entities_entity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: entities_entity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.entities_entity_id_seq OWNED BY public.entities.entity_id;


--
-- Name: explored_tiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.explored_tiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    grid_id integer NOT NULL,
    explored_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: explored_tiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.explored_tiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: explored_tiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.explored_tiles_id_seq OWNED BY public.explored_tiles.id;


--
-- Name: facilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.facilities (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1500),
    level integer DEFAULT 0 NOT NULL,
    nextlevelcost integer NOT NULL,
    date_creation timestamp without time zone DEFAULT now() NOT NULL,
    date_modification timestamp without time zone DEFAULT now() NOT NULL,
    facility_type_id integer,
    CONSTRAINT facilities_level_check CHECK ((level >= 0)),
    CONSTRAINT facilities_nextlevelcost_check CHECK ((nextlevelcost >= 0))
);


--
-- Name: facilities_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.facilities_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: facilities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.facilities_id_seq OWNED BY public.facilities.id;


--
-- Name: faction_control_points; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.faction_control_points (
    id integer NOT NULL,
    zone_id integer NOT NULL,
    faction_id character varying(50) NOT NULL,
    control_points integer DEFAULT 0 NOT NULL,
    points_buildings integer DEFAULT 0 NOT NULL,
    points_military integer DEFAULT 0 NOT NULL,
    points_attacks integer DEFAULT 0 NOT NULL,
    points_trade integer DEFAULT 0 NOT NULL,
    last_contribution_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN faction_control_points.control_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faction_control_points.control_points IS 'Total control points accumulated';


--
-- Name: COLUMN faction_control_points.points_buildings; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faction_control_points.points_buildings IS 'Points from building constructions';


--
-- Name: COLUMN faction_control_points.points_military; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faction_control_points.points_military IS 'Points from military presence';


--
-- Name: COLUMN faction_control_points.points_attacks; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faction_control_points.points_attacks IS 'Points from successful attacks';


--
-- Name: COLUMN faction_control_points.points_trade; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.faction_control_points.points_trade IS 'Points from trade activity';


--
-- Name: faction_control_points_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.faction_control_points_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: faction_control_points_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.faction_control_points_id_seq OWNED BY public.faction_control_points.id;


--
-- Name: factions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.factions (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    color character varying(7),
    capital_x integer,
    capital_y integer,
    bonuses jsonb DEFAULT '{}'::jsonb NOT NULL,
    unique_unit_type character varying(50),
    unique_unit_stats jsonb,
    lore text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN factions.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.id IS 'Faction identifier (TERRAN_FEDERATION, NOMAD_RAIDERS, INDUSTRIAL_SYNDICATE)';


--
-- Name: COLUMN factions.name; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.name IS 'Display name';


--
-- Name: COLUMN factions.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.description IS 'Short description';


--
-- Name: COLUMN factions.color; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.color IS 'Hex color (#0066FF)';


--
-- Name: COLUMN factions.capital_x; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.capital_x IS 'X coordinate of faction capital';


--
-- Name: COLUMN factions.capital_y; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.capital_y IS 'Y coordinate of faction capital';


--
-- Name: COLUMN factions.bonuses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.bonuses IS 'Faction passive bonuses { defense: 1.15, production: 1.25, ... }';


--
-- Name: COLUMN factions.unique_unit_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.unique_unit_type IS 'Unique unit type (Shield_Guardian, Desert_Raider, Corporate_Enforcer)';


--
-- Name: COLUMN factions.unique_unit_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.unique_unit_stats IS 'Stats for unique unit';


--
-- Name: COLUMN factions.lore; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.factions.lore IS 'Faction backstory/philosophy';


--
-- Name: fleet_units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fleet_units (
    id integer NOT NULL,
    fleet_id integer NOT NULL,
    unit_name character varying(255) NOT NULL,
    quantity integer NOT NULL,
    CONSTRAINT fleet_units_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: fleet_units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fleet_units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fleet_units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fleet_units_id_seq OWNED BY public.fleet_units.id;


--
-- Name: fleets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.fleets (
    id integer NOT NULL,
    user_id integer NOT NULL,
    origin_city_id integer,
    name character varying(255) NOT NULL,
    status character varying(50) DEFAULT 'idle'::character varying NOT NULL,
    position_x integer,
    position_y integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: fleets_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.fleets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: fleets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.fleets_id_seq OWNED BY public.fleets.id;


--
-- Name: leaderboard_entries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_entries (
    id integer NOT NULL,
    user_id integer NOT NULL,
    category public.enum_leaderboard_entries_category NOT NULL,
    score bigint DEFAULT 0 NOT NULL,
    rank integer,
    previous_rank integer,
    last_updated timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: leaderboard_entries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leaderboard_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leaderboard_entries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leaderboard_entries_id_seq OWNED BY public.leaderboard_entries.id;


--
-- Name: leaderboard_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.leaderboard_rewards (
    id integer NOT NULL,
    category public.enum_leaderboard_rewards_category NOT NULL,
    season_id integer,
    rank_min integer NOT NULL,
    rank_max integer NOT NULL,
    reward_type public.enum_leaderboard_rewards_reward_type NOT NULL,
    reward_data jsonb NOT NULL,
    display_name character varying(255) NOT NULL,
    display_icon character varying(255),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN leaderboard_rewards.season_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.leaderboard_rewards.season_id IS 'ID de la saison (future implementation)';


--
-- Name: COLUMN leaderboard_rewards.rank_min; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.leaderboard_rewards.rank_min IS 'Rang minimum pour cette récompense';


--
-- Name: COLUMN leaderboard_rewards.rank_max; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.leaderboard_rewards.rank_max IS 'Rang maximum pour cette récompense';


--
-- Name: COLUMN leaderboard_rewards.reward_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.leaderboard_rewards.reward_data IS 'Données spécifiques à la récompense';


--
-- Name: leaderboard_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.leaderboard_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: leaderboard_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.leaderboard_rewards_id_seq OWNED BY public.leaderboard_rewards.id;


--
-- Name: market_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_orders (
    id integer NOT NULL,
    user_id integer NOT NULL,
    city_id integer NOT NULL,
    order_type public.enum_market_orders_order_type NOT NULL,
    resource_type public.enum_market_orders_resource_type NOT NULL,
    quantity integer NOT NULL,
    remaining_quantity integer NOT NULL,
    price_per_unit numeric(10,2) NOT NULL,
    status public.enum_market_orders_status DEFAULT 'active'::public.enum_market_orders_status NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN market_orders.order_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.order_type IS 'Type of order: buy or sell';


--
-- Name: COLUMN market_orders.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.resource_type IS 'Resource being traded';


--
-- Name: COLUMN market_orders.quantity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.quantity IS 'Total quantity in the order';


--
-- Name: COLUMN market_orders.remaining_quantity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.remaining_quantity IS 'Quantity still available';


--
-- Name: COLUMN market_orders.price_per_unit; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.price_per_unit IS 'Price per unit in gold';


--
-- Name: COLUMN market_orders.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_orders.expires_at IS 'Optional expiration date';


--
-- Name: market_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_orders_id_seq OWNED BY public.market_orders.id;


--
-- Name: market_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.market_transactions (
    id integer NOT NULL,
    order_id integer NOT NULL,
    buyer_id integer NOT NULL,
    seller_id integer NOT NULL,
    buyer_city_id integer NOT NULL,
    seller_city_id integer NOT NULL,
    resource_type public.enum_market_transactions_resource_type NOT NULL,
    quantity integer NOT NULL,
    price_per_unit numeric(10,2) NOT NULL,
    total_price numeric(12,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN market_transactions.tax_amount; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.market_transactions.tax_amount IS 'Transaction tax (e.g., 5%)';


--
-- Name: market_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.market_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: market_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.market_transactions_id_seq OWNED BY public.market_transactions.id;


--
-- Name: player_blueprints; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_blueprints (
    id integer NOT NULL,
    user_id integer NOT NULL,
    blueprint_id integer NOT NULL,
    discovered_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    discovery_source character varying(50),
    times_crafted integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN player_blueprints.discovery_source; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.player_blueprints.discovery_source IS 'portal_blue, research, quest_reward, market_purchase, event';


--
-- Name: player_blueprints_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.player_blueprints_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: player_blueprints_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.player_blueprints_id_seq OWNED BY public.player_blueprints.id;


--
-- Name: player_crafting_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.player_crafting_stats (
    user_id integer NOT NULL,
    crafting_xp integer DEFAULT 0,
    crafting_level integer DEFAULT 1,
    total_crafts_completed integer DEFAULT 0,
    total_crafts_cancelled integer DEFAULT 0,
    resources_t1_consumed jsonb DEFAULT '{}'::jsonb,
    resources_t2_consumed jsonb DEFAULT '{}'::jsonb,
    first_craft_at timestamp with time zone,
    first_rare_craft_at timestamp with time zone,
    first_epic_craft_at timestamp with time zone,
    first_legendary_craft_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN player_crafting_stats.resources_t1_consumed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.player_crafting_stats.resources_t1_consumed IS 'Lifetime T1 resources consumed';


--
-- Name: COLUMN player_crafting_stats.resources_t2_consumed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.player_crafting_stats.resources_t2_consumed IS 'Lifetime T2 resources consumed';


--
-- Name: portal_alliance_raids; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_alliance_raids (
    raid_id integer NOT NULL,
    boss_id integer NOT NULL,
    alliance_id integer NOT NULL,
    min_participants integer DEFAULT 3,
    max_participants integer DEFAULT 10,
    status public.enum_portal_alliance_raids_status DEFAULT 'forming'::public.enum_portal_alliance_raids_status,
    total_damage integer DEFAULT 0,
    rewards_pool jsonb,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN portal_alliance_raids.min_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.min_participants IS 'Minimum members required to start raid';


--
-- Name: COLUMN portal_alliance_raids.max_participants; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.max_participants IS 'Maximum members allowed in raid';


--
-- Name: COLUMN portal_alliance_raids.total_damage; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.total_damage IS 'Total damage dealt by all participants';


--
-- Name: COLUMN portal_alliance_raids.rewards_pool; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.rewards_pool IS 'Rewards to distribute based on contribution';


--
-- Name: COLUMN portal_alliance_raids.started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.started_at IS 'When raid began';


--
-- Name: COLUMN portal_alliance_raids.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_alliance_raids.completed_at IS 'When raid finished';


--
-- Name: portal_alliance_raids_raid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_alliance_raids_raid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_alliance_raids_raid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_alliance_raids_raid_id_seq OWNED BY public.portal_alliance_raids.raid_id;


--
-- Name: portal_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_attempts (
    id integer NOT NULL,
    portal_id integer NOT NULL,
    user_id integer NOT NULL,
    units_sent jsonb NOT NULL,
    result public.enum_portal_attempts_result NOT NULL,
    units_lost jsonb,
    units_survived jsonb,
    rewards jsonb,
    battle_duration integer,
    tactic_used public.enum_portal_attempts_tactic_used DEFAULT 'balanced'::public.enum_portal_attempts_tactic_used,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN portal_attempts.units_sent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_attempts.units_sent IS 'Units composition sent: { Infantry: 50, Tank: 10 }';


--
-- Name: COLUMN portal_attempts.units_lost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_attempts.units_lost IS 'Units lost in battle';


--
-- Name: COLUMN portal_attempts.units_survived; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_attempts.units_survived IS 'Units that survived';


--
-- Name: COLUMN portal_attempts.rewards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_attempts.rewards IS 'Resources and items obtained';


--
-- Name: COLUMN portal_attempts.battle_duration; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_attempts.battle_duration IS 'Battle duration in seconds';


--
-- Name: portal_attempts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_attempts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_attempts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_attempts_id_seq OWNED BY public.portal_attempts.id;


--
-- Name: portal_boss_attempts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_boss_attempts (
    attempt_id integer NOT NULL,
    boss_id integer NOT NULL,
    user_id integer NOT NULL,
    units_sent jsonb NOT NULL,
    damage_dealt integer DEFAULT 0,
    phases_reached integer DEFAULT 1,
    abilities_triggered jsonb DEFAULT '[]'::jsonb,
    result public.enum_portal_boss_attempts_result NOT NULL,
    units_lost jsonb,
    units_survived jsonb,
    rewards jsonb,
    battle_log jsonb,
    tactic_used public.enum_portal_boss_attempts_tactic_used DEFAULT 'balanced'::public.enum_portal_boss_attempts_tactic_used,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN portal_boss_attempts.units_sent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.units_sent IS 'Unit composition sent to battle';


--
-- Name: COLUMN portal_boss_attempts.damage_dealt; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.damage_dealt IS 'Total damage dealt to boss';


--
-- Name: COLUMN portal_boss_attempts.phases_reached; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.phases_reached IS 'Highest phase reached in this attempt';


--
-- Name: COLUMN portal_boss_attempts.abilities_triggered; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.abilities_triggered IS 'Boss abilities that triggered during battle';


--
-- Name: COLUMN portal_boss_attempts.units_lost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.units_lost IS 'Units lost in battle';


--
-- Name: COLUMN portal_boss_attempts.units_survived; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.units_survived IS 'Units that survived';


--
-- Name: COLUMN portal_boss_attempts.rewards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.rewards IS 'Rewards earned (if victory)';


--
-- Name: COLUMN portal_boss_attempts.battle_log; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_boss_attempts.battle_log IS 'Detailed battle log with rounds and events';


--
-- Name: portal_boss_attempts_attempt_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_boss_attempts_attempt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_boss_attempts_attempt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_boss_attempts_attempt_id_seq OWNED BY public.portal_boss_attempts.attempt_id;


--
-- Name: portal_bosses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_bosses (
    boss_id integer NOT NULL,
    portal_id integer NOT NULL,
    boss_type public.enum_portal_bosses_boss_type NOT NULL,
    base_hp integer NOT NULL,
    current_hp integer NOT NULL,
    current_phase integer DEFAULT 1,
    defense integer DEFAULT 100,
    abilities jsonb DEFAULT '[]'::jsonb,
    abilities_used jsonb DEFAULT '[]'::jsonb,
    rewards jsonb,
    defeated boolean DEFAULT false,
    defeated_by integer,
    defeated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN portal_bosses.boss_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.boss_type IS 'Type of boss with unique mechanics';


--
-- Name: COLUMN portal_bosses.base_hp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.base_hp IS 'Maximum HP of the boss';


--
-- Name: COLUMN portal_bosses.current_hp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.current_hp IS 'Current HP (for persistent boss battles)';


--
-- Name: COLUMN portal_bosses.current_phase; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.current_phase IS 'Current phase 1-4 based on HP thresholds';


--
-- Name: COLUMN portal_bosses.defense; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.defense IS 'Boss defense rating';


--
-- Name: COLUMN portal_bosses.abilities; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.abilities IS 'Array of boss abilities: shield_regen, aoe_blast, unit_disable';


--
-- Name: COLUMN portal_bosses.abilities_used; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.abilities_used IS 'Log of abilities triggered with timestamps';


--
-- Name: COLUMN portal_bosses.rewards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.rewards IS 'Special boss rewards on defeat';


--
-- Name: COLUMN portal_bosses.defeated_by; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.defeated_by IS 'User who landed killing blow';


--
-- Name: COLUMN portal_bosses.defeated_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_bosses.defeated_at IS 'Timestamp when boss was defeated';


--
-- Name: portal_bosses_boss_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_bosses_boss_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_bosses_boss_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_bosses_boss_id_seq OWNED BY public.portal_bosses.boss_id;


--
-- Name: portal_expeditions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_expeditions (
    id integer NOT NULL,
    portal_id integer NOT NULL,
    user_id integer NOT NULL,
    city_id integer NOT NULL,
    units text NOT NULL,
    status public.enum_portal_expeditions_status DEFAULT 'traveling'::public.enum_portal_expeditions_status NOT NULL,
    departure_time timestamp with time zone NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    resolved_at timestamp with time zone,
    distance integer DEFAULT 0 NOT NULL,
    loot_gained text,
    survivors text,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: portal_expeditions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_expeditions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_expeditions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_expeditions_id_seq OWNED BY public.portal_expeditions.id;


--
-- Name: portal_leaderboard; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_leaderboard (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tier public.enum_portal_leaderboard_tier NOT NULL,
    total_clears integer DEFAULT 0,
    fastest_time integer,
    highest_difficulty integer,
    season character varying(50) DEFAULT 'season_1'::character varying,
    points integer DEFAULT 0,
    rank integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN portal_leaderboard.fastest_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_leaderboard.fastest_time IS 'Fastest clear time in seconds';


--
-- Name: COLUMN portal_leaderboard.highest_difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_leaderboard.highest_difficulty IS 'Highest difficulty cleared';


--
-- Name: COLUMN portal_leaderboard.points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_leaderboard.points IS 'Leaderboard points';


--
-- Name: COLUMN portal_leaderboard.rank; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_leaderboard.rank IS 'Current rank in tier';


--
-- Name: portal_leaderboard_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_leaderboard_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_leaderboard_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_leaderboard_id_seq OWNED BY public.portal_leaderboard.id;


--
-- Name: portal_mastery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_mastery (
    id integer NOT NULL,
    user_id integer NOT NULL,
    tier public.enum_portal_mastery_tier NOT NULL,
    clears integer DEFAULT 0,
    fastest_time integer,
    total_rewards jsonb,
    mastery_level integer DEFAULT 0,
    last_clear timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN portal_mastery.clears; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_mastery.clears IS 'Number of successful clears';


--
-- Name: COLUMN portal_mastery.fastest_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_mastery.fastest_time IS 'Fastest clear time in seconds';


--
-- Name: COLUMN portal_mastery.total_rewards; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_mastery.total_rewards IS 'Total rewards earned from this tier';


--
-- Name: COLUMN portal_mastery.mastery_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_mastery.mastery_level IS 'Mastery level 0-4';


--
-- Name: COLUMN portal_mastery.last_clear; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_mastery.last_clear IS 'Timestamp of last successful clear';


--
-- Name: portal_mastery_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_mastery_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_mastery_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_mastery_id_seq OWNED BY public.portal_mastery.id;


--
-- Name: portal_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_quests (
    quest_id integer NOT NULL,
    quest_type character varying(20) NOT NULL,
    quest_category character varying(50),
    title character varying(200) NOT NULL,
    description text NOT NULL,
    chapter integer,
    order_in_chapter integer,
    prerequisite_quest_id integer,
    objectives jsonb DEFAULT '[]'::jsonb NOT NULL,
    rewards jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    required_level integer DEFAULT 1,
    required_mastery_tier character varying(20),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN portal_quests.quest_category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_quests.quest_category IS 'tutorial, progression, combat, social';


--
-- Name: portal_quests_quest_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_quests_quest_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_quests_quest_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_quests_quest_id_seq OWNED BY public.portal_quests.quest_id;


--
-- Name: portal_raid_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_raid_participants (
    participant_id integer NOT NULL,
    raid_id integer NOT NULL,
    user_id integer NOT NULL,
    damage_contributed integer DEFAULT 0,
    contribution_percent double precision DEFAULT '0'::double precision,
    units_sent jsonb,
    units_lost jsonb,
    rewards_earned jsonb,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN portal_raid_participants.contribution_percent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_raid_participants.contribution_percent IS 'Percentage of total raid damage';


--
-- Name: COLUMN portal_raid_participants.units_sent; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_raid_participants.units_sent IS 'Units contributed to raid';


--
-- Name: COLUMN portal_raid_participants.units_lost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_raid_participants.units_lost IS 'Units lost during raid';


--
-- Name: COLUMN portal_raid_participants.rewards_earned; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_raid_participants.rewards_earned IS 'Individual rewards based on contribution';


--
-- Name: portal_raid_participants_participant_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_raid_participants_participant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_raid_participants_participant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_raid_participants_participant_id_seq OWNED BY public.portal_raid_participants.participant_id;


--
-- Name: portal_rewards_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portal_rewards_config (
    id integer NOT NULL,
    tier public.enum_portal_rewards_config_tier NOT NULL,
    difficulty integer NOT NULL,
    base_resources jsonb,
    special_items_pool jsonb,
    experience_reward integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: COLUMN portal_rewards_config.base_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_rewards_config.base_resources IS 'Base resource rewards';


--
-- Name: COLUMN portal_rewards_config.special_items_pool; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portal_rewards_config.special_items_pool IS 'Pool of special items with drop rates';


--
-- Name: portal_rewards_config_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portal_rewards_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portal_rewards_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portal_rewards_config_id_seq OWNED BY public.portal_rewards_config.id;


--
-- Name: portals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portals (
    id integer NOT NULL,
    tier public.enum_portals_tier NOT NULL,
    x_coordinate integer CONSTRAINT portals_coord_x_not_null NOT NULL,
    y_coordinate integer CONSTRAINT portals_coord_y_not_null NOT NULL,
    status public.enum_portals_status DEFAULT 'active'::public.enum_portals_status NOT NULL,
    spawn_time timestamp with time zone CONSTRAINT portals_spawned_at_not_null NOT NULL,
    expiry_time timestamp with time zone CONSTRAINT portals_expires_at_not_null NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    difficulty integer NOT NULL,
    recommended_power integer NOT NULL,
    global_event boolean DEFAULT false,
    enemy_composition jsonb
);


--
-- Name: COLUMN portals.difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portals.difficulty IS 'Difficulty scale 1-10';


--
-- Name: COLUMN portals.global_event; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portals.global_event IS 'True for Golden Portal world events';


--
-- Name: COLUMN portals.enemy_composition; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.portals.enemy_composition IS 'Enemy units defending the portal';


--
-- Name: portals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.portals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: portals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.portals_id_seq OWNED BY public.portals.id;


--
-- Name: quest_streaks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quest_streaks (
    user_id integer NOT NULL,
    current_streak integer DEFAULT 0 NOT NULL,
    longest_streak integer DEFAULT 0 NOT NULL,
    last_completed_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quests (
    id integer NOT NULL,
    key character varying(255) NOT NULL,
    type public.enum_quests_type DEFAULT 'daily'::public.enum_quests_type NOT NULL,
    category public.enum_quests_category NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    objective_type character varying(255) NOT NULL,
    objective_target integer DEFAULT 1 NOT NULL,
    objective_data json,
    reward_or integer DEFAULT 0 NOT NULL,
    reward_metal integer DEFAULT 0 NOT NULL,
    reward_carburant integer DEFAULT 0 NOT NULL,
    reward_xp integer DEFAULT 0 NOT NULL,
    reward_items json,
    difficulty public.enum_quests_difficulty DEFAULT 'easy'::public.enum_quests_difficulty NOT NULL,
    min_level integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    icon character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: COLUMN quests.key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.key IS 'Identifiant unique de la quête (ex: daily_train_units)';


--
-- Name: COLUMN quests.type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.type IS 'Type de quête (journalière, hebdomadaire, succès)';


--
-- Name: COLUMN quests.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.category IS 'Catégorie de la quête';


--
-- Name: COLUMN quests.title; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.title IS 'Titre de la quête';


--
-- Name: COLUMN quests.description; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.description IS 'Description de la quête';


--
-- Name: COLUMN quests.objective_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.objective_type IS 'Type d''objectif (train_units, collect_resources, upgrade_building, etc.)';


--
-- Name: COLUMN quests.objective_target; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.objective_target IS 'Cible à atteindre (quantité)';


--
-- Name: COLUMN quests.objective_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.objective_data IS 'Données supplémentaires pour l''objectif (ex: {unit_type: "Infantry"})';


--
-- Name: COLUMN quests.reward_items; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.reward_items IS 'Récompenses additionnelles (unités, items spéciaux, etc.)';


--
-- Name: COLUMN quests.difficulty; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.difficulty IS 'Difficulté de la quête';


--
-- Name: COLUMN quests.min_level; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.min_level IS 'Niveau minimum requis pour débloquer la quête';


--
-- Name: COLUMN quests.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.is_active IS 'Quête active dans le système';


--
-- Name: COLUMN quests.icon; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.quests.icon IS 'Icône de la quête (emoji ou path)';


--
-- Name: quests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quests_id_seq OWNED BY public.quests.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    token character varying(255) NOT NULL,
    user_id integer NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    revoked boolean DEFAULT false NOT NULL,
    replaced_by_token character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: researches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.researches (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1500),
    level integer DEFAULT 0 NOT NULL,
    nextlevelcost integer NOT NULL,
    date_creation timestamp without time zone DEFAULT now() NOT NULL,
    date_modification timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT researches_level_check CHECK ((level >= 0)),
    CONSTRAINT researches_nextlevelcost_check CHECK ((nextlevelcost >= 0))
);


--
-- Name: researches_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.researches_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: researches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.researches_id_seq OWNED BY public.researches.id;


--
-- Name: resource_conversion_recipes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_conversion_recipes (
    id integer NOT NULL,
    resource_type public.enum_resource_conversion_recipes_resource_type NOT NULL,
    input_resources jsonb NOT NULL,
    output_quantity integer NOT NULL,
    duration_seconds integer NOT NULL,
    building_required character varying(50),
    building_level_min integer,
    research_required character varying(100),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN resource_conversion_recipes.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.resource_type IS 'Output T2 resource type';


--
-- Name: COLUMN resource_conversion_recipes.input_resources; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.input_resources IS 'Required T1 resources, e.g., { metal: 10000, carburant: 2000 }';


--
-- Name: COLUMN resource_conversion_recipes.output_quantity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.output_quantity IS 'Amount of T2 resource produced';


--
-- Name: COLUMN resource_conversion_recipes.duration_seconds; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.duration_seconds IS 'Time required for conversion';


--
-- Name: COLUMN resource_conversion_recipes.building_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.building_required IS 'Building type required, e.g., mine_metal';


--
-- Name: COLUMN resource_conversion_recipes.building_level_min; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.building_level_min IS 'Minimum building level required';


--
-- Name: COLUMN resource_conversion_recipes.research_required; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.research_required IS 'Research technology required';


--
-- Name: COLUMN resource_conversion_recipes.is_active; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversion_recipes.is_active IS 'Whether this recipe is currently available';


--
-- Name: resource_conversion_recipes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resource_conversion_recipes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resource_conversion_recipes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resource_conversion_recipes_id_seq OWNED BY public.resource_conversion_recipes.id;


--
-- Name: resource_conversions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_conversions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    resource_type public.enum_resource_conversions_resource_type NOT NULL,
    quantity_target integer NOT NULL,
    input_cost jsonb DEFAULT '{}'::jsonb NOT NULL,
    building_id integer,
    started_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp with time zone,
    status public.enum_resource_conversions_status DEFAULT 'in_progress'::public.enum_resource_conversions_status NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN resource_conversions.resource_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.resource_type IS 'Type of T2 resource being produced';


--
-- Name: COLUMN resource_conversions.quantity_target; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.quantity_target IS 'Amount of T2 resource to produce';


--
-- Name: COLUMN resource_conversions.input_cost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.input_cost IS 'T1 resources consumed for this conversion';


--
-- Name: COLUMN resource_conversions.building_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.building_id IS 'Building performing the conversion (optional)';


--
-- Name: COLUMN resource_conversions.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.completed_at IS 'When conversion will be complete';


--
-- Name: COLUMN resource_conversions.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.resource_conversions.status IS 'Current status of the conversion';


--
-- Name: resource_conversions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resource_conversions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resource_conversions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resource_conversions_id_seq OWNED BY public.resource_conversions.id;


--
-- Name: resource_costs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_costs (
    id integer NOT NULL,
    entity_id integer NOT NULL,
    resource_type character varying(50) NOT NULL,
    amount numeric NOT NULL,
    level integer NOT NULL,
    CONSTRAINT resource_costs_amount_check CHECK ((amount >= (0)::numeric)),
    CONSTRAINT resource_costs_level_check CHECK ((level >= 1))
);


--
-- Name: resource_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resource_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resource_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resource_costs_id_seq OWNED BY public.resource_costs.id;


--
-- Name: resource_production; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resource_production (
    production_id integer NOT NULL,
    building_id integer NOT NULL,
    resource_type_id integer NOT NULL,
    amount integer NOT NULL,
    production_rate integer NOT NULL,
    last_updated timestamp without time zone DEFAULT now() NOT NULL,
    level integer NOT NULL,
    building_name character varying(255) NOT NULL,
    CONSTRAINT resource_production_amount_check CHECK ((amount >= 0)),
    CONSTRAINT resource_production_level_check CHECK ((level >= 1)),
    CONSTRAINT resource_production_production_rate_check CHECK ((production_rate >= 0))
);


--
-- Name: resource_production_production_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resource_production_production_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resource_production_production_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resource_production_production_id_seq OWNED BY public.resource_production.production_id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.resources (
    id integer NOT NULL,
    city_id integer NOT NULL,
    type character varying(50) NOT NULL,
    amount integer NOT NULL,
    last_update timestamp without time zone DEFAULT now() NOT NULL,
    version integer DEFAULT 0 NOT NULL,
    CONSTRAINT resources_amount_check CHECK ((amount >= 0))
);


--
-- Name: resources_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.resources_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: resources_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.resources_id_seq OWNED BY public.resources.id;


--
-- Name: spy_missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.spy_missions (
    id integer NOT NULL,
    spy_user_id integer NOT NULL,
    spy_city_id integer NOT NULL,
    target_user_id integer NOT NULL,
    target_city_id integer NOT NULL,
    spy_count integer NOT NULL,
    mission_type public.enum_spy_missions_mission_type DEFAULT 'reconnaissance'::public.enum_spy_missions_mission_type NOT NULL,
    status public.enum_spy_missions_status DEFAULT 'traveling'::public.enum_spy_missions_status NOT NULL,
    departure_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    distance double precision NOT NULL,
    success_rate double precision,
    intel_data jsonb,
    spies_lost integer DEFAULT 0 NOT NULL,
    detected boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN spy_missions.spy_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.spy_count IS 'Nombre d''espions envoyés';


--
-- Name: COLUMN spy_missions.mission_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.mission_type IS 'reconnaissance=infos basiques, military_intel=détails militaires, sabotage=destruction';


--
-- Name: COLUMN spy_missions.success_rate; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.success_rate IS 'Taux de succès 0-1';


--
-- Name: COLUMN spy_missions.intel_data; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.intel_data IS 'Données récoltées (ressources, unités, défenses, etc.)';


--
-- Name: COLUMN spy_missions.spies_lost; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.spies_lost IS 'Espions capturés/tués';


--
-- Name: COLUMN spy_missions.detected; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.spy_missions.detected IS 'Mission détectée par la cible';


--
-- Name: spy_missions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.spy_missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: spy_missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.spy_missions_id_seq OWNED BY public.spy_missions.id;


--
-- Name: trade_convoys; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_convoys (
    id integer NOT NULL,
    trade_route_id integer NOT NULL,
    origin_city_id integer NOT NULL,
    destination_city_id integer NOT NULL,
    status public.enum_trade_convoys_status DEFAULT 'traveling'::public.enum_trade_convoys_status NOT NULL,
    cargo_gold integer DEFAULT 0 NOT NULL,
    cargo_metal integer DEFAULT 0 NOT NULL,
    cargo_fuel integer DEFAULT 0 NOT NULL,
    escort_units jsonb,
    departure_time timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    arrival_time timestamp with time zone NOT NULL,
    distance double precision NOT NULL,
    intercepted_by_attack_id integer,
    cargo_lost_gold integer DEFAULT 0 NOT NULL,
    cargo_lost_metal integer DEFAULT 0 NOT NULL,
    cargo_lost_fuel integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN trade_convoys.escort_units; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_convoys.escort_units IS 'JSON { unit_entity_id: quantity } - unités d''escorte';


--
-- Name: COLUMN trade_convoys.intercepted_by_attack_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_convoys.intercepted_by_attack_id IS 'ID de l''attaque si le convoi est intercepté';


--
-- Name: COLUMN trade_convoys.cargo_lost_gold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_convoys.cargo_lost_gold IS 'Cargaison perdue en cas d''interception';


--
-- Name: trade_convoys_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trade_convoys_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trade_convoys_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trade_convoys_id_seq OWNED BY public.trade_convoys.id;


--
-- Name: trade_routes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trade_routes (
    id integer NOT NULL,
    owner_user_id integer NOT NULL,
    origin_city_id integer NOT NULL,
    destination_city_id integer NOT NULL,
    route_type public.enum_trade_routes_route_type DEFAULT 'internal'::public.enum_trade_routes_route_type NOT NULL,
    status public.enum_trade_routes_status DEFAULT 'active'::public.enum_trade_routes_status NOT NULL,
    distance double precision NOT NULL,
    auto_transfer_gold integer DEFAULT 0 NOT NULL,
    auto_transfer_metal integer DEFAULT 0 NOT NULL,
    auto_transfer_fuel integer DEFAULT 0 NOT NULL,
    transfer_frequency integer DEFAULT 3600 NOT NULL,
    trade_offer_gold integer DEFAULT 0 NOT NULL,
    trade_offer_metal integer DEFAULT 0 NOT NULL,
    trade_offer_fuel integer DEFAULT 0 NOT NULL,
    trade_request_gold integer DEFAULT 0 NOT NULL,
    trade_request_metal integer DEFAULT 0 NOT NULL,
    trade_request_fuel integer DEFAULT 0 NOT NULL,
    total_convoys integer DEFAULT 0 NOT NULL,
    total_gold_traded bigint DEFAULT 0 NOT NULL,
    total_metal_traded bigint DEFAULT 0 NOT NULL,
    total_fuel_traded bigint DEFAULT 0 NOT NULL,
    last_convoy_time timestamp with time zone,
    established_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN trade_routes.route_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.route_type IS 'internal=entre villes du même joueur, external=commerce avec autres joueurs';


--
-- Name: COLUMN trade_routes.distance; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.distance IS 'Distance en tiles';


--
-- Name: COLUMN trade_routes.auto_transfer_gold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.auto_transfer_gold IS 'Quantité d''or transférée automatiquement par convoi';


--
-- Name: COLUMN trade_routes.transfer_frequency; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.transfer_frequency IS 'Fréquence transferts auto en secondes (default 1h)';


--
-- Name: COLUMN trade_routes.trade_offer_gold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.trade_offer_gold IS 'Offre de vente pour routes externes';


--
-- Name: COLUMN trade_routes.trade_request_gold; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.trade_request_gold IS 'Demande d''achat pour routes externes';


--
-- Name: COLUMN trade_routes.total_convoys; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.total_convoys IS 'Nombre total de convois envoyés';


--
-- Name: COLUMN trade_routes.last_convoy_time; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.trade_routes.last_convoy_time IS 'Date du dernier convoi';


--
-- Name: trade_routes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trade_routes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trade_routes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trade_routes_id_seq OWNED BY public.trade_routes.id;


--
-- Name: trainings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trainings (
    id integer NOT NULL,
    user_id integer NOT NULL,
    name character varying(255) NOT NULL,
    description character varying(1500),
    level integer DEFAULT 0 NOT NULL,
    nextlevelcost integer NOT NULL,
    date_creation timestamp without time zone DEFAULT now() NOT NULL,
    date_modification timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT trainings_level_check CHECK ((level >= 0)),
    CONSTRAINT trainings_nextlevelcost_check CHECK ((nextlevelcost >= 0))
);


--
-- Name: trainings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trainings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trainings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trainings_id_seq OWNED BY public.trainings.id;


--
-- Name: tutorial_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_progress (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_step integer DEFAULT 1 NOT NULL,
    completed boolean DEFAULT false NOT NULL,
    skipped boolean DEFAULT false NOT NULL,
    completed_steps json DEFAULT '[]'::json NOT NULL,
    started_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN tutorial_progress.current_step; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tutorial_progress.current_step IS 'Current tutorial step (1-10)';


--
-- Name: COLUMN tutorial_progress.completed_steps; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tutorial_progress.completed_steps IS 'Array of completed step IDs';


--
-- Name: tutorial_progress_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tutorial_progress_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tutorial_progress_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tutorial_progress_id_seq OWNED BY public.tutorial_progress.id;


--
-- Name: unit_stats; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unit_stats (
    unit_id integer NOT NULL,
    unit_key character varying(50) NOT NULL,
    description text,
    tier integer DEFAULT 1 NOT NULL,
    category character varying(50) NOT NULL,
    attack integer DEFAULT 1 NOT NULL,
    defense integer DEFAULT 1 NOT NULL,
    health integer DEFAULT 10 NOT NULL,
    initiative integer DEFAULT 10 NOT NULL,
    speed numeric(3,1) DEFAULT 1 NOT NULL,
    carry_capacity integer DEFAULT 0 NOT NULL,
    train_time_seconds integer DEFAULT 60 NOT NULL,
    counters json DEFAULT '[]'::json NOT NULL,
    weak_to json DEFAULT '[]'::json NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN unit_stats.unit_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.unit_key IS 'Unique identifier key (e.g., infantry, tanks)';


--
-- Name: COLUMN unit_stats.tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.tier IS '1=Basic, 2=Advanced, 3=Elite, 4=Experimental';


--
-- Name: COLUMN unit_stats.category; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.category IS 'infantry, mounted, armored, air, siege, support, special';


--
-- Name: COLUMN unit_stats.initiative; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.initiative IS 'Turn order in combat';


--
-- Name: COLUMN unit_stats.speed; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.speed IS 'Movement speed multiplier';


--
-- Name: COLUMN unit_stats.carry_capacity; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.carry_capacity IS 'Loot capacity per unit';


--
-- Name: COLUMN unit_stats.counters; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.counters IS 'Array of unit IDs this unit is strong against';


--
-- Name: COLUMN unit_stats.weak_to; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.unit_stats.weak_to IS 'Array of unit IDs this unit is weak against';


--
-- Name: unit_upkeep; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unit_upkeep (
    unit_id integer NOT NULL,
    gold_per_hour integer DEFAULT 0 NOT NULL,
    metal_per_hour integer DEFAULT 0 NOT NULL,
    fuel_per_hour integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: units; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.units (
    id integer NOT NULL,
    city_id integer NOT NULL,
    name character varying(255) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    force integer DEFAULT 0 NOT NULL,
    capacite_speciale character varying(255),
    CONSTRAINT units_force_check CHECK ((force >= 0)),
    CONSTRAINT units_quantity_check CHECK ((quantity >= 0))
);


--
-- Name: units_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.units_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: units_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.units_id_seq OWNED BY public.units.id;


--
-- Name: user_achievements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_achievements (
    id integer NOT NULL,
    user_id integer NOT NULL,
    achievement_id integer NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    unlocked_at timestamp with time zone,
    claimed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN user_achievements.progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_achievements.progress IS 'Current progress towards objective';


--
-- Name: COLUMN user_achievements.unlocked_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_achievements.unlocked_at IS 'When achievement was unlocked';


--
-- Name: COLUMN user_achievements.claimed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_achievements.claimed_at IS 'When rewards were claimed';


--
-- Name: user_achievements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_achievements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_achievements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_achievements_id_seq OWNED BY public.user_achievements.id;


--
-- Name: user_battle_pass; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_battle_pass (
    id integer NOT NULL,
    user_id integer NOT NULL,
    season_id integer NOT NULL,
    current_tier integer DEFAULT 1 NOT NULL,
    current_xp integer DEFAULT 0 NOT NULL,
    total_xp integer DEFAULT 0 NOT NULL,
    has_premium boolean DEFAULT false NOT NULL,
    premium_purchased_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN user_battle_pass.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.user_id IS 'Foreign key to users';


--
-- Name: COLUMN user_battle_pass.season_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.season_id IS 'Foreign key to battle_pass_seasons';


--
-- Name: COLUMN user_battle_pass.current_tier; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.current_tier IS 'Current tier level';


--
-- Name: COLUMN user_battle_pass.current_xp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.current_xp IS 'XP progress in current tier';


--
-- Name: COLUMN user_battle_pass.total_xp; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.total_xp IS 'Total XP earned this season';


--
-- Name: COLUMN user_battle_pass.has_premium; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.has_premium IS 'Whether user has premium pass';


--
-- Name: COLUMN user_battle_pass.premium_purchased_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass.premium_purchased_at IS 'When premium was purchased';


--
-- Name: user_battle_pass_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_battle_pass_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_battle_pass_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_battle_pass_id_seq OWNED BY public.user_battle_pass.id;


--
-- Name: user_battle_pass_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_battle_pass_rewards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    season_id integer NOT NULL,
    reward_id integer NOT NULL,
    claimed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN user_battle_pass_rewards.user_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass_rewards.user_id IS 'Foreign key to users';


--
-- Name: COLUMN user_battle_pass_rewards.season_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass_rewards.season_id IS 'Foreign key to battle_pass_seasons';


--
-- Name: COLUMN user_battle_pass_rewards.reward_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass_rewards.reward_id IS 'Foreign key to battle_pass_rewards';


--
-- Name: COLUMN user_battle_pass_rewards.claimed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_battle_pass_rewards.claimed_at IS 'When reward was claimed';


--
-- Name: user_battle_pass_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_battle_pass_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_battle_pass_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_battle_pass_rewards_id_seq OWNED BY public.user_battle_pass_rewards.id;


--
-- Name: user_factions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_factions (
    id integer NOT NULL,
    user_id integer NOT NULL,
    faction_id character varying(50) NOT NULL,
    joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    left_at timestamp with time zone,
    contribution_points integer DEFAULT 0 NOT NULL,
    can_change_at timestamp with time zone,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: COLUMN user_factions.left_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_factions.left_at IS 'NULL if currently active';


--
-- Name: COLUMN user_factions.contribution_points; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_factions.contribution_points IS 'Total points contributed by user';


--
-- Name: COLUMN user_factions.can_change_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_factions.can_change_at IS 'Cooldown expiry date for faction change (30 days)';


--
-- Name: user_factions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_factions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_factions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_factions_id_seq OWNED BY public.user_factions.id;


--
-- Name: user_leaderboard_rewards; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_leaderboard_rewards (
    id integer NOT NULL,
    user_id integer NOT NULL,
    reward_id integer NOT NULL,
    season_id integer,
    rank_achieved integer NOT NULL,
    claimed_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: COLUMN user_leaderboard_rewards.rank_achieved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_leaderboard_rewards.rank_achieved IS 'Rang atteint pour obtenir cette récompense';


--
-- Name: user_leaderboard_rewards_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_leaderboard_rewards_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_leaderboard_rewards_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_leaderboard_rewards_id_seq OWNED BY public.user_leaderboard_rewards.id;


--
-- Name: user_quest_unlocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_quest_unlocks (
    unlock_id integer NOT NULL,
    user_id integer NOT NULL,
    unlock_type character varying(50) NOT NULL,
    unlock_key character varying(100) NOT NULL,
    unlocked_by_quest_id integer,
    unlocked_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: COLUMN user_quest_unlocks.unlock_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quest_unlocks.unlock_type IS 'portal_tier, feature, blueprint, title';


--
-- Name: COLUMN user_quest_unlocks.unlock_key; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quest_unlocks.unlock_key IS 'blue_portals, alliance_raids, advanced_barracks';


--
-- Name: user_quest_unlocks_unlock_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_quest_unlocks_unlock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_quest_unlocks_unlock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_quest_unlocks_unlock_id_seq OWNED BY public.user_quest_unlocks.unlock_id;


--
-- Name: user_quests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_quests (
    id integer NOT NULL,
    user_id integer NOT NULL,
    quest_id integer NOT NULL,
    status public.enum_user_quests_status DEFAULT 'available'::public.enum_user_quests_status NOT NULL,
    progress integer DEFAULT 0 NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    claimed_at timestamp with time zone,
    expires_at timestamp with time zone,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: COLUMN user_quests.status; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.status IS 'Statut de la quête pour l''utilisateur';


--
-- Name: COLUMN user_quests.progress; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.progress IS 'Progression actuelle (0 à objective_target)';


--
-- Name: COLUMN user_quests.started_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.started_at IS 'Date de début de la quête';


--
-- Name: COLUMN user_quests.completed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.completed_at IS 'Date de complétion de la quête';


--
-- Name: COLUMN user_quests.claimed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.claimed_at IS 'Date de réclamation des récompenses';


--
-- Name: COLUMN user_quests.expires_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_quests.expires_at IS 'For daily/weekly quests';


--
-- Name: user_quests_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_quests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_quests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_quests_id_seq OWNED BY public.user_quests.id;


--
-- Name: user_resources_t2; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_resources_t2 (
    user_id integer NOT NULL,
    titanium bigint DEFAULT 0 NOT NULL,
    plasma bigint DEFAULT 0 NOT NULL,
    nanotubes bigint DEFAULT 0 NOT NULL,
    titanium_storage_max integer DEFAULT 0 NOT NULL,
    plasma_storage_max integer DEFAULT 0 NOT NULL,
    nanotubes_storage_max integer DEFAULT 0 NOT NULL,
    last_production_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN user_resources_t2.titanium; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.titanium IS 'Titanium quantity';


--
-- Name: COLUMN user_resources_t2.plasma; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.plasma IS 'Plasma energy quantity';


--
-- Name: COLUMN user_resources_t2.nanotubes; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.nanotubes IS 'Carbon nanotubes quantity';


--
-- Name: COLUMN user_resources_t2.titanium_storage_max; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.titanium_storage_max IS 'Maximum titanium storage capacity';


--
-- Name: COLUMN user_resources_t2.plasma_storage_max; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.plasma_storage_max IS 'Maximum plasma storage capacity';


--
-- Name: COLUMN user_resources_t2.nanotubes_storage_max; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.nanotubes_storage_max IS 'Maximum nanotubes storage capacity';


--
-- Name: COLUMN user_resources_t2.last_production_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_resources_t2.last_production_at IS 'Last time passive production was calculated';


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    points_experience integer DEFAULT 0 NOT NULL,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    two_factor_secret character varying(255),
    rang character varying(50) DEFAULT 'novice'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    protection_shield_until timestamp with time zone,
    attacks_sent_count integer DEFAULT 0 NOT NULL,
    active_bonuses jsonb DEFAULT '{}'::jsonb NOT NULL,
    CONSTRAINT users_points_experience_check CHECK ((points_experience >= 0))
);


--
-- Name: COLUMN users.protection_shield_until; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.protection_shield_until IS 'Protection shield expiration date for new players (72h from registration)';


--
-- Name: COLUMN users.attacks_sent_count; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.attacks_sent_count IS 'Total attacks sent by user (used to remove shield if user is aggressive)';


--
-- Name: COLUMN users.active_bonuses; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.users.active_bonuses IS 'Calculated faction + territorial bonuses { defense: 1.265, metal: 1.15, ... }';


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: world_grid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.world_grid (
    id integer NOT NULL,
    coord_x integer NOT NULL,
    coord_y integer NOT NULL,
    terrain_type character varying(50) DEFAULT 'plains'::character varying NOT NULL,
    has_city_slot boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: COLUMN world_grid.terrain_type; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.world_grid.terrain_type IS 'Type de terrain: plains, forest, mountain, desert, water';


--
-- Name: COLUMN world_grid.has_city_slot; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.world_grid.has_city_slot IS 'Indique si cette case peut accueillir une ville';


--
-- Name: world_grid_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.world_grid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: world_grid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.world_grid_id_seq OWNED BY public.world_grid.id;


--
-- Name: achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements ALTER COLUMN id SET DEFAULT nextval('public.achievements_id_seq'::regclass);


--
-- Name: action_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_logs ALTER COLUMN id SET DEFAULT nextval('public.action_logs_id_seq'::regclass);


--
-- Name: alliance_diplomacy id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy ALTER COLUMN id SET DEFAULT nextval('public.alliance_diplomacy_id_seq'::regclass);


--
-- Name: alliance_invitations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_invitations ALTER COLUMN id SET DEFAULT nextval('public.alliance_invitations_id_seq'::regclass);


--
-- Name: alliance_join_requests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_join_requests ALTER COLUMN id SET DEFAULT nextval('public.alliance_join_requests_id_seq'::regclass);


--
-- Name: alliance_members id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_members ALTER COLUMN id SET DEFAULT nextval('public.alliance_members_id_seq'::regclass);


--
-- Name: alliance_territories id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_territories ALTER COLUMN id SET DEFAULT nextval('public.alliance_territories_id_seq'::regclass);


--
-- Name: alliance_treasury_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_treasury_logs ALTER COLUMN id SET DEFAULT nextval('public.alliance_treasury_logs_id_seq'::regclass);


--
-- Name: alliance_war_battles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_war_battles ALTER COLUMN id SET DEFAULT nextval('public.alliance_war_battles_id_seq'::regclass);


--
-- Name: alliance_wars id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_wars ALTER COLUMN id SET DEFAULT nextval('public.alliance_wars_id_seq'::regclass);


--
-- Name: alliances id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliances ALTER COLUMN id SET DEFAULT nextval('public.alliances_id_seq'::regclass);


--
-- Name: attack_waves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attack_waves ALTER COLUMN id SET DEFAULT nextval('public.attack_waves_id_seq'::regclass);


--
-- Name: attacks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attacks ALTER COLUMN id SET DEFAULT nextval('public.attacks_id_seq'::regclass);


--
-- Name: battle_pass_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_rewards ALTER COLUMN id SET DEFAULT nextval('public.battle_pass_rewards_id_seq'::regclass);


--
-- Name: battle_pass_seasons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_seasons ALTER COLUMN id SET DEFAULT nextval('public.battle_pass_seasons_id_seq'::regclass);


--
-- Name: blueprints id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprints ALTER COLUMN id SET DEFAULT nextval('public.blueprints_id_seq'::regclass);


--
-- Name: buildings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings ALTER COLUMN id SET DEFAULT nextval('public.buildings_id_seq'::regclass);


--
-- Name: chat_messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages ALTER COLUMN id SET DEFAULT nextval('public.chat_messages_id_seq'::regclass);


--
-- Name: cities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities ALTER COLUMN id SET DEFAULT nextval('public.cities_id_seq'::regclass);


--
-- Name: city_slots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_slots ALTER COLUMN id SET DEFAULT nextval('public.city_slots_id_seq'::regclass);


--
-- Name: colonization_missions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colonization_missions ALTER COLUMN id SET DEFAULT nextval('public.colonization_missions_id_seq'::regclass);


--
-- Name: combat_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.combat_logs ALTER COLUMN id SET DEFAULT nextval('public.combat_logs_id_seq'::regclass);


--
-- Name: control_zones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_zones ALTER COLUMN id SET DEFAULT nextval('public.control_zones_id_seq'::regclass);


--
-- Name: crafting_queue id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_queue ALTER COLUMN id SET DEFAULT nextval('public.crafting_queue_id_seq'::regclass);


--
-- Name: daily_quest_rotation rotation_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quest_rotation ALTER COLUMN rotation_id SET DEFAULT nextval('public.daily_quest_rotation_rotation_id_seq'::regclass);


--
-- Name: defense id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense ALTER COLUMN id SET DEFAULT nextval('public.defense_id_seq'::regclass);


--
-- Name: defense_reports id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense_reports ALTER COLUMN id SET DEFAULT nextval('public.defense_reports_id_seq'::regclass);


--
-- Name: entities entity_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entities ALTER COLUMN entity_id SET DEFAULT nextval('public.entities_entity_id_seq'::regclass);


--
-- Name: explored_tiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explored_tiles ALTER COLUMN id SET DEFAULT nextval('public.explored_tiles_id_seq'::regclass);


--
-- Name: facilities id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities ALTER COLUMN id SET DEFAULT nextval('public.facilities_id_seq'::regclass);


--
-- Name: faction_control_points id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faction_control_points ALTER COLUMN id SET DEFAULT nextval('public.faction_control_points_id_seq'::regclass);


--
-- Name: fleet_units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_units ALTER COLUMN id SET DEFAULT nextval('public.fleet_units_id_seq'::regclass);


--
-- Name: fleets id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleets ALTER COLUMN id SET DEFAULT nextval('public.fleets_id_seq'::regclass);


--
-- Name: leaderboard_entries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries ALTER COLUMN id SET DEFAULT nextval('public.leaderboard_entries_id_seq'::regclass);


--
-- Name: leaderboard_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_rewards ALTER COLUMN id SET DEFAULT nextval('public.leaderboard_rewards_id_seq'::regclass);


--
-- Name: market_orders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_orders ALTER COLUMN id SET DEFAULT nextval('public.market_orders_id_seq'::regclass);


--
-- Name: market_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions ALTER COLUMN id SET DEFAULT nextval('public.market_transactions_id_seq'::regclass);


--
-- Name: player_blueprints id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_blueprints ALTER COLUMN id SET DEFAULT nextval('public.player_blueprints_id_seq'::regclass);


--
-- Name: portal_alliance_raids raid_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_alliance_raids ALTER COLUMN raid_id SET DEFAULT nextval('public.portal_alliance_raids_raid_id_seq'::regclass);


--
-- Name: portal_attempts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_attempts ALTER COLUMN id SET DEFAULT nextval('public.portal_attempts_id_seq'::regclass);


--
-- Name: portal_boss_attempts attempt_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_boss_attempts ALTER COLUMN attempt_id SET DEFAULT nextval('public.portal_boss_attempts_attempt_id_seq'::regclass);


--
-- Name: portal_bosses boss_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_bosses ALTER COLUMN boss_id SET DEFAULT nextval('public.portal_bosses_boss_id_seq'::regclass);


--
-- Name: portal_expeditions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_expeditions ALTER COLUMN id SET DEFAULT nextval('public.portal_expeditions_id_seq'::regclass);


--
-- Name: portal_leaderboard id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_leaderboard ALTER COLUMN id SET DEFAULT nextval('public.portal_leaderboard_id_seq'::regclass);


--
-- Name: portal_mastery id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_mastery ALTER COLUMN id SET DEFAULT nextval('public.portal_mastery_id_seq'::regclass);


--
-- Name: portal_quests quest_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_quests ALTER COLUMN quest_id SET DEFAULT nextval('public.portal_quests_quest_id_seq'::regclass);


--
-- Name: portal_raid_participants participant_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_raid_participants ALTER COLUMN participant_id SET DEFAULT nextval('public.portal_raid_participants_participant_id_seq'::regclass);


--
-- Name: portal_rewards_config id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_rewards_config ALTER COLUMN id SET DEFAULT nextval('public.portal_rewards_config_id_seq'::regclass);


--
-- Name: portals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portals ALTER COLUMN id SET DEFAULT nextval('public.portals_id_seq'::regclass);


--
-- Name: quests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests ALTER COLUMN id SET DEFAULT nextval('public.quests_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: researches id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.researches ALTER COLUMN id SET DEFAULT nextval('public.researches_id_seq'::regclass);


--
-- Name: resource_conversion_recipes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversion_recipes ALTER COLUMN id SET DEFAULT nextval('public.resource_conversion_recipes_id_seq'::regclass);


--
-- Name: resource_conversions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversions ALTER COLUMN id SET DEFAULT nextval('public.resource_conversions_id_seq'::regclass);


--
-- Name: resource_costs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_costs ALTER COLUMN id SET DEFAULT nextval('public.resource_costs_id_seq'::regclass);


--
-- Name: resource_production production_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_production ALTER COLUMN production_id SET DEFAULT nextval('public.resource_production_production_id_seq'::regclass);


--
-- Name: resources id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources ALTER COLUMN id SET DEFAULT nextval('public.resources_id_seq'::regclass);


--
-- Name: spy_missions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spy_missions ALTER COLUMN id SET DEFAULT nextval('public.spy_missions_id_seq'::regclass);


--
-- Name: trade_convoys id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_convoys ALTER COLUMN id SET DEFAULT nextval('public.trade_convoys_id_seq'::regclass);


--
-- Name: trade_routes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_routes ALTER COLUMN id SET DEFAULT nextval('public.trade_routes_id_seq'::regclass);


--
-- Name: trainings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings ALTER COLUMN id SET DEFAULT nextval('public.trainings_id_seq'::regclass);


--
-- Name: tutorial_progress id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_progress ALTER COLUMN id SET DEFAULT nextval('public.tutorial_progress_id_seq'::regclass);


--
-- Name: units id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units ALTER COLUMN id SET DEFAULT nextval('public.units_id_seq'::regclass);


--
-- Name: user_achievements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements ALTER COLUMN id SET DEFAULT nextval('public.user_achievements_id_seq'::regclass);


--
-- Name: user_battle_pass id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass ALTER COLUMN id SET DEFAULT nextval('public.user_battle_pass_id_seq'::regclass);


--
-- Name: user_battle_pass_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass_rewards ALTER COLUMN id SET DEFAULT nextval('public.user_battle_pass_rewards_id_seq'::regclass);


--
-- Name: user_factions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_factions ALTER COLUMN id SET DEFAULT nextval('public.user_factions_id_seq'::regclass);


--
-- Name: user_leaderboard_rewards id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_leaderboard_rewards ALTER COLUMN id SET DEFAULT nextval('public.user_leaderboard_rewards_id_seq'::regclass);


--
-- Name: user_quest_unlocks unlock_id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_unlocks ALTER COLUMN unlock_id SET DEFAULT nextval('public.user_quest_unlocks_unlock_id_seq'::regclass);


--
-- Name: user_quests id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quests ALTER COLUMN id SET DEFAULT nextval('public.user_quests_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: world_grid id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.world_grid ALTER COLUMN id SET DEFAULT nextval('public.world_grid_id_seq'::regclass);


--
-- Name: SequelizeMeta SequelizeMeta_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SequelizeMeta"
    ADD CONSTRAINT "SequelizeMeta_pkey" PRIMARY KEY (name);


--
-- Name: achievements achievements_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_key_key UNIQUE (key);


--
-- Name: achievements achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.achievements
    ADD CONSTRAINT achievements_pkey PRIMARY KEY (id);


--
-- Name: action_logs action_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_pkey PRIMARY KEY (id);


--
-- Name: alliance_diplomacy alliance_diplomacy_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy
    ADD CONSTRAINT alliance_diplomacy_pkey PRIMARY KEY (id);


--
-- Name: alliance_invitations alliance_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_invitations
    ADD CONSTRAINT alliance_invitations_pkey PRIMARY KEY (id);


--
-- Name: alliance_join_requests alliance_join_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_join_requests
    ADD CONSTRAINT alliance_join_requests_pkey PRIMARY KEY (id);


--
-- Name: alliance_members alliance_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_pkey PRIMARY KEY (id);


--
-- Name: alliance_territories alliance_territories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_territories
    ADD CONSTRAINT alliance_territories_pkey PRIMARY KEY (id);


--
-- Name: alliance_treasury_logs alliance_treasury_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_treasury_logs
    ADD CONSTRAINT alliance_treasury_logs_pkey PRIMARY KEY (id);


--
-- Name: alliance_war_battles alliance_war_battles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_war_battles
    ADD CONSTRAINT alliance_war_battles_pkey PRIMARY KEY (id);


--
-- Name: alliance_wars alliance_wars_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_wars
    ADD CONSTRAINT alliance_wars_pkey PRIMARY KEY (id);


--
-- Name: alliances alliances_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_name_key UNIQUE (name);


--
-- Name: alliances alliances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_pkey PRIMARY KEY (id);


--
-- Name: alliances alliances_tag_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_tag_key UNIQUE (tag);


--
-- Name: attack_waves attack_waves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attack_waves
    ADD CONSTRAINT attack_waves_pkey PRIMARY KEY (id);


--
-- Name: attacks attacks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attacks
    ADD CONSTRAINT attacks_pkey PRIMARY KEY (id);


--
-- Name: battle_pass_rewards battle_pass_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_rewards
    ADD CONSTRAINT battle_pass_rewards_pkey PRIMARY KEY (id);


--
-- Name: battle_pass_seasons battle_pass_seasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_seasons
    ADD CONSTRAINT battle_pass_seasons_pkey PRIMARY KEY (id);


--
-- Name: battle_pass_seasons battle_pass_seasons_season_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_seasons
    ADD CONSTRAINT battle_pass_seasons_season_number_key UNIQUE (season_number);


--
-- Name: blueprints blueprints_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprints
    ADD CONSTRAINT blueprints_name_key UNIQUE (name);


--
-- Name: blueprints blueprints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.blueprints
    ADD CONSTRAINT blueprints_pkey PRIMARY KEY (id);


--
-- Name: buildings buildings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: city_slots city_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_slots
    ADD CONSTRAINT city_slots_pkey PRIMARY KEY (id);


--
-- Name: colonization_missions colonization_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colonization_missions
    ADD CONSTRAINT colonization_missions_pkey PRIMARY KEY (id);


--
-- Name: combat_logs combat_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.combat_logs
    ADD CONSTRAINT combat_logs_pkey PRIMARY KEY (id);


--
-- Name: control_zones control_zones_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_zones
    ADD CONSTRAINT control_zones_name_key UNIQUE (name);


--
-- Name: control_zones control_zones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_zones
    ADD CONSTRAINT control_zones_pkey PRIMARY KEY (id);


--
-- Name: crafting_queue crafting_queue_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_queue
    ADD CONSTRAINT crafting_queue_pkey PRIMARY KEY (id);


--
-- Name: daily_quest_rotation daily_quest_rotation_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quest_rotation
    ADD CONSTRAINT daily_quest_rotation_date_key UNIQUE (date);


--
-- Name: daily_quest_rotation daily_quest_rotation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_quest_rotation
    ADD CONSTRAINT daily_quest_rotation_pkey PRIMARY KEY (rotation_id);


--
-- Name: defense defense_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense
    ADD CONSTRAINT defense_pkey PRIMARY KEY (id);


--
-- Name: defense_reports defense_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense_reports
    ADD CONSTRAINT defense_reports_pkey PRIMARY KEY (id);


--
-- Name: entities entities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entities
    ADD CONSTRAINT entities_pkey PRIMARY KEY (entity_id);


--
-- Name: explored_tiles explored_tiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explored_tiles
    ADD CONSTRAINT explored_tiles_pkey PRIMARY KEY (id);


--
-- Name: facilities facilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_pkey PRIMARY KEY (id);


--
-- Name: faction_control_points faction_control_points_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faction_control_points
    ADD CONSTRAINT faction_control_points_pkey PRIMARY KEY (id);


--
-- Name: factions factions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.factions
    ADD CONSTRAINT factions_pkey PRIMARY KEY (id);


--
-- Name: fleet_units fleet_units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_units
    ADD CONSTRAINT fleet_units_pkey PRIMARY KEY (id);


--
-- Name: fleets fleets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_pkey PRIMARY KEY (id);


--
-- Name: leaderboard_entries leaderboard_entries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_pkey PRIMARY KEY (id);


--
-- Name: leaderboard_rewards leaderboard_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_rewards
    ADD CONSTRAINT leaderboard_rewards_pkey PRIMARY KEY (id);


--
-- Name: market_orders market_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_orders
    ADD CONSTRAINT market_orders_pkey PRIMARY KEY (id);


--
-- Name: market_transactions market_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_pkey PRIMARY KEY (id);


--
-- Name: player_blueprints player_blueprints_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_blueprints
    ADD CONSTRAINT player_blueprints_pkey PRIMARY KEY (id);


--
-- Name: player_crafting_stats player_crafting_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_crafting_stats
    ADD CONSTRAINT player_crafting_stats_pkey PRIMARY KEY (user_id);


--
-- Name: portal_alliance_raids portal_alliance_raids_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_alliance_raids
    ADD CONSTRAINT portal_alliance_raids_pkey PRIMARY KEY (raid_id);


--
-- Name: portal_attempts portal_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_attempts
    ADD CONSTRAINT portal_attempts_pkey PRIMARY KEY (id);


--
-- Name: portal_boss_attempts portal_boss_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_boss_attempts
    ADD CONSTRAINT portal_boss_attempts_pkey PRIMARY KEY (attempt_id);


--
-- Name: portal_bosses portal_bosses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_bosses
    ADD CONSTRAINT portal_bosses_pkey PRIMARY KEY (boss_id);


--
-- Name: portal_expeditions portal_expeditions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_expeditions
    ADD CONSTRAINT portal_expeditions_pkey PRIMARY KEY (id);


--
-- Name: portal_leaderboard portal_leaderboard_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_leaderboard
    ADD CONSTRAINT portal_leaderboard_pkey PRIMARY KEY (id);


--
-- Name: portal_mastery portal_mastery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_mastery
    ADD CONSTRAINT portal_mastery_pkey PRIMARY KEY (id);


--
-- Name: portal_quests portal_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_quests
    ADD CONSTRAINT portal_quests_pkey PRIMARY KEY (quest_id);


--
-- Name: portal_raid_participants portal_raid_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_raid_participants
    ADD CONSTRAINT portal_raid_participants_pkey PRIMARY KEY (participant_id);


--
-- Name: portal_rewards_config portal_rewards_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_rewards_config
    ADD CONSTRAINT portal_rewards_config_pkey PRIMARY KEY (id);


--
-- Name: portals portals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portals
    ADD CONSTRAINT portals_pkey PRIMARY KEY (id);


--
-- Name: quest_streaks quest_streaks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_streaks
    ADD CONSTRAINT quest_streaks_pkey PRIMARY KEY (user_id);


--
-- Name: quests quests_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_key_key UNIQUE (key);


--
-- Name: quests quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quests
    ADD CONSTRAINT quests_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: researches researches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.researches
    ADD CONSTRAINT researches_pkey PRIMARY KEY (id);


--
-- Name: resource_conversion_recipes resource_conversion_recipes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversion_recipes
    ADD CONSTRAINT resource_conversion_recipes_pkey PRIMARY KEY (id);


--
-- Name: resource_conversion_recipes resource_conversion_recipes_resource_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversion_recipes
    ADD CONSTRAINT resource_conversion_recipes_resource_type_key UNIQUE (resource_type);


--
-- Name: resource_conversions resource_conversions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversions
    ADD CONSTRAINT resource_conversions_pkey PRIMARY KEY (id);


--
-- Name: resource_costs resource_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_costs
    ADD CONSTRAINT resource_costs_pkey PRIMARY KEY (id);


--
-- Name: resource_production resource_production_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_production
    ADD CONSTRAINT resource_production_pkey PRIMARY KEY (production_id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: spy_missions spy_missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.spy_missions
    ADD CONSTRAINT spy_missions_pkey PRIMARY KEY (id);


--
-- Name: trade_convoys trade_convoys_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_convoys
    ADD CONSTRAINT trade_convoys_pkey PRIMARY KEY (id);


--
-- Name: trade_routes trade_routes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_routes
    ADD CONSTRAINT trade_routes_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: tutorial_progress tutorial_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_progress
    ADD CONSTRAINT tutorial_progress_pkey PRIMARY KEY (id);


--
-- Name: portal_raid_participants unique_raid_participant; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_raid_participants
    ADD CONSTRAINT unique_raid_participant UNIQUE (raid_id, user_id);


--
-- Name: portal_rewards_config unique_tier_difficulty; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_rewards_config
    ADD CONSTRAINT unique_tier_difficulty UNIQUE (tier, difficulty);


--
-- Name: player_blueprints unique_user_blueprint; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_blueprints
    ADD CONSTRAINT unique_user_blueprint UNIQUE (user_id, blueprint_id);


--
-- Name: user_quests unique_user_quest; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quests
    ADD CONSTRAINT unique_user_quest UNIQUE (user_id, quest_id);


--
-- Name: portal_mastery unique_user_tier; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_mastery
    ADD CONSTRAINT unique_user_tier UNIQUE (user_id, tier);


--
-- Name: user_quest_unlocks unique_user_unlock; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_unlocks
    ADD CONSTRAINT unique_user_unlock UNIQUE (user_id, unlock_type, unlock_key);


--
-- Name: faction_control_points unique_zone_faction; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faction_control_points
    ADD CONSTRAINT unique_zone_faction UNIQUE (zone_id, faction_id);


--
-- Name: unit_stats unit_stats_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_stats
    ADD CONSTRAINT unit_stats_pkey PRIMARY KEY (unit_id);


--
-- Name: unit_stats unit_stats_unit_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_stats
    ADD CONSTRAINT unit_stats_unit_key_key UNIQUE (unit_key);


--
-- Name: unit_upkeep unit_upkeep_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_upkeep
    ADD CONSTRAINT unit_upkeep_pkey PRIMARY KEY (unit_id);


--
-- Name: units units_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_pkey PRIMARY KEY (id);


--
-- Name: buildings uq_buildings_city_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT uq_buildings_city_name UNIQUE (city_id, name);


--
-- Name: cities uq_cities_user_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT uq_cities_user_name UNIQUE (user_id, name);


--
-- Name: defense uq_defense_city_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense
    ADD CONSTRAINT uq_defense_city_name UNIQUE (city_id, name);


--
-- Name: facilities uq_facilities_city_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT uq_facilities_city_name UNIQUE (city_id, name);


--
-- Name: fleets uq_fleets_user_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT uq_fleets_user_name UNIQUE (user_id, name);


--
-- Name: researches uq_researches_user_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.researches
    ADD CONSTRAINT uq_researches_user_name UNIQUE (user_id, name);


--
-- Name: resources uq_resources_city_type; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT uq_resources_city_type UNIQUE (city_id, type);


--
-- Name: trainings uq_trainings_user_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT uq_trainings_user_name UNIQUE (user_id, name);


--
-- Name: units uq_units_city_name; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT uq_units_city_name UNIQUE (city_id, name);


--
-- Name: users uq_users_email; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_email UNIQUE (email);


--
-- Name: users uq_users_username; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uq_users_username UNIQUE (username);


--
-- Name: user_achievements user_achievements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_pkey PRIMARY KEY (id);


--
-- Name: user_battle_pass user_battle_pass_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass
    ADD CONSTRAINT user_battle_pass_pkey PRIMARY KEY (id);


--
-- Name: user_battle_pass_rewards user_battle_pass_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass_rewards
    ADD CONSTRAINT user_battle_pass_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_factions user_factions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_factions
    ADD CONSTRAINT user_factions_pkey PRIMARY KEY (id);


--
-- Name: user_leaderboard_rewards user_leaderboard_rewards_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_leaderboard_rewards
    ADD CONSTRAINT user_leaderboard_rewards_pkey PRIMARY KEY (id);


--
-- Name: user_quest_unlocks user_quest_unlocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_unlocks
    ADD CONSTRAINT user_quest_unlocks_pkey PRIMARY KEY (unlock_id);


--
-- Name: user_quests user_quests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quests
    ADD CONSTRAINT user_quests_pkey PRIMARY KEY (id);


--
-- Name: user_resources_t2 user_resources_t2_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_resources_t2
    ADD CONSTRAINT user_resources_t2_pkey PRIMARY KEY (user_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: world_grid world_grid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.world_grid
    ADD CONSTRAINT world_grid_pkey PRIMARY KEY (id);


--
-- Name: achievements_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX achievements_category ON public.achievements USING btree (category);


--
-- Name: achievements_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX achievements_is_active ON public.achievements USING btree (is_active);


--
-- Name: achievements_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX achievements_key ON public.achievements USING btree (key);


--
-- Name: achievements_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX achievements_tier ON public.achievements USING btree (tier);


--
-- Name: alliance_diplomacy_alliance_id_target_alliance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX alliance_diplomacy_alliance_id_target_alliance_id ON public.alliance_diplomacy USING btree (alliance_id, target_alliance_id);


--
-- Name: alliance_invitations_alliance_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliance_invitations_alliance_id_status ON public.alliance_invitations USING btree (alliance_id, status);


--
-- Name: alliance_invitations_invitee_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliance_invitations_invitee_id_status ON public.alliance_invitations USING btree (invitee_id, status);


--
-- Name: alliance_join_requests_alliance_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliance_join_requests_alliance_id_status ON public.alliance_join_requests USING btree (alliance_id, status);


--
-- Name: alliance_join_requests_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliance_join_requests_user_id ON public.alliance_join_requests USING btree (user_id);


--
-- Name: alliance_members_alliance_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliance_members_alliance_id ON public.alliance_members USING btree (alliance_id);


--
-- Name: alliance_members_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX alliance_members_user_id ON public.alliance_members USING btree (user_id);


--
-- Name: alliances_is_recruiting; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliances_is_recruiting ON public.alliances USING btree (is_recruiting);


--
-- Name: alliances_total_power; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX alliances_total_power ON public.alliances USING btree (total_power);


--
-- Name: attack_waves_attack_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attack_waves_attack_id ON public.attack_waves USING btree (attack_id);


--
-- Name: attack_waves_unit_entity_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attack_waves_unit_entity_id ON public.attack_waves USING btree (unit_entity_id);


--
-- Name: attacks_arrival_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attacks_arrival_time ON public.attacks USING btree (arrival_time);


--
-- Name: attacks_attacker_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attacks_attacker_user_id_status ON public.attacks USING btree (attacker_user_id, status);


--
-- Name: attacks_defender_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attacks_defender_user_id_status ON public.attacks USING btree (defender_user_id, status);


--
-- Name: attacks_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attacks_status ON public.attacks USING btree (status);


--
-- Name: battle_pass_rewards_season_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_rewards_season_id ON public.battle_pass_rewards USING btree (season_id);


--
-- Name: battle_pass_rewards_season_id_tier_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_rewards_season_id_tier_track ON public.battle_pass_rewards USING btree (season_id, tier, track);


--
-- Name: battle_pass_rewards_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_rewards_tier ON public.battle_pass_rewards USING btree (tier);


--
-- Name: battle_pass_rewards_track; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_rewards_track ON public.battle_pass_rewards USING btree (track);


--
-- Name: battle_pass_seasons_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_seasons_is_active ON public.battle_pass_seasons USING btree (is_active);


--
-- Name: battle_pass_seasons_season_number; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX battle_pass_seasons_season_number ON public.battle_pass_seasons USING btree (season_number);


--
-- Name: battle_pass_seasons_start_date_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX battle_pass_seasons_start_date_end_date ON public.battle_pass_seasons USING btree (start_date, end_date);


--
-- Name: cities_coords_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_coords_idx ON public.cities USING btree (coord_x, coord_y);


--
-- Name: city_slots_city_id_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX city_slots_city_id_unique ON public.city_slots USING btree (city_id) WHERE (city_id IS NOT NULL);


--
-- Name: city_slots_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_slots_status_idx ON public.city_slots USING btree (status);


--
-- Name: colonization_missions_arrival_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX colonization_missions_arrival_idx ON public.colonization_missions USING btree (arrival_at, status);


--
-- Name: colonization_missions_user_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX colonization_missions_user_status_idx ON public.colonization_missions USING btree (user_id, status);


--
-- Name: defense_reports_attack_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX defense_reports_attack_id ON public.defense_reports USING btree (attack_id);


--
-- Name: explored_tiles_user_grid_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX explored_tiles_user_grid_unique ON public.explored_tiles USING btree (user_id, grid_id);


--
-- Name: idx_action_logs_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_action_logs_user_created ON public.action_logs USING btree (user_id, created_at DESC);


--
-- Name: idx_alliance_raids_alliance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alliance_raids_alliance ON public.portal_alliance_raids USING btree (alliance_id);


--
-- Name: idx_alliance_raids_boss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alliance_raids_boss ON public.portal_alliance_raids USING btree (boss_id);


--
-- Name: idx_alliance_raids_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_alliance_raids_status ON public.portal_alliance_raids USING btree (status);


--
-- Name: idx_attempts_portal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_portal ON public.portal_attempts USING btree (portal_id);


--
-- Name: idx_attempts_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_result ON public.portal_attempts USING btree (result);


--
-- Name: idx_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_attempts_user ON public.portal_attempts USING btree (user_id);


--
-- Name: idx_blueprints_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blueprints_active ON public.blueprints USING btree (is_active);


--
-- Name: idx_blueprints_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blueprints_category ON public.blueprints USING btree (category);


--
-- Name: idx_blueprints_rarity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_blueprints_rarity ON public.blueprints USING btree (rarity);


--
-- Name: idx_boss_attempts_boss; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_attempts_boss ON public.portal_boss_attempts USING btree (boss_id);


--
-- Name: idx_boss_attempts_result; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_attempts_result ON public.portal_boss_attempts USING btree (result);


--
-- Name: idx_boss_attempts_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_boss_attempts_user ON public.portal_boss_attempts USING btree (user_id);


--
-- Name: idx_buildings_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_buildings_city ON public.buildings USING btree (city_id);


--
-- Name: idx_chat_messages_channel_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_channel_created ON public.chat_messages USING btree (channel_type, channel_id, created_at);


--
-- Name: idx_chat_messages_user_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_user_created ON public.chat_messages USING btree (user_id, created_at);


--
-- Name: idx_cities_specialization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_specialization ON public.cities USING btree (specialization);


--
-- Name: idx_cities_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_cities_user ON public.cities USING btree (user_id);


--
-- Name: idx_combat_logs_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_combat_logs_created ON public.combat_logs USING btree (created_at DESC);


--
-- Name: idx_control_zones_controller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_control_zones_controller ON public.control_zones USING btree (current_controller);


--
-- Name: idx_control_zones_coordinates; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_control_zones_coordinates ON public.control_zones USING btree (center_x, center_y);


--
-- Name: idx_control_zones_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_control_zones_status ON public.control_zones USING btree (status);


--
-- Name: idx_conversions_completion; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversions_completion ON public.resource_conversions USING btree (status, completed_at);


--
-- Name: idx_conversions_user_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_conversions_user_status ON public.resource_conversions USING btree (user_id, status);


--
-- Name: idx_crafting_queue_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crafting_queue_completed ON public.crafting_queue USING btree (completed_at) WHERE ((status)::text = 'in_progress'::text);


--
-- Name: idx_crafting_queue_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crafting_queue_status ON public.crafting_queue USING btree (status);


--
-- Name: idx_crafting_queue_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_crafting_queue_user ON public.crafting_queue USING btree (user_id);


--
-- Name: idx_daily_rotation_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_rotation_date ON public.daily_quest_rotation USING btree (date);


--
-- Name: idx_defense_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_defense_city ON public.defense USING btree (city_id);


--
-- Name: idx_entities_type_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_entities_type_name ON public.entities USING btree (entity_type, entity_name);


--
-- Name: idx_facilities_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_facilities_city ON public.facilities USING btree (city_id);


--
-- Name: idx_faction_control_points_faction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faction_control_points_faction ON public.faction_control_points USING btree (faction_id);


--
-- Name: idx_faction_control_points_zone; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_faction_control_points_zone ON public.faction_control_points USING btree (zone_id);


--
-- Name: idx_fleet_units_fleet; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fleet_units_fleet ON public.fleet_units USING btree (fleet_id);


--
-- Name: idx_fleets_origin_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fleets_origin_city ON public.fleets USING btree (origin_city_id);


--
-- Name: idx_fleets_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_fleets_user ON public.fleets USING btree (user_id);


--
-- Name: idx_leaderboard_category_rank; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_category_rank ON public.leaderboard_entries USING btree (category, rank);


--
-- Name: idx_leaderboard_category_score; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_category_score ON public.leaderboard_entries USING btree (category, score);


--
-- Name: idx_leaderboard_ranking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_ranking ON public.portal_leaderboard USING btree (tier, season, points);


--
-- Name: idx_leaderboard_rewards_category_season; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_rewards_category_season ON public.leaderboard_rewards USING btree (category, season_id);


--
-- Name: idx_leaderboard_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_leaderboard_user ON public.portal_leaderboard USING btree (user_id);


--
-- Name: idx_leaderboard_user_category; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_leaderboard_user_category ON public.leaderboard_entries USING btree (user_id, category);


--
-- Name: idx_market_orders_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_orders_active ON public.market_orders USING btree (resource_type, order_type, status);


--
-- Name: idx_market_orders_status_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_orders_status_date ON public.market_orders USING btree (status, created_at);


--
-- Name: idx_market_orders_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_orders_user ON public.market_orders USING btree (user_id);


--
-- Name: idx_market_transactions_buyer; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_transactions_buyer ON public.market_transactions USING btree (buyer_id);


--
-- Name: idx_market_transactions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_transactions_date ON public.market_transactions USING btree (created_at);


--
-- Name: idx_market_transactions_seller; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_market_transactions_seller ON public.market_transactions USING btree (seller_id);


--
-- Name: idx_mastery_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastery_level ON public.portal_mastery USING btree (mastery_level);


--
-- Name: idx_mastery_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastery_tier ON public.portal_mastery USING btree (tier);


--
-- Name: idx_mastery_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mastery_user ON public.portal_mastery USING btree (user_id);


--
-- Name: idx_player_blueprints_blueprint; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_blueprints_blueprint ON public.player_blueprints USING btree (blueprint_id);


--
-- Name: idx_player_blueprints_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_player_blueprints_user ON public.player_blueprints USING btree (user_id);


--
-- Name: idx_portal_bosses_defeated; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_bosses_defeated ON public.portal_bosses USING btree (defeated);


--
-- Name: idx_portal_bosses_portal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_bosses_portal ON public.portal_bosses USING btree (portal_id);


--
-- Name: idx_portal_bosses_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_bosses_type ON public.portal_bosses USING btree (boss_type);


--
-- Name: idx_portal_expeditions_arrival; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_expeditions_arrival ON public.portal_expeditions USING btree (arrival_time);


--
-- Name: idx_portal_expeditions_portal; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_expeditions_portal ON public.portal_expeditions USING btree (portal_id);


--
-- Name: idx_portal_expeditions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_expeditions_status ON public.portal_expeditions USING btree (status);


--
-- Name: idx_portal_expeditions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_expeditions_user ON public.portal_expeditions USING btree (user_id);


--
-- Name: idx_portal_quests_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_quests_active ON public.portal_quests USING btree (is_active);


--
-- Name: idx_portal_quests_chapter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_quests_chapter ON public.portal_quests USING btree (chapter);


--
-- Name: idx_portal_quests_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portal_quests_type ON public.portal_quests USING btree (quest_type);


--
-- Name: idx_portals_coords; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portals_coords ON public.portals USING btree (x_coordinate, y_coordinate);


--
-- Name: idx_portals_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portals_expires_at ON public.portals USING btree (expiry_time);


--
-- Name: idx_portals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portals_status ON public.portals USING btree (status);


--
-- Name: idx_portals_tier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portals_tier ON public.portals USING btree (tier);


--
-- Name: idx_raid_participants_raid; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raid_participants_raid ON public.portal_raid_participants USING btree (raid_id);


--
-- Name: idx_raid_participants_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_raid_participants_user ON public.portal_raid_participants USING btree (user_id);


--
-- Name: idx_recipes_resource_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recipes_resource_type ON public.resource_conversion_recipes USING btree (resource_type);


--
-- Name: idx_researches_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_researches_user ON public.researches USING btree (user_id);


--
-- Name: idx_resource_costs_entity_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_costs_entity_level ON public.resource_costs USING btree (entity_id, level);


--
-- Name: idx_resource_production_building; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resource_production_building ON public.resource_production USING btree (building_id);


--
-- Name: idx_resources_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_resources_city ON public.resources USING btree (city_id);


--
-- Name: idx_territories_alliance; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_territories_alliance ON public.alliance_territories USING btree (alliance_id);


--
-- Name: idx_territories_coords_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_territories_coords_unique ON public.alliance_territories USING btree (coord_x, coord_y);


--
-- Name: idx_territories_spatial; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_territories_spatial ON public.alliance_territories USING btree (coord_x, coord_y);


--
-- Name: idx_trainings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trainings_user ON public.trainings USING btree (user_id);


--
-- Name: idx_treasury_logs_alliance_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_logs_alliance_date ON public.alliance_treasury_logs USING btree (alliance_id, created_at);


--
-- Name: idx_treasury_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_treasury_logs_user ON public.alliance_treasury_logs USING btree (user_id);


--
-- Name: idx_tutorial_progress_completed; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_tutorial_progress_completed ON public.tutorial_progress USING btree (completed);


--
-- Name: idx_tutorial_progress_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_tutorial_progress_user_id ON public.tutorial_progress USING btree (user_id);


--
-- Name: idx_units_city; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_units_city ON public.units USING btree (city_id);


--
-- Name: idx_user_factions_faction_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_factions_faction_active ON public.user_factions USING btree (faction_id, is_active) WHERE (is_active = true);


--
-- Name: idx_user_factions_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_factions_user ON public.user_factions USING btree (user_id);


--
-- Name: idx_user_leaderboard_rewards_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_user_leaderboard_rewards_unique ON public.user_leaderboard_rewards USING btree (user_id, reward_id, season_id);


--
-- Name: idx_user_quests_expires; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quests_expires ON public.user_quests USING btree (expires_at);


--
-- Name: idx_user_quests_quest; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quests_quest ON public.user_quests USING btree (quest_id);


--
-- Name: idx_user_quests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quests_status ON public.user_quests USING btree (status);


--
-- Name: idx_user_quests_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_quests_user ON public.user_quests USING btree (user_id);


--
-- Name: idx_user_resources_t2_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_resources_t2_user ON public.user_resources_t2 USING btree (user_id);


--
-- Name: idx_user_unlocks_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_unlocks_type ON public.user_quest_unlocks USING btree (unlock_type);


--
-- Name: idx_user_unlocks_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_unlocks_user ON public.user_quest_unlocks USING btree (user_id);


--
-- Name: idx_users_protection_shield; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_protection_shield ON public.users USING btree (protection_shield_until);


--
-- Name: idx_war_battles_war_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_war_battles_war_date ON public.alliance_war_battles USING btree (war_id, occurred_at);


--
-- Name: idx_wars_attacker_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wars_attacker_status ON public.alliance_wars USING btree (attacker_alliance_id, status);


--
-- Name: idx_wars_defender_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wars_defender_status ON public.alliance_wars USING btree (defender_alliance_id, status);


--
-- Name: idx_wars_ended; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_wars_ended ON public.alliance_wars USING btree (status, ended_at);


--
-- Name: quests_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quests_category ON public.quests USING btree (category);


--
-- Name: quests_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quests_key ON public.quests USING btree (key);


--
-- Name: quests_type_is_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quests_type_is_active ON public.quests USING btree (type, is_active);


--
-- Name: spy_missions_arrival_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spy_missions_arrival_time ON public.spy_missions USING btree (arrival_time);


--
-- Name: spy_missions_spy_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spy_missions_spy_user_id_status ON public.spy_missions USING btree (spy_user_id, status);


--
-- Name: spy_missions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spy_missions_status ON public.spy_missions USING btree (status);


--
-- Name: spy_missions_target_user_id_detected; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX spy_missions_target_user_id_detected ON public.spy_missions USING btree (target_user_id, detected);


--
-- Name: trade_convoys_arrival_time; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_convoys_arrival_time ON public.trade_convoys USING btree (arrival_time);


--
-- Name: trade_convoys_destination_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_convoys_destination_city_id ON public.trade_convoys USING btree (destination_city_id);


--
-- Name: trade_convoys_origin_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_convoys_origin_city_id ON public.trade_convoys USING btree (origin_city_id);


--
-- Name: trade_convoys_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_convoys_status ON public.trade_convoys USING btree (status);


--
-- Name: trade_convoys_trade_route_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_convoys_trade_route_id ON public.trade_convoys USING btree (trade_route_id);


--
-- Name: trade_routes_destination_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_routes_destination_city_id ON public.trade_routes USING btree (destination_city_id);


--
-- Name: trade_routes_origin_city_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_routes_origin_city_id ON public.trade_routes USING btree (origin_city_id);


--
-- Name: trade_routes_owner_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_routes_owner_user_id_status ON public.trade_routes USING btree (owner_user_id, status);


--
-- Name: trade_routes_route_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_routes_route_type ON public.trade_routes USING btree (route_type);


--
-- Name: trade_routes_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX trade_routes_status ON public.trade_routes USING btree (status);


--
-- Name: user_achievements_achievement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_achievements_achievement_id ON public.user_achievements USING btree (achievement_id);


--
-- Name: user_achievements_unlocked_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_achievements_unlocked_at ON public.user_achievements USING btree (unlocked_at);


--
-- Name: user_achievements_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_achievements_user_id ON public.user_achievements USING btree (user_id);


--
-- Name: user_achievements_user_id_achievement_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_achievements_user_id_achievement_id ON public.user_achievements USING btree (user_id, achievement_id);


--
-- Name: user_battle_pass_rewards_reward_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_battle_pass_rewards_reward_id ON public.user_battle_pass_rewards USING btree (reward_id);


--
-- Name: user_battle_pass_rewards_season_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_battle_pass_rewards_season_id ON public.user_battle_pass_rewards USING btree (season_id);


--
-- Name: user_battle_pass_rewards_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_battle_pass_rewards_user_id ON public.user_battle_pass_rewards USING btree (user_id);


--
-- Name: user_battle_pass_rewards_user_id_reward_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_battle_pass_rewards_user_id_reward_id ON public.user_battle_pass_rewards USING btree (user_id, reward_id);


--
-- Name: user_battle_pass_season_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_battle_pass_season_id ON public.user_battle_pass USING btree (season_id);


--
-- Name: user_battle_pass_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_battle_pass_user_id ON public.user_battle_pass USING btree (user_id);


--
-- Name: user_battle_pass_user_id_season_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_battle_pass_user_id_season_id ON public.user_battle_pass USING btree (user_id, season_id);


--
-- Name: user_quests_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_quests_expires_at ON public.user_quests USING btree (expires_at);


--
-- Name: user_quests_user_id_quest_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_quests_user_id_quest_id ON public.user_quests USING btree (user_id, quest_id);


--
-- Name: user_quests_user_id_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_quests_user_id_status ON public.user_quests USING btree (user_id, status);


--
-- Name: world_grid_city_slot_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX world_grid_city_slot_idx ON public.world_grid USING btree (has_city_slot);


--
-- Name: world_grid_coords_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX world_grid_coords_unique ON public.world_grid USING btree (coord_x, coord_y);


--
-- Name: action_logs action_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.action_logs
    ADD CONSTRAINT action_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: alliance_diplomacy alliance_diplomacy_accepted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy
    ADD CONSTRAINT alliance_diplomacy_accepted_by_fkey FOREIGN KEY (accepted_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alliance_diplomacy alliance_diplomacy_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy
    ADD CONSTRAINT alliance_diplomacy_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_diplomacy alliance_diplomacy_proposed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy
    ADD CONSTRAINT alliance_diplomacy_proposed_by_fkey FOREIGN KEY (proposed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: alliance_diplomacy alliance_diplomacy_target_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_diplomacy
    ADD CONSTRAINT alliance_diplomacy_target_alliance_id_fkey FOREIGN KEY (target_alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_invitations alliance_invitations_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_invitations
    ADD CONSTRAINT alliance_invitations_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_invitations alliance_invitations_invitee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_invitations
    ADD CONSTRAINT alliance_invitations_invitee_id_fkey FOREIGN KEY (invitee_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_invitations alliance_invitations_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_invitations
    ADD CONSTRAINT alliance_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_join_requests alliance_join_requests_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_join_requests
    ADD CONSTRAINT alliance_join_requests_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_join_requests alliance_join_requests_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_join_requests
    ADD CONSTRAINT alliance_join_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alliance_join_requests alliance_join_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_join_requests
    ADD CONSTRAINT alliance_join_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_members alliance_members_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_members alliance_members_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_members
    ADD CONSTRAINT alliance_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_territories alliance_territories_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_territories
    ADD CONSTRAINT alliance_territories_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_treasury_logs alliance_treasury_logs_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_treasury_logs
    ADD CONSTRAINT alliance_treasury_logs_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_treasury_logs alliance_treasury_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_treasury_logs
    ADD CONSTRAINT alliance_treasury_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alliance_war_battles alliance_war_battles_war_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_war_battles
    ADD CONSTRAINT alliance_war_battles_war_id_fkey FOREIGN KEY (war_id) REFERENCES public.alliance_wars(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_wars alliance_wars_attacker_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_wars
    ADD CONSTRAINT alliance_wars_attacker_alliance_id_fkey FOREIGN KEY (attacker_alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliance_wars alliance_wars_declared_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_wars
    ADD CONSTRAINT alliance_wars_declared_by_fkey FOREIGN KEY (declared_by) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: alliance_wars alliance_wars_defender_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliance_wars
    ADD CONSTRAINT alliance_wars_defender_alliance_id_fkey FOREIGN KEY (defender_alliance_id) REFERENCES public.alliances(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: alliances alliances_leader_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.alliances
    ADD CONSTRAINT alliances_leader_id_fkey FOREIGN KEY (leader_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attack_waves attack_waves_attack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attack_waves
    ADD CONSTRAINT attack_waves_attack_id_fkey FOREIGN KEY (attack_id) REFERENCES public.attacks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: battle_pass_rewards battle_pass_rewards_season_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.battle_pass_rewards
    ADD CONSTRAINT battle_pass_rewards_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: buildings buildings_building_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_building_type_id_fkey FOREIGN KEY (building_type_id) REFERENCES public.entities(entity_id) ON DELETE SET NULL;


--
-- Name: buildings buildings_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.buildings
    ADD CONSTRAINT buildings_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_user_id_fkey1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_user_id_fkey1 FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: cities cities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: city_slots city_slots_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_slots
    ADD CONSTRAINT city_slots_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: city_slots city_slots_grid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_slots
    ADD CONSTRAINT city_slots_grid_id_fkey FOREIGN KEY (grid_id) REFERENCES public.world_grid(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: colonization_missions colonization_missions_departure_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colonization_missions
    ADD CONSTRAINT colonization_missions_departure_city_id_fkey FOREIGN KEY (departure_city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: colonization_missions colonization_missions_target_slot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colonization_missions
    ADD CONSTRAINT colonization_missions_target_slot_id_fkey FOREIGN KEY (target_slot_id) REFERENCES public.city_slots(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: colonization_missions colonization_missions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.colonization_missions
    ADD CONSTRAINT colonization_missions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: combat_logs combat_logs_attacker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.combat_logs
    ADD CONSTRAINT combat_logs_attacker_id_fkey FOREIGN KEY (attacker_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: combat_logs combat_logs_defender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.combat_logs
    ADD CONSTRAINT combat_logs_defender_id_fkey FOREIGN KEY (defender_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: control_zones control_zones_current_controller_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.control_zones
    ADD CONSTRAINT control_zones_current_controller_fkey FOREIGN KEY (current_controller) REFERENCES public.factions(id) ON DELETE SET NULL;


--
-- Name: crafting_queue crafting_queue_blueprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_queue
    ADD CONSTRAINT crafting_queue_blueprint_id_fkey FOREIGN KEY (blueprint_id) REFERENCES public.blueprints(id);


--
-- Name: crafting_queue crafting_queue_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.crafting_queue
    ADD CONSTRAINT crafting_queue_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: defense defense_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.defense
    ADD CONSTRAINT defense_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: explored_tiles explored_tiles_grid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explored_tiles
    ADD CONSTRAINT explored_tiles_grid_id_fkey FOREIGN KEY (grid_id) REFERENCES public.world_grid(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: explored_tiles explored_tiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.explored_tiles
    ADD CONSTRAINT explored_tiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: facilities facilities_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: facilities facilities_facility_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.facilities
    ADD CONSTRAINT facilities_facility_type_id_fkey FOREIGN KEY (facility_type_id) REFERENCES public.entities(entity_id) ON DELETE SET NULL;


--
-- Name: faction_control_points faction_control_points_faction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faction_control_points
    ADD CONSTRAINT faction_control_points_faction_id_fkey FOREIGN KEY (faction_id) REFERENCES public.factions(id) ON DELETE CASCADE;


--
-- Name: faction_control_points faction_control_points_zone_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.faction_control_points
    ADD CONSTRAINT faction_control_points_zone_id_fkey FOREIGN KEY (zone_id) REFERENCES public.control_zones(id) ON DELETE CASCADE;


--
-- Name: fleet_units fleet_units_fleet_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleet_units
    ADD CONSTRAINT fleet_units_fleet_id_fkey FOREIGN KEY (fleet_id) REFERENCES public.fleets(id) ON DELETE CASCADE;


--
-- Name: fleets fleets_origin_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_origin_city_id_fkey FOREIGN KEY (origin_city_id) REFERENCES public.cities(id) ON DELETE SET NULL;


--
-- Name: fleets fleets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.fleets
    ADD CONSTRAINT fleets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leaderboard_entries leaderboard_entries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.leaderboard_entries
    ADD CONSTRAINT leaderboard_entries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: market_orders market_orders_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_orders
    ADD CONSTRAINT market_orders_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: market_orders market_orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_orders
    ADD CONSTRAINT market_orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: market_transactions market_transactions_buyer_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_buyer_city_id_fkey FOREIGN KEY (buyer_city_id) REFERENCES public.cities(id);


--
-- Name: market_transactions market_transactions_buyer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: market_transactions market_transactions_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.market_orders(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: market_transactions market_transactions_seller_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_seller_city_id_fkey FOREIGN KEY (seller_city_id) REFERENCES public.cities(id);


--
-- Name: market_transactions market_transactions_seller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.market_transactions
    ADD CONSTRAINT market_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: player_blueprints player_blueprints_blueprint_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_blueprints
    ADD CONSTRAINT player_blueprints_blueprint_id_fkey FOREIGN KEY (blueprint_id) REFERENCES public.blueprints(id) ON DELETE CASCADE;


--
-- Name: player_blueprints player_blueprints_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_blueprints
    ADD CONSTRAINT player_blueprints_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: player_crafting_stats player_crafting_stats_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.player_crafting_stats
    ADD CONSTRAINT player_crafting_stats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portal_alliance_raids portal_alliance_raids_alliance_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_alliance_raids
    ADD CONSTRAINT portal_alliance_raids_alliance_id_fkey FOREIGN KEY (alliance_id) REFERENCES public.alliances(id) ON DELETE CASCADE;


--
-- Name: portal_alliance_raids portal_alliance_raids_boss_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_alliance_raids
    ADD CONSTRAINT portal_alliance_raids_boss_id_fkey FOREIGN KEY (boss_id) REFERENCES public.portal_bosses(boss_id) ON DELETE CASCADE;


--
-- Name: portal_attempts portal_attempts_portal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_attempts
    ADD CONSTRAINT portal_attempts_portal_id_fkey FOREIGN KEY (portal_id) REFERENCES public.portals(id) ON DELETE CASCADE;


--
-- Name: portal_attempts portal_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_attempts
    ADD CONSTRAINT portal_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portal_boss_attempts portal_boss_attempts_boss_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_boss_attempts
    ADD CONSTRAINT portal_boss_attempts_boss_id_fkey FOREIGN KEY (boss_id) REFERENCES public.portal_bosses(boss_id) ON DELETE CASCADE;


--
-- Name: portal_boss_attempts portal_boss_attempts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_boss_attempts
    ADD CONSTRAINT portal_boss_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portal_bosses portal_bosses_defeated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_bosses
    ADD CONSTRAINT portal_bosses_defeated_by_fkey FOREIGN KEY (defeated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: portal_bosses portal_bosses_portal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_bosses
    ADD CONSTRAINT portal_bosses_portal_id_fkey FOREIGN KEY (portal_id) REFERENCES public.portals(id) ON DELETE CASCADE;


--
-- Name: portal_expeditions portal_expeditions_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_expeditions
    ADD CONSTRAINT portal_expeditions_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_expeditions portal_expeditions_portal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_expeditions
    ADD CONSTRAINT portal_expeditions_portal_id_fkey FOREIGN KEY (portal_id) REFERENCES public.portals(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_expeditions portal_expeditions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_expeditions
    ADD CONSTRAINT portal_expeditions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: portal_leaderboard portal_leaderboard_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_leaderboard
    ADD CONSTRAINT portal_leaderboard_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portal_mastery portal_mastery_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_mastery
    ADD CONSTRAINT portal_mastery_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portal_quests portal_quests_prerequisite_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_quests
    ADD CONSTRAINT portal_quests_prerequisite_quest_id_fkey FOREIGN KEY (prerequisite_quest_id) REFERENCES public.portal_quests(quest_id) ON DELETE SET NULL;


--
-- Name: portal_raid_participants portal_raid_participants_raid_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_raid_participants
    ADD CONSTRAINT portal_raid_participants_raid_id_fkey FOREIGN KEY (raid_id) REFERENCES public.portal_alliance_raids(raid_id) ON DELETE CASCADE;


--
-- Name: portal_raid_participants portal_raid_participants_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portal_raid_participants
    ADD CONSTRAINT portal_raid_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: quest_streaks quest_streaks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quest_streaks
    ADD CONSTRAINT quest_streaks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: researches researches_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.researches
    ADD CONSTRAINT researches_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resource_conversions resource_conversions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_conversions
    ADD CONSTRAINT resource_conversions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resource_costs resource_costs_entity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_costs
    ADD CONSTRAINT resource_costs_entity_id_fkey FOREIGN KEY (entity_id) REFERENCES public.entities(entity_id) ON DELETE CASCADE;


--
-- Name: resource_production resource_production_building_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resource_production
    ADD CONSTRAINT resource_production_building_id_fkey FOREIGN KEY (building_id) REFERENCES public.buildings(id) ON DELETE CASCADE;


--
-- Name: resources resources_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: trade_convoys trade_convoys_intercepted_by_attack_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_convoys
    ADD CONSTRAINT trade_convoys_intercepted_by_attack_id_fkey FOREIGN KEY (intercepted_by_attack_id) REFERENCES public.attacks(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: trade_routes trade_routes_destination_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_routes
    ADD CONSTRAINT trade_routes_destination_city_id_fkey FOREIGN KEY (destination_city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trade_routes trade_routes_origin_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trade_routes
    ADD CONSTRAINT trade_routes_origin_city_id_fkey FOREIGN KEY (origin_city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trainings trainings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: tutorial_progress tutorial_progress_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_progress
    ADD CONSTRAINT tutorial_progress_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: unit_stats unit_stats_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_stats
    ADD CONSTRAINT unit_stats_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.entities(entity_id) ON DELETE CASCADE;


--
-- Name: unit_upkeep unit_upkeep_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unit_upkeep
    ADD CONSTRAINT unit_upkeep_unit_id_fkey FOREIGN KEY (unit_id) REFERENCES public.entities(entity_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: units units_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.units
    ADD CONSTRAINT units_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_achievement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.achievements(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_achievements user_achievements_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_achievements
    ADD CONSTRAINT user_achievements_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_battle_pass_rewards user_battle_pass_rewards_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass_rewards
    ADD CONSTRAINT user_battle_pass_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.battle_pass_rewards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_battle_pass_rewards user_battle_pass_rewards_season_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass_rewards
    ADD CONSTRAINT user_battle_pass_rewards_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_battle_pass_rewards user_battle_pass_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass_rewards
    ADD CONSTRAINT user_battle_pass_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_battle_pass user_battle_pass_season_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass
    ADD CONSTRAINT user_battle_pass_season_id_fkey FOREIGN KEY (season_id) REFERENCES public.battle_pass_seasons(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_battle_pass user_battle_pass_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_battle_pass
    ADD CONSTRAINT user_battle_pass_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_factions user_factions_faction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_factions
    ADD CONSTRAINT user_factions_faction_id_fkey FOREIGN KEY (faction_id) REFERENCES public.factions(id) ON DELETE CASCADE;


--
-- Name: user_factions user_factions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_factions
    ADD CONSTRAINT user_factions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_leaderboard_rewards user_leaderboard_rewards_reward_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_leaderboard_rewards
    ADD CONSTRAINT user_leaderboard_rewards_reward_id_fkey FOREIGN KEY (reward_id) REFERENCES public.leaderboard_rewards(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_leaderboard_rewards user_leaderboard_rewards_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_leaderboard_rewards
    ADD CONSTRAINT user_leaderboard_rewards_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_quest_unlocks user_quest_unlocks_unlocked_by_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_unlocks
    ADD CONSTRAINT user_quest_unlocks_unlocked_by_quest_id_fkey FOREIGN KEY (unlocked_by_quest_id) REFERENCES public.portal_quests(quest_id) ON DELETE SET NULL;


--
-- Name: user_quest_unlocks user_quest_unlocks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quest_unlocks
    ADD CONSTRAINT user_quest_unlocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_quests user_quests_quest_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quests
    ADD CONSTRAINT user_quests_quest_id_fkey FOREIGN KEY (quest_id) REFERENCES public.quests(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_quests user_quests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_quests
    ADD CONSTRAINT user_quests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_resources_t2 user_resources_t2_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_resources_t2
    ADD CONSTRAINT user_resources_t2_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict EOVD4CQrm7DJEBmQwpywtahgtaCKevTbJiLQHVRTRHVYIYKSnaML6E1dWalziIX

