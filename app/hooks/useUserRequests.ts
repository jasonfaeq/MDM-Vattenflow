import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Request } from "@/types";
import { useAuth } from "@/lib/auth";

export const useUserRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setRequests([]);
      setFilteredRequests([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Set up real-time listener
      const requestsRef = collection(db, "requests");
      const q = query(
        requestsRef,
        where("requesterId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribe = onSnapshot(
        q,
        (querySnapshot) => {
          const requestsData = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as Request[];

          setRequests(requestsData);
          setFilteredRequests(requestsData);
          setLoading(false);
        },
        (err) => {
          console.error("Error getting documents: ", err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Clean up the listener on unmount
      return () => unsubscribe();
    } catch (err) {
      console.error("Error setting up listener: ", err);
      setError(err as Error);
      setLoading(false);
    }
  }, [user]);

  const applyFilters = (filters: {
    requestType?: string;
    status?: string;
    dateRange?: [Date | null, Date | null];
  }) => {
    let filtered = [...requests];

    if (filters.requestType && filters.requestType !== "All") {
      filtered = filtered.filter(
        (req) => req.requestType === filters.requestType
      );
    }

    if (filters.status && filters.status !== "All") {
      filtered = filtered.filter((req) => req.status === filters.status);
    }

    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = filters.dateRange[0];
      const endDate = filters.dateRange[1];

      filtered = filtered.filter((req) => {
        const createdDate = req.createdAt.toDate();
        return createdDate >= startDate && createdDate <= endDate;
      });
    }

    setFilteredRequests(filtered);
  };

  return {
    userRequests: filteredRequests,
    isLoading: loading,
    error,
    applyFilters,
  };
};

export default useUserRequests;
