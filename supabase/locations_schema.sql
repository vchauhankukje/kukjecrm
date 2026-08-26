-- Country/City as managed data (Master-Detail: city cascades on country delete)
create table country (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table city (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country_id uuid references country(id) on delete cascade
);

alter table country enable row level security;
alter table city enable row level security;
create policy "public_read_country" on country for select using (true);
create policy "recruiters_manage_country" on country for all using (auth.uid() is not null) with check (auth.uid() is not null);
create policy "public_read_city" on city for select using (true);
create policy "recruiters_manage_city" on city for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- Seed from the existing 10 countries
insert into country (name) values
  ('Belarus'), ('Bulgaria'), ('Czech Republic'), ('Hungary'), ('Moldova'),
  ('Poland'), ('Romania'), ('Russia'), ('Slovakia'), ('Ukraine');

insert into city (name, country_id)
select c, country.id from country, unnest(
  case country.name
    when 'Belarus' then array['Minsk','Gomel','Mogilev','Vitebsk','Hrodna']
    when 'Bulgaria' then array['Sofia','Plovdiv','Varna','Burgas','Ruse']
    when 'Czech Republic' then array['Prague','Brno','Ostrava','Plzen','Liberec']
    when 'Hungary' then array['Budapest','Debrecen','Szeged','Miskolc','Pecs']
    when 'Moldova' then array['Chisinau','Balti','Tiraspol','Cahul','Comrat']
    when 'Poland' then array['Warsaw','Krakow','Lodz','Wroclaw','Poznan','Gdansk']
    when 'Romania' then array['Bucharest','Cluj-Napoca','Timisoara','Iasi','Constanta']
    when 'Russia' then array['Moscow','Saint Petersburg','Novosibirsk','Yekaterinburg','Nizhny Novgorod']
    when 'Slovakia' then array['Bratislava','Kosice','Presov','Zilina','Nitra']
    when 'Ukraine' then array['Kyiv','Kharkiv','Odesa','Dnipro','Lviv','Donetsk']
  end
) as c;
