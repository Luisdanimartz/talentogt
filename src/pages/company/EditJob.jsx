import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import JobForm from "./JobForm";

import {
  getJobCategories,
  getEmploymentTypes,
  getEducationLevels,
  getJobById,
  updateJob,
} from "../../services/jobService";

import {
  getDepartments,
  getMunicipalitiesByDepartment,
} from "../../services/locationService";

import { formatMiles, salarioANumero } from "../../utils/formatSalary";

function EditJob() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);

  const [categories, setCategories] = useState([]);
  const [employmentTypes, setEmploymentTypes] = useState([]);
  const [educationLevels, setEducationLevels] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [municipalities, setMunicipalities] = useState([]);

  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {

    loadData();

  }, [id]);

  useEffect(() => {

    if (form?.department_id) {
      loadMunicipalities(form.department_id);
    }

  }, [form?.department_id]);

  async function loadData() {

    const [
      jobRes,
      categoriesRes,
      employmentRes,
      educationRes,
      departmentsRes,
    ] = await Promise.all([
      getJobById(id),
      getJobCategories(),
      getEmploymentTypes(),
      getEducationLevels(),
      getDepartments(),
    ]);

    if (jobRes.error || !jobRes.data) {
      setNotFound(true);
      return;
    }

    setForm({
      ...jobRes.data,
      salary: jobRes.data.salary_min
        ? formatMiles(jobRes.data.salary_min)
        : "",
    });

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

    const { name, value } = e.target;

    setForm((prev) => ({

      ...prev,

      [name]: value,

      ...(name === "department_id" ? { municipality_id: "" } : {}),

    }));

  }

  async function handleSubmit() {

    setLoading(true);

    const {
      id: jobId,
      company_profiles,
      created_at,
      updated_at,
      salary,
      ...editableFields
    } = form;

    const salario = salarioANumero(salary);

    const { error } = await updateJob(id, {
      ...editableFields,
      salary_min: salario,
      salary_max: salario,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Vacante actualizada correctamente.");

    navigate("/empresa/dashboard");

  }

  if (notFound) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Vacante no encontrada.</p>;
  }

  if (!form) {
    return <p style={{ textAlign: "center", marginTop: 40 }}>Cargando...</p>;
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

      isEdit

      onChange={handleChange}

      onSubmit={handleSubmit}

    />

  );

}

export default EditJob;
