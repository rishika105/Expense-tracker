const express = require("express");
const { addExpense } = require("../controllers/expenseController");
const { auth } = require("../middlewares/auth");

const router = express.Router();

router.post("/add", auth, addExpense);


module.exports = router;
