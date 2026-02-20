import { db } from "@/lib/firebase/firebase";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";

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
