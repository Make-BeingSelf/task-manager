const jwt = require("jsonwebtoken"); //validate token
const User = require("../models/user"); // 유저 정보 조회

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({
      _id: decoded._id,
      "tokens.token": token,
    }); // 'tokens.token':token -> 여전히 유효한 토큰인지 검증

    if (!user) {
      throw new Error();
    }
    // 객체를 사전에 미리 설정하므로써 추후에 다룰 때(업데이트, 삭제) 큰 편의를 제공
    req.token = token; // 로그인한 해당 환경에 대한 토큰 // 특정 클라이언트(기기)에 존재하는 토큰만을 부분적으로 삭제하기
    req.user = user; //해당 user 정보 제공
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate." });
  }
};

module.exports = auth;
