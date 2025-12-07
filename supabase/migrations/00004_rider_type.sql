-- Add rider_type to profiles for skier/snowboarder preference

-- Create the enum type
create type rider_type as enum ('skier', 'snowboarder', 'both');

-- Add column to profiles
alter table public.profiles add column rider_type rider_type;
