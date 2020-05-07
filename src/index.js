// start point
const express = require("express");
require("./db/mongoose"); //mongoose connects to the database
const userRouter = require("./routers/user");
const taskRouter = require("./routers/task");

const app = express();
const port = process.env.PORT;

// app.use((req, res, next) => {
//   res.status(503).send("Site is currently down. Check back soon!");
// });

//요청 정보를 쉽게 접근하기: 자동적으로 json 입력값을 parse해줌
app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
  console.log("Server is up on port " + port);
});
