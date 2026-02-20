import cities from "@/lib/geodata/cities.json";

/**
 * Generates a "Smart ID" for a course entry.
 * @param {Object} course - The course data object.
 * @returns {string} - The formatted Smart ID (e.g., "FRA-M-FI-22313")
 */
export function generateSmartID(course) {
  // 1. Map City to 3-letter code
  const cityEntry = cities.find((c) => c.city_DE === course.location);

  const cityCode =
    cityEntry?.["UN/LOCODE"] ||
    (course.location ? course.location.substring(0, 3).toUpperCase() : "UNK");

  // 2. Map Degree Level to 1-letter code
  const levelCode =
    course.degree && course.degree.startsWith("Bachelor") ? "B" : "M";

  // 3. Map Subject to 2-letter code
  const getSubjectCode = (title) => {
    if (!title) return "GN";
    const t = title.toLowerCase();
    if (t.includes("computer") || t.includes("data")) return "CS";
    if (t.includes("finance") || t.includes("management")) return "BM"; // Business/Mgmt
    if (t.includes("business") || t.includes("communication")) return "BC"; // Business/Comm
    if (t.includes("soziale") || t.includes("pädagogik")) return "SW"; // Social Work
    if (t.includes("health") || t.includes("biomedical")) return "HE"; // Health
    return "GN"; // General
  };
  const subjectCode = getSubjectCode(course.title);

  // 4. Combine with the original ID
  return `${cityCode}-${levelCode}-${subjectCode}-${course.id}`;
}
