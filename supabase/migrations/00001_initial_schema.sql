-- Mökki Initial Schema
-- Creates profiles, houses, and house_members tables

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create custom types
create type member_role as enum ('admin', 'member');
create type invite_status as enum ('pending', 'accepted');
create type expense_category as enum ('groceries', 'utilities', 'supplies', 'other');
create type message_type as enum ('text', 'system');

-- Profiles table (extends auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  display_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Houses table
create table public.houses (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  address text,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- House members (join table)
create table public.house_members (
  id uuid default uuid_generate_v4() primary key,
  house_id uuid references public.houses on delete cascade not null,
  user_id uuid references public.profiles on delete cascade,
  role member_role default 'member' not null,
  invite_status invite_status default 'pending' not null,
  invited_email text,
  invited_at timestamp with time zone default timezone('utc'::text, now()) not null,
  joined_at timestamp with time zone,
  unique(house_id, user_id),
  unique(house_id, invited_email)
);

-- Stays table
create table public.stays (
  id uuid default uuid_generate_v4() primary key,
  house_id uuid references public.houses on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  check_in date not null,
  check_out date not null,
  notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  constraint check_dates check (check_out >= check_in)
);

-- Expenses table
create table public.expenses (
  id uuid default uuid_generate_v4() primary key,
  house_id uuid references public.houses on delete cascade not null,
  paid_by uuid references public.profiles on delete cascade not null,
  amount decimal(10,2) not null,
  description text not null,
  category expense_category default 'other' not null,
  date date not null,
  receipt_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Expense splits table
create table public.expense_splits (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references public.expenses on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  amount decimal(10,2) not null,
  settled boolean default false not null,
  settled_at timestamp with time zone,
  unique(expense_id, user_id)
);

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  house_id uuid references public.houses on delete cascade not null,
  user_id uuid references public.profiles on delete cascade not null,
  content text not null,
  type message_type default 'text' not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes for performance
create index idx_house_members_house_id on public.house_members(house_id);
create index idx_house_members_user_id on public.house_members(user_id);
create index idx_stays_house_id on public.stays(house_id);
create index idx_stays_user_id on public.stays(user_id);
create index idx_stays_dates on public.stays(check_in, check_out);
create index idx_expenses_house_id on public.expenses(house_id);
create index idx_expenses_paid_by on public.expenses(paid_by);
create index idx_expense_splits_expense_id on public.expense_splits(expense_id);
create index idx_expense_splits_user_id on public.expense_splits(user_id);
create index idx_messages_house_id on public.messages(house_id);
create index idx_messages_created_at on public.messages(created_at);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.houses enable row level security;
alter table public.house_members enable row level security;
alter table public.stays enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.messages enable row level security;

-- RLS Policies

-- Profiles: Users can view all profiles of people in their houses, update their own
create policy "Users can view profiles of house members"
  on public.profiles for select
  using (
    id = auth.uid() or
    id in (
      select hm.user_id from public.house_members hm
      where hm.house_id in (
        select house_id from public.house_members where user_id = auth.uid()
      )
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (id = auth.uid());

-- Houses: Users can view houses they're members of
create policy "Users can view their houses"
  on public.houses for select
  using (
    id in (select house_id from public.house_members where user_id = auth.uid())
  );

create policy "Authenticated users can create houses"
  on public.houses for insert
  with check (auth.uid() is not null);

create policy "House admins can update their houses"
  on public.houses for update
  using (
    id in (
      select house_id from public.house_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- House members: Users can view members of their houses
create policy "Users can view members of their houses"
  on public.house_members for select
  using (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
    or invited_email = (select email from auth.users where id = auth.uid())
  );

create policy "Admins can invite members"
  on public.house_members for insert
  with check (
    house_id in (
      select house_id from public.house_members
      where user_id = auth.uid() and role = 'admin'
    )
    or not exists (select 1 from public.house_members where house_id = house_members.house_id)
  );

create policy "Admins can update members"
  on public.house_members for update
  using (
    house_id in (
      select house_id from public.house_members
      where user_id = auth.uid() and role = 'admin'
    )
    or (user_id = auth.uid())
  );

create policy "Admins can remove members"
  on public.house_members for delete
  using (
    house_id in (
      select house_id from public.house_members
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Stays: House members can CRUD stays
create policy "House members can view stays"
  on public.stays for select
  using (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
  );

create policy "House members can create stays"
  on public.stays for insert
  with check (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
    and user_id = auth.uid()
  );

create policy "Users can update their own stays"
  on public.stays for update
  using (user_id = auth.uid());

create policy "Users can delete their own stays"
  on public.stays for delete
  using (user_id = auth.uid());

-- Expenses: House members can CRUD expenses
create policy "House members can view expenses"
  on public.expenses for select
  using (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
  );

create policy "House members can create expenses"
  on public.expenses for insert
  with check (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
    and paid_by = auth.uid()
  );

create policy "Users can update their own expenses"
  on public.expenses for update
  using (paid_by = auth.uid());

create policy "Users can delete their own expenses"
  on public.expenses for delete
  using (paid_by = auth.uid());

-- Expense splits: House members can view, expense creator can manage
create policy "House members can view expense splits"
  on public.expense_splits for select
  using (
    expense_id in (
      select id from public.expenses
      where house_id in (select house_id from public.house_members where user_id = auth.uid())
    )
  );

create policy "Expense creators can manage splits"
  on public.expense_splits for insert
  with check (
    expense_id in (select id from public.expenses where paid_by = auth.uid())
  );

create policy "Users can settle their own splits"
  on public.expense_splits for update
  using (user_id = auth.uid() or expense_id in (select id from public.expenses where paid_by = auth.uid()));

-- Messages: House members can view and create messages
create policy "House members can view messages"
  on public.messages for select
  using (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
  );

create policy "House members can send messages"
  on public.messages for insert
  with check (
    house_id in (select house_id from public.house_members where user_id = auth.uid())
    and user_id = auth.uid()
  );

-- Function to automatically create profile on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

create trigger update_houses_updated_at
  before update on public.houses
  for each row execute procedure public.update_updated_at();

-- Enable realtime for messages
alter publication supabase_realtime add table public.messages;
