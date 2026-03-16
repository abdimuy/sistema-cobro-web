import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { USERS_COLLECTION } from "../constants/collections";
import { Cobrador } from "./useGetCobradores";

const useGetUser = (uid: string | undefined) => {
  const [user, setUser] = useState<Cobrador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!uid) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(doc(db, USERS_COLLECTION, uid), (snapshot) => {
      if (snapshot.exists()) {
        setUser({ ...snapshot.data(), ID: snapshot.id } as Cobrador);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [uid]);

  return { user, isLoading };
};

export default useGetUser;
