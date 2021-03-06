import { useContext, useEffect, useRef, useState } from "react";

import { Book } from "services/comic-release/models/book";
import { collectionName } from "services/comic-release/constants";
import { FirebaseContext } from "contexts";
import { tokenize } from "utils/text-processor";

type SearchOptions = {
  limit?: number;
};
const defaultOptions: Required<SearchOptions> = {
  limit: 30,
};

const buildQuery = (
  collection: firebase.firestore.CollectionReference,
  q: string,
  options: Required<SearchOptions>
) => {
  let query = collection.limit(options.limit);

  tokenize(q).forEach((token) => {
    query = query.where(`tokenMap.${token}`, "==", true);
  });

  return query;
};

const useBookSearch = (q: string, options?: SearchOptions) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const firebaseRef = useRef(useContext(FirebaseContext));
  const optionsRef = useRef({ ...defaultOptions, ...options });

  useEffect(() => {
    const { db } = firebaseRef.current;
    if (!db) throw new Error("Firestore is not initialized");
    const collection = db.collection(collectionName.books);
    const query = buildQuery(collection, q, optionsRef.current);

    const load = async () => {
      if (q.length >= 1) {
        setLoading(true);
        try {
          const snap = await query.get();
          const booksData = snap.docs.map((doc) => ({
            ...(doc.data() as Book),
            id: doc.id,
          }));
          setBooks(booksData);
          setError(null);
        } catch (err) {
          setError(err);
        }
        setLoading(false);
      } else {
        setBooks([]);
      }
    };

    load();
  }, [q]);

  return { books, loading, error };
};

export default useBookSearch;
