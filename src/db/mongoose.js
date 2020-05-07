const mongoose = require("mongoose");

// connect 형태, 주소:port/db name,{option}
mongoose.connect(process.env.MONGODB_URL, {
  useNewUrlParser: true,
  useCreateIndex: true,
  useFindAndModify: false, //address the deprecation warning 안뜨게함
});

// const Study = new Task({
//   name: "Study",
//   description: "Focusing Something Healthy",
// });
// Study.save()
//   .then(() => {
//     console.log(Study);
//   })
//   .catch((error) => {
//     console.log("Error", error);
//   });
