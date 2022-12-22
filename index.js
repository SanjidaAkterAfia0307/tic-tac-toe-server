import express from "express";
import cors from "cors";
import { StreamChat } from "stream-chat";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcrypt";
import { MongoClient, ServerApiVersion } from 'mongodb';
import * as dotenv from 'dotenv';
dotenv.config()
const app = express();

app.use(cors());
app.use(express.json());
const api_key = process.env.API_KEY;
const api_secret = process.env.API_SECRET;
const serverClient = StreamChat.getInstance(api_key, api_secret);

app.post("/signup", async (req, res) => {
  try {
    const { fullName, email, username, password } = req.body;
    console.log(fullName, email, username, password)
    const userId = uuidv4();
    console.log(userId)
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log(hashedPassword)
    const token = serverClient.createToken(userId);
    res.json({ token, userId, fullName, email, username, hashedPassword });
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
        hashedPassword: users[0].hashedPassword
      })

    } else {
      return res.json({ message: "User not found" });
    }
  } catch (error) {
    res.json(error);
  }

})


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.3jlrk4o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
  try {
    const gameCollection = client.db("tic-tac-toe").collection("games")

    app.post("/games", async (req, res) => {
      const game = req.body
      const date = new Date(Date.now())
      const result = await gameCollection.insertOne({ ...game, date })
      console.log(result)
      res.send(result)
    })
    app.get("/games/:email", async (req, res) => {
      const email = req.params.email
      console.log(email)
      const query = { userEmail: email }
      const user = await gameCollection.find(query).sort({ date: -1 }).toArray()
      console.log(user)
      res.send(user)
    })

    app.put("/games/:id", async (req, res) => {
      const id = parseFloat(req.params.id);
      const win = req.body.win
      const winner = req.body.winPlayer
      console.log(id)
      console.log(typeof(id))
      console.log(win)
      const query = { id: id }
      const updoc = {
        $set: {
          state: win,
          winner:winner
        }
      }

      const result = await gameCollection.updateOne(query, updoc)

      res.send(result)
      console.log(result)
    })

  }
  finally {

  }
}
run().catch(er => console.error(er))



app.listen(3001, () => {
  console.log("Server is running on port 3001");
});