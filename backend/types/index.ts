// Terra Dominus - Shared TypeScript Types

// ============================================================================
// User & Authentication
// ============================================================================

export interface User {
  id: number;
  username: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface AuthPayload {
  userId: number;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  email: string;
}

// ============================================================================
// Cities
// ============================================================================

export interface City {
  id: number;
  user_id: number;
  name: string;
  is_capital: boolean;
  coord_x: number | null;
  coord_y: number | null;
  vision_range: number;
  founded_at: Date;
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Resources
// ============================================================================

export interface Resources {
  gold: number;
  metal: number;
  fuel: number;
  energy: number;
}

export type ResourceType = keyof Resources;

export interface ResourceProduction {
  type: ResourceType;
  production_per_second: number;
  capacity: number;
}

// ============================================================================
// Combat
// ============================================================================

export type AttackType = 'raid' | 'conquest' | 'siege';
export type AttackStatus = 'traveling' | 'arrived' | 'completed' | 'returning';

export interface AttackData {
  attackerCityId: number;
  defenderCityId: number;
  attackType: AttackType;
  units: UnitQuantity[];
}

export interface UnitQuantity {
  entityId: number;
  quantity: number;
}

export interface Attack {
  id: number;
  attacker_city_id: number;
  defender_city_id: number;
  attacker_user_id: number;
  defender_user_id: number;
  attack_type: AttackType;
  status: AttackStatus;
  distance: number;
  departure_time: Date;
  arrival_time: Date;
  return_time: Date | null;
  loot: Resources | null;
}

export interface CombatOutcome {
  winner: 'attacker' | 'defender';
  attackerLosses: number;
  defenderLosses: number;
  rounds: number;
}

// ============================================================================
// Trade
// ============================================================================

export type TradeRouteType = 'internal' | 'external';
export type TradeRouteStatus = 'active' | 'inactive' | 'suspended';

export interface TradeRoute {
  id: number;
  owner_user_id: number;
  origin_city_id: number;
  destination_city_id: number;
  route_type: TradeRouteType;
  status: TradeRouteStatus;
  distance: number;
  auto_transfer_enabled: boolean;
  auto_transfer_gold: number;
  auto_transfer_metal: number;
  auto_transfer_fuel: number;
  auto_transfer_interval: number;
  last_transfer: Date | null;
}

export interface ConvoyData {
  routeId: number;
  cargo: Partial<Resources>;
  escortUnits?: UnitQuantity[];
}

// ============================================================================
// Colonization
// ============================================================================

export type MissionStatus = 'traveling' | 'completed' | 'cancelled';
export type SlotStatus = 'free' | 'reserved' | 'occupied';
export type SlotQuality = 'low' | 'medium' | 'high' | 'excellent';

export interface ColonizationMission {
  id: number;
  user_id: number;
  departure_city_id: number;
  target_slot_id: number;
  status: MissionStatus;
  departure_time: Date;
  arrival_time: Date;
  completed_at: Date | null;
}

export interface CitySlot {
  id: number;
  grid_id: number;
  status: SlotStatus;
  quality: SlotQuality;
  city_id: number | null;
  reserved_by_user: number | null;
  reserved_at: Date | null;
}

// ============================================================================
// World
// ============================================================================

export type TerrainType = 'plains' | 'forest' | 'mountain' | 'hills' | 'desert' | 'water';

export interface WorldTile {
  id: number;
  coord_x: number;
  coord_y: number;
  terrain_type: TerrainType;
  has_city_slot: boolean;
}

export interface TerrainBonus {
  production: Partial<Resources>;
  description: string;
}

export interface VisibleWorld {
  tiles: Array<{
    id: number;
    x: number;
    y: number;
    terrain: TerrainType;
    hasCitySlot: boolean;
    isVisible: boolean;
    isExplored: boolean;
  }>;
  exploredCount: number;
  visionRanges: Array<{
    cityId: number;
    x: number;
    y: number;
    range: number;
  }>;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
  };
}

// ============================================================================
// Buildings & Entities
// ============================================================================

export type EntityType = 'building' | 'unit' | 'defense' | 'research';

export interface Entity {
  id: number;
  entity_id: number;
  name: string;
  entity_type: EntityType;
  description: string | null;
}

export interface Building {
  id: number;
  city_id: number;
  name: string;
  level: number;
  build_start: Date | null;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export interface ConstructionQueue {
  id: number;
  city_id: number;
  entity_id: number;
  type: EntityType;
  slot: number;
  status: 'pending' | 'in_progress' | 'completed';
  finish_time: Date;
  created_at: Date;
}

// ============================================================================
// Service Responses
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  status: number;
  traceId?: string;
}

// ============================================================================
// Pagination
// ============================================================================

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ============================================================================
// Logger & Observability
// ============================================================================

export interface LogContext {
  module?: string;
  userId?: number;
  traceId?: string;
  [key: string]: any;
}

export interface LoggerInterface {
  info(message: string, context?: LogContext): void;
  error(message: string, error: Error, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
}

// ============================================================================
// Dependency Injection
// ============================================================================

export interface Container {
  register<T>(name: string, resolver: (container: Container) => T): void;
  resolve<T>(name: string): T;
}

// ============================================================================
// Transaction Provider
// ============================================================================

export interface Transaction {
  commit(): Promise<void>;
  rollback(): Promise<void>;
  LOCK: {
    UPDATE: string;
    SHARE: string;
  };
  afterCommit(fn: () => void): void;
}

export type TransactionProvider = <T>(
  handler: (transaction: Transaction) => Promise<T>
) => Promise<T>;
