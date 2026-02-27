import express from "express";
import dotenv from "dotenv";
import revisionYearRoutes from "./routes/revisionYear.js";
import propertyRoutes from "./routes/property.js";
import locationalRoutes from "./routes/locational.js";
import smvRoutes from "./routes/smv.js";
import bkmtRoutes from "./routes/bkmt.js";
import pmlRoutes from "./routes/masterList.js";
import faasRoutes from "./routes/faas.js";
import tdRoutes from "./routes/td.js";
import tcRoutes from "./routes/tc.js";
import olRoutes from "./routes/owner.js"
import baiRoutes from "./routes/bai.js"
import loiRoutes from "./routes/loi.js"
import userRoutes from "./routes/users.js"
import cors from "cors";

dotenv.config();
const app = express();

app.use(cors({}));

app.use(express.json()); // parse JSON bodies
app.use("/ry", revisionYearRoutes);
app.use("/p", propertyRoutes);
app.use("/lvg", locationalRoutes);
app.use("/smv", smvRoutes);
app.use("/bkmt", bkmtRoutes);
app.use("/pml", pmlRoutes);
app.use("/faas", faasRoutes);
app.use("/td", tdRoutes);
app.use("/tc", tcRoutes);
app.use("/ol", olRoutes);
app.use("/bai", baiRoutes);
app.use("/loi", loiRoutes);
app.use('/user', userRoutes);

app.listen(process.env.PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${process.env.PORT}`);
});
