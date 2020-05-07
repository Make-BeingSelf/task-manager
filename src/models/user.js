const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Task = require("./task");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true, // 필수
      trim: true, // space처리
    },
    email: {
      type: String,
      unique: true, //유일한 값을 갖게함. 중복을 허용하지 않음
      required: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Email is invalid.");
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 7,
      validate(value) {
        if (value.toLowerCase().includes("password")) {
          throw new Error("Password cannot contain 'password'.");
        }
      },
    },
    age: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number.");
        }
      },
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
    avatar: {
      type: Buffer, // binary - image
    },
  },
  {
    timestamps: true, // created, updated time
  }
);

// task와 user(owner) 사이의 관계를 나타내기 위한 가상 특성
userSchema.virtual("tasks", {
  // virtual property(relationship between two entities) not in db
  // local field(user id) is a relationship between task and task owner
  ref: "Task", // ->populate
  localField: "_id", // 내부 db(user)
  foreignField: "owner", // 외부 db(task)
});

// 제한된 정보만을 노출시킴
userSchema.methods.toJSON = function () {
  // toJSON을 통해 별다른 호출없이도 해당 객체에 자동으로 수행하게함
  const user = this;
  const userObject = user.toObject();

  delete userObject.password;
  delete userObject.tokens;
  delete userObject.avatar;

  return userObject;
};

// 권한 부여
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Login
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Unable to login");
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error("Unable to login");
  }
  return user;
};

// hash befor saving
// pre('event name', function) // binding(this= save할 대상)을 사용해야함(arrow function불가)
userSchema.pre("save", async function (next) {
  const user = this; // access to individual user to be saved

  // 이미 hash가 되어있는지 확인
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// delet user tasks when user is removed
userSchema.pre("remove", async function (next) {
  const user = this;
  await Task.deleteMany({ owner: user._id });
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
