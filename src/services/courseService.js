import { db } from "@/lib/firebase/firebase";
import {
  collection,
  getDocs,
  doc,
  writeBatch,
  onSnapshot,
} from "firebase/firestore";

const COLLECTION_NAME = "courses";

export const saveCoursesToDB = async (rows, onProgress) => {
  if (!rows || rows.length === 0) return;

  const batch = writeBatch(db);
  const coursesRef = collection(db, COLLECTION_NAME);

  rows.forEach((row, index) => {
    // using the row.id as the document ID for easy updates/reference
    const docRef = doc(coursesRef, String(row.id));
    batch.set(docRef, row, { merge: true });

    if (onProgress) {
      onProgress(index + 1, rows.length);
    }
  });

  await batch.commit();
};

export const loadCoursesFromDB = async () => {
  const coursesRef = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(coursesRef);

  if (snapshot.empty) {
    return [];
  }

  const courses = [];
  snapshot.forEach((doc) => {
    courses.push({ id: doc.id, ...doc.data() });
  });

  return courses;
};

/**
 * Setup a real-time listener on the courses collection.
 * @param {function} onUpdate Callback function that receives the array of courses
 * @returns {function} Unsubscribe function to detach the listener
 */
export const listenToCoursesDB = (onUpdate) => {
  const coursesRef = collection(db, COLLECTION_NAME);

  return onSnapshot(
    coursesRef,
    (snapshot) => {
      const courses = [];
      snapshot.forEach((doc) => {
        courses.push({ id: doc.id, ...doc.data() });
      });
      onUpdate(courses);
    },
    (error) => {
      console.error("Error listening to courses:", error);
    },
  );
};

/**
 * Update the scrape_status field for multiple courses.
 * @param {Array<string>} rowIds Array of course document IDs
 * @param {string} status The new status (e.g. 'PENDING_SCRAPE')
 */
export const updateCourseStatus = async (rowIds, status) => {
  if (!rowIds || rowIds.length === 0) return;

  const batch = writeBatch(db);
  const coursesRef = collection(db, COLLECTION_NAME);

  rowIds.forEach((id) => {
    const docRef = doc(coursesRef, String(id));
    batch.update(docRef, { scrape_status: status });
  });

  await batch.commit();
};
