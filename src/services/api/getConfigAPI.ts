import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../firebase";
import { CONFIG_COLLECTION } from "../../constants/collections";
import { API_SETTINGS_DOC } from "../../constants/values";

interface APISettings {
  baseURL: string;
}

const getConfigAPI = async (): Promise<{
  baseURL: string;
}> => {
  const docRefConfig = doc(db, CONFIG_COLLECTION, API_SETTINGS_DOC);
  const settings: APISettings = (
    await getDoc(docRefConfig)
  ).data() as APISettings;

  return settings;
};

export default getConfigAPI;
