export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type HouseSettings = {
  wifi_password?: string;
  address?: string;
  rules?: string[];
  local_tips?: string;
  emergency_contacts?: { name: string; phone: string }[];
};

export type MemberRole = "admin" | "member";
export type InviteStatus = "pending" | "accepted";
export type ExpenseCategory = "groceries" | "utilities" | "supplies" | "other" | "guest_fees";
export type MessageType = "text" | "system";
export type RiderType = "skier" | "snowboarder" | "both";
export type BulletinCategory = "wifi" | "house_rules" | "emergency" | "local_tips";

// Webcam configuration for resorts
export type WebcamConfig = {
  name: string;
  url: string;
  type: "image" | "embed";
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          rider_type: RiderType | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          avatar_url?: string | null;
          rider_type?: RiderType | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          rider_type?: RiderType | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      houses: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          settings: Json;
          resort_id: string | null;
          favorite_resort_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          settings?: Json;
          resort_id?: string | null;
          favorite_resort_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          address?: string | null;
          settings?: Json;
          resort_id?: string | null;
          favorite_resort_ids?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "houses_resort_id_fkey";
            columns: ["resort_id"];
            isOneToOne: false;
            referencedRelation: "resorts";
            referencedColumns: ["id"];
          }
        ];
      };
      resorts: {
        Row: {
          id: string;
          name: string;
          slug: string;
          latitude: number;
          longitude: number;
          elevation_base: number | null;
          elevation_summit: number | null;
          timezone: string;
          website_url: string | null;
          webcam_urls: WebcamConfig[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          latitude: number;
          longitude: number;
          elevation_base?: number | null;
          elevation_summit?: number | null;
          timezone?: string;
          website_url?: string | null;
          webcam_urls?: WebcamConfig[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          latitude?: number;
          longitude?: number;
          elevation_base?: number | null;
          elevation_summit?: number | null;
          timezone?: string;
          website_url?: string | null;
          webcam_urls?: WebcamConfig[];
          updated_at?: string;
        };
        Relationships: [];
      };
      house_members: {
        Row: {
          id: string;
          house_id: string;
          user_id: string | null;
          role: MemberRole;
          invite_status: InviteStatus;
          invited_email: string | null;
          invited_at: string;
          joined_at: string | null;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id?: string | null;
          role?: MemberRole;
          invite_status?: InviteStatus;
          invited_email?: string | null;
          invited_at?: string;
          joined_at?: string | null;
        };
        Update: {
          role?: MemberRole;
          invite_status?: InviteStatus;
          user_id?: string | null;
          joined_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "house_members_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "house_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      stays: {
        Row: {
          id: string;
          house_id: string;
          user_id: string;
          check_in: string;
          check_out: string;
          notes: string | null;
          guest_count: number;
          linked_expense_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id: string;
          check_in: string;
          check_out: string;
          notes?: string | null;
          guest_count?: number;
          linked_expense_id?: string | null;
          created_at?: string;
        };
        Update: {
          check_in?: string;
          check_out?: string;
          notes?: string | null;
          guest_count?: number;
          linked_expense_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "stays_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stays_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      expenses: {
        Row: {
          id: string;
          house_id: string;
          paid_by: string;
          amount: number;
          description: string;
          category: ExpenseCategory;
          date: string;
          receipt_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          paid_by: string;
          amount: number;
          description: string;
          category?: ExpenseCategory;
          date: string;
          receipt_url?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          description?: string;
          category?: ExpenseCategory;
          date?: string;
          receipt_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expenses_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expenses_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      expense_splits: {
        Row: {
          id: string;
          expense_id: string;
          user_id: string;
          amount: number;
          settled: boolean;
          settled_at: string | null;
        };
        Insert: {
          id?: string;
          expense_id: string;
          user_id: string;
          amount: number;
          settled?: boolean;
          settled_at?: string | null;
        };
        Update: {
          amount?: number;
          settled?: boolean;
          settled_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey";
            columns: ["expense_id"];
            isOneToOne: false;
            referencedRelation: "expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          id: string;
          house_id: string;
          user_id: string;
          content: string;
          type: MessageType;
          created_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          user_id: string;
          content: string;
          type?: MessageType;
          created_at?: string;
        };
        Update: {
          content?: string;
        };
        Relationships: [
          {
            foreignKeyName: "messages_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      bulletin_items: {
        Row: {
          id: string;
          house_id: string;
          category: BulletinCategory | null;
          title: string;
          content: string;
          color: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          house_id: string;
          category?: BulletinCategory | null;
          title: string;
          content: string;
          color?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category?: BulletinCategory | null;
          title?: string;
          content?: string;
          color?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bulletin_items_house_id_fkey";
            columns: ["house_id"];
            isOneToOne: false;
            referencedRelation: "houses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bulletin_items_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      member_role: MemberRole;
      invite_status: InviteStatus;
      expense_category: ExpenseCategory;
      message_type: MessageType;
      rider_type: RiderType;
      bulletin_category: BulletinCategory;
    };
    CompositeTypes: {};
  };
}

// Helper types for easier usage
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type House = Database["public"]["Tables"]["houses"]["Row"];
export type HouseMember = Database["public"]["Tables"]["house_members"]["Row"];
export type Stay = Database["public"]["Tables"]["stays"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseSplit = Database["public"]["Tables"]["expense_splits"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];

// Joined types for common queries
export type HouseMemberWithProfile = HouseMember & {
  profiles: Profile;
};

export type StayWithProfile = Stay & {
  profiles: Profile;
};

export type ExpenseWithPaidBy = Expense & {
  profiles: Profile;
};

export type MessageWithProfile = Message & {
  profiles: Profile;
};

// Stay with guest fees and expense info
export type StayWithGuestFees = Stay & {
  profiles: Profile;
  expenses: (Expense & {
    expense_splits: ExpenseSplit[];
  }) | null;
};

// User guest fee summary for account page
export type UserGuestFeeSummary = {
  totalStays: number;
  totalGuests: number;
  totalAmount: number;
  settledAmount: number;
  unsettledAmount: number;
};

// Bulletin board types
export type BulletinItem = Database["public"]["Tables"]["bulletin_items"]["Row"];

export type BulletinItemWithProfile = BulletinItem & {
  profiles: Profile;
};

// Resort types
export type Resort = Database["public"]["Tables"]["resorts"]["Row"];

export type HouseWithResort = House & {
  resorts: Resort | null;
};

// Open-Meteo API response types
export type OpenMeteoCurrentWeather = {
  temperature: number;
  apparent_temperature: number;
  precipitation: number;
  snowfall: number;
  wind_speed: number;
  wind_direction: number;
  wind_gusts: number;
  weather_code: number;
  cloud_cover: number;
  is_day: boolean;
};

export type OpenMeteoDailyForecast = {
  time: string[];
  temperature_max: number[];
  temperature_min: number[];
  precipitation_sum: number[];
  snowfall_sum: number[];
  precipitation_probability_max: number[];
  weather_code: number[];
};

export type OpenMeteoWeatherData = {
  current: OpenMeteoCurrentWeather;
  daily: OpenMeteoDailyForecast;
};

// Combined weather report for UI
export type WeatherReport = {
  resort: Resort;
  weather: OpenMeteoWeatherData;
  fetchedAt: string;
};
