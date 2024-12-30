const express = require("express");
const multer = require("multer");
const path = require("path");
const isAuth = require("../config/auth/authMiddleware.js").isAuth;
const crypto = require("crypto");

const genPassword = require("../config/auth/passportUtils.js").genPassword;
const validPassword = require("../config/auth/passportUtils.js").validPassword;
const {
  supabase,
  supabaseFunctions,
} = require("../config/supabase/supabase.js");

const passport = require("passport");
const db = require("../prisma/queries.js");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const main = express.Router();

main.get("/", (req, res) => {
  res.redirect("/sign-up");
});

main.get("/sign-in", (req, res) => {
  res.render("sign-in");
});

main.get("/sign-up", async (req, res) => {
  res.render("sign-up");
});

main.post(
  "/sign-in",
  passport.authenticate("local", {
    failureRedirect: "/sign-in",
    successRedirect: "/dashboard",
  })
);

main.post("/sign-up", async (req, res) => {
  const { first_name, last_name, email, password, confirm_password } = req.body;

  const saltHash = genPassword(password);
  const salt = saltHash.salt;
  const hash = saltHash.hash;

  await db.createNewUser(first_name, last_name, email, salt, hash, res);
  res.redirect("/sign-in");
});

main.get("/dashboard", isAuth, async (req, res) => {
  const currentUser = req.user;
  const allFolders = await db.getAllFolders(req.user.id, res);
  const allFiles = await db.getAllFilesNoFolder();

  const allFoldersWithFileSize = await Promise.all(
    allFolders.map(async (folder) => {
      const folderFiles = await db.getAllFilesSpecificFolder(folder.id);
      const fileSize = folderFiles.reduce(
        (total, file) => Number(total) + Number(file.fileSize),
        0
      );
      return {
        ...folder,
        fileSize,
      };
    })
  );

  res.render("dashboard", {
    currentUser: currentUser,
    userFolders: allFoldersWithFileSize,
    allFiles: allFiles,
  });
});

main.post("/new-folder", isAuth, async (req, res) => {
  const { folder_name } = req.body;
  const currentUserId = req.user.id;
  await db.insertNewFolder(folder_name, currentUserId, res);
  res.redirect("/dashboard");
});

main.post("/new-file", isAuth, upload.single("file"), async (req, res) => {
  try {
    const currentUser = req.user;
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const fileName = req.body.file_name + "_" + generateUniqueHash();
    const fileType = file.mimetype;
    const fileSize = file.size;

    const data = await supabaseFunctions.uploadFile(
      file.buffer,
      fileName,
      fileType
    );

    await db.insertNewFile(
      fileName,
      fileType,
      fileSize,
      data.path,
      currentUser.id,
      null,
      res
    );

    res.redirect("/dashboard");
  } catch (error) {
    console.error("Error during file upload:", error);
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

main.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

main.get("/dashboard/:folderId", isAuth, async (req, res) => {
  let folderId = req.params.folderId;
  folderId = Number(folderId);
  const allFilesFolder = await db.getAllFilesSpecificFolder(folderId);
  const folderInfo = await db.getSpecificFolder(folderId);
  const currentUser = req.user;

  res.render("dashboard_folder", {
    folder: folderInfo,
    folderSpecificFiles: allFilesFolder,
    currentUser: currentUser,
  });
});

main.post(
  "/new-file-folder/:id",
  isAuth,
  upload.single("file"),
  async (req, res) => {
    try {
      const currentUser = req.user;
      const folderId = Number(req.params.id);
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileName = req.body.file_name + "_" + generateUniqueHash();
      const fileType = file.mimetype;
      const fileSize = file.size;

      const data = await supabaseFunctions.uploadFile(
        file.buffer,
        fileName,
        fileType
      );

      await db.insertNewFile(
        fileName,
        fileType,
        fileSize,
        data.path,
        currentUser.id,
        folderId,
        res
      );

      res.redirect(`/dashboard/${folderId}`);
    } catch (error) {
      console.error("Error during file upload:", error);
      res.status(500).json({ error: error.message || "Something went wrong" });
    }
  }
);

main.get("/delete-file/:id", async (req, res) => {
  try {
    const fileId = Number(req.params.id);
    console.log(fileId);
    await db.deleteFileById(fileId);
    res.redirect('/dashboard'); 
  } catch (error) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});

main.get("/delete-folder/:id", async (req, res) => {
  try {
    const folderId = Number(req.params.id);
    await db.deleteFolderById(folderId);
    res.redirect('/dashboard');
  } catch (error) {
    res.status(500).json({ error: error.message || "Something went wrong" });
  }
});


main.get("/delete-file-folder/:fileId/:folderId", async (req, res) => {
  const fileId = Number(req.params.fileId); 
  const folderId = Number(req.params.folderId); 
  await db.deleteFileById(fileId); 
  res.redirect(`/dashboard/${folderId}`); 
})


main.get('/file-information/:fileId', async (req, res) => {
  try {
    const fileId = Number(req.params.fileId); 
    const fullFileInformation = await db.getFileById(fileId); 
    const supabaseLocation = fullFileInformation.location_supabase; 
    return res.json({supabaseLocation}); 
  } catch (error) {
    
  }
})

module.exports = main;

//generate unique hash function
function generateUniqueHash() {
  const timestamp = Date.now();
  const randomValue = Math.random().toString(36).substr(2);
  const hash = crypto.createHash("sha256");
  hash.update(timestamp + randomValue);
  return hash.digest("hex");
}


//It is bascially like this. The frontend simply 