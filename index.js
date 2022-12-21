import express from "express";
import cors from "cors";
import { StreamChat } from "stream-chat";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
const app = express();

app.use(cors());
app.use(express.json());
const api_key = "3pmzbsccz3f3";
const api_secret ="g5dhsja3wrp99k3s2uxq6q99vm9gkgdd6fbhm2wztbhvsgsydzwkzvmq6k3jex9h";
const serverClient = StreamChat.getInstance(api_key, api_secret);

app.post("/signup", async (req, res) => {
    try {
        const { fullName,email,username, password } = req.body;
        console.log(fullName,email,username, password)
        const userId = uuidv4();
        console.log(userId)
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword)
        const token = serverClient.createToken(userId);
        res.json({ token, userId, fullName,email,username, hashedPassword });
      } catch (error) {
        res.json(error);
      }
    
})
app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        console.log(username, password)
        const { users } = await serverClient.queryUsers({ name: username });
        console.log(users)
        if (users.length === 0) {
            return res.json({ message: "User not found" });
        }
    
        const token = serverClient.createToken(users[0].id);
        console.log(token)
        const passwordMatch = await bcrypt.compare(
          password,
          users[0].hashedPassword
        );
    
        console.log(passwordMatch)
        if (passwordMatch) {
         return res.json({
            token,
            fullName: users[0].fullName,
            email: users[0].email,
            username,
            userId: users[0].id,
            hashedPassword:users[0].hashedPassword
          })
          
        }else{
          return res.json({ message: "User not found" });
        }
      } catch (error) {
        res.json(error);
      }

})


app.listen(3001, () => {
    console.log("Server is running on port 3001");
  });