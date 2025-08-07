import { doc, deleteDoc } from "firebase/firestore";
import { db } from "../../../firebase";

export const deletePago = async (id: string) => {
  try {
    await deleteDoc(doc(db, "pagos", id));
  } catch (error) {
    console.log("Error deleting document:", error);
  }
};
