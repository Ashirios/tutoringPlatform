import { useEffect, useState } from "react";
import { Navigation } from "../../components/Navigation/Navigation";
import styles from "./LMS.module.css";
import { API_URL, authFetch } from "../../api";
import { jwtDecode } from "jwt-decode";

export const LMS = () => {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [link, setLink] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.email === "adinai@gmail.com") {
          setTimeout(() => setIsAdmin(true), 1000);
        }
      } catch (e) {
        console.error(e);
      }
    }

    authFetch(`${API_URL}/api/lms`)
      .then((res) => {
        if (!res.ok) throw new Error(`Ошибка загрузки: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setMaterials(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setFetchError("Не удалось загрузить материалы. Попробуйте позже.");
        setLoading(false);
      });
  }, []);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name || !description || !link) {
      return setFormError("Заполните все поля");
    }

    try {
      const res = await authFetch(`${API_URL}/api/lms`, {
        method: "POST",
        body: JSON.stringify({ name, description, link }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Ошибка добавления");

      setMaterials([...materials, data]);
      setName("");
      setDescription("");
      setLink("");
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Удалить материал?")) return;

    try {
      const res = await authFetch(`${API_URL}/api/lms/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setMaterials((prev) => prev.filter((item) => item.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Ошибка удаления");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={styles.lmsPage}>
      <Navigation />

      {isAdmin && (
        <form onSubmit={handleAddMaterial} className="adminFormContainer adminForm lms">
          <h3>Добавить новый материал</h3>
          {formError && <p style={{ color: "red" }}>{formError}</p>}
          <input
            type="text"
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="text"
            placeholder="Описание"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            type="text"
            placeholder="Ссылка (https://...)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
          />
          <button className="adminSubmitBtn" type="submit">Добавить</button>
        </form>
      )}

      {loading ? (
        <p style={{ textAlign: "center", marginTop: "2rem" }}>Loading...</p>
      ) : fetchError ? (
        <p style={{ textAlign: "center", marginTop: "2rem", color: "red" }}>{fetchError}</p>
      ) : (
        <div className={styles.grid}>
          {materials.map((item) => (
            <div key={item.id} className={styles.card}>
              {isAdmin && (
                <button
                  className="deleteQuestionBtn"
                  onClick={() => handleDeleteMaterial(item.id)}
                >
                  🗑️
                </button>
              )}
              <h2 className="title">{item.name}</h2>
              <p>{item.description}</p>
              <a href={item.link} target="_blank" rel="noreferrer">
                View <span>⭢</span>
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
