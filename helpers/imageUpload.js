const multer = require('multer');
const path = require('path');

//Video Jotter Image Upload
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/uploads/' + req.user.id + '/');
    },
    filename: (req, file, callback) => {
        callback(null, req.user.id + '-'+Date.now()+ path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1000000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('posterUpload'); // Must be the name as the HTML file upload input

//Furniture Item Image Upload
const furnitureImageStorage = multer.diskStorage({
    destination: (req, file, callback) => { //file location
        callback(null, './public/furnitureUploads/');
    },
    filename: (req, file, callback) => { //filename
        console.log("This is the ", file)
        callback(null, req.user.id+'-'+Date.now() + path.extname(file.originalname));
    }
});
const imageUpload = multer({
    storage: furnitureImageStorage, //look up ^
    limits: {
        fileSize: 1500000 //file size
    },
    fileFilter: (req, file, callback) => { //function at the lowest
        checkFileType(file, callback);
    }
}).single('imageUpload'); // Id of the HTML Input for file image

//Review Image Upload
const reviewImageStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/reviewUploads/');
    },
    filename: (req, file, callback) => {
        callback(null, req.user.id+'-'+Date.now() + path.extname(file.originalname));
    }
});
const reviewImageUpload = multer({
    storage: reviewImageStorage,
    limits: {
        fileSize: 1500000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('reviewImageUpload'); // Must be the name as the HTML file upload input

//Theme Image Upload
const themeImageStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/themeUploads/');
    },
    filename: (req, file, callback) => {
        callback(null, req.user.id+'-'+Date.now() + path.extname(file.originalname));
    }
});
const themeImageUpload = multer({
    storage: themeImageStorage,
    limits: {
        fileSize: 1500000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('themeImageUpload'); // Must be the name as the HTML file upload input / key???

//Category Image Upload
const categoryImageStorage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, './public/categoryUploads/');
    },
    filename: (req, file, callback) => {
        callback(null, req.user.id+'-'+Date.now() + path.extname(file.originalname));
    }
});
const categoryImageUpload = multer({
    storage: categoryImageStorage,
    limits: {
        fileSize: 1500000
    },
    fileFilter: (req, file, callback) => {
        checkFileType(file, callback);
    }
}).single('categoryImageUpload'); // Must be the name as the HTML file upload input

// Check File Type
function checkFileType(file, callback) {
    // Allowed file extensions
    const filetypes = /jpeg|jpg|png|gif|webp/;
    // Test extension
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Test mime
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
        return callback(null, true);
    } else {
        callback({message: 'Images Only'});
    }
}
module.exports = {imageUpload, upload, reviewImageUpload, themeImageUpload, categoryImageUpload};
