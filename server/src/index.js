import dotenv from "dotenv";
import { createApp } from "./api/app.js";

dotenv.config();

const app = createApp();

const PORT = process.env.PORT || 8888;

app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});
