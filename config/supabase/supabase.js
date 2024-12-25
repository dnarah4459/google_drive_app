require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

//supabase client to interact with supabase
const supabase = createClient(
  "https://ratfpgqhedajbxfquhso.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhdGZwZ3FoZWRhamJ4ZnF1aHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQwMjUzMDgsImV4cCI6MjA0OTYwMTMwOH0.1sA3imdnV2_9QGl_Q7cxO1UJXwGbJ0VKglTv2GDQlpM"
);``

const supabaseFunctions = {
  uploadFile: async (file, fileName, fileType) => {
    const { data, error } = await supabase.storage
      .from("files")
      .upload(fileName, file, {
        contentType: fileType,
        upsert: false,
      });

    
    if (error) {
      console.error("Error uploading file:", error);
      throw new Error(error.message); // Throws an error if upload fails
    }

    return data; 
  },
  deleteFile: async (filePath) => {
    const { data, error } = await supabase.storage.from('files').deleteFile(filePath); 
    return data; 
  },
  downloadFile: async (filePath) => {
      const { data, error } = await supabase.storage.from("files").download(filePath)
      const fileURL = URL.createObjectURL(data); 
      const link = document.createElement('a'); 
      link.href = fileURL;
      link.download = filePath.split('/').pop(); 
      link.click(); 
      URL.revokeObjectURL(fileURL);
  }
};

module.exports = supabaseFunctions;