const express = require("express");
const User = require("../models/user");
const auth = require("../middleware/auth");
const multer = require("multer");
const sharp = require("sharp");
const { sendWelcomeEmail, SendcancelationEmail } = require("../emails/account");
const router = new express.Router();
// async/await을 통해 보다 간결한 코드를 작성: user.save().then(()=>{}).catch(()=>{})
router.post("/users", async (req, res) => {
  const user = new User(req.body);
  try {
    await user.save();
    sendWelcomeEmail(user.email, user.name);
    const token = await user.generateAuthToken();
    res.status(201).send({ user, token }); //보다 명확한 status 결과를 위한 작업 기본적으로 200만 뜸
  } catch (err) {
    res.status(400).send(err); // status명령어는  send 명령어 전에 보내야함
  }
});

router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    ); // verify e-mail, password -> return true/false
    const token = await user.generateAuthToken(); // user 개인의 token을 가져와야하는 것이기 때문에
    res.send({ user, token });
  } catch (err) {
    res.status(400).send();
  }
});
// 특정 클라이언트(기기)에 존재하는 토큰만을 부분적으로 삭제하기
router.post("/users/logout", auth, async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token; // 해당 토큰만을 필터링하여 삭제함
    });
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();
    res.send();
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  res.send(req.user);
});

// const _id = req.params.id; // 자동으로 stringID를 ObjectID로 전환시켜준다.

router.patch("/users/me", auth, async (req, res) => {
  // 명시하지 않으면 200으로 대답하고 존재하지 않는 속성값 변경은 무시된다.
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "email", "password", "age"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    // db에 직접 처리하는 명령(save작업이 별도로 실행되지 않음)이라 middleware가 실행되지 않는다.
    // destructuring을 이용해여 자동으로 원하는 요소들 변경하게 하면 된다. req.body
    // option
    // const user = await User.findByIdAndUpdate(_id, req.body, {
    //   new: true, // new: true 실제로 있는 값을 변경하는지 확인
    //   runValidators: true, // runValidators: true validation이 제대로, 명확히 작동하는지 명확히하기 양식에 맞춰서 변경을 시도하는 것인지 확인하기
    // });
    const user = req.user;
    updates.forEach((update) => (user[update] = req.body[update])); // update되는 property를 모르므로 dot(.) notation을 사용할 수 없다.
    await user.save(); // middle way작동
    res.send(user);
  } catch (err) {
    res.status(400).send(err);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  try {
    //auth를 통해 검증했으므로 예외구문은 작성하지 않는다.
    await req.user.remove();
    SendcancelationEmail(req.user.email, req.user.name); // remove해도 req에는 아직 정보가 존재함
    res.send(req.user);
  } catch (err) {
    res.status(500).send(err);
  }
});

const upload = multer({
  // dest: "avatars", 해당 명령어가 없으면 file이 post함수 쪽으로 간다
  limits: {
    fileSize: 1000000,
  },
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg,png)$/)) {
      return cb(new Error("File must be a Image"));
    }
    cb(undefined, true);
  },
});

router.post(
  "/users/me/avatar",
  auth,
  upload.single("avatar"),
  async (req, res) => {
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();
    req.user.avatar = buffer; //buffer: binary
    await req.user.save();
    res.send();
  },
  (error, req, res, next) => {
    // error handler: 에러 메시지 가공하기 - 네개의 argu가 call 시그니쳐이다./
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  req.user.avatar = undefined; //buffer: binary
  await req.user.save();
  res.send();
});

// router.get("/users/:id/avatar", async (req, res) => {
//   try {
//     if (!user || !user.avatar) {
//       throw new Error();
//     }
//     res.set("Content-Type", "image/png"); // 어떠한 타입의 데이터로 돌려줄 것인가? set response header  (set하려는 대상-header 종류, 반환할 데이터 타입)
//     res.send(user.avatar);
//   } catch (err) {
//     res.status(404).send();
//   }
// });

module.exports = router;
