-- =====================================================================
-- Migración 051: Normalización de nombres de lugares
--
-- Problema: el catálogo municipalities se cargó con nombres en
-- MAYÚSCULAS y sin tildes ("SAN LUCAS SACATEPEQUEZ"). Como las
-- empresas usan FK al catálogo y los candidatos copian el texto de
-- los mismos dropdowns, el error se propaga a toda la plataforma.
--
-- Solución de raíz:
--   1. Función permanente public.normalizar_lugar(text): Title Case,
--      conectores en minúscula (de, del, de la...) y tildes de
--      topónimos guatemaltecos frecuentes. Queda disponible para
--      cualquier integración futura.
--   2. UPDATE al catálogo municipalities.name.
--   3. UPDATE al texto libre de candidate_profiles (department y
--      municipality), que copió el formato viejo del catálogo.
--
-- Self-contained. Segura de correr más de una vez (es idempotente:
-- normalizar algo ya normalizado no lo cambia).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. Función permanente de normalización
-- ---------------------------------------------------------------------

create or replace function public.normalizar_lugar(p_nombre text)
returns text
language plpgsql
immutable
as $$
declare
  v text;
  r record;
begin

  if p_nombre is null or trim(p_nombre) = '' then
    return p_nombre;
  end if;

  -- Espacios múltiples -> uno; Title Case base
  v := initcap(lower(trim(regexp_replace(p_nombre, '\s+', ' ', 'g'))));

  -- Conectores en minúscula (ningún municipio de GT inicia con ellos)
  v := regexp_replace(v, '\mDe Las\M', 'de las', 'g');
  v := regexp_replace(v, '\mDe La\M',  'de la',  'g');
  v := regexp_replace(v, '\mDe Los\M', 'de los', 'g');
  v := regexp_replace(v, '\mDel\M',    'del',    'g');
  v := regexp_replace(v, '\mDe\M',     'de',     'g');

  -- Tildes de topónimos guatemaltecos frecuentes (por palabra completa)
  for r in
    select * from (values
      ('Jose','José'), ('Maria','María'), ('Lucia','Lucía'),
      ('Bartolome','Bartolomé'), ('Sebastian','Sebastián'),
      ('Andres','Andrés'), ('Agustin','Agustín'), ('Martin','Martín'),
      ('Cristobal','Cristóbal'), ('Asuncion','Asunción'),
      ('Concepcion','Concepción'), ('Union','Unión'), ('Rio','Río'),
      ('Barbara','Bárbara'), ('Tomas','Tomás'),
      ('Sacatepequez','Sacatepéquez'), ('Suchitepequez','Suchitepéquez'),
      ('Quiche','Quiché'), ('Solola','Sololá'), ('Peten','Petén'),
      ('Totonicapan','Totonicapán'), ('Atitlan','Atitlán'),
      ('Ixtahuacan','Ixtahuacán'), ('Malacatan','Malacatán'),
      ('Tacana','Tacaná'), ('Nenton','Nentón'), ('Coban','Cobán'),
      ('Cahabon','Cahabón'), ('Lanquin','Lanquín'), ('Panzos','Panzós'),
      ('Sayaxche','Sayaxché'), ('Poptun','Poptún'), ('Morazan','Morazán'),
      ('Gualan','Gualán'), ('Teculutan','Teculután'),
      ('Usumatlan','Usumatlán'), ('Salama','Salamá'),
      ('Chicaman','Chicamán'), ('Uspantan','Uspantán'),
      ('Camotan','Camotán'), ('Jocotan','Jocotán'),
      ('Guazacapan','Guazacapán'), ('Amatitlan','Amatitlán'),
      ('Aguacatan','Aguacatán'), ('Tectitan','Tectitán'),
      ('Ixchiguan','Ixchiguán'), ('Ocos','Ocós'), ('Nahuala','Nahualá'),
      ('Cajola','Cajolá'), ('Cunen','Cunén'), ('Ixcan','Ixcán'),
      ('Patzite','Patzité'), ('Chiche','Chiché'), ('Tucuru','Tucurú'),
      ('Tamahu','Tamahú'), ('Purulha','Purulhá'), ('Senahu','Senahú'),
      ('Carcha','Carchá'), ('Acatan','Acatán'), ('Raxruha','Raxruhá'),
      ('Canilla','Canillá'), ('Cabanas','Cabañas'), ('Jesus','Jesús'),
      ('Patzun','Patzún'), ('Patzicia','Patzicía'), ('Tecpan','Tecpán'),
      ('Genova','Génova'), ('Salcaja','Salcajá'), ('Huitan','Huitán'),
      ('Cabrican','Cabricán'), ('Zapotitlan','Zapotitlán'),
      ('Chaparron','Chaparrón'), ('Cuchumatan','Cuchumatán'),
      ('Ixtatan','Ixtatán'), ('Petatan','Petatán')
    ) as t(sin_tilde, con_tilde)
  loop
    v := regexp_replace(v, '\m' || r.sin_tilde || '\M', r.con_tilde, 'g');
  end loop;

  return v;

end;
$$;

grant execute on function public.normalizar_lugar(text) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 2. Normalizar el catálogo (la raíz del problema)
-- ---------------------------------------------------------------------

update public.municipalities
set name = public.normalizar_lugar(name)
where name is not null
  and name <> public.normalizar_lugar(name);


-- ---------------------------------------------------------------------
-- 3. Normalizar el texto libre que copió el formato viejo
-- ---------------------------------------------------------------------

update public.candidate_profiles
set municipality = public.normalizar_lugar(municipality)
where municipality is not null
  and trim(municipality) <> ''
  and municipality <> public.normalizar_lugar(municipality);

update public.candidate_profiles
set department = public.normalizar_lugar(department)
where department is not null
  and trim(department) <> ''
  and department <> public.normalizar_lugar(department);


-- ---------------------------------------------------------------------
-- Verificación (correr aparte después de la migración):
--
-- select name from public.municipalities order by name limit 50;
--
-- Si alguna tilde puntual faltara (nombre poco común fuera del
-- diccionario), se corrige con un UPDATE individual, por ejemplo:
-- update public.municipalities set name = 'Nombre Correcto'
-- where name = 'Nombre Sin Tilde';
-- ---------------------------------------------------------------------
