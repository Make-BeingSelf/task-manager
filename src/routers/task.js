const express = require("express");
const Task = require("../models/task");
const auth = require("../middleware/auth");
const router = new express.Router();

// task 생성
router.post("/tasks", auth, async (req, res) => {
  const task = new Task({
    ...req.body,
    owner: req.user._id,
  });

  try {
    await task.save();
    res.status(201).send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

// task 전체 조회 // tasks?completed=true
// tasks?limit=10&skip=10
// tasks?sortBy=createdAt:asc/desc -> special char to break it into its two component
// sortBy=정렬기준:정렬순서
router.get("/tasks", auth, async (req, res) => {
  const match = {};
  const sort = {};

  if (req.query.completed) {
    match.completed = req.query.completed === "true";
  }

  if (req.query.sortBy) {
    const parts = req.query.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1; // 삼항 연산 if ~ ? true: false
  }
  try {
    await req.user
      .populate({
        path: "tasks",
        match,
        options: {
          limit: parseInt(req.query.limit), // string to integer
          skip: parseInt(req.query.skip),
          sort, // asc: 1, desc: -1
          // completed: 1: imcompleted/-1: completed  - 오름차순, 내림차순 개념으로 봐야한다.
        },
      })
      .execPopulate(); // take owner and convert it from id to entire info

    //const tasks = await Task.find({ owner: req.user._id });
    res.send(req.user.tasks);
    // await req.user.populate('tasks').execPopulate()
    // res.send(req.user.tasks)
  } catch (err) {
    res.status(500).send();
  }
});

// 특정 task 조회
router.get("/tasks/:id", auth, async (req, res) => {
  const _id = req.params.id;

  try {
    const task = await Task.findOne({ _id, owner: req.user._id }); // 작성자만 조회할 수 있게
    if (!task) {
      return res.status(404).send(); // 작성자가 아닐 수 있으므로 예외문이 존재해야 한다.
    }
    res.status(201).send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

// task update
router.patch("/tasks/:id", auth, async (req, res) => {
  const updates = Object.keys(req.body);
  const allowedUpdates = ["name", "description", "completed"];
  const isValidOperation = updates.every((update) =>
    allowedUpdates.includes(update)
  );

  if (!isValidOperation) {
    return res.status(400).send({ error: "Invalid updates!" });
  }

  try {
    const task = await Task.findOne({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    updates.forEach((update) => (task[update] = req.body[update]));
    await task.save();
    res.send(task);
  } catch (err) {
    res.status(400).send(err);
  }

  // const _id = req.params.id;
  // try {
  //   const task = await Task.findByIdAndUpdate(_id, req.body, {
  //     new: true,
  //     runValidators: true,
  //   });
  //   if (!task) {
  //     return res.status(404).send();
  //   }
  //   res.send(task);
  // }
});

// task delete
router.delete("/tasks/:id", auth, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });
    if (!task) {
      return res.status(404).send();
    }
    res.send(task);
  } catch (err) {
    res.status(500).send(err);
  }
});

module.exports = router;
