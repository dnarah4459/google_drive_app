const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const supabase = require("../config/supabase/supabase.js");

async function createNewUser(firstName, lastName, email, salt, hash, res) {
  try {
    const newUser = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        salt,
        hash,
      },
    });
    return newUser;
  } catch (error) {
    console.error("Error creating new user:", error);
    res.status(500).json({ error: "Failed to create new user" });
  }
}

async function getAllFolders(userId, res) {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId },
    });
    return folders;
  } catch (error) {
    console.error("Error fetching folders:", error);
    res.status(500).json({ error: "Failed to fetch folders" });
  }
}

async function insertNewFolder(folderName, userId, res) {
  try {
    const newFolder = await prisma.folder.create({
      data: {
        name: folderName,
        userId,
      },
    });
    return newFolder;
  } catch (error) {
    console.error("Error inserting new folder:", error);
    res.status(500).json({ error: "Failed to insert new folder" });
  }
}

async function insertNewFile(
  fileName,
  fileType,
  fileSize,
  fullPath,
  userId,
  folderId,
  res
) {
  try {
    const newFile = await prisma.file.create({
      data: {
        name: fileName,
        fileType: fileType,
        fileSize: fileSize,
        location_supabase: fullPath,
        userId: userId,
        folderId: folderId,
      },
    });
    return newFile;
  } catch (error) {
    console.error("Error inserting new file:", error);
    res.status(500).json({ error: "Failed to insert new file" });
  }
}

async function getAllFilesSpecificFolder(folderId) {
  try {
    const files = await prisma.file.findMany({
      where: { folderId },
    });
    return files;
  } catch (error) {
    console.error("Error fetching files:", error);
    throw new Error("Failed to fetch files");
  }
}

async function getAllFilesNoFolder() {
  try {
    const files = await prisma.file.findMany({
      where: { folderId: null },
    });
    return files;
  } catch (error) {
    throw new Error("Failed to fetch files");
  }
}

async function getSpecificFolder(folderId) {
  try {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder) {
      console.error(`Folder with ID ${folderId} not found.`);
      return null; // Return null if the folder is not found
    }

    return folder;
  } catch (error) {
    console.error("Error fetching specific folder:", error);
    throw new Error("Failed to get folder ID");
  }
}


async function deleteFileById(idVal) {
  try {
      const deletedFile = await prisma.file.delete({
        where: {id: idVal}
      })

      const supabase_filePath = deletedFile.location_supabase; 

      await supabase.deleteFile(supabase_filePath); 
  } catch (error) {
    
  }
}

async function getFileById(idVal) {
  try {
      const file = await prisma.file.findFirst({
        where: {id: idVal}
      })

     return file; 
  } catch (error) {
    
  }
}


async function deleteFolderById(idVal) {
  try {
    const folder = await prisma.folder.delete({
      where: {id: idVal},
    })
    const allFiles = await prisma.file.deleteMany({
      where: {folderId: idVal}
    })

    allFiles.forEach(async (file) => {
      await supabase.deleteFile(file.location_supabase)
    })
  } catch (error) {
  } 
}


module.exports = {
  createNewUser,
  getAllFolders,
  insertNewFolder,
  insertNewFile,
  getAllFilesSpecificFolder,
  getAllFilesNoFolder,
  getSpecificFolder,
  deleteFileById,
  deleteFolderById, 
  getFileById
};
