import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import JobForm from "./JobForm";

import {
  getJobCategories,
  getEmploymentTypes,
  getEducationLevels,
  createJob,
  getMyJobCredits,
} from "../../services/jobService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../../services/locationService";

import { getMyCompanyContext } from "../../services/teamService";

import { salarioANumero } from "../../utils/formatSalary";

import {
  fechaCompromisoPorDefecto,
  fechaMaximaCompromiso,
  DIAS_VIGENCIA,
} from "../../utils/resolution";

const initialForm = {
  title: "",
  category_id: "",
  employment_type_id: "",
  education_level_id: "",
  work_mode: "",
  experience_level: "",
  contract_type: "",
  is_urgent: false,
  department_id: "",
  municipality_id: "",
  vacancies: 1,
  salary: "",
  salary_top: "",
  resolution_deadline: fechaCompromisoPorDefecto(),
  scheduled_publish_at: "",
  description: "",
  requirements: "",
  benefits: "",
};

function CreateJob() {

  const navigate = useNavigate();

  const [form, setForm] = useState(initialForm);

  const [categories, setCategories] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [creditos, setCreditos] = useState(null);

  useEffect(() => {

    loadCatalogs();
    getMyJobCredits().then(({ data }) => setCreditos(data));

  }, []);

  useEffect(() => {

    loadMunicipalities(form.department_id);

  }, [form.department_id]);

  async function loadCatalogs() {

    const [
      categoriesRes,
      employmentRes,
      educationRes,
      departmentsRes,
    ] = await Promise.all([
      getJobCategories(),
      getEmploymentTypes(),
      getEducationLevels(),
      getDepartments(),
    ]);

    setCategories(categoriesRes.data || []);
    setEmploymentTypes(employmentRes.data || []);
    setEducationLevels(educationRes.data || []);
    setDepartments(departmentsRes.data || []);

  }

  async function loadMunicipalities(departmentId) {

    const { data } =
      await getMunicipalitiesByDepartment(departmentId);

    setMunicipalities(data || []);

  }

  function handleChange(e) {

    setForm({

      ...form,

      [e.target.name]: e.target.value,

    });

  }

  async function handleSubmit() {

    setLoading(true);

    try {

      /* Multi-usuario: dueño o reclutador de la empresa */
      const { company, role, error: companyError } =
        await getMyCompanyContext();

      if (role === "observador") {

        alert(
          "Tu rol es de solo lectura (observador): " +
          "no puedes publicar vacantes."
        );

        return;

      }

      if (companyError || !company) {

        alert(
          "No se encontró el perfil de tu empresa. " +
          "Completa tu perfil antes de publicar una vacante."
        );

        return;

      }

      const { salary, salary_top, scheduled_publish_at, ...fields } = form;

      const salario = salarioANumero(salary);
      const salarioTecho = salarioANumero(salary_top);

      /* Reglas de ChanceGT: sin salario y sin fecha de compromiso
         no se publica. La base de datos tambien lo valida (ver
         055_compromiso_de_respuesta.sql); esto solo es para dar
         un mensaje claro antes de mandar el insert. */
      if (!salario || salario <= 0) {
        alert(
          "Toda vacante en ChanceGT debe indicar el salario mensual. " +
          "Es lo que nos diferencia de la competencia."
        );
        return;
      }

      if (!fields.resolution_deadline) {
        alert(
          "Indica la fecha en la que te comprometes a resolver el proceso."
        );
        return;
      }

      if (salarioTecho && salarioTecho < salario) {
        alert(
          "El salario máximo no puede ser menor que el salario mensual."
        );
        return;
      }

      /* El compromiso no puede pasarse de la vigencia comprada.
         La base de datos también lo valida (057). */
      const topeCompromiso = fechaMaximaCompromiso(
        scheduled_publish_at || null
      );

      if (fields.resolution_deadline.slice(0, 10) > topeCompromiso) {
        alert(
          `Tu publicación dura ${DIAS_VIGENCIA} días, así que la fecha ` +
          "de compromiso no puede pasar de esa vigencia. Si necesitas " +
          "más tiempo, republica la vacante o usa un crédito nuevo."
        );
        return;
      }

      const fechaProgramada = scheduled_publish_at
        ? new Date(scheduled_publish_at)
        : null;

      const estaProgramada =
        fechaProgramada && fechaProgramada.getTime() > Date.now();

      /* La fecha de compromiso tiene que ser POSTERIOR al dia en que
         la vacante se publica; si no, nace vencida. */
      if (
        estaProgramada &&
        new Date(`${fields.resolution_deadline}T23:59:59`) <= fechaProgramada
      ) {
        alert(
          "La fecha en la que te comprometes a resolver debe ser " +
          "posterior a la fecha programada de publicación."
        );
        return;
      }

      const job = {
        company_id: company.id,
        ...fields,
        salary_min: salario,
        salary_max: salarioTecho && salarioTecho > salario
          ? salarioTecho
          : salario,
        status: estaProgramada ? "scheduled" : "published",
        published_at: estaProgramada ? null : new Date().toISOString(),
        scheduled_publish_at: estaProgramada
          ? fechaProgramada.toISOString()
          : null,
      };

      const { error } = await createJob(job);

      if (error) {

        alert(error.message);

        return;

      }

      alert("Vacante publicada correctamente.");

      navigate("/empresa/dashboard");

    } finally {

      setLoading(false);

    }

  }

  return (

    <JobForm

      form={form}

      categories={categories}

      employmentTypes={employmentTypes}

      educationLevels={educationLevels}

      departments={departments}

      municipalities={municipalities}

      loading={loading}

      onChange={handleChange}

      onSubmit={handleSubmit}

      creditos={creditos}

    />

  );

}

export default CreateJob;
