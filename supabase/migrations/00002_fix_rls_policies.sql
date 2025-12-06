-- Fix RLS infinite recursion issue
-- This migration fixes the house_members policies that were causing infinite recursion

-- First, create helper functions with SECURITY DEFINER to bypass RLS
create or replace function public.is_house_admin(check_house_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from house_members
    where house_id = check_house_id
      and user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.is_house_member(check_house_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from house_members
    where house_id = check_house_id
      and user_id = auth.uid()
      and invite_status = 'accepted'
  );
$$;

create or replace function public.get_user_house_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select house_id from house_members
  where user_id = auth.uid()
    and invite_status = 'accepted';
$$;

create or replace function public.house_has_no_members(check_house_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select not exists (
    select 1 from house_members where house_id = check_house_id
  );
$$;

-- Drop existing problematic policies
drop policy if exists "Users can view members of their houses" on public.house_members;
drop policy if exists "Admins can invite members" on public.house_members;
drop policy if exists "Admins can update members" on public.house_members;
drop policy if exists "Admins can remove members" on public.house_members;

drop policy if exists "Users can view their houses" on public.houses;
drop policy if exists "House admins can update their houses" on public.houses;

drop policy if exists "House members can view stays" on public.stays;
drop policy if exists "House members can create stays" on public.stays;

drop policy if exists "House members can view expenses" on public.expenses;
drop policy if exists "House members can create expenses" on public.expenses;

drop policy if exists "House members can view expense splits" on public.expense_splits;

drop policy if exists "House members can view messages" on public.messages;
drop policy if exists "House members can send messages" on public.messages;

drop policy if exists "Users can view profiles of house members" on public.profiles;

-- Recreate policies using the helper functions

-- Profiles policies
create policy "Users can view profiles of house members"
  on public.profiles for select
  using (
    id = auth.uid() or
    id in (
      select hm.user_id from public.house_members hm
      where hm.house_id in (select public.get_user_house_ids())
    )
  );

-- Houses policies
create policy "Users can view their houses"
  on public.houses for select
  using (id in (select public.get_user_house_ids()));

create policy "House admins can update their houses"
  on public.houses for update
  using (public.is_house_admin(id));

-- House members policies (fixed to avoid recursion)
create policy "Users can view members of their houses"
  on public.house_members for select
  using (
    public.is_house_member(house_id) or
    invited_email = (select email from auth.users where id = auth.uid())
  );

create policy "Admins can invite members"
  on public.house_members for insert
  with check (
    public.is_house_admin(house_id) or
    public.house_has_no_members(house_id)
  );

create policy "Admins can update members"
  on public.house_members for update
  using (
    public.is_house_admin(house_id) or
    user_id = auth.uid()
  );

create policy "Admins can remove members"
  on public.house_members for delete
  using (public.is_house_admin(house_id));

-- Stays policies
create policy "House members can view stays"
  on public.stays for select
  using (public.is_house_member(house_id));

create policy "House members can create stays"
  on public.stays for insert
  with check (
    public.is_house_member(house_id) and
    user_id = auth.uid()
  );

-- Expenses policies
create policy "House members can view expenses"
  on public.expenses for select
  using (public.is_house_member(house_id));

create policy "House members can create expenses"
  on public.expenses for insert
  with check (
    public.is_house_member(house_id) and
    paid_by = auth.uid()
  );

-- Expense splits policies
create policy "House members can view expense splits"
  on public.expense_splits for select
  using (
    expense_id in (
      select id from public.expenses where public.is_house_member(house_id)
    )
  );

-- Messages policies
create policy "House members can view messages"
  on public.messages for select
  using (public.is_house_member(house_id));

create policy "House members can send messages"
  on public.messages for insert
  with check (
    public.is_house_member(house_id) and
    user_id = auth.uid()
  );

-- Notify PostgREST to reload schema
notify pgrst, 'reload schema';
