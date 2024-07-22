const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");
const routes = require("./routes/api")

const axiosClient = axios.create({
  baseURL: "https://json-server-c67opnddza-el.a.run.app",
});

app.use(cors());
app.use(express.json());

app.use("/api",routes);
app.use((err,req,res,next)=>{
  console.log(err);
  next()
})

app.listen(5000, () => {
  console.log("Server is listening on port 5000.");
});
