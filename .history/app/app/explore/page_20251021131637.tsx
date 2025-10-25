"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

interface Dataset {
  id: string;
  title: string;
  description: string;
  file_name: string;
  file_url: string;
  uploader_id: string;
  created_at: string;
}

export default function ExplorePage() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchDatasets() {
    setLoading(true);
    const { data, error } = await supabase
      .from("datasets")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setDatasets(data || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchDatasets();

    // Refresh when new upload happens
    const refresh = () => fetchDatasets();
    window.addEventListener("datasetUploaded", refresh);
    return () => window.removeEventListener("datasetUploaded", refresh);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-gray-400">
        Loading datasets...
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {datasets.length === 0 ? (
        <p className="col-span-full text-center text-gray-400">
          No public datasets yet.
        </p>
      ) : (
        datasets.map((ds) => (
          <Card
            key={ds.id}
            className="bg-white/5 border border-gray-800 hover:border-gray-600 transition"
          >
            <CardHeader>
              <h3 className="text-lg font-semibold text-white line-clamp-1">
                {ds.title}
              </h3>
              <p className="text-gray-400 text-sm line-clamp-2">
                {ds.description}
              </p>
            </CardHeader>
            <CardContent className="mt-2">
              <a
                href={ds.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                📄 {ds.file_name}
              </a>
              <p className="text-xs text-gray-500 mt-1">
                Uploaded on {new Date(ds.created_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
