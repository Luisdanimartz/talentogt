/* =====================================================================
   062_slugs_para_seo.sql

   Objetivo
   --------
   Darle a cada vacante una URL con palabras reales en lugar del UUID.

   Antes:  /vacantes/7c2e9a14-8f31-4b2a-9d55-1e6f0c3a7b88
   Ahora:  /empleos/asistente-de-contabilidad-guatemala-7c2e9a14

   El sufijo de 8 caracteres viene del propio id, asi que el slug es
   unico por construccion y no hace falta logica de colisiones.

   Este archivo es autocontenido e idempotente: se puede correr las
   veces que sea necesario y no depende de que 001 se haya corrido
   completo en produccion.
   ===================================================================== */


/* ---------------------------------------------------------------------
   0. Utilitario compartido (va en TODAS las migraciones por regla
      del proyecto: 001 nunca se corrio completo en produccion)
   --------------------------------------------------------------------- */

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


/* ---------------------------------------------------------------------
   1. Convertir texto libre a slug

   No usamos la extension unaccent porque no siempre esta habilitada
   en el proyecto de Supabase. translate() cubre el espanol completo.
   --------------------------------------------------------------------- */

create or replace function public.slugify(texto text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      regexp_replace(
        lower(
          translate(
            coalesce(texto, ''),
            'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
            'aaaaaeeeeiiiiooooouuuuncAAAAAEEEEIIIIOOOOOUUUUNC'
          )
        ),
        '[^a-z0-9]+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
$$;

comment on function public.slugify(text) is
  'Convierte texto a slug apto para URL. Quita acentos y caracteres raros.';


/* ---------------------------------------------------------------------
   2. Columna slug en jobs
   --------------------------------------------------------------------- */

alter table public.jobs
  add column if not exists slug text;


/* ---------------------------------------------------------------------
   3. Armar el slug de una vacante

   Formato: {titulo}-{municipio}-{8 caracteres del id}

   El municipio va incluido porque la busqueda real de la gente es
   "trabajo de bodeguero en mixco", no solo "bodeguero".
   --------------------------------------------------------------------- */

create or replace function public.armar_slug_vacante(
  p_id uuid,
  p_title text,
  p_municipality_id bigint
)
returns text
language plpgsql
stable
as $$
declare
  v_municipio text;
  v_base      text;
begin

  select m.name
    into v_municipio
    from public.municipalities m
   where m.id = p_municipality_id;

  v_base := public.slugify(nullif(trim(coalesce(p_title, '')), ''));

  if v_base is null or v_base = '' then
    v_base := 'vacante';
  end if;

  if v_municipio is not null and trim(v_municipio) <> '' then
    v_base := v_base || '-' || public.slugify(v_municipio);
  end if;

  /* Cortamos para que la URL no se vuelva absurda, cuidando de no
     terminar en guion. */
  v_base := trim(both '-' from left(v_base, 80));

  return v_base || '-' || substr(replace(p_id::text, '-', ''), 1, 8);

end;
$$;


/* ---------------------------------------------------------------------
   4. Mantenerlo al dia solo cuando cambia lo que lo compone
   --------------------------------------------------------------------- */

create or replace function public.jobs_set_slug()
returns trigger
language plpgsql
as $$
begin

  new.slug := public.armar_slug_vacante(
    new.id,
    new.title,
    new.municipality_id
  );

  return new;

end;
$$;

drop trigger if exists trg_jobs_set_slug on public.jobs;

create trigger trg_jobs_set_slug
  before insert or update of title, municipality_id
  on public.jobs
  for each row
  execute function public.jobs_set_slug();


/* ---------------------------------------------------------------------
   5. Rellenar las vacantes que ya existen

   IMPORTANTE
   ----------
   La migracion 055 dejo el disparador cgt_jobs_compromiso, que corre
   ante CUALQUIER update sobre jobs y exige salario y fecha de
   resolucion en toda vacante publicada.

   Las vacantes publicadas ANTES de esa regla no cumplen, asi que un
   update masivo revienta con:

     "En ChanceGT toda vacante publicada debe indicar el salario"

   Aqui solo estamos escribiendo la columna slug: no tocamos salario
   ni fechas ni estado. Por eso se apaga esa validacion durante el
   relleno y se vuelve a encender enseguida.

   No se usa "disable trigger user" a proposito: eso apagaria TODOS
   los disparadores de la tabla. Se apaga unicamente el que estorba.
   --------------------------------------------------------------------- */

alter table public.jobs disable trigger cgt_jobs_compromiso;

update public.jobs j
   set slug = public.armar_slug_vacante(j.id, j.title, j.municipality_id)
 where j.slug is null
    or j.slug = '';

alter table public.jobs enable trigger cgt_jobs_compromiso;


/* ---------------------------------------------------------------------
   6. Indice unico (parcial: ignora filas sin slug si las hubiera)
   --------------------------------------------------------------------- */

create unique index if not exists jobs_slug_unique_idx
  on public.jobs (slug)
  where slug is not null;


/* ---------------------------------------------------------------------
   7. Lectura publica del slug

   La funcion la usa el sitemap y el renderizado del servidor, que
   entran con la llave anonima. Devuelve unicamente vacantes
   publicadas de empresas activas: nada privado se expone.
   --------------------------------------------------------------------- */

create or replace function public.vacantes_para_sitemap()
returns table (
  slug         text,
  actualizado  timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select j.slug,
         greatest(
           coalesce(j.published_at, now()),
           coalesce(j.updated_at, j.published_at, now())
         ) as actualizado
    from public.jobs j
    join public.company_profiles c on c.id = j.company_id
   where j.status = 'published'
     and c.status = 'activa'
     and j.slug is not null
   order by j.published_at desc nulls last
   limit 5000;
$$;

grant execute on function public.vacantes_para_sitemap()
  to anon, authenticated;


/* ---------------------------------------------------------------------
   8. Comprobaciones

   a) Ver como quedaron los slugs:

      select title, slug from public.jobs
       order by published_at desc nulls last limit 10;

   b) Confirmar que la validacion de 055 quedo encendida de nuevo
      (tgenabled debe ser 'O'):

      select tgname, tgenabled
        from pg_trigger
       where tgrelid = 'public.jobs'::regclass
         and not tgisinternal;

   c) Vacantes publicadas SIN salario. Son las que hicieron fallar el
      relleno la primera vez. Siguen visibles en el sitio y su
      JSON-LD saldra sin baseSalary, que es justo lo que Google
      premia. Conviene corregirlas o despublicarlas:

      select id, title, status, salary_min, salary_max
        from public.jobs
       where status in ('published','scheduled')
         and (salary_min is null or salary_min <= 0);
   --------------------------------------------------------------------- */
