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

      const { salary, scheduled_publish_at, ...fields } = form;

      const salario = salarioANumero(salary);

      const fechaProgramada = scheduled_publish_at
        ? new Date(scheduled_publish_at)
        : null;

      const estaProgramada =
        fechaProgramada && fechaProgramada.getTime() > Date.now();

      const job = {
        company_id: company.id,
        ...fields,
        salary_min: salario,
        salary_max: salario,
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
